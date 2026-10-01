jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'ok' }),
  })),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import nodemailer from 'nodemailer';
import {
  isSmtpEnabled,
  renderManagerEmail,
  renderClientEmail,
  sendOrderEmails,
  __resetTransporterForTests,
  type OrderEmailPayload,
} from '@/lib/smtp';
import { logger } from '@/lib/logger';

const mockedCreateTransport = nodemailer.createTransport as unknown as jest.Mock;

const order: OrderEmailPayload = {
  id: 'abc123456',
  name: 'Иван <Тест>',
  phone: '+79991234567',
  email: 'client@example.com',
  furnitureType: 'SOFA_2',
  seats: 1,
  services: ['heavy_soil', 'odor_removal'],
  comment: '<script>alert(1)</script>',
  calculatedPrice: 2050,
};

describe('шаблоны писем', () => {
  test('письмо менеджеру содержит данные заявки и экранирует HTML', () => {
    const html = renderManagerEmail(order);
    expect(html).toContain('+79991234567');
    expect(html).toContain('Иван &lt;Тест&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toMatch(/2[\s\u00A0]050/);
  });

  test('письмо клиенту дружелюбное и содержит имя', () => {
    const html = renderClientEmail(order);
    expect(html).toContain('Иван');
    expect(html).toContain('Спасибо за заявку');
  });
});

describe('sendOrderEmails', () => {
  beforeEach(() => {
    __resetTransporterForTests();
  });

  afterEach(() => {
    delete process.env.SMTP_ENABLED;
    delete process.env.ORDER_EMAIL_TO;
    delete process.env.SMTP_FROM;
  });

  test('SMTP выключен → письма пропускаются, но заявка не падает', async () => {
    process.env.SMTP_ENABLED = 'false';
    const result = await sendOrderEmails(order);
    expect(result.skipped).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      'smtp disabled, skipping order emails',
      expect.anything()
    );
  });

  test('SMTP включён: менеджеру и клиенту уходят письма, логируется успех', async () => {
    process.env.SMTP_ENABLED = 'true';
    process.env.ORDER_EMAIL_TO = 'manager@example.com';
    process.env.SMTP_FROM = 'noreply@example.com';

    const result = await sendOrderEmails(order);

    expect(result).toEqual({ managerSent: true, clientSent: true });
    const transport = mockedCreateTransport.mock.results[0].value as { sendMail: jest.Mock };
    expect(transport.sendMail).toHaveBeenCalledTimes(2);

    const managerCall = transport.sendMail.mock.calls[0][0];
    expect(managerCall.to).toBe('manager@example.com');
    expect(managerCall.subject).toContain('+79991234567');

    const clientCall = transport.sendMail.mock.calls[1][0];
    expect(clientCall.to).toBe('client@example.com');
    expect(clientCall.subject).toContain('Заявка принята');

    expect(logger.info).toHaveBeenCalledWith('manager email sent', expect.anything());
    expect(logger.info).toHaveBeenCalledWith('client email sent', expect.anything());
  });

  test('SMTP включён, у клиента нет email → отправляется только письмо менеджеру', async () => {
    process.env.SMTP_ENABLED = 'true';
    process.env.ORDER_EMAIL_TO = 'manager@example.com';

    const result = await sendOrderEmails({ ...order, email: null });
    expect(result).toEqual({ managerSent: true, clientSent: false });
    const transport = mockedCreateTransport.mock.results[0].value as { sendMail: jest.Mock };
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
  });

  test('SMTP включён, но транспортировка падает → ошибки логируются, обещание резолвится', async () => {
    process.env.SMTP_ENABLED = 'true';
    process.env.ORDER_EMAIL_TO = 'manager@example.com';
    mockedCreateTransport.mockReturnValueOnce({
      sendMail: jest.fn().mockRejectedValue(new Error('connection refused')),
    });

    const result = await sendOrderEmails(order);

    expect(result).toEqual({ managerSent: false, clientSent: false });
    expect(logger.error).toHaveBeenCalledWith(
      'manager email failed',
      expect.objectContaining({ operation: 'sendOrderEmails' })
    );
  });

  test('isSmtpEnabled читает env', () => {
    process.env.SMTP_ENABLED = 'true';
    expect(isSmtpEnabled()).toBe(true);
    process.env.SMTP_ENABLED = 'false';
    expect(isSmtpEnabled()).toBe(false);
  });
});
