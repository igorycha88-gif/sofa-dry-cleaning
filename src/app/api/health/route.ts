import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const path = '/api/health';

  let db: 'up' | 'down' = 'down';
  let redisStatus: 'up' | 'down' = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'up';
  } catch (error) {
    logger.error('healthcheck: database down', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'health',
    });
  }

  try {
    const pong = await redis.ping();
    redisStatus = pong === 'PONG' ? 'up' : 'down';
  } catch (error) {
    logger.error('healthcheck: redis down', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'health',
    });
  }

  const healthy = db === 'up';
  const body = {
    status: healthy ? 'ok' : 'degraded',
    db,
    redis: redisStatus,
    uptime: Math.round(process.uptime()),
  };

  logger.info('response', { status: healthy ? 200 : 503, duration: Date.now() - startedAt, path });
  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
