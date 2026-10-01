import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

function makeFakeStore() {
  const scores = new Map<string, Array<{ score: number; member: string }>>();
  return {
    scores,
    async zadd(key: string, score: number, member: string) {
      const list = scores.get(key) ?? [];
      list.push({ score, member });
      scores.set(key, list);
      return 1;
    },
    async zremrangebyscore(key: string, min: number, max: number) {
      const list = scores.get(key) ?? [];
      const filtered = list.filter((entry) => entry.score < min || entry.score > max);
      scores.set(key, filtered);
      return list.length - filtered.length;
    },
    async zcard(key: string) {
      return (scores.get(key) ?? []).length;
    },
  };
}

describe('rateLimit', () => {
  test('разрешает первые 5 запросов, 6-й блокируется', async () => {
    const store = makeFakeStore();
    const results: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      const result = await rateLimit('orders', 'ip-1', store);
      results.push(result.allowed);
    }
    expect(results).toEqual([true, true, true, true, true, false]);
  });

  test('окно скользит: старые записи удаляются', async () => {
    const store = makeFakeStore();
    const realNow = Date.now;
    let now = realNow();
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    for (let i = 0; i < 5; i++) {
      await rateLimit('orders', 'ip-2', store);
    }
    expect((await rateLimit('orders', 'ip-2', store)).allowed).toBe(false);

    // время идёт: окно 60с истекло
    now += 61_000;
    const afterWindow = await rateLimit('orders', 'ip-2', store);
    expect(afterWindow.allowed).toBe(true);

    (Date.now as unknown as jest.Mock).mockRestore();
    void realNow;
  });

  test('разные идентификаторы — разные лимиты', async () => {
    const store = makeFakeStore();
    for (let i = 0; i < 5; i++) {
      await rateLimit('orders', 'ip-a', store);
    }
    const other = await rateLimit('orders', 'ip-b', store);
    expect(other.allowed).toBe(true);
  });

  test('fail-open: при недоступности стора запрос пропускается и логируется', async () => {
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const brokenStore = {
      async zadd() {
        throw new Error('connection refused');
      },
      async zremrangebyscore() {
        throw new Error('connection refused');
      },
      async zcard() {
        throw new Error('connection refused');
      },
    };
    const result = await rateLimit('orders', 'ip-c', brokenStore);
    expect(result.allowed).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      'rate limit store unavailable, failing open',
      expect.objectContaining({ operation: 'rateLimit' })
    );
    errorSpy.mockRestore();
  });
});
