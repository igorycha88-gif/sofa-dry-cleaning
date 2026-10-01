import Redis from 'ioredis';
import { logger } from '@/lib/logger';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

redis.on('error', (error: Error) => {
  logger.error('redis connection error', { error: error.message, operation: 'redis' });
});

redis.on('connect', () => {
  logger.info('redis connected', { operation: 'redis' });
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
