jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: { create: jest.fn() },
  },
}));
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX: 5,
}));
jest.mock('@/lib/smtp', () => ({
  sendOrderEmails: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { createOrder } from '@/services/ordersService';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sendOrderEmails } from '@/lib/smtp';
import { logger } from '@/lib/logger';
import { RateLimitError, ValidationError } from '@/schemas/order';

const mockedCreate = prisma.order.create as jest.Mock;
const mockedRateLimit = rateLimit as jest.Mock;
const mockedSendEmails = sendOrderEmails as jest.Mock;
const mockedInfo = logger.info as jest.Mock;
const mockedWarn = logger.warn as jest.Mock;

const validPayload = {
  name: 'Иван',
  phone: '+7 (999) 123-45-67',
  furnitureType: 'SOFA',
  seats: 2,
  services: ['heavy_soil'],
  source: 'calculator',
};

beforeEach(() => {
  mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 4, retryAfterMs: 0 });
  mockedSendEmails.mockResolvedValue({ managerSent: true, clientSent: false });
  mockedCreate.mockResolvedValue({
    id: 'order-123',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    ...validPayload,
    phone: '+79991234567',
    calculatedPrice: 3750,
  });
});

describe('createOrder', () => {
  test('happy path: honeypot → limit → prisma → smtp → логирование', async () => {
    const result = await createOrder(validPayload, '1.2.3.4');

    expect(result).toEqual({ id: 'order-123' });
    expect(mockedRateLimit).toHaveBeenCalledWith('orders', '1.2.3.4');
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedCreate.mock.calls[0][0].data).toMatchObject({
      name: 'Иван',
      phone: '+79991234567',
      furnitureType: 'SOFA',
      services: ['heavy_soil'],
      calculatedPrice: 3750,
    });
    expect(mockedSendEmails).toHaveBeenCalledTimes(1);

    // проверка логирования (Правило 8)
    expect(mockedInfo).toHaveBeenCalledWith('order created', expect.anything());
    expect(mockedInfo).toHaveBeenCalledWith('order flow finished', expect.anything());
  });

  test('honeypot заполнен → фейковый успех, без записи в БД', async () => {
    const result = await createOrder({ ...validPayload, website: 'http://spam' }, '1.2.3.4');
    expect(result).toEqual({ id: 'hp-ok' });
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(mockedWarn).toHaveBeenCalledWith(
      'honeypot triggered, fake success returned',
      expect.anything()
    );
  });

  test('превышен rate limit → RateLimitError, заявка не создаётся', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterMs: 60_000 });
    await expect(createOrder(validPayload, '1.2.3.4')).rejects.toBeInstanceOf(RateLimitError);
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(mockedWarn).toHaveBeenCalledWith('rate limit exceeded', expect.anything());
  });

  test('невалидные данные → ValidationError, БД не вызывается', async () => {
    await expect(createOrder({ ...validPayload, name: 'И' }, '1.2.3.4')).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  test('ошибка SMTP не валирует заявку (она уже в БД)', async () => {
    mockedSendEmails.mockRejectedValue(new Error('SMTP connect failed'));
    const result = await createOrder(validPayload, '1.2.3.4');
    expect(result).toEqual({ id: 'order-123' });
  });

  test('цена всегда пересчитывается на сервере', async () => {
    await createOrder({ ...validPayload, calculatedPrice: 100 }, '1.2.3.4');
    expect(mockedCreate.mock.calls[0][0].data.calculatedPrice).toBe(3750);
  });

  test('телефон в логах маскирован', async () => {
    await createOrder(validPayload, '1.2.3.4');
    const logCall = mockedInfo.mock.calls.find(([message]) => message === 'order created');
    const context = logCall?.[1]?.context;
    expect(context.phone).toBe('+799***567');
  });
});
