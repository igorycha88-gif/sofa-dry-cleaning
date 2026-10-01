jest.mock('@/services/ordersService', () => ({
  createOrder: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { POST } from './route';
import { createOrder } from '@/services/ordersService';
import { RateLimitError, ValidationError } from '@/schemas/order';
import { logger } from '@/lib/logger';

const mockedCreateOrder = createOrder as jest.Mock;
const mockedInfo = logger.info as jest.Mock;
const mockedWarn = logger.warn as jest.Mock;
const mockedError = logger.error as jest.Mock;

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/v1/orders', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
  });
}

describe('POST /api/v1/orders', () => {
  const validBody = { name: 'Иван', phone: '+79991234567', furnitureType: 'SOFA_2' };

  beforeEach(() => {
    mockedCreateOrder.mockReset();
    mockedInfo.mockClear();
    mockedWarn.mockClear();
    mockedError.mockClear();
  });

  test('успех → 201 с id, логируются request и response', async () => {
    mockedCreateOrder.mockResolvedValue({ id: 'abc123' });
    const response = await POST(makeRequest(validBody) as never);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 'abc123' });
    expect(mockedInfo).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({ method: 'POST', path: '/api/v1/orders' })
    );
    expect(mockedInfo).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({ status: 201, path: '/api/v1/orders' })
    );
  });

  test('битый JSON → 400', async () => {
    const response = await POST(makeRequest('{not json') as never);
    expect(response.status).toBe(400);
    expect(mockedWarn).toHaveBeenCalledWith('response', expect.objectContaining({ status: 400 }));
  });

  test('ошибка валидации → 400 с полями', async () => {
    mockedCreateOrder.mockRejectedValue(new ValidationError({ name: ['Имя слишком короткое'] }));
    const response = await POST(makeRequest({ ...validBody, name: 'И' }) as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fields).toEqual({ name: ['Имя слишком короткое'] });
  });

  test('rate limit → 429 с Retry-After', async () => {
    mockedCreateOrder.mockRejectedValue(new RateLimitError(60_000));
    const response = await POST(makeRequest(validBody) as never);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  test('неожиданная ошибка → 500, ошибка логируется', async () => {
    mockedCreateOrder.mockRejectedValue(new Error('db down'));
    const response = await POST(makeRequest(validBody) as never);

    expect(response.status).toBe(500);
    expect(mockedError).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({ status: 500, operation: 'POST /api/v1/orders' })
    );
  });
});
