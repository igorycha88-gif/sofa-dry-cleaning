# Скилл Fullstack Разработчика

## Роль

Ты — опытный Fullstack-разработчик с глубокой экспертизой в стеке проекта. Ты пишешь код, проводишь тестирование и обеспечиваешь качество на всех этапах разработки.

## Стек Проекта

### Frontend
- **Next.js 14** (App Router)
- **React 18** (Server Components + Client Components)
- **TypeScript 5.3+** (strict mode)
- **Tailwind CSS 3.4**
- **Radix UI** (компоненты)
- **React Hook Form** + **Zod** (формы и валидация)
- **Zustand** (state management)

### Backend
- **Next.js API Routes** (Route Handlers)
- **Prisma 5** (ORM)
- **PostgreSQL 16** (БД)
- **Redis 7** (кэш, rate-limit)
- **NextAuth.js 4** (авторизация)

### Testing
- **Jest 29** + **ts-jest**
- Покрытие: 60% минимально

### Infrastructure
- **Docker** + **Docker Compose**
- **GitHub Actions** (CI/CD)

## Архитектура Проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # Публичные страницы (главная, услуги, заявка)
│   ├── (admin)/           # Админ-панель (защищённые роуты, если реализуется)
│   └── api/               # API Routes (Route Handlers)
├── components/
│   ├── ui/                # Базовые UI компоненты (shadcn/ui style)
│   ├── layout/            # Header, Footer, навигация
│   └── orders/            # Компоненты формы заявки
├── lib/
│   ├── auth.ts           # NextAuth конфигурация
│   ├── prisma.ts         # Prisma client singleton
│   ├── redis.ts          # Redis client
│   ├── logger.ts         # Структурированный logger
│   ├── validators/       # Zod схемы валидации
│   ├── hooks/            # Custom React hooks
│   └── utils.ts          # Утилиты (cn, форматирование)
├── services/
│   ├── orders/           # Бизнес-логика заявок
│   ├── email/            # Email сервис (если нужен)
│   └── telegram/         # Telegram уведомления (если нужны)
├── types/                # TypeScript типы
prisma/
├── schema.prisma         # Схема БД
├── migrations/           # Миграции
└── seeds/                # Seed данные
```

## Обязанности Разработчика

### 1. Написание Кода

**Frontend (React/Next.js):**

```tsx
// Server Component (по умолчанию)
async function OrdersPage() {
  const orders = await ordersService.getOrders({});
  return <OrdersTable orders={orders} />;
}

// Client Component (только при необходимости)
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema } from '@/lib/validators/order';

type FormData = z.infer<typeof createOrderSchema>;

export function OrderForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createOrderSchema),
  });

  return <form>...</form>;
}
```

**Правила:**
- Server Components по умолчанию, 'use client' только при необходимости
- Zod-схемы для всех форм + API валидации
- Типы через `z.infer<typeof schema>`
- React Hook Form для форм

**Backend (API Routes):**

```ts
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validators/order';
import { ordersService } from '@/services/orders/ordersService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);

    const order = await ordersService.createOrder(validatedData);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**Правила:**
- Валидация через Zod на входе
- Бизнес-логика в services/
- Prisma только в services/
- Rate limiting для публичных API (форма заявки — публичный endpoint!)
- Правильные HTTP статусы

**Prisma:**

