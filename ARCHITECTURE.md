# ARCHITECTURE.md — Сайт «Химчистка диванов»

> Blueprint v1.0 (2026-10-01). Основан на ADR-001.

## 1. Обзор

Конверсионный многостраничный сайт услуг химчистки. Цель — заявка (лид) через форму или калькулятор. Яркий градиентный дизайн, анимации, CTA-ориентированная структура.

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Prisma 5, PostgreSQL 16
- **Кэш/лимиты:** Redis 7 (ioredis)
- **Почта:** nodemailer (SMTP)
- **Тесты:** Jest 29 + ts-jest
- **Инфра:** Docker Compose (dev), GitHub Actions (CI)

## 2. Структура страниц

```
/                     Главная: Hero → Marquee → Bento-преимущества → Шаги → Калькулятор →
                      До/После → Отзывы → FAQ → Финальный CTA → Footer
/uslugi               Список услуг (карточки с ценами «от»)
/uslugi/[slug]        SEO-страница услуги: описание, процесс, цены, форма, FAQ (SSG, 6 слагов)
/ceny                 Полный прайс + встроенный калькулятор
/kontakty             Контакты, карта, часы работы, форма
```

## 3. Дизайн-система

### Цвета (Tailwind tokens)

| Токен | Значение | Использование |
|-------|----------|---------------|
| `primary` | cyan-500 `#06b6d4` | Основной акцент |
| `secondary` | violet-600 `#7c3aed` | Градиенты, заголовки |
| `accent` | fuchsia-500 `#d946ef` | CTA-glow, бейджи |
| `cta` | gradient: cyan→violet→fuchsia | Все основные кнопки |
| `surface` | white / slate-50 | Фон секций |
| `ink` | slate-900 | Текст |

Градиент бренда: `linear-gradient(135deg, #06b6d4, #7c3aed 50%, #d946ef)`.

### Типографика

- **Заголовки:** Unbounded (variable, кириллица) — hero 48–72px, секции 32–40px
- **Текст:** Manrope (variable, кириллица) — 16–18px
- Обе через `next/font/google` (self-hosted, `display: swap`, zero CLS)

### Радиусы и тени

- Карточки: `rounded-3xl` (24px) — тренд крупных скруглений
- Кнопки: `rounded-full`
- Тень: `shadow-glow` (цветное свечение для CTA), `shadow-bento` (мягкая многослойная)

### Компоненты UI (`src/components/ui/`)

| Компонент | Описание |
|-----------|----------|
| `Button` | Варианты: `cta` (градиент + hover-glow + scale), `ghost`, `outline` |
| `BentoCard` | Стеклянная карточка `bg-white/60 backdrop-blur` + hover-lift |
| `SectionHeading` | Бейдж-надзаголовок + градиентный заголовок + подзаголовок |
| `Badge` | Скруглённый бейдж с иконкой |
| `Input` / `Textarea` / `Select` | Состояния: default / focus (gradient-ring) / error |
| `AnimatedNumber` | Счётчик цены (Framer Motion `animate`) |

## 4. План анимаций (конверсионная механика)

| Секция | Анимация | Технология |
|--------|----------|------------|
| Hero | Aurora-фон (дышащие градиентные пятна), появление текста stagger, floating price-карточки | CSS keyframes + Framer |
| Hero кнопка CTA | Hover: scale 1.05 + glow; пульсирующее кольцо | Framer + CSS |
| Marquee | Бесконечная бегущая строка УТП | CSS `@keyframes marquee` |
| Bento-преимущества | Reveal по скроллу + stagger 80ms, hover-lift | Framer `whileInView` |
| Шаги работы | Timeline: линия «растёт» по скроллу, шаги появляются | Framer `useScroll` |
| Калькулятор | Цена — анимированный счётчик; выбор — spring-микровзаимодействия | Framer `animate`/`spring` |
| До/После | Перетаскиваемый слайдер сравнения | Framer `useMotionValue` |
| Отзывы | Горизонтальная карусель со snap | CSS scroll-snap |
| FAQ | Аккордеон с плавным раскрытием высоты | Framer `AnimatePresence` |
| Sticky CTA (mobile) | Появление после 1-го экрана | Framer `useInView` |
| Все | `prefers-reduced-motion` → отключение | `useReducedMotion` |

## 5. Калькулятор (ядро конверсии)

```
Шаг 1: Тип мебели (SOFA | CORNER_SOFA | ARMCHAIR | MATTRESS | CARPET | CHAIR | OTTOMAN)
Шаг 2: Размер (кол-во мест / м²)
Шаг 3: Опции (сильное загрязнение ×1.25, срочный выезд ×1.2, антибактериальная обработка +X₽, удаление запахов +X₽)
→ Итог: анимированная цена + кнопка «Оставить заявку» (телефон + имя)
```

Цены: `src/config/pricing.ts` (ADR-001.2). Компонент — Client Component, цена считается на лету, та же формула валидируется на сервере через Zod.

## 6. БД (prisma/schema.prisma)

См. ADR-001 → `Order`, `OrderStatus`, `FurnitureType`. Индекс `@@index([status, createdAt])`.

## 7. API

### POST /api/v1/orders
```
Request:  OrderCreateInput (Zod: имя 2-100, телефон E.164/RU-формат, ...)
Flow:     honeypot check → rate limit (Redis, 5/60s/IP) → Zod validate → Prisma create
          → SMTP (менеджеру + клиенту, таймаут 5с, ошибка не валирует) → 201 { id }
Errors:   400 (валидация) | 422 (honeypot молча 201-fake) | 429 (rate limit) | 500
```

### GET /api/health
```
Response: { status: 'ok', db: 'up'|'down', redis: 'up'|'down', uptime }
```

## 8. Слои backend

```
route.ts (валидация, rate limit, лог) → services/ordersService.ts (бизнес-логика)
                                     → lib/smtp.ts (письма)
                                     → lib/prisma.ts / lib/redis.ts (singleton)
                                     → lib/logger.ts (структурированные логи)
```

## 9. SEO

- Metadata API: title/description/OG для каждой страницы
- JSON-LD: `LocalBusiness` (глобально), `Service` + `FAQPage` (страницы услуг)
- `sitemap.ts`, `robots.ts`, `generateStaticParams` для `/uslugi/[slug]`
- Семантическая разметка, alt у изображений, кириллические slug (`/uslugi/divan`)

## 10. Производительность (бюджеты)

- Анимации: только `transform`/`opacity` (60 FPS)
- Изображения: `next/image`, hero — `priority`, AVIF/WebP
- Страницы статичны (SSG), API — `runtime = 'nodejs'`
- Шрифты: self-hosted `next/font`
- Lighthouse mobile ≥ 90

## 11. Безопасность

- SMTP-креденшилы только в env (сервер)
- Zod на всех входах API
- Rate limit + honeypot на форме
- Заголовки: CSP/X-Frame-Options в `next.config.js`
- Телефон логируется маскированно (PII)
