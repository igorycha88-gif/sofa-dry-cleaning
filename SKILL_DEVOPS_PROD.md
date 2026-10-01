# Скилл AI-DevOps: Продакшн-деплой (VPS)

> ⚠️ **СТАТУС: НЕ АКТИВЕН.** VPS и домен появятся позже.
> Когда появятся — заполнить плейсхолдеры `<VPS_IP>`, `<DOMAIN>`
> в `PROD_CONFIG` (файл `PIPELINE_PROD.js`) и в этом скилле.
> Конвейер прода активируется автоматически.

## Роль

Ты — DevOps-инженер для ПРОДАКШН-деплоя. Отвечаешь за безопасное развёртывание из ветки `main` на VPS (`<VPS_IP>`) с гарантией отката при любой проблеме. Базовый скилл: `SKILL_DEVOPS.md`. Этот файл — продакшн-расширение.

## Ключевые отличия от Dev-деплоя

| Аспект | Dev (PIPELINE.js) | Prod (PIPELINE_PROD.js) |
|--------|-------------------|-------------------------|
| Среда | docker-compose.dev.yml (локально) | docker-compose.yml (VPS) |
| Сеть | bridge | host networking |
| Порт | 3000 | 3001 (production), 3003 (green) |
| Стратегия | Пересборка всех контейнеров | Blue-Green, образ из GHCR |
| Откат | Не требуется (dev) | Автоматический при провале |
| Бэкап БД | Нет | Обязательный перед деплоем |
| Nginx | Нет | Управление upstream |
| Уведомления | Нет | Telegram (если настроен) |

---

## Архитектура продакшн-деплоя

### VPS (`<VPS_IP>`)

```
┌──────────────────────────────────────────────────┐
│  VPS <VPS_IP>                                    │
│                                                  │
│  ┌──────────┐    ┌──────────────┐                │
│  │  Nginx   │───▶│ cleaning-app │ (port 3001)   │
│  │ :80/:443 │    │  Docker      │                │
│  └──────────┘    └──────┬───────┘                │
│                         │                         │
│  ┌──────────┐    ┌──────▼───────┐                │
│  │  Redis   │    │  PostgreSQL  │                │
│  │  :6379   │    │  :5432 (cleaning)            │
│  └──────────┘    └──────────────┘                │
│                                                  │
│  Host: network_mode=host (все сервисы)           │
│  /root/sofa-dry-cleaning/  ← app directory      │
│  /var/www/uploads/          ← uploads volume     │
└──────────────────────────────────────────────────┘
```

### Blue-Green Flow

```
ШАГ 1: BLUE работает на :3001, nginx → :3001

ШАГ 2: GREEN стартует на :3003 (nginx НЕ переключён)
        ┌──────────┐     ┌────────────────┐
        │  Nginx   │────▶│ BLUE (:3001) ✅│ ← пользователи тут
        │          │     │ GREEN(:3003) 🔵│ ← healthcheck
        └──────────┘     └────────────────┘

ШАГ 3: GREEN здоров → nginx → :3003
        ┌──────────┐     ┌────────────────┐
        │  Nginx   │────▶│ BLUE (:3001)   │ ← ещё работает
        │          │────▶│ GREEN(:3003) ✅│ ← пользователи тут
        └──────────┘     └────────────────┘

ШАГ 4: Запускаем новый на :3001, nginx → :3001, GREEN удаляем
        ┌──────────┐     ┌────────────────┐
        │  Nginx   │────▶│ NEW (:3001) ✅ │ ← пользователи тут
        │          │     │ (GREEN удалён) │
        └──────────┘     └────────────────┘
```

---

## Переменные окружения

### Ключевые env-переменные на VPS (.env)

```bash
# App
NODE_ENV=production
PORT=3001
NEXTAUTH_URL=https://<DOMAIN>
NEXTAUTH_SECRET=<secret>

# PostgreSQL (host networking → localhost)
DATABASE_URL=postgresql://postgres:<password>@127.0.0.1:5432/cleaning

# Redis (host networking → localhost)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<password>
REDIS_URL=redis://:<password>@127.0.0.1:6379

# Notifications (опционально)
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_CHAT_ID=<chat_id>

# SMTP (опционально, если нужны email-уведомления о заявках)
SMTP_HOST=<host>
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<password>
```

---

## Docker-образы

### Production Dockerfile (docker/Dockerfile)

Multi-stage build:
1. `base` — системные зависимости (curl, fonts)
2. `deps` — npm ci + prisma generate
3. `builder` — next build (с build-time env vars)
4. `runner` — минимальный runtime, non-root user

