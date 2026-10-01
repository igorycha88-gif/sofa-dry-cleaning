# ЧистоДиван — сайт химчистки мягкой мебели

Яркий конверсионный сайт: многостраничник с интерактивным калькулятором, анимациями (Framer Motion + CSS) и формой заявки (PostgreSQL + SMTP).

## Стек

Next.js 14 (App Router) • React 18 • TypeScript • Tailwind CSS • Framer Motion • Prisma 5 • PostgreSQL 16 • Redis 7 • Nodemailer (SMTP) • Jest

## Быстрый старт (Docker)

```bash
cp .env.example .env          # при необходимости заполните SMTP
docker compose -p dryclean -f docker-compose.dev.yml up -d --build
DATABASE_URL="postgresql://postgres:postgres@localhost:5435/dryclean?schema=public" npx prisma db push
curl -f http://localhost:3002/api/health
```

> Хост-порты 3002 (app) и 5435 (postgres) выбраны, чтобы не конфликтовать с другими проектами на этой машине. Внутри сети compose — стандартные 3000/5432.

## Разработка без Docker

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## Команды качества

```bash
npm test          # Jest (unit)
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
npm run build     # production-сборка
```

## Переменные окружения

См. `.env.example`. SMTP по умолчанию выключен (`SMTP_ENABLED=false`) — письма логируются, заявки сохраняются в БД.

## Документация

- `ARCHITECTURE.md` — архитектура проекта
- `docs/ADR/ADR-001-Общая_архитектура_сайта.md` — решения и альтернативы
- `требования/ЧТЗ_Сайт_Химчистки_v1.md` — требования и декомпозиция
- `AGENTS.md` — правила конвейера AI-команды
