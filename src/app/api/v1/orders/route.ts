import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/utils';
import { createOrder } from '@/services/ordersService';
import { RateLimitError, ValidationError } from '@/schemas/order';
import { siteConfig } from '@/config/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const ip = getClientIp(request.headers);
  const path = new URL(request.url).pathname;

  logger.info('request', { method: 'POST', path, context: { ip } });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const duration = Date.now() - startedAt;
    logger.warn('response', { status: 400, duration, path, context: { reason: 'invalid json' } });
    return NextResponse.json({ error: 'Некорректный формат запроса' }, { status: 400 });
  }

  try {
    const result = await createOrder(body, ip);
    const duration = Date.now() - startedAt;
    logger.info('response', { status: 201, duration, path });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startedAt;

    if (error instanceof RateLimitError) {
      logger.warn('response', { status: 429, duration, path, context: { ip } });
      return NextResponse.json(
        { error: 'Слишком много заявок. Попробуйте через минуту или позвоните нам.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)) } }
      );
    }

    if (error instanceof ValidationError) {
      logger.warn('response', { status: 400, duration, path, context: { errors: error.fieldErrors } });
      return NextResponse.json(
        { error: 'Проверьте правильность заполнения формы', fields: error.fieldErrors },
        { status: 400 }
      );
    }

    logger.error('response', {
      status: 500,
      duration,
      path,
      error: error instanceof Error ? error.message : String(error),
      operation: 'POST /api/v1/orders',
    });
    return NextResponse.json(
      { error: `Ошибка сервера. Позвоните нам: ${siteConfig.phone}` },
      { status: 500 }
    );
  }
}