Expose: 3001
Healthcheck: `curl -f http://127.0.0.1:${PORT}/api/health`
Entrypoint: `docker/entrypoint.sh` (prisma migrate + npm start)

### Registry: GHCR

```
ghcr.io/igorycha88-gif/sofa-dry-cleaning/app:sha-XXXXXXX
ghcr.io/igorycha88-gif/sofa-dry-cleaning/app:latest
ghcr.io/igorycha88-gif/sofa-dry-cleaning/app:YYYYMMDD
```

---

## Версионирование приложения

### Принцип

Каждый деплой на прод = новая версия в package.json (semver).
Git tag `vMAJOR.MINOR.PATCH` создаётся перед деплоем.
Версия отображается в `/api/health` → `version` и в Telegram уведомлениях.

### Определение типа изменения

| Тип | Коммиты | Пример | Версия |
|-----|---------|--------|--------|
| **patch** | fix:, refactor:, chore:, docs:, style: | `fix: починил форму заявки` | 1.0.1 → 1.0.2 |
| **minor** | feat: | `feat: блок отзывов на главной` | 1.0.1 → 1.1.0 |
| **major** | feat!: или BREAKING CHANGE | `feat!: новый API` | 1.0.1 → 2.0.0 |

### Команды версионирования

```bash
# Текущая версия
grep '"version"' package.json | head -1 | sed 's/.*: "//;s/".*//'

# Список изменений с прошлой версии
git log v$(grep '"version"' package.json | head -1 | sed 's/.*: "//;s/".*//')..HEAD --oneline

# Bump версии (patch / minor / major)
npm version patch --no-git-tag-version   # 1.0.1 → 1.0.2
npm version minor --no-git-tag-version   # 1.0.1 → 1.1.0
npm version major --no-git-tag-version   # 1.0.1 → 2.0.0

# Git commit + tag
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v1.0.2"
git tag -a "v1.0.2" -m "Release v1.0.2: $(date +%Y-%m-%d)"
```

### CHANGELOG.md

Формат при добавлении записи:
```markdown
## [1.0.2] - YYYY-MM-DD

### Исправлено
- fix: починил валидацию телефона в форме заявки (abc1234)
- fix: исправил баг с Redis (def5678)

### Добавлено
- feat: блок отзывов на главной (ghi9012)
```

### Версия в /api/health

Health endpoint возвращает `version` из `process.env.npm_package_version`.
В Docker контейнере эта переменная устанавливается автоматически из `package.json`
при запуске через `node server.js` (Next.js standalone).

---

## Полное тестирование на проде

### Обзор

После успешного деплоя и верификации — проводится **полное тестирование**
на рабочем проде. Делится на два блока:

| Блок | Тип | Количество | Автоматический? |
|------|-----|------------|-----------------|
| A: API-тесты | curl + grep | 6 тестов | Да (SSH на VPS) |
| B: E2E ручные | Браузер | 5 чеклистов | Нет (пользователь) |

### Блок A: Автоматические API-тесты

Выполняются через SSH на VPS. Не требуют участия пользователя.

| ID | Тест | Проверка | Critical |
|----|------|----------|----------|
| FT1 | Health endpoint | status=ok, version=X.X.X, db=true, redis=true | **Да** |
| FT2 | HTTP статусы | /, /api/health, /zayavka → 200 | **Да** |
| FT3 | API функциональность | структура health + валидация заявки (400 на пустые данные) | **Да** |
| FT4 | SSL + Headers | HTTPS, HSTS, X-Frame-Options, redirect | Нет |
| FT5 | Performance | Время ответа < 3s (internal + external) | Нет |
| FT6 | Логи | Нет fatal/panic/unhandled за время деплоя | Нет |

### Блок B: Ручное E2E тестирование

Выводится чеклист. Пользователь проверяет в браузере и отвечает «Да/Нет».

| ID | Тест | Что проверять | Critical |
|----|------|---------------|----------|
| FT7 | Главная страница | Загрузка, шапка, навигация, блок услуг, футер, мобильная | **Да** |
| FT8 | Форма заявки | Поля, выбор типа мебели, валидация, отправка, success | **Да** |
| FT9 | Админ-панель (если есть) | /admin/login, форма логина, список заявок | Нет |
| FT10 | SEO | Title, description, OG, метрики, sitemap | Нет |
| FT11 | Мобильная версия | Бургер-меню, адаптивность, кнопки, скролл | Нет |

### Вердикт тестирования

| Результат | Условие | Действие |
|-----------|---------|----------|
| **GO** | Все critical = ✅ | → FINALIZE |
| **CONDITIONAL GO** | critical = ✅, есть warnings | → FINALIZE (с замечаниями) |
| **NO-GO** | Хотя бы один critical = ❌ | → АВТОМАТИЧЕСКИЙ ОТКАТ |