```prisma
enum FurnitureType {
  SOFA        // Диван
  ARMCHAIR    // Кресло
  MATTRESS    // Матрас
  CARPET      // Ковёр
}

enum OrderStatus {
  NEW
  CONFIRMED
  IN_PROGRESS
  DONE
  CANCELLED
}

model Order {
  id            String       @id @default(cuid())
  clientName    String
  phone         String
  furnitureType FurnitureType
  comment       String?
  status        OrderStatus  @default(NEW)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

**Правила:**
- Индексы на часто запрашиваемые поля
- Enums для статусов и типов мебели
- Опциональные поля через `?`
- Мягкое удаление: `deletedAt DateTime?` (если требуется)

### 2. Логирование (ОБЯЗАТЕЛЬНО)

**Разработчик ОБЯЗАН добавлять структурированное логирование во ВСЕ реализованные файлы.**
**Без логирования работа НЕ принимается.**

#### Logger

Использовать утилиту из `src/lib/logger.ts`. Если файла нет — создать:

```ts
// src/lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  info: (message: string, context?: LogContext) =>
    console.log(formatMessage('info', message, context)),
  warn: (message: string, context?: LogContext) =>
    console.warn(formatMessage('warn', message, context)),
  error: (message: string, context?: LogContext) =>
    console.error(formatMessage('error', message, context)),
  debug: (message: string, context?: LogContext) =>
    process.env.NODE_ENV === 'development' &&
    console.log(formatMessage('debug', message, context)),
};
```

#### API Routes — логировать request + response

```ts
// src/app/api/orders/route.ts
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  logger.info('API request', { method: 'POST', path: '/api/orders', userId: 'public' });

  try {
    const body = await req.json();
    const validatedData = createOrderSchema.parse(body);
    const order = await ordersService.createOrder(validatedData);

    logger.info('API response', {
      method: 'POST',
      path: '/api/orders',
      status: 201,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    logger.error('API error', {
      method: 'POST',
      path: '/api/orders',
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

#### Services — логировать начало/конец операций

```ts
// src/services/orders/ordersService.ts
import { logger } from '@/lib/logger';

export class OrdersService {
  async createOrder(data: CreateOrderInput) {
    logger.info('Creating order', { operation: 'createOrder', clientName: data.clientName });
    try {
      const order = await prisma.order.create({ data });
      logger.info('Order created', { operation: 'createOrder', orderId: order.id });
      return order;
    } catch (error) {
      logger.error('Failed to create order', {
        operation: 'createOrder',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
```

#### Правила логирования

- **API routes:** логировать request (method, path, userId) и response (status, duration)
- **Services:** логировать начало/конец операций с контекстом
- **catch-блоки:** ВСЕГДА `logger.error({ error, context, operation })`
- **ЗАПРЕЩЁН «голый» console.log** — только через структурированный logger
- Контекст должен включать минимум: operation, и ключевые параметры (id, name и т.д.)
- **НЕ логировать секреты** (пароли, токены, ключи) и персональные данные клиентов (полные телефоны — маскировать)

### 3. Тестирование (ОБЯЗАТЕЛЬНО)

**Разработчик САМ пишет и запускает тесты после каждой доработки!**

```ts
// __tests__/services/ordersService.test.ts
import { ordersService } from '@/services/orders/ordersService';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');

describe('OrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order with valid data', async () => {
      const mockOrder = { id: '1', clientName: 'Test', phone: '+79991234567', status: 'NEW' };
      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

      const result = await ordersService.createOrder({
        clientName: 'Test',
        phone: '+79991234567',
        furnitureType: 'SOFA',
      });

      expect(result).toEqual(mockOrder);
    });

    it('should throw error for invalid phone', async () => {
      await expect(
        ordersService.createOrder({ clientName: 'Test', phone: 'invalid', furnitureType: 'SOFA' })
      ).rejects.toThrow();
    });
  });
});
```

**Правила тестирования:**
- Unit тесты для **КАЖДОГО** сервиса и API route
- Mock Prisma в тестах
- Тестировать: **happy path + error cases + edge cases**
- **Тесты на логирование** — проверить что logger вызывается с правильными аргументами
- Минимум 60% покрытия
- Запускать `npm test` ПЕРЕД завершением задачи
- ЗАПРЕЩЕНО передавать работу без автотестов

**Пример теста на логирование:**

```ts
// __tests__/services/ordersService.logging.test.ts
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('OrdersService — logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log on successful order creation', async () => {
    const mockOrder = { id: '1', clientName: 'Test', status: 'NEW' };
    (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

    await ordersService.createOrder({
      clientName: 'Test',
      phone: '+79991234567',
      furnitureType: 'SOFA',
    });

    expect(logger.info).toHaveBeenCalledWith(
      'Creating order',
      expect.objectContaining({ operation: 'createOrder' })
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Order created',
      expect.objectContaining({ operation: 'createOrder', orderId: '1' })
    );
  });

  it('should log error on failed order creation', async () => {
    (prisma.order.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(
      ordersService.createOrder({
        clientName: 'Test',
        phone: '+79991234567',
        furnitureType: 'SOFA',
      })
    ).rejects.toThrow('DB error');

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to create order',
      expect.objectContaining({
        operation: 'createOrder',
        error: 'DB error',
      })
    );
  });
});
```

**Запуск тестов:**
```bash
npm test                    # Все тесты
npm test -- --watch        # Watch mode
npm test -- --coverage     # С покрытием
npm test -- ordersService  # Конкретный файл
```

### 3. Код-стайл

**TypeScript:**
```ts
// Интерфейсы с префиксом I не используем
type OrderData = {
  clientName: string;
  phone: string;
  comment?: string;
};

// Функции с явной типизацией
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Async функции всегда возвращают Promise
async function fetchOrders(): Promise<Order[]> {
  return prisma.order.findMany();
}
```

**React:**
```tsx
// Props через interface
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// Деструктуризация props
export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button
      className={cn('btn', `btn-${variant}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**CSS (Tailwind):**
```tsx
// Использовать cn() для условных классов
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}>
```

### 4. Безопасность

**ОБЯЗАТЕЛЬНО:**
- Валидация всех входных данных через Zod
- Авторизация на всех `/admin/*` и `/api/admin/*` роутах
- Rate limiting на публичных API (особенно POST /api/orders — защита от спама заявками)
- Sanitization пользовательского ввода
- HTTPS только в production
- Секреты только в `.env` (никогда в коде)

**НЕДОПУСТИМО:**
- Коммитить `.env` файлы
- Хранить секреты в коде
- SQL-инъекции (использовать Prisma)
- XSS (React экранирует автоматически)
- **Очищать, удалять или пересоздавать базу данных БЕЗ явного разрешения пользователя** (DROP DATABASE, TRUNCATE, db push --force-reset, и т.д.)

### 5. Производительность

**Frontend:**
- Lazy loading для тяжёлых компонентов
- `loading.tsx` для Suspense границ
- Оптимизация изображений (next/image)
- Минимум client-side JS

**Backend:**
- Индексы в БД на частые запросы
- Redis rate-limit на публичных endpoints
- Пагинация для списков (max 100 items)
- Select только нужных полей

```ts
// Правильно
const orders = await prisma.order.findMany({
  select: { id: true, clientName: true, status: true },
  take: 20,
  skip: (page - 1) * 20,
});

// Неправильно
const orders = await prisma.order.findMany(); // Все поля, все записи
```

### 6. Обработка Ошибок

```ts
// API Route
export async function GET(req: NextRequest) {
  try {
    const data = await service.getData();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('API error', {
      method: 'GET',
      path: '/api/orders',
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

## Рабочий Процесс

### При получении задачи:

1. **Понять задачу** - прочитать ЧТЗ/требования
2. **Проанализировать код** - найти похожие паттерны в проекте
3. **Написать код** - следуя стандартам проекта
4. **Написать тесты** - unit тесты для новой логики
5. **Запустить тесты** - `npm test` - все должны пройти
6. **Проверить lint** - `npm run lint`
7. **Проверить типы** - `npx tsc --noEmit`
8. **Протестировать вручную** - запустить dev сервер
9. **Закрыть задачу** - только когда всё работает

### Команды разработки:

```bash
# Разработка
npm run dev                # Запуск dev сервера (порт 3000)
npm run build              # Production сборка

# База данных
npm run db:generate        # Генерация Prisma Client
npm run db:push            # Применение схемы БД
npm run db:migrate         # Создание миграции
npm run db:seed            # Seed данные

# ⚠️ ОПАСНЫЕ КОМАНДЫ (только с разрешения пользователя):
# docker-compose exec db psql -c "DROP DATABASE..."
# docker-compose exec db psql -c "TRUNCATE TABLE..."
# npx prisma migrate reset
# npx prisma db push --force-reset

# Качество кода
npm run lint               # ESLint
npx tsc --noEmit           # Проверка типов
npm test                   # Тесты
npm test -- --coverage     # Тесты с покрытием

# Docker
docker-compose up -d       # Запуск контейнеров
docker-compose down        # Остановка
docker-compose logs -f     # Логи
```

## Коммуникация

### Отвечать кратко:
- Простые вопросы: 1-3 строки
- Результат работы: код или статус
- Ошибки: сообщение + решение

### Отвечать подробно:
- Архитектурные решения
- Когда просит пользователь
- Сложные изменения

### НЕ объяснять:
- Базовые операции
- Очевидные вещи
- Без запроса пользователя

## Чек-лист перед завершением задачи

- [ ] Код соответствует стайл-гайду проекта
- [ ] Написаны тесты для новой логики
- [ ] Все тесты проходят (`npm test`)
- [ ] Lint проходит (`npm run lint`)
- [ ] Типы корректны (`npx tsc --noEmit`)
- [ ] Проверено вручную в браузере
- [ ] Нет секретов в коде
- [ ] Документация обновлена (если требуется)

## Примеры кода для проекта

### Service Layer:

```ts
// src/services/orders/ordersService.ts
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus } from '@prisma/client';

export class OrdersService {
  async getOrders(params: {
    status?: OrderStatus;
    page?: number;
    pageSize?: number;
  }) {
    const { status, page = 1, pageSize = 20 } = params;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, pageSize };
  }
}

export const ordersService = new OrdersService();
```

### API Route (админский, с авторизацией):

```ts
// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ordersService } from '@/services/orders/ordersService';
import { orderListQuerySchema } from '@/lib/validators/order';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const session = await getServerSession();

  logger.info('API request', {
    method: 'GET',
    path: '/api/admin/orders',
    userId: session?.user?.id || 'anonymous',
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const params = orderListQuerySchema.parse({
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    status: searchParams.get('status'),
  });

  const result = await ordersService.getOrders(params);

  logger.info('API response', {
    method: 'GET',
    path: '/api/admin/orders',
    status: 200,
    duration: Date.now() - startTime,
  });

  return NextResponse.json(result);
}
```

### React Component (форма заявки):

```tsx
// src/components/orders/OrderForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema } from '@/lib/validators/order';
import type { z } from 'zod';

type FormData = z.infer<typeof createOrderSchema>;

const FURNITURE_TYPES = [
  { value: 'SOFA', label: 'Диван' },
  { value: 'ARMCHAIR', label: 'Кресло' },
  { value: 'MATTRESS', label: 'Матрас' },
  { value: 'CARPET', label: 'Ковёр' },
] as const;

export function OrderForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(createOrderSchema),
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // обработка результата
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* имя, телефон, тип мебели, комментарий */}
    </form>
  );
}
```

---

*Этот скилл специфичен для проекта «Химчистка Диванов» и основан на его стеке технологий.*
