import { cn, formatPrice, normalizePhone, maskPhone, getClientIp } from '@/lib/utils';

describe('normalizePhone', () => {
  test.each([
    ['+7 (999) 123-45-67', '+79991234567'],
    ['89991234567', '+79991234567'],
    ['9991234567', '+79991234567'],
    ['79991234567', '+79991234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  test.each(['12345', '+79991234567890', 'abcdefgh', '8999123456', ''])('невалидный: %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('maskPhone', () => {
  test('маскирует середину номера', () => {
    expect(maskPhone('+79991234567')).toBe('+799***567');
  });

  test('короткие значения маскируются полностью', () => {
    expect(maskPhone('123')).toBe('***');
  });
});

describe('formatPrice', () => {
  test('форматирует в рубли', () => {
    expect(formatPrice(1500)).toContain('₽');
    expect(formatPrice(1500)).toContain('1');
  });
});

describe('cn', () => {
  test('склеивает классы и отбрасывает ложные', () => {
    expect(cn('a', false, undefined, 'b', null)).toBe('a b');
  });
});

describe('getClientIp', () => {
  test('берёт первый IP из x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIp(headers)).toBe('1.2.3.4');
  });

  test('fallback на x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '9.9.9.9' });
    expect(getClientIp(headers)).toBe('9.9.9.9');
  });

  test('unknown при отсутствии заголовков', () => {
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});
