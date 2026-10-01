import { logger } from '@/lib/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** ms до сброса окна (примерно), 0 если лимит не превышен */
  retryAfterMs: number;
}

interface RateLimitStore {
  zadd(key: string, score: number, member: string): Promise<number>;
  zremrangebyscore(key: string, min: number, max: number): Promise<number>;
  zcard(key: string): Promise<number>;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

async function check(
  store: RateLimitStore,
  key: string,
  now: number,
  windowMs = WINDOW_MS,
  maxRequests = MAX_REQUESTS
): Promise<RateLimitResult> {
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  await store.zadd(key, now, member);
  await store.zremrangebyscore(key, 0, now - windowMs);
  const count = await store.zcard(key);
  if (count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs };
  }
  return { allowed: true, remaining: maxRequests - count, retryAfterMs: 0 };
}

/**
 * Sliding-window rate limit на Redis.
 * Fail-open: если Redis недоступен — пропускаем запрос (лиды важнее),
 * но логируем ошибку.
 */
export async function rateLimit(
  namespace: string,
  identifier: string,
  store: RateLimitStore | null = null
): Promise<RateLimitResult> {
  const activeStore = store ?? (await import('@/lib/redis')).redis;
  const key = `ratelimit:${namespace}:${identifier}`;
  const now = Date.now();
  try {
    return await check(activeStore, key, now);
  } catch (error) {
    logger.error('rate limit store unavailable, failing open', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'rateLimit',
      context: { namespace, identifier },
    });
    return { allowed: true, remaining: MAX_REQUESTS, retryAfterMs: 0 };
  }
}

export const RATE_LIMIT_WINDOW_MS = WINDOW_MS;
export const RATE_LIMIT_MAX = MAX_REQUESTS;
