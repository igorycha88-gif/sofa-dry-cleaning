let consoleOutput: string[] = [];

beforeEach(() => {
  consoleOutput = [];
  jest.spyOn(console, 'log').mockImplementation((line: string) => consoleOutput.push(line));
  jest.spyOn(console, 'warn').mockImplementation((line: string) => consoleOutput.push(line));
  jest.spyOn(console, 'error').mockImplementation((line: string) => consoleOutput.push(line));
});

afterEach(() => {
  jest.restoreAllMocks();
});

import { logger } from '@/lib/logger';

function parse(line: string): Record<string, unknown> {
  return JSON.parse(line) as Record<string, unknown>;
}

describe('logger', () => {
  test.each([
    ['info', 'info'],
    ['warn', 'warn'],
    ['error', 'error'],
  ] as const)('%s пишет структурированный JSON с уровнем и метой', (level, message) => {
    logger[level](message, { context: { foo: 'bar' } });
    const entry = parse(consoleOutput[0]);
    expect(entry.level).toBe(message);
    expect(entry.message).toBe(message);
    expect(entry.context).toEqual({ foo: 'bar' });
    expect(typeof entry.timestamp).toBe('string');
  });

  test('debug по умолчанию отфильтрован (уровень info)', () => {
    logger.debug('hidden');
    expect(consoleOutput).toHaveLength(0);
  });

  test('error пишет через console.error', () => {
    logger.error('boom', { error: 'x', operation: 'test' });
    const entry = parse(consoleOutput[0]);
    expect(entry.error).toBe('x');
    expect(entry.operation).toBe('test');
  });
});
