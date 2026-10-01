import { logger } from '@/lib/logger';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

/** Нормализация RU-телефона к +7XXXXXXXXXX. Возвращает null, если невалиден. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.length === 11 && normalized.startsWith('8')) {
    normalized = '7' + normalized.slice(1);
  }
  if (normalized.length === 10 && normalized.startsWith('9')) {
    normalized = '7' + normalized;
  }
  if (/^7\d{10}$/.test(normalized)) {
    return `+${normalized}`;
  }
  return null;
}

/** Маскирование телефона для логов: +7999***4567 */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***';
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}
