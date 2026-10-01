import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from '@/lib/logger';
import { formatPrice } from '@/lib/utils';
import { FURNITURE_PRICING, EXTRA_SERVICES, type ExtraServiceId } from '@/config/pricing';
import { siteConfig } from '@/config/site';

export interface OrderEmailPayload {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  furnitureType: keyof typeof FURNITURE_PRICING;
  seats?: number | null;
  services: string[];
  comment?: string | null;
  calculatedPrice?: number | null;
  source?: string | null;
  createdAt?: Date;
}

export interface SmtpSendResult {
  managerSent: boolean;
  clientSent: boolean;
  skipped?: boolean;
}

let transporter: Transporter | null = null;

/** Только для тестов: сбрасывает кэш транспорта */
export function __resetTransporterForTests(): void {
  transporter = null;
}

export function isSmtpEnabled(): boolean {
  return process.env.SMTP_ENABLED === 'true';
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      connectionTimeout: 5_000,
      socketTimeout: 5_000,
    });
  }
  return transporter;
}

function describeOrder(order: OrderEmailPayload): string {
  const furniture = FURNITURE_PRICING[order.furnitureType];
  const parts = [
    `Услуга: химчистка ${furniture?.shortLabel ?? order.furnitureType}`,
    order.seats ? `Объём: ${order.seats} × ${furniture?.unit ?? 'шт'}` : null,
    order.services.length
      ? `Опции: ${escapeHtml(
          order.services
            .map((id) => EXTRA_SERVICES.find((s) => s.id === (id as never))?.label ?? id)
            .join(', ')
        )}`
      : null,
    order.calculatedPrice ? `Предварительная цена: ${formatPrice(order.calculatedPrice)}` : null,
    order.address ? `Адрес: ${escapeHtml(order.address)}` : null,
    order.source ? `Страница: ${escapeHtml(order.source)}` : null,
    order.comment ? `Комментарий: ${escapeHtml(order.comment)}` : null,
  ].filter(Boolean);
  return parts.join('<br/>\n');
}

export function renderManagerEmail(order: OrderEmailPayload): string {
  return `<h2>🔔 Новая заявка №${order.id.slice(-6).toUpperCase()}</h2>
<p><b>Клиент:</b> ${escapeHtml(order.name)}<br/>
<b>Телефон:</b> <a href="tel:${order.phone}">${order.phone}</a>${order.email ? `<br/><b>Email:</b> ${escapeHtml(order.email)}` : ''}</p>
<p>${describeOrder(order)}</p>
<p style="color:#64748b">Заявка создана: ${order.createdAt?.toLocaleString('ru-RU') ?? 'только что'}</p>`;
}

export function renderClientEmail(order: OrderEmailPayload): string {
  return `<h2>Спасибо за заявку, ${escapeHtml(order.name)}! 🧼</h2>
<p>Мы получили вашу заявку на химчистку ${FURNITURE_PRICING[order.furnitureType]?.shortLabel ?? 'мебели'}${
    order.calculatedPrice ? ` (предварительно ${formatPrice(order.calculatedPrice)})` : ''
  }.</p>
<p>Менеджер перезвонит в течение 15 минут в рабочее время (${siteConfig.workingHours}), чтобы подтвердить удобное время выезда.</p>
<p>Вопросы? Звоните: <b>${siteConfig.phone}</b></p>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`smtp timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function sendOrderEmails(order: OrderEmailPayload): Promise<SmtpSendResult> {
  const operation = 'sendOrderEmails';
  if (!isSmtpEnabled()) {
    logger.info('smtp disabled, skipping order emails', {
      operation,
      context: { orderId: order.id },
    });
    return { managerSent: false, clientSent: false, skipped: true };
  }

  let managerSent = false;
  let clientSent = false;

  try {
    const transport = getTransporter();
    const from = process.env.SMTP_FROM || siteConfig.name;
    await withTimeout(
      transport.sendMail({
        from,
        to: process.env.ORDER_EMAIL_TO || '',
        subject: `🔔 Заявка ${order.id.slice(-6).toUpperCase()}: ${order.name} ${order.phone}`,
        html: renderManagerEmail(order),
      }),
      5_000
    );
    managerSent = true;
    logger.info('manager email sent', { operation, context: { orderId: order.id } });
  } catch (error) {
    logger.error('manager email failed', {
      error: error instanceof Error ? error.message : String(error),
      operation,
      context: { orderId: order.id },
    });
  }

  if (order.email) {
    try {
      const transport = getTransporter();
      const from = process.env.SMTP_FROM || siteConfig.name;
      await withTimeout(
        transport.sendMail({
          from,
          to: order.email,
          subject: `Заявка принята — ${siteConfig.name}`,
          html: renderClientEmail(order),
        }),
        5_000
      );
      clientSent = true;
      logger.info('client email sent', { operation, context: { orderId: order.id } });
    } catch (error) {
      logger.error('client email failed', {
        error: error instanceof Error ? error.message : String(error),
        operation,
        context: { orderId: order.id },
      });
    }
  }

  return { managerSent, clientSent };
}
