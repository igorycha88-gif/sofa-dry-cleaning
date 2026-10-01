import { parseOrderInput, ValidationError, orderCreateSchema } from '@/schemas/order';

const validInput = {
  name: 'Иван',
  phone: '+7 (999) 123-45-67',
  furnitureType: 'SOFA',
};

describe('orderCreateSchema', () => {
  test('happy path: валидная заявка, телефон нормализуется', () => {
    const result = orderCreateSchema.parse(validInput);
    expect(result.phone).toBe('+79991234567');
    expect(result.services).toEqual([]);
  });

  test('имя: отклоняет слишком короткое', () => {
    const result = orderCreateSchema.safeParse({ ...validInput, name: 'И' });
    expect(result.success).toBe(false);
  });

  test('имя: отклоняет слишком длинное', () => {
    const result = orderCreateSchema.safeParse({ ...validInput, name: 'а'.repeat(101) });
    expect(result.success).toBe(false);
  });

  test('телефон: отклоняет мусор', () => {
    const result = orderCreateSchema.safeParse({ ...validInput, phone: '12345' });
    expect(result.success).toBe(false);
  });

  test('email: опционален, но валидируется при наличии', () => {
    expect(orderCreateSchema.safeParse({ ...validInput, email: 'not-an-email' }).success).toBe(false);
    expect(orderCreateSchema.safeParse({ ...validInput, email: '' }).success).toBe(true);
  });

  test('furnitureType: только известные значения', () => {
    expect(orderCreateSchema.safeParse({ ...validInput, furnitureType: 'TABLE' }).success).toBe(false);
  });

  test('seats: целое 1..40 (строка коэрцируется)', () => {
    expect(orderCreateSchema.safeParse({ ...validInput, seats: '3' }).success).toBe(true);
    expect(orderCreateSchema.safeParse({ ...validInput, seats: 0 }).success).toBe(false);
    expect(orderCreateSchema.safeParse({ ...validInput, seats: 2.5 }).success).toBe(false);
  });

  test('services: только известные id', () => {
    expect(
      orderCreateSchema.safeParse({ ...validInput, services: ['antibacterial'] }).success
    ).toBe(true);
    expect(orderCreateSchema.safeParse({ ...validInput, services: ['gold'] }).success).toBe(false);
  });

  test('comment: максимум 1000 символов', () => {
    expect(orderCreateSchema.safeParse({ ...validInput, comment: 'х'.repeat(1001) }).success).toBe(false);
  });

  test('website (honeypot): должна быть пустой строкой', () => {
    expect(orderCreateSchema.safeParse({ ...validInput, website: '' }).success).toBe(true);
    expect(orderCreateSchema.safeParse({ ...validInput, website: 'spam' }).success).toBe(false);
  });
});

describe('parseOrderInput', () => {
  test('выбрасывает ValidationError с ошибками по полям', () => {
    try {
      parseOrderInput({ name: '', phone: 'x' });
      throw new Error('должен был выбросить ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const fieldErrors = (error as ValidationError).fieldErrors;
      expect(fieldErrors.name).toBeDefined();
      expect(fieldErrors.phone).toBeDefined();
    }
  });

  test('возвращает распарсенные данные', () => {
    const result = parseOrderInput(validInput);
    expect(result.name).toBe('Иван');
  });
});