---

## Команды продакшн-деплоя

### Pre-flight

```bash
# Проверка VPS доступности
ssh -o ConnectTimeout=10 root@<VPS_IP> "echo OK"

# Проверка диска
ssh root@<VPS_IP> "df -m /root | tail -1 | awk '{print \$4}'"

# Проверка .env
ssh root@<VPS_IP> "test -f /root/sofa-dry-cleaning/.env && echo OK"

# Текущее состояние
ssh root@<VPS_IP> "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep cleaning"
```

### Backup

```bash
# Бэкап БД
ssh root@<VPS_IP> "pg_dump -U postgres -h 127.0.0.1 cleaning | gzip > /root/sofa-dry-cleaning/backups/db_\$(date +%Y%m%d_%H%M%S).sql.gz"

# Бэкап nginx конфига
ssh root@<VPS_IP> "cp /etc/nginx/conf.d/cleaning-upstream.conf /root/sofa-dry-cleaning/backups/nginx-upstream-\$(date +%Y%m%d_%H%M%S).conf"
```

### Build / Pull

```bash
# Push в main (триггерит CI)
git push origin main

# Мониторинг CI
gh run list --branch main --limit 1
gh run watch <run_id>

# Pull образа на VPS
ssh root@<VPS_IP> "docker pull ghcr.io/igorycha88-gif/sofa-dry-cleaning/app:sha-XXXXXXX"
```

### Deploy (Blue-Green)

```bash
# Запуск GREEN на 3003
ssh root@<VPS_IP> 'docker run -d \
  --name cleaning-app-green \
  --network host \
  --restart no \
  --env-file /root/sofa-dry-cleaning/.env \
  -e PORT=3003 \
  -e NODE_ENV=production \
  -v /var/www/uploads:/app/public/uploads \
  ghcr.io/igorycha88-gif/sofa-dry-cleaning/app:sha-XXXXXXX'

# Healthcheck GREEN (wait up to 120s)
ssh root@<VPS_IP> 'for i in $(seq 1 24); do
  sleep 5
  if curl -sf --max-time 3 "http://127.0.0.1:3003/api/health" | grep -q "\"status\":\"ok\""; then
    echo "GREEN healthy"
    exit 0
  fi
done; echo "GREEN FAILED"; exit 1'

# Переключение nginx
ssh root@<VPS_IP> 'cat > /etc/nginx/conf.d/cleaning-upstream.conf <<EOF
upstream app {
    server 127.0.0.1:3003;
    keepalive 32;
}
EOF
nginx -t && nginx -s reload'

# Smoke tests
ssh root@<VPS_IP> 'curl -sf http://127.0.0.1:3003/api/health && echo "OK"'

# Остановка BLUE, запуск нового production
ssh root@<VPS_IP> 'docker stop cleaning-app && docker rm cleaning-app'
ssh root@<VPS_IP> 'docker run -d \
  --name cleaning-app \
  --network host \
  --restart unless-stopped \
  --env-file /root/sofa-dry-cleaning/.env \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -v /var/www/uploads:/app/public/uploads \
  ghcr.io/igorycha88-gif/sofa-dry-cleaning/app:sha-XXXXXXX'

# Переключение nginx на 3001
ssh root@<VPS_IP> 'cat > /etc/nginx/conf.d/cleaning-upstream.conf <<EOF
upstream app {
    server 127.0.0.1:3001;
    keepalive 32;
}
EOF
nginx -t && nginx -s reload'

# Удаление GREEN
ssh root@<VPS_IP> 'docker rm -f cleaning-app-green'
```

### Rollback

```bash
# Экстренный откат: переключить nginx на BLUE
ssh root@<VPS_IP> 'cat > /etc/nginx/conf.d/cleaning-upstream.conf <<EOF
upstream app {
    server 127.0.0.1:3001;
    keepalive 32;
}
EOF
nginx -t && nginx -s reload'

# Удалить GREEN
ssh root@<VPS_IP> 'docker rm -f cleaning-app-green 2>/dev/null'

# Если BLUE не работает — запустить предыдущий образ
ssh root@<VPS_IP> "docker run -d --name cleaning-app --network host --restart unless-stopped \
  --env-file /root/sofa-dry-cleaning/.env \
  -e PORT=3001 -e NODE_ENV=production \
  -v /var/www/uploads:/app/public/uploads \
  <PREVIOUS_IMAGE>"

# Восстановление БД (ТОЛЬКО при подтверждении пользователя)
# gunzip -c /root/sofa-dry-cleaning/backups/db_YYYYMMDD.sql.gz | psql -U postgres cleaning
```

### Verification

