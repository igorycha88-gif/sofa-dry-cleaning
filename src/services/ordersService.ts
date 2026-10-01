import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { maskPhone } from '@/lib/utils';
import { calcPrice, FURNITURE_PRICING, type ExtraServiceId, type SofaTypeKey } from '@/config/pricing';
import {
  parseOrderInput,
  RateLimitError,
  ValidationError,
  type OrderCreateResult,
} from '@/schemas/order';
import { rateLimit, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from '@/lib/rate-limit';
import { sendOrderEmails } from '@/lib/smtp';

const OPERATION = 'createOrder';

/**
 * Создание заявки:
 * honeypot → rate limit → валидация → расчёт цены на сервере → Prisma → SMTP (не блокирует результат)
 */
export async function createOrder(
  data: unknown,
  ip: string
): Promise<OrderCreateResult> {
  const startedAt = Date.now();

  // Honeypot: боты заполняют скрытое поле — отвечаем «успехом», ничего не создаём
  const raw = (data ?? {}) as Record<string, unknown>;
  if (typeof raw.website === 'string' && raw.website.length > 0) {
    logger.warn('honeypot triggered, fake success returned', {
      operation: OPERATION,
      context: { ip },
    });
    return { id: 'hp-ok' };
  }

  const limit = await rateLimit('orders', ip);
  if (!limit.allowed) {
    logger.warn('rate limit exceeded', {
      operation: OPERATION,
      context: { ip },
    });
    throw new RateLimitError(limit.retryAfterMs || RATE_LIMIT_WINDOW_MS);
  }

  const input = parseOrderInput(data);

  // Цена всегда считается на сервере (клиентскому calculatedPrice не доверяем)
  const serverPrice = calcPrice({
    furnitureType: input.furnitureType as SofaTypeKey,
    units: input.seats ?? defaultUnits(input.furnitureType as SofaTypeKey),
    services: input.services as ExtraServiceId[],
  });

  const order = await prisma.order.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      address: input.address || null,
      furnitureType: input.furnitureType,
      seats: input.seats ?? null,
      services: input.services,
      comment: input.comment || null,
      calculatedPrice: serverPrice,
      source: input.source || null,
      utm: input.utm ?? undefined,
    },
  });

  logger.info('order created', {
    operation: OPERATION,
    context: {
      orderId: order.id,
      phone: maskPhone(order.phone),
      furnitureType: order.furnitureType,
      price: serverPrice,
      durationMs: Date.now() - startedAt,
    },
  });

  let emailResult: Awaited<ReturnType<typeof sendOrderEmails>> = {
    managerSent: false,
    clientSent: false,
  };
  try {
    emailResult = await sendOrderEmails({
      id: order.id,
      name: order.name,
      phone: order.phone,
      email: order.email,
      address: order.address,
      furnitureType: order.furnitureType,
      seats: order.seats,
      services: order.services,
      comment: order.comment,
      calculatedPrice: order.calculatedPrice,
      source: order.source,
      createdAt: order.createdAt,
    });
  } catch (error) {
    // Заявка уже сохранена в БД — сбой почты не должен её валировать (ADR-001.3)
    logger.error('order emails unexpected failure', {
      error: error instanceof Error ? error.message : String(error),
      operation: OPERATION,
      context: { orderId: order.id },
    });
  }

  logger.info('order flow finished', {
    operation: OPERATION,
    context: {
      orderId: order.id,
      emailsSkipped: emailResult.skipped === true,
      durationMs: Date.now() - startedAt,
    },
  });

  return { id: order.id };
}

function defaultUnits(furnitureType: SofaTypeKey): number {
  return FURNITURE_PRICING[furnitureType]?.minUnits ?? 1;
}

export { RateLimitError, ValidationError };
export const ORDER_RATE_LIMIT = { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX };
