import { z } from 'zod';
import { normalizePhone } from '@/lib/utils';
import { FURNITURE_PRICING, EXTRA_SERVICES, type ExtraServiceId } from '@/config/pricing';

export const furnitureTypeKeys = Object.keys(FURNITURE_PRICING) as [
  keyof typeof FURNITURE_PRICING,
  ...Array<keyof typeof FURNITURE_PRICING>
];

const extraServiceIds = EXTRA_SERVICES.map((s) => s.id) as [ExtraServiceId, ...ExtraServiceId[]];

const phoneSchema = z
  .string()
  .trim()
  .min(6, 'Укажите телефон')
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Некорректный телефон' });
      return z.NEVER;
    }
    return normalized;
  });

export const orderCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Имя слишком короткое')
    .max(100, 'Имя слишком длинное'),
  phone: phoneSchema,
  email: z.string().trim().email('Некорректный email').max(254).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  furnitureType: z.enum(furnitureTypeKeys),
  seats: z.coerce.number().int().min(1).max(40).optional(),
  services: z.array(z.enum(extraServiceIds)).max(10).default([]),
  comment: z.string().trim().max(1000, 'Комментарий слишком длинный').optional().or(z.literal('')),
  calculatedPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
  source: z.string().trim().max(200).optional(),
  utm: z.record(z.string()).optional(),
  /** honeypot: должно быть пустым */
  website: z.string().max(0).optional().or(z.literal('')),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export interface OrderCreateResult {
  id: string;
}

export class ValidationError extends Error {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    super('Order validation failed');
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class RateLimitError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export function parseOrderInput(data: unknown): OrderCreateInput {
  const result = orderCreateSchema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || '_';
      fieldErrors[field] = [...(fieldErrors[field] || []), issue.message];
    }
    throw new ValidationError(fieldErrors);
  }
  return result.data;
}