```bash
# Контейнеры
ssh root@<VPS_IP> "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' | grep cleaning"

# Health (internal)
ssh root@<VPS_IP> "curl -sf http://127.0.0.1:3001/api/health"

# Health (external / SSL)
curl -sf --max-time 10 "https://<DOMAIN>/api/health"

# Redis
ssh root@<VPS_IP> 'redis-cli -h 127.0.0.1 -a "$REDIS_PASSWORD" ping'

# PostgreSQL
ssh root@<VPS_IP> "pg_isready -h 127.0.0.1 -p 5432"

# Логи (искать ошибки)
ssh root@<VPS_IP> "docker logs cleaning-app --tail=50 2>&1 | grep -iE 'error|fatal|panic|NOAUTH'"
```

### Cleanup

```bash
# Удалить старые образы (оставить 10)
ssh root@<VPS_IP> 'docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "ghcr.io.*sofa-dry-cleaning.*app" | grep -v "<none>" | tail -n +11 | xargs -r docker rmi'

# Удалить старые бэкапы (> 7 дней)
ssh root@<VPS_IP> 'find /root/sofa-dry-cleaning/backups -name "*.sql.gz" -mtime +7 -delete'

# Удалить старые логи (> 30 дней)
ssh root@<VPS_IP> 'find /var/log/cleaning-deploy -name "*.log" -mtime +30 -delete'

# Prune unused images
ssh root@<VPS_IP> 'docker image prune -f'
```

---

## Telegram уведомления (если настроены)

```bash
# Source env for credentials
source /root/sofa-dry-cleaning/.env

# Success
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "'${TELEGRAM_CHAT_ID}'", "text": "✅ Деплой успешен\nВерсия: v1.0.2\nВремя: Xs\nИнициатор: manual"}'

# Failure + Rollback
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "'${TELEGRAM_CHAT_ID}'", "text": "🔄 Деплой FAILED + откат\nПричина: healthcheck failed\nВернулись к: sha-YYYYYYY"}'

# Critical (rollback failed)
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "'${TELEGRAM_CHAT_ID}'", "text": "🚨 КРИТИЧЕСКАЯ ОШИБКА: откат провалился\nРучное вмешательство! VPS <VPS_IP>"}'
```

---

## Типичные проблемы и решения

| Проблема | Симптом | Решение |
|----------|---------|---------|
| GREEN не стартует | `docker ps` не показывает cleaning-app-green | `docker logs cleaning-app-green` — проверить ошибку |
| GREEN healthcheck timeout | 120s — нет ответа | Проверить PORT=3003, проверить entrypoint, проверить миграции |
| nginx -t failed | Config test error | Проверить `/etc/nginx/conf.d/cleaning-upstream.conf` — синтаксис |
| Redis NOAUTH | `NOAUTH Authentication required` | Проверить REDIS_PASSWORD в .env |
| DB migration failed | Prisma error в логах | Откат + восстановить из бэкапа |
| Image not found | `docker pull` → 404 | Проверить GHCR registry, проверить image tag |
| Disk full | `no space left on device` | `docker image prune -a`, `docker system prune` |
| OOM Kill | `SIGKILL` в логах | Уменьшить `--max-old-space-size` или добавить RAM |

---

## Порядок действий при ручном деплое (чеклист)

### Перед деплоем
- [ ] PROD_CONFIG заполнен (VPS_IP, DOMAIN, OWNER)
- [ ] Ветка = main
- [ ] Все изменения закоммичены и запушены
- [ ] CI pipeline прошёл (gh run list)
- [ ] VPS доступен (SSH)
- [ ] Диск > 1GB свободного места
- [ ] .env на месте

### Во время деплоя
- [ ] Бэкап БД создан
- [ ] GREEN контейнер запущен на 3003
- [ ] GREEN healthcheck пройден
- [ ] Nginx переключён
- [ ] Smoke tests пройдены
- [ ] Production контейнер на 3001
- [ ] GREEN удалён

### После деплоя
- [ ] https://<DOMAIN>/api/health → 200
- [ ] Redis подключен
- [ ] PostgreSQL подключена
- [ ] Логи без fatal/panic
- [ ] Telegram уведомление отправлено (если настроено)
- [ ] Старые образы почищены

---

## Ссылки

- **Базовый скилл:** `SKILL_DEVOPS.md`
- **Формальная спецификация:** `PIPELINE_PROD.js`
- **CI/CD workflow:** `.github/workflows/ci.yml`
- **Production Dockerfile:** `docker/Dockerfile`
- **Production compose:** `docker-compose.yml`

---

*Скилл создан для безопасного продакшн-деплоя с Blue-Green стратегией и автоматическим откатом.*
