/**
 * PIPELINE_PROD.js — Конвейер безопасного ручного деплоя на прод
 *
 * Это НЕ исполняемый файл. Это ФОРМАЛЬНАЯ СПЕЦИФИКАЦИЯ конвейера
 * продакшн-деплоя, которую AI-агент (opencode) обязан выполнять пошагово.
 *
 * ⚠️ СТАТУС: НЕ АКТИВЕН — VPS и домен появятся позже.
 * Когда появятся — заполнить плейсхолдеры в PROD_CONFIG ниже.
 * Конвейер активируется автоматически (агент проверяет, заполнен ли конфиг).
 *
 * Отличия от основного конвейера (PIPELINE.js):
 *   - PIPELINE.js    → разработка (локально, docker-compose.dev.yml)
 *   - PIPELINE_PROD  → деплой на прод (VPS, main → production)
 *
 * Принцип: ОДИН промпт пользователя → безопасный деплой с откатом.
 * Каждый шаг проверяем, каждый провал — откат.
 *
 * Триггерные фразы пользователя:
 *   «деплой на прод», «задеплой», «деплой в прод», «выложить на прод»,
 *   «push to prod», «deploy to production», «запусти прод деплой»
 *
 * Если PROD_CONFIG не заполнен (содержит "<...>") → сообщить пользователю:
 * «Прод не настроен: нет VPS/домена. Заполни PROD_CONFIG в PIPELINE_PROD.js
 * или деплой выполнится локально через PIPELINE.js».
 *
 * Базовый скилл: SKILL_DEVOPS.md (стандарт работы DevOps)
 * Расширенный скилл: SKILL_DEVOPS_PROD.md (продакшн-специфичные практики)
 */

// ═══════════════════════════════════════════════════════════════════════
// КОНФИГ ПРОДАКШЕНА — ЗАПОЛНИТЬ при появлении VPS и домена
// ═══════════════════════════════════════════════════════════════════════

const PROD_CONFIG = {
  VPS_HOST: "<VPS_IP>",          // TODO: IP VPS-сервера, например 37.x.x.x
  PROD_DOMAIN: "<DOMAIN>",       // TODO: домен сайта, например himchistka-divanov.ru
  GHCR_OWNER: "igorycha88-gif",  // владелец репозитория на GitHub (для GHCR)
  REPO_NAME: "sofa-dry-cleaning",
  BRANCH: "main",                // основная ветка разработки
  APP_DIR: "/root/sofa-dry-cleaning",     // каталог проекта на VPS
  APP_CONTAINER: "cleaning-app",
  GREEN_CONTAINER: "cleaning-app-green",
  BLUE_PORT: 3001,               // production порт
  GREEN_PORT: 3003,              // blue-green порт для проверки новой версии
  DB_NAME: "cleaning",
  NGINX_UPSTREAM: "/etc/nginx/conf.d/cleaning-upstream.conf",
  UPLOADS_DIR: "/var/www/uploads",
  DEPLOY_LOG_DIR: "/var/log/cleaning-deploy",
  IMAGE: () => `ghcr.io/${PROD_CONFIG.GHCR_OWNER}/${PROD_CONFIG.REPO_NAME}/app`, // + :tag
};

// ═══════════════════════════════════════════════════════════════════════
// 6 ЖЕЛЕЗНЫХ ПРАВИЛ ПРОД ДЕПЛОЯ
// ═══════════════════════════════════════════════════════════════════════

const PROD_RULES = {

  PR1_BACKUP_FIRST: `
    ПРАВИЛО 1: БЭКАП ПРЕЖДЕ ВСЕГО
    Перед ЛЮБЫМ изменением на проде — ОБЯЗАТЕЛЬНО:
    - Бэкап БД (pg_dump)
    - Фиксация текущего состояния контейнеров (docker ps, image tags)
    - Сохранение текущего nginx конфига
    БЭКАП — это страховка для отката. Без бэкапа — деплой НЕ начинается.`,

  PR2_BLUE_GREEN: `
    ПРАВИЛО 2: BLUE-GREEN ДЕПЛОЙ
    НИКОГДА не останавливать текущий контейнер до проверки нового.
    Новый контейнер запускается на GREEN_PORT=3003.
    Healthcheck проходит → переключаем nginx → останавливаем старый.
    Если healthcheck провалился — старый контейнер ПРОДОЛЖАЕТ работать.`,

  PR3_VERIFY_EVERY_STEP: `
    ПРАВИЛО 3: ВЕРИФИКАЦИЯ КАЖДОГО ШАГА
    Каждый этап завершается проверкой:
    - Build/Pull → образ существует
    - Start container → healthcheck pass
    - Nginx switch → HTTP 200
    - Smoke tests → все критические эндпоинты отвечают
    Провал любого шага → СТОП + ОТКАТ.`,

  PR4_AUTO_ROLLBACK: `
    ПРАВИЛО 4: АВТОМАТИЧЕСКИЙ ОТКАТ
    При провале healthcheck или smoke tests:
    1. Переключить nginx на предыдущий контейнер
    2. Остановить провалившийся контейнер
    3. Вернуть предыдущий образ (PREVIOUS_IMAGE)
    4. Верифицировать откат
    5. Уведомить через Telegram (если настроен)
    Откат НЕ требует подтверждения пользователя — это автоматическая защита.`,

  PR5_NO_PARTIAL_DEPLOY: `
    ПРАВИЛО 5: ПОЛНАЯ ПЕРЕСБОРКА
    На проде Docker-образы — неделимые артефакты.
    ЗАПРЕЩЕНО: обновлять один контейнер, не трогая остальные.
    ЗАПРЕЩЕНО: частичная пересборка на проде.
    Каждый деплой — новый Docker-образ целиком (multi-stage build).
    nginx, Redis, PostgreSQL — НЕ пересобираются (они stateful сервисы).`,

  PR6_AUDIT_TRAIL: `
    ПРАВИЛО 6: АУДИТ
    Каждый деплой логируется:
    - timestamp начала/конца
    - предыдущий образ → новый образ
    - commit SHA
    - результат (success / failed / rolled_back)
    - длительность
    - инициатор
    Логи: ${PROD_CONFIG.DEPLOY_LOG_DIR}/deploy-YYYYMMDD-HHMMSS.log
    Уведомление: Telegram (success/failure/rollback) — если настроен`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 0: ПРЕДПОСЁЛОЧНАЯ ПРОВЕРКА (Pre-Flight)
// ═══════════════════════════════════════════════════════════════════════

const PREFLIGHT_STAGE = {
  role: "DEVOPS",
  icon: "🔍",
  name: "PRE-FLIGHT CHECK",

  description: `
    Проверка готовности к деплою. Если любой чек проваливается —
    деплой НЕ начинается, выводится причина.`,

  steps: [
    {
      id: "PF0",
      name: "Проверка заполненности PROD_CONFIG",
      action: `Если VPS_HOST или PROD_DOMAIN содержат "<...>" →
        СТОП. Сообщить: «Прод не настроен (нет VPS/домена).
        Заполни PROD_CONFIG в PIPELINE_PROD.js».`,
      critical: true,
    },
    {
      id: "PF1",
      name: "Проверка ветки",
      action: `Убедиться что текущая ветка = ${PROD_CONFIG.BRANCH}:
        git branch --show-current
        Если НЕ ${PROD_CONFIG.BRANCH} → ВЫВЕСТИ предупреждение и спросить подтверждение.`,
      critical: true,
    },
    {
      id: "PF2",
      name: "Проверка CI статуса",
      action: `Проверить что последний CI pipeline прошёл:
        gh run list --branch ${PROD_CONFIG.BRANCH} --limit 1 --json status,conclusion
        Если conclusion != "success" → ВЫВЕСТИ предупреждение.
        Если есть непройденные тесты → СПРОСИТЬ подтверждение.`,
      critical: true,
    },
    {
      id: "PF3",
      name: "Проверка незакоммиченных изменений",
      action: `git status --porcelain
        Если есть незакоммиченные файлы → ВЫВЕСТИ предупреждение,
        СПРОСИТЬ: «Есть незакоммиченные изменения. Продолжить?»`,
      critical: false,
    },
    {
      id: "PF4",
      name: "Проверка VPS доступности",
      action: `SSH connectivity check:
        ssh -o ConnectTimeout=10 -o BatchMode=yes root@${PROD_CONFIG.VPS_HOST} "echo OK"
        Если недоступен → деплой НЕ начинается.`,
      critical: true,
    },
    {
      id: "PF5",
      name: "Проверка дискового пространства на VPS",
      action: `ssh root@VPS "df -m /root | tail -1 | awk '{print \\$4}'"
        Если свободно < 2GB → ВЫВЕСТИ предупреждение.
        Если свободно < 500MB → деплой НЕ начинается.`,
      critical: true,
    },
    {
      id: "PF6",
      name: "Проверка .env на проде",
      action: `ssh root@VPS "test -f ${PROD_CONFIG.APP_DIR}/.env && echo OK || echo MISSING"
        Если .env отсутствует → деплой НЕ начинается.`,
      critical: true,
    },
    {
      id: "PF7",
      name: "Фиксация текущего состояния прода",
      action: `Зафиксировать для возможного отката:
        - Текущий контейнер: docker ps --format '{{.Names}} {{.Image}} {{.Status}}'
        - Текущий образ: docker inspect --format='{{.Config.Image}}' ${PROD_CONFIG.APP_CONTAINER}
        - Текущий nginx upstream: cat ${PROD_CONFIG.NGINX_UPSTREAM}
        - Текущий commit: git rev-parse HEAD
        Сохранить в PREVIOUS_STATE.`,
      critical: true,
    },
  ],

  output: `Pre-flight report:
    ✅/❌ PROD_CONFIG: заполнен
    ✅/❌ Ветка: ${PROD_CONFIG.BRANCH}
    ✅/❌ CI: passed
    ✅/❌ VPS: доступен
    ✅/❌ Диск: X MB free
    ✅/❌ .env: OK
    📸 Текущее состояние прода зафиксировано`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 0.5: ВЕРСИОНИРОВАНИЕ (Versioning) — перед бэкапом
// ═══════════════════════════════════════════════════════════════════════

const VERSIONING_STAGE = {
  role: "DEVOPS",
  icon: "🏷️",
  name: "VERSIONING",

  description: `
    Определение и фиксация версии приложения перед деплоем.
    Версия хранится в package.json (semver: MAJOR.MINOR.PATCH).
    Каждый деплой = новая версия. Git tag = vMAJOR.MINOR.PATCH.
    Версия отображается в /api/health и в Telegram уведомлениях.`,

  semver: {
    source: "package.json → field: version",
    format: "MAJOR.MINOR.PATCH (semver)",
    current: "Читается из package.json автоматически",
    bump_rules: `
      patch (1.0.1 → 1.0.2): баг-фиксы, мелкие правки, безопасности
      minor (1.0.1 → 1.1.0): новый функционал, новые страницы, новые API
      major (1.0.1 → 2.0.0): breaking changes, смена архитектуры, удаление API`,
  },

  steps: [
    {
      id: "VR1",
      name: "Определение текущей версии",
      action: `Прочитать текущую версию:
        grep '"version"' package.json | head -1 | sed 's/.*: "//;s/".*//'
        Пример: 1.0.1
        Запомнить как CURRENT_VERSION.`,
      critical: true,
    },
    {
      id: "VR2",
      name: "Определение типа изменения (patch / minor / major)",
      action: `Проанализировать что было изменено с предыдущего деплоя:
        git log v${CURRENT_VERSION}..HEAD --oneline
        По коммит-сообщениям определить тип:
        - Если есть "feat!" или "BREAKING CHANGE" → major
        - Если есть "feat:" → minor
        - Иначе (fix:, refactor:, chore:, docs:, etc.) → patch

        Если git tag v${CURRENT_VERSION} не существует →
        использовать git log --oneline -20 для анализа.

        ЗАДАТЬ вопрос пользователю через question tool:
        «Какой тип версионирования?» с вариантами:
        - patch (баг-фикс) — рекомендуемый на основе анализа
        - minor (новый функционал)
        - major (breaking change)
        Если пользователь не ответил 2 мин → использовать рекомендуемый.`,
      critical: true,
    },
    {
      id: "VR3",
      name: "Bump версии в package.json",
      action: `Увеличить версию:
        npm version ${BUMP_TYPE} --no-git-tag-version
        Это обновит package.json и package-lock.json.
        Запомнить NEW_VERSION.
        Пример: 1.0.1 → 1.0.2`,
      critical: true,
    },
    {
      id: "VR4",
      name: "Обновление CHANGELOG.md",
      action: `Прочитать существующий CHANGELOG.md (если есть).
        Собрать список изменений:
        git log v${CURRENT_VERSION}..HEAD --pretty=format:"- %s (%h)" --no-merges

        Создать/обновить CHANGELOG.md — добавить блок наверх:
        ## [${NEW_VERSION}] - $(date +%Y-%m-%d)
        ### Добавлено
        - feat: ...
        ### Исправлено
        - fix: ...
        ### Изменено
        - refactor: ...

        Если CHANGELOG.md не существует — создать с заголовком.`,
      critical: false,
    },
    {
      id: "VR5",
      name: "Git commit + tag",
      action: `Закоммитить изменения версии:
        git add package.json package-lock.json CHANGELOG.md
        git commit -m "chore: release v${NEW_VERSION}"

        Создать git tag:
        git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}: $(date +%Y-%m-%d)"

        НЕ ПУШИТЬ — push будет на этапе BUILD вместе с кодом.`,
      critical: true,
    },
    {
      id: "VR6",
      name: "Вывод версионного отчёта",
      action: `Вывести:
        📦 Версия: ${CURRENT_VERSION} → ${NEW_VERSION}
        🏷️  Tag: v${NEW_VERSION}
        📝 Изменений: $(git log v${CURRENT_VERSION}..HEAD --oneline | wc -l) коммитов
        Тип: ${BUMP_TYPE}`,
      critical: true,
    },
  ],

  output: `Versioning report:
    📦 Версия: 1.0.1 → 1.0.2
    🏷️  Tag: v1.0.2 (готов к push)
    📝 CHANGELOG.md обновлён
    Тип: patch`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 1: БЭКАП (Backup)
// ═══════════════════════════════════════════════════════════════════════

const BACKUP_STAGE = {
  role: "DEVOPS",
  icon: "💾",
  name: "BACKUP",

  steps: [
    {
      id: "BK1",
      name: "Бэкап базы данных",
      action: `Создать бэкап PostgreSQL:
        ssh root@VPS "pg_dump -U postgres -h 127.0.0.1 ${PROD_CONFIG.DB_NAME} | gzip > ${PROD_CONFIG.APP_DIR}/backups/db_$(date +%Y%m%d_%H%M%S).sql.gz"
        Если pg_dump не работает через TCP → попробовать:
        ssh root@VPS "sudo -u postgres pg_dump ${PROD_CONFIG.DB_NAME} | gzip > ..."
        Бэкап ОБЯЗАТЕЛЕН. Если бэкап провалился → WARN + спросить подтверждение.`,
      critical: true,
      rollback: "Бэкап нужен для отката при повреждении данных миграцией.",
    },
    {
      id: "BK2",
      name: "Сохранение nginx конфигурации",
      action: `ssh root@VPS "cp ${PROD_CONFIG.NGINX_UPSTREAM} ${PROD_CONFIG.APP_DIR}/backups/nginx-upstream-$(date +%Y%m%d_%H%M%S).conf 2>/dev/null || true"
        Сохранить текущий nginx upstream для быстрого отката.`,
      critical: false,
    },
    {
      id: "BK3",
      name: "Проверка бэкапа",
      action: `Убедиться что бэкап создан и имеет размер > 0:
        ls -la ${PROD_CONFIG.APP_DIR}/backups/db_*.sql.gz | tail -1
        Если файл пустой или отсутствует → WARN.`,
      critical: true,
    },
  ],

  output: `Backup report:
    💾 DB backup: ${PROD_CONFIG.APP_DIR}/backups/db_YYYYMMDD_HHMMSS.sql.gz (X MB)
    📄 Nginx config backed up
    ✅ Готово к деплою`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 2: СБОРКА (Build / Pull)
// ═══════════════════════════════════════════════════════════════════════

const BUILD_STAGE = {
  role: "DEVOPS",
  icon: "🏗️",
  name: "BUILD",

  steps: [
    {
      id: "BD1",
      name: `Push в ${PROD_CONFIG.BRANCH} (если есть незапушенные коммиты)`,
      action: `Проверить: git status и git log origin/${PROD_CONFIG.BRANCH}..HEAD
        Если есть незапушенные коммиты → ВЫПОЛНИТЬ git push origin ${PROD_CONFIG.BRANCH}
        Push триггерит GitHub Actions CI pipeline (build Docker image → push to GHCR).
        ДОЖДАТЬСЯ завершения CI pipeline (gh run watch).`,
      critical: true,
    },
    {
      id: "BD2",
      name: "Ожидание CI completion",
      action: `Если CI не запущен — запустить вручную:
        gh workflow run ci.yml --ref ${PROD_CONFIG.BRANCH}
        Отслеживать:
        gh run list --branch ${PROD_CONFIG.BRANCH} --limit 1
        gh run watch <run_id>
        Таймаут: 15 минут.
        Если CI failed → СТОП. Деплой НЕ продолжается.`,
      critical: true,
    },
    {
      id: "BD3",
      name: "Определение образа для деплоя",
      action: `Получить SHA последнего коммита:
        SHORT_SHA=$(git rev-parse --short HEAD)
        IMAGE_TAG="sha-${SHORT_SHA}"
        IMAGE="${PROD_CONFIG.IMAGE()}:${IMAGE_TAG}"
        Вывести: «Деплой образ: ${IMAGE}»`,
      critical: true,
    },
    {
      id: "BD4",
      name: "Pull образа на VPS",
      action: `SSH на VPS и пуллим образ:
        ssh root@VPS "docker pull ${IMAGE}"
        Если pull failed → попытаться локальный билд:
        ssh root@VPS "cd ${PROD_CONFIG.APP_DIR} && docker compose -f docker-compose.yml build --no-cache app"
        Таймаут: 10 минут.`,
      critical: true,
      on_failure: "Если pull и local build оба провалились → СТОП + ОТКАТ невозможен (старый контейнер ещё работает).",
    },
  ],

  output: `Build report:
    📦 Image: ${PROD_CONFIG.IMAGE()}:sha-XXXXXXX
    ✅ CI: passed
    ✅ Image pulled on VPS`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 3: ДЕПЛОЙ (Blue-Green)
// ═══════════════════════════════════════════════════════════════════════

const DEPLOY_STAGE = {
  role: "DEVOPS",
  icon: "🚀",
  name: "BLUE-GREEN DEPLOY",

  BLUE_PORT: PROD_CONFIG.BLUE_PORT,
  GREEN_PORT: PROD_CONFIG.GREEN_PORT,
  NGINX_UPSTREAM: PROD_CONFIG.NGINX_UPSTREAM,

  steps: [
    {
      id: "DP1",
      name: "Очистка старого green контейнера",
      action: `Удалить остатки предыдущего green:
        ssh root@VPS "docker rm -f ${PROD_CONFIG.GREEN_CONTAINER} 2>/dev/null || true"`,
      critical: false,
    },
    {
      id: "DP2",
      name: "Запуск GREEN контейнера",
      action: `Запустить новый контейнер на GREEN_PORT=${PROD_CONFIG.GREEN_PORT}:
        ssh root@VPS "docker run -d \\
          --name ${PROD_CONFIG.GREEN_CONTAINER} \\
          --network host \\
          --restart no \\
          --env-file ${PROD_CONFIG.APP_DIR}/.env \\
          -e PORT=${PROD_CONFIG.GREEN_PORT} \\
          -e NODE_ENV=production \\
          -v ${PROD_CONFIG.UPLOADS_DIR}:/app/public/uploads \\
          ${IMAGE}"

        ВАЖНО: --restart no — чтобы при краше не перезапускался автоматически.
        ВАЖНО: BLUE контейнер (${PROD_CONFIG.APP_CONTAINER}) ПРОДОЛЖАЕТ работать на порту ${PROD_CONFIG.BLUE_PORT}.
        Пользователи ничего не замечают.`,
      critical: true,
    },
    {
      id: "DP3",
      name: "Healthcheck GREEN контейнера",
      action: `Ждём healthcheck на GREEN порту (макс 120 секунд):
        for i in $(seq 1 24); do
          sleep 5
          if curl -sf --max-time 3 "http://127.0.0.1:${PROD_CONFIG.GREEN_PORT}/api/health" | grep -q '"status":"ok"'; then
            echo "GREEN healthy after $((i*5))s"
            break
          fi
          if ! docker ps | grep -q ${PROD_CONFIG.GREEN_CONTAINER}; then
            echo "GREEN container died"
            break
          fi
        done

        Проверить:
        1. Контейнер RUNNING (docker ps)
        2. HTTP /api/health → 200 + "status":"ok"
        3. В логах нет fatal/error (docker logs ${PROD_CONFIG.GREEN_CONTAINER} --tail=20)

        Если healthcheck FAILED → АВТОМАТИЧЕСКИЙ ОТКАТ (см. ROLLBACK).`,
      critical: true,
      rollback_trigger: true,
    },
    {
      id: "DP4",
      name: "Миграции БД (внутри контейнера)",
      action: `Миграции запускаются автоматически в entrypoint.sh контейнера.
        Проверить что миграция прошла:
        docker logs ${PROD_CONFIG.GREEN_CONTAINER} 2>&1 | grep -i "migration\\|prisma" | tail -5
        Если логи показывают ошибку миграции → ОТКАТ.
        ПРИМЕЧАНИЕ: Откат миграции сложен. Бэкап БД — наша страховка.`,
      critical: true,
      rollback_trigger: true,
    },
    {
      id: "DP5",
      name: "Переключение nginx на GREEN",
      action: `Переключить nginx upstream на GREEN порт:
        cat > ${PROD_CONFIG.NGINX_UPSTREAM} <<EOF
        upstream app {
            server 127.0.0.1:${PROD_CONFIG.GREEN_PORT};
            keepalive 32;
        }
        EOF
        nginx -t && nginx -s reload

        ВАЖНО: Это момент когда пользователи начинают видеть новую версию.
        Если nginx -t failed → НЕ переключаем, BLUE продолжает работать.`,
      critical: true,
    },
    {
      id: "DP6",
      name: "Smoke tests на GREEN (через nginx)",
      action: `Проверить критические эндпоинты через nginx (порт 80/443):
        - GET /api/health → 200
        - GET / → 200
        - GET /zayavka (страница формы заявки) → 200
        - GET /api/services (если реализован) → 200

        Если любой FAILED → ОТКАТ (переключить nginx обратно на BLUE).`,
      critical: true,
      rollback_trigger: true,
    },
    {
      id: "DP7",
      name: "Остановка BLUE + запуск нового production контейнера",
      action: `После успешных smoke tests:
        1. Остановить старый BLUE: docker stop ${PROD_CONFIG.APP_CONTAINER} && docker rm ${PROD_CONFIG.APP_CONTAINER}
        2. Запустить новый production на BLUE_PORT=${PROD_CONFIG.BLUE_PORT}:
           docker run -d --name ${PROD_CONFIG.APP_CONTAINER} --network host --restart unless-stopped \\
             --env-file ${PROD_CONFIG.APP_DIR}/.env \\
             -e PORT=${PROD_CONFIG.BLUE_PORT} -e NODE_ENV=production \\
             -v ${PROD_CONFIG.UPLOADS_DIR}:/app/public/uploads \\
             ${IMAGE}
        3. Healthcheck нового на ${PROD_CONFIG.BLUE_PORT}
        4. Переключить nginx на ${PROD_CONFIG.BLUE_PORT}
        5. Удалить green: docker rm -f ${PROD_CONFIG.GREEN_CONTAINER}

        Это даёт нам чистое состояние: один контейнер ${PROD_CONFIG.APP_CONTAINER} на порту ${PROD_CONFIG.BLUE_PORT}.`,
      critical: true,
    },
  ],

  output: `Deploy report:
    🟢 GREEN started on port ${PROD_CONFIG.GREEN_PORT}
    ✅ GREEN healthcheck passed
    ✅ Nginx switched to GREEN
    ✅ Smoke tests passed
    ✅ Production container on port ${PROD_CONFIG.BLUE_PORT}
    ✅ Cleanup completed`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 4: ВЕРИФИКАЦИЯ (Post-Deploy Verification)
// ═══════════════════════════════════════════════════════════════════════

const VERIFY_STAGE = {
  role: "DEVOPS",
  icon: "✅",
  name: "POST-DEPLOY VERIFICATION",

  steps: [
    {
      id: "VF1",
      name: "Проверка контейнера",
      action: `ssh root@VPS:
        docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Image}}" | grep cleaning
        Ожидаем: ${PROD_CONFIG.APP_CONTAINER} Up (healthy) + IMAGE = новый образ`,
      critical: true,
    },
    {
      id: "VF2",
      name: "Проверка HTTP (через nginx)",
      action: `curl -sf --max-time 10 "http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}/api/health"
        Ожидаем: {"status":"ok",...}
        Проверить: db=true, redis=true`,
      critical: true,
    },
    {
      id: "VF3",
      name: "Проверка Redis",
      action: `Из healthcheck ответа:
        curl -s "http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}/api/health" | grep -o '"redis":[^,}]*'
        Ожидаем: "redis":true
        Или: redis-cli -h 127.0.0.1 -a "$REDIS_PASSWORD" ping → PONG`,
      critical: true,
    },
    {
      id: "VF4",
      name: "Проверка PostgreSQL",
      action: `pg_isready -h 127.0.0.1 -p 5432
        Из healthcheck: curl -s ... | grep -o '"db":[^,}]*' → "db":true`,
      critical: true,
    },
    {
      id: "VF5",
      name: "Проверка логов на ошибки",
      action: `docker logs ${PROD_CONFIG.APP_CONTAINER} --tail=50 2>&1 | grep -iE "error|fatal|panic|NOAUTH|ECONNREFUSED"
        Если найдены → WARN (не откат, но обратить внимание).
        КРИТИЧЕСКИЕ: fatal, panic, NOAUTH → рассмотреть откат.`,
      critical: false,
    },
    {
      id: "VF6",
      name: "Проверка SSL (через внешний домен)",
      action: `curl -sf --max-time 10 "https://${PROD_CONFIG.PROD_DOMAIN}/api/health"
        Ожидаем: 200 + {"status":"ok"}
        Если failed → WARN (возможно DNS/CDN кеш, подождать 30 сек и retry).`,
      critical: false,
    },
    {
      id: "VF7",
      name: "Полный smoke test (через внешний домен)",
      action: `Проверить через https://${PROD_CONFIG.PROD_DOMAIN}:
        - GET / → 200
        - GET /api/health → 200
        - GET /zayavka → 200
        Записать результаты в отчёт.`,
      critical: false,
    },
    {
      id: "VF8",
      name: "Проверка мониторинга (если настроен)",
      action: `Опционально (если Prometheus/Grafana настроены на VPS):
        Проверить что дашборды загружены.
        Не блокирует деплой — только WARN.`,
      critical: false,
    },
  ],

  output: `Verification report:
    ✅ Container: ${PROD_CONFIG.APP_CONTAINER} healthy
    ✅ HTTP: /api/health → 200
    ✅ Redis: connected
    ✅ PostgreSQL: connected
    ✅ SSL: https://${PROD_CONFIG.PROD_DOMAIN} → 200
    ⚠️/✅ Logs: clean / warnings found
    ⚠️/✅ Monitoring: active / not configured`,

  criteria: `
    DEPLOYMENT GO — все критические (critical: true) шаги пройдены
    DEPLOYMENT CONDITIONAL — критические пройдены, есть warnings
    DEPLOYMENT NO-GO → АВТОМАТИЧЕСКИЙ ОТКАТ`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 4.5: ПОЛНОЕ ТЕСТИРОВАНИЕ НА ПРОДЕ (Full Production Testing)
// ═══════════════════════════════════════════════════════════════════════

const FULL_TESTING_STAGE = {
  role: "DEVOPS",
  icon: "🧪",
  name: "FULL PRODUCTION TESTING",

  description: `
    Комплексное тестирование РАБОТАЮЩЕГО продакшн-сайта ПОСЛЕ деплоя.
    Включает автоматические API-тесты и ручное E2E-тестирование.
    Все тесты выполняются НА ПРОДЕ (https://${PROD_CONFIG.PROD_DOMAIN}).
    Версия приложения проверяется через /api/health → version.`,

  TEST_URL: `https://${PROD_CONFIG.PROD_DOMAIN}`,
  INTERNAL_URL: `http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}`,

  steps: [
    // ── БЛОК A: Автоматические API-тесты (выполняются SSH на VPS) ──
    {
      id: "FT1",
      name: "Автотест: Health endpoint (версия + зависимости)",
      action: `SSH на VPS — полный чек health:
        curl -sf "http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}/api/health" | python3 -m json.tool

        Проверить:
        - status == "ok"
        - version == "${NEW_VERSION}" ← СВЕРИТЬ С ТЕКУЩЕЙ ВЕРСИЕЙ!
        - checks.database.ok == true
        - checks.database.latencyMs < 500
        - checks.redis.ok == true
        - checks.redis.latencyMs < 100
        - uptime > 0

        Если version != NEW_VERSION → ❌ КРИТИЧЕСКАЯ ОШИБКА
        (деплой прошёл, но образ не обновился)`,
      critical: true,
      rollback_trigger: true,
    },
    {
      id: "FT2",
      name: "Автотест: Критические страницы (HTTP статусы)",
      action: `SSH на VPS — проверить ВСЕ критические страницы:
        PASS=0; FAIL=0

        test_url() {
          CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$1" 2>/dev/null || echo "000")
          if [ "$CODE" = "$2" ]; then echo "  ✅ $1 → $CODE"; PASS=$((PASS+1));
          else echo "  ❌ $1 → $CODE (expected $2)"; FAIL=$((FAIL+1)); fi
        }

        # Публичные страницы
        test_url "https://${PROD_CONFIG.PROD_DOMAIN}/" "200"
        test_url "https://${PROD_CONFIG.PROD_DOMAIN}/api/health" "200"
        test_url "https://${PROD_CONFIG.PROD_DOMAIN}/zayavka" "200"

        echo "Результат: $PASS passed, $FAIL failed"

        Если FAIL > 0 → ❌ КРИТИЧЕСКАЯ ОШИБКА`,
      critical: true,
      rollback_trigger: true,
    },
    {
      id: "FT3",
      name: "Автотест: API функциональность (response body)",
      action: `SSH на VPS — глубокая проверка API:

        # /api/health — проверить структуру ответа
        HEALTH=$(curl -sf "http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}/api/health")
        echo "$HEALTH" | grep -q '"status":"ok"' || echo "❌ health.status != ok"
        echo "$HEALTH" | grep -q '"version"' || echo "❌ health.version missing"
        echo "$HEALTH" | grep -q '"database"' || echo "❌ health.database missing"
        echo "$HEALTH" | grep -q '"redis"' || echo "❌ health.redis missing"

        # Валидация формы заявки — отправить НЕВАЛИДНЫЕ данные (не создаёт заявку)
        INVALID=$(curl -s -o /dev/null -w "%{http_code}" -X POST \\
          -H "Content-Type: application/json" \\
          -d '{"clientName":"","phone":"invalid"}' \\
          "http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}/api/orders")
        if [ "$INVALID" = "400" ]; then echo "✅ Валидация заявки работает (400 на пустые данные)";
        else echo "❌ Валидация заявки: ожидался 400, получен $INVALID"; fi

        ВНИМАНИЕ: НЕ отправлять реальные валидные заявки на проде!
        Только негативные проверки (валидация).

        echo "API функциональность: проверена"`,
      critical: true,
    },
    {
      id: "FT4",
      name: "Автотест: SSL + Security Headers",
      action: `Проверить через внешний URL:
        # SSL
        curl -sfI --max-time 10 "https://${PROD_CONFIG.PROD_DOMAIN}/" | head -20
        echo "$HEADERS" | grep -qi "strict-transport-security" && echo "✅ HSTS" || echo "⚠️ HSTS missing"
        echo "$HEADERS" | grep -qi "x-frame-options" && echo "✅ X-Frame-Options" || echo "⚠️ X-Frame-Options missing"
        echo "$HEADERS" | grep -qi "x-content-type-options" && echo "✅ X-Content-Type-Options" || echo "⚠️ missing"

        # HTTP → HTTPS redirect
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://${PROD_CONFIG.PROD_DOMAIN}/" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
          echo "✅ HTTP → HTTPS redirect ($HTTP_CODE)"
        else
          echo "⚠️ HTTP redirect: got $HTTP_CODE"
        fi`,
      critical: false,
    },
    {
      id: "FT5",
      name: "Автотест: Время отклика (Performance)",
      action: `SSH на VPS — замерить время ответа ключевых страниц:
        for url in "/" "/api/health" "/zayavka"; do
          TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}${url}")
          echo "  ${url}: ${TIME}s"
          if (( $(echo "$TIME > 3.0" | bc -l) )); then
            echo "  ⚠️ SLOW: ${url} > 3s"
          fi
        done

        Внешний доступ:
        for url in "/" "/api/health"; do
          TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 15 "https://${PROD_CONFIG.PROD_DOMAIN}${url}")
          echo "  [external] ${url}: ${TIME}s"
        done`,
      critical: false,
    },
    {
      id: "FT6",
      name: "Автотест: Отсутствие ошибок в логах после деплоя",
      action: `SSH на VPS — проверить логи SINCE DEPLOY:
        DEPLOY_TIME=$(stat -c %Y ${PROD_CONFIG.APP_DIR}/.env 2>/dev/null || date +%s)
        docker logs ${PROD_CONFIG.APP_CONTAINER} --since "\${DEPLOY_TIME}s" 2>&1 | \\
          grep -iE "error|fatal|panic|unhandled|uncaught|ENOENT|SIGKILL" | \\
          grep -viE "healthcheck|favicon|robots.txt|\\.well-known" || echo "✅ Логи чистые"

        Если найдены НЕ-expected ошибки → WARN`,
      critical: false,
    },

    // ── БЛОК B: Ручное E2E тестирование (чеклист для пользователя) ──
    {
      id: "FT7",
      name: "Ручное E2E: Главная страница",
      action: `ВЫВЕСТИ пользователю чеклист для ручной проверки:

        📋 E2E ТЕСТ — ГЛАВНАЯ СТРАНИЦА
        Открой: https://${PROD_CONFIG.PROD_DOMAIN}
        □ Страница загружается без ошибок
        □ Шапка (header) отображается корректно
        □ Навигация работает (все пункты меню кликабельны)
        □ Секция герои/баннер отображается (призыв оставить заявку)
        □ Блок услуг (чистка диванов, кресел, матрасов) отображается
        □ Футер отображается
        □ Нет визуальных артефактов (битые картинки, съехавшая вёрстка)
        □ Мобильная версия: открыть DevTools → iPhone 12 → проверить

        Задать вопрос: «Главная страница OK?» (Да/Нет)
        Если «Нет» → запросить детали, предложить откат.`,
      critical: true,
      manual_e2e: true,
    },
    {
      id: "FT8",
      name: "Ручное E2E: Форма заявки на химчистку",
      action: `ВЫВЕСТИ пользователю чеклист:

        📋 E2E ТЕСТ — ФОРМА ЗАЯВКИ
        Открой: https://${PROD_CONFIG.PROD_DOMAIN}/zayavka (или страницу с формой)
        □ Форма отображается корректно
        □ Все поля ввода работают (имя, телефон, тип мебели, комментарий)
        □ Выбор типа мебели работает (диван / кресло / матрас / ковёр)
        □ Валидация полей срабатывает (отправить пустую форму → ошибки)
        □ Валидация телефона срабатывает (ввести некорректный номер)
        □ Успешная отправка формы (заполнить и отправить)
        □ Сообщение об успешной отправке появляется
        □ Нет ошибок в консоли браузера (F12 → Console)

        ВНИМАНИЕ: Для реальной отправки — использовать тестовые данные.
        НЕ отправлять реальных заявок на проде (или удалить тестовую после).

        Задать вопрос: «Форма заявки OK?» (Да/Нет)`,
      critical: true,
      manual_e2e: true,
    },
    {
      id: "FT9",
      name: "Ручное E2E: Админ-панель (если реализована)",
      action: `ВЫВЕСТИ пользователю чеклист (ТОЛЬКО если админка реализована):

        📋 E2E ТЕСТ — АДМИН-ПАНЕЛЬ
        Открой: https://${PROD_CONFIG.PROD_DOMAIN}/admin/login
        □ Страница логина загружается
        □ Форма логина отображается корректно
        □ Ввод email + password работает
        □ При неверных данных — сообщение об ошибке
        □ (Опционально) Успешный логин → редирект в админку
        □ Список заявок отображается

        Задать вопрос: «Админ-панель OK?» (Да/Нет / Пропустить)`,
      critical: false,
      manual_e2e: true,
    },
    {
      id: "FT10",
      name: "Ручное E2E: SEO + Мета-теги",
      action: `Автоматическая проверка + чеклист:

        Автопроверка:
        TITLE=$(curl -sf "https://${PROD_CONFIG.PROD_DOMAIN}/" | grep -o '<title>[^<]*</title>' | head -1)
        echo "Title: $TITLE"
        echo "$TITLE" | grep -q "химчистк\|диван" && echo "✅ Title SEO OK" || echo "⚠️ Title SEO"

        Чеклист для пользователя:
        📋 E2E ТЕСТ — SEO
        □ Title страницы содержит ключевые слова (химчистка, диван, чистка мебели)
        □ Description мета-тег присутствует (View Source → meta description)
        □ Open Graph теги присутствуют (og:title, og:description, og:image)
        □ Яндекс.Метрика загружается (Network tab → watch yarn metrika)
        □ Sitemap доступен: /sitemap.xml
        □ Robots.txt: /robots.txt

        Задать вопрос: «SEO OK?» (Да/Нет / Пропустить)`,
      critical: false,
      manual_e2e: true,
    },
    {
      id: "FT11",
      name: "Ручное E2E: Мобильная адаптивность",
      action: `ВЫВЕСТИ пользователю чеклист:

        📋 E2E ТЕСТ — МОБИЛЬНАЯ ВЕРСИЯ
        Открой Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
        Проверить на iPhone 12 (390x844) и iPad (768x1024):
        □ Навигация работает (бургер-меню или адаптивное меню)
        □ Контент не вылезает за экран
        □ Кнопки и ссылки кликабельны (размер min 44px)
        □ Картинки адаптируются
        □ Форма заявки удобна для заполнения на мобильном
        □ Кнопка звонка/заявки доступна без скролла (или плавающая)
        □ Нет горизонтального скролла

        Задать вопрос: «Мобильная версия OK?» (Да/Нет / Пропустить)`,
      critical: false,
      manual_e2e: true,
    },

    // ── БЛОК C: Итоговый вердикт ──
    {
      id: "FT12",
      name: "Сводный отчёт тестирования",
      action: `Собрать все результаты:

        ┌─────────────────────────────────────────────────────┐
        │           РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ НА ПРОДЕ          │
        ├─────────────────────────────────────────────────────┤
        │ БЛОК A: Автоматические тесты                       │
        │  ✅/❌ FT1: Health endpoint (версия: X.X.X)        │
        │  ✅/❌ FT2: HTTP статусы страниц                   │
        │  ✅/❌ FT3: API функциональность (валидация)       │
        │  ⚠️/✅ FT4: SSL + Security Headers                 │
        │  ⚠️/✅ FT5: Performance                            │
        │  ⚠️/✅ FT6: Логи без ошибок                       │
        ├─────────────────────────────────────────────────────┤
        │ БЛОК B: Ручное E2E тестирование                   │
        │  ✅/❌/⏭️ FT7:  Главная страница                   │
        │  ✅/❌/⏭️ FT8:  Форма заявки                       │
        │  ✅/❌/⏭️ FT9:  Админ-панель (если есть)           │
        │  ✅/❌/⏭️ FT10: SEO                                │
        │  ✅/❌/⏭️ FT11: Мобильная версия                   │
        ├─────────────────────────────────────────────────────┤
        │ ВЕРДИКТ: GO / CONDITIONAL GO / NO-GO              │
        └─────────────────────────────────────────────────────┘

        GO → продолжить к FINALIZE
        CONDITIONAL GO → WARN + продолжить (некритичные замечания)
        NO-GO → АВТОМАТИЧЕСКИЙ ОТКАТ (критичный E2E тест провален)`,
      critical: true,
    },
  ],

  verdict_rules: `
    GO:      Все critical тесты пройдены (✅)
    COND:    Все critical пройдены, есть warnings (⚠️)
    NO-GO:   Хотя бы один critical = ❌ → АВТОМАТИЧЕСКИЙ ОТКАТ

    Если пользователь ответил «Нет» на critical E2E тест → NO-GO → откат
    Если пользователь ответил «Пропустить» на non-critical E2E → COND → продолжить`,

  output: `Testing report:
    🧪 Автотесты: 6/6 passed
    👆 E2E ручные: 2/2 critical passed, 3/3 optional skipped
    📦 Версия на проде: X.X.X (совпадает с деплоем)
    ⏱️  Performance: < 2s
    📊 Вердикт: GO`,
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП 5: ФИНАЛИЗАЦИЯ (Finalize)
// ═══════════════════════════════════════════════════════════════════════

const FINALIZE_STAGE = {
  role: "DEVOPS",
  icon: "📋",
  name: "FINALIZE",

  steps: [
    {
      id: "FN1",
      name: "Очистка старых образов",
      action: `На VPS удалить старые образы (оставить 10 последних):
        ОСТАВИТЬ текущий + предыдущий минимум.
        docker image prune -f
        Удалить образы старше 10 деплоев назад.`,
      critical: false,
    },
    {
      id: "FN2",
      name: "Очистка старых бэкапов",
      action: `Удалить бэкапы БД старше 7 дней:
        find ${PROD_CONFIG.APP_DIR}/backups -name "*.sql.gz" -mtime +7 -delete
        Удалить логи деплоя старше 30 дней:
        find ${PROD_CONFIG.DEPLOY_LOG_DIR} -name "*.log" -mtime +30 -delete`,
      critical: false,
    },
    {
      id: "FN3",
      name: "Telegram уведомление — УСПЕХ (если настроен)",
      action: `Отправить в Telegram (если TELEGRAM_BOT_TOKEN задан):
        ✅ Деплой успешен
        Версия: v${NEW_VERSION} (sha-XXXXXXX)
        Время: Xs
        Предыдущий: sha-YYYYYYY → Новый: sha-XXXXXXX
        Инициатор: manual (opencode)
        Если токен не задан → пропустить шаг без WARN.`,
      critical: false,
    },
    {
      id: "FN4",
      name: "Deployment Report",
      action: `Вывести итоговый отчёт:
        ═══════════════════════════════════════════
        🎉 PRODUCTION DEPLOYMENT SUCCESSFUL
        ═══════════════════════════════════════════
        📦 Image:  ${PROD_CONFIG.IMAGE()}:sha-XXXXXXX
        🌐 URL:    https://${PROD_CONFIG.PROD_DOMAIN}
        ⏱️  Time:   Xs
        📊 From:   sha-YYYYYYY → To: sha-XXXXXXX
        💾 Backup: ${PROD_CONFIG.APP_DIR}/backups/db_YYYYMMDD.sql.gz
        📝 Log:    ${PROD_CONFIG.DEPLOY_LOG_DIR}/deploy-YYYYMMDD.log
        ═══════════════════════════════════════════`,
      critical: true,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// ЭТАП ОТКАТА: ROLLBACK (автоматический или ручной)
// ═══════════════════════════════════════════════════════════════════════

const ROLLBACK_STAGE = {
  role: "DEVOPS",
  icon: "🔄",
  name: "ROLLBACK",

  trigger: `
    Автоматический откат запускается при:
    - GREEN healthcheck failed (Этап 3, DP3)
    - Миграция БД провалена (Этап 3, DP4)
    - Smoke tests failed (Этап 3, DP6)
    - Post-deploy verification NO-GO (Этап 4)

    Ручной откат — по команде пользователя:
    «откат», «rollback», «верни предыдущую версию»`,

  steps: [
    {
      id: "RB1",
      name: "Переключение nginx на BLUE",
      action: `Если BLUE контейнер ещё работает — переключить nginx на BLUE_PORT:
        cat > ${PROD_CONFIG.NGINX_UPSTREAM} <<EOF
        upstream app {
            server 127.0.0.1:${PROD_CONFIG.BLUE_PORT};
            keepalive 32;
        }
        EOF
        nginx -t && nginx -s reload
        Это момент возврата трафика к старой версии.`,
      critical: true,
    },
    {
      id: "RB2",
      name: "Остановка GREEN контейнера",
      action: `docker rm -f ${PROD_CONFIG.GREEN_CONTAINER} 2>/dev/null || true
        Новый контейнер удаляется. Старый продолжает работать.`,
      critical: true,
    },
    {
      id: "RB3",
      name: "Восстановление предыдущего контейнера (если BLUE упал)",
      action: `Если ${PROD_CONFIG.APP_CONTAINER} не работает:
        docker run -d --name ${PROD_CONFIG.APP_CONTAINER} --network host --restart unless-stopped \\
          --env-file ${PROD_CONFIG.APP_DIR}/.env \\
          -e PORT=${PROD_CONFIG.BLUE_PORT} -e NODE_ENV=production \\
          -v ${PROD_CONFIG.UPLOADS_DIR}:/app/public/uploads \\
          \${PREVIOUS_IMAGE}
        Ждать healthcheck на ${PROD_CONFIG.BLUE_PORT} (макс 90 сек).
        Переключить nginx на ${PROD_CONFIG.BLUE_PORT}.`,
      critical: true,
    },
    {
      id: "RB4",
      name: "Восстановление БД (если миграция повредила данные)",
      action: `ТОЛЬКО если есть признаки повреждения данных:
        1. Остановить приложение: docker stop ${PROD_CONFIG.APP_CONTAINER}
        2. Восстановить из бэкапа:
           gunzip -c ${PROD_CONFIG.APP_DIR}/backups/db_YYYYMMDD.sql.gz | psql -U postgres ${PROD_CONFIG.DB_NAME}
        3. Запустить приложение
        ВНИМАНИЕ: Это деструктивная операция, данные после бэкапа теряются.
        Спросить подтверждение пользователя ПЕРЕД восстановлением БД.`,
      critical: false,
      manual_only: true,
    },
    {
      id: "RB5",
      name: "Верификация после отката",
      action: `Проверить что откат прошёл успешно:
        - docker ps → ${PROD_CONFIG.APP_CONTAINER} Up (healthy)
        - curl http://127.0.0.1:${PROD_CONFIG.BLUE_PORT}/api/health → 200
        - curl https://${PROD_CONFIG.PROD_DOMAIN}/ → 200
        Если откат провалился → КРИТИЧЕСКАЯ ОШИБКА → ручное вмешательство.`,
      critical: true,
    },
    {
      id: "RB6",
      name: "Уведомление об откате",
      action: `Telegram (если настроен):
        🔄 Откат выполнен
        Причина: [healthcheck failed / smoke test failed / ...]
        Версия: вернулись к sha-YYYYYYY (образ: \${PREVIOUS_IMAGE})
        Деплой: sha-XXXXXXX → FAILED

        + Deployment Report с деталями.`,
      critical: false,
    },
  ],

  output: `Rollback report:
    🔄 Причина: [healthcheck / smoke / manual]
    ✅ Nginx: переключён на BLUE
    ✅ GREEN: удалён
    ✅ BLUE: работает на порту ${PROD_CONFIG.BLUE_PORT}
    ✅ Healthcheck: OK
    📧 Telegram: уведомление отправлено`,

  on_rollback_failure: `
    Если откат тоже провалился:
    1. Вывести КРИТИЧЕСКОЕ сообщение:
       🚨🚨🚨 ОТКАТ ПРОВАЛИЛСЯ — РУЧНОЕ ВМЕШАТЕЛЬСТВО 🚨🚨🚨
    2. Вывести диагностику:
       - docker ps -a | grep cleaning
       - docker logs ${PROD_CONFIG.APP_CONTAINER} --tail=100
       - docker logs ${PROD_CONFIG.GREEN_CONTAINER} --tail=100
       - nginx -T 2>&1 | grep upstream
       - df -m /
    3. Вывести команды для ручного восстановления:
       - docker run ... (запуск предыдущего образа)
       - psql restore (если БД повреждена)
    4. Отправить CRITICAL уведомление в Telegram (если настроен)`,
};

// ═══════════════════════════════════════════════════════════════════════
// ПОСТДЕПЛОЙНЫЙ МОНИТОРИНГ (Post-Deploy Watch)
// ═══════════════════════════════════════════════════════════════════════

const POSTDEPLOY_WATCH = {
  role: "DEVOPS",
  icon: "👁️",
  name: "POST-DEPLOY WATCH",

  description: `
    После успешного деплоя — 5-минутное наблюдение.
    Не блокирует конвейер, но позволяет заметить проблемы.

    Проверки каждые 60 секунд (5 итераций):
    1. curl /api/health → 200
    2. docker logs --since 60s → нет fatal/panic/OOM
    3. Время ответа /api/health < 2s

    Если проблема найдена → WARN пользователю + предложить откат.`,

  iterations: 5,
  interval_seconds: 60,
};

// ═══════════════════════════════════════════════════════════════════════
// ГРАФ ПЕРЕХОДОВ (автоматический)
// ═══════════════════════════════════════════════════════════════════════

const PROD_PIPELINE_TRANSITIONS = {
  "Pre-Flight → Versioning": {
    condition: "Все critical проверки пройдены",
    action: "АВТОМАТИЧЕСКИ продолжить",
    on_failure: "Вывести причину и СТОП",
  },
  "Versioning → Backup": {
    condition: "Версия bumped, git tag создан",
    action: "АВТОМАТИЧЕСКИ продолжить",
    on_failure: "СТОП — версия не определена",
  },
  "Backup → Build": {
    condition: "Бэкап БД создан успешно",
    action: "АВТОМАТИЧЕСКИ продолжить",
    on_failure: "WARN + спросить подтверждение",
  },
  "Build → Deploy": {
    condition: "CI passed + образ существует на VPS",
    action: "АВТОМАТИЧЕСКИ продолжить",
    on_failure: "СТОП — образ недоступен",
  },
  "Deploy → Verify": {
    condition: "GREEN healthcheck + smoke tests passed",
    action: "АВТОМАТИЧЕСКИ продолжить",
    on_failure: "АВТОМАТИЧЕСКИЙ ОТКАТ → Rollback",
  },
  "Verify → Full Testing": {
    condition: "Все critical верификации пройдены (GO)",
    action: "АВТОМАТИЧЕСКИ продолжить",
    on_failure: "АВТОМАТИЧЕСКИЙ ОТКАТ → Rollback",
  },
  "Full Testing → Finalize": {
    condition: "GO или CONDITIONAL GO (все critical тесты + E2E пройдены)",
    action: "АВТОМАТИЧЕСКИ продолжить",
    on_failure: "NO-GO → АВТОМАТИЧЕСКИЙ ОТКАТ → Rollback",
  },
  "Finalize → Done": {
    condition: "Отчёт выведен, уведомления отправлены",
    action: "Вывести итоговый отчёт + начать Post-Deploy Watch",
  },

  "ЛЮБОЙ ЭТАП → Rollback": {
    condition: "critical шаг провалился + rollback_trigger = true",
    action: "АВТОМАТИЧЕСКИЙ ОТКАТ без подтверждения",
  },

  "Rollback → Done": {
    condition: "Откат успешен, верификация пройдена",
    action: "Вывести Rollback Report + уведомления",
  },
  "Rollback → CRITICAL": {
    condition: "Откат тоже провалился",
    action: "Вывести 🚨 + диагностику + команды ручного восстановления",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// ПОЛНАЯ СХЕМА КОНВЕЙЕРА (визуальная)
// ═══════════════════════════════════════════════════════════════════════

/**
 *
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │              ПОЛЬЗОВАТЕЛЬ: «деплой на прод»                 │
 *    └────────────────────────┬────────────────────────────────────┘
 *                             │
 *                    ┌────────▼────────┐
 *                    │  🔍 PRE-FLIGHT  │  PROD_CONFIG, ветка, CI, VPS, диск, .env
 *                    └────────┬────────┘
 *                             │ ✅ Все проверки
 *                    ┌────────▼────────┐
 *                    │  🏷️ VERSIONING  │  bump version, git tag, CHANGELOG
 *                    └────────┬────────┘
 *                             │ ✅ Версия определена
 *                    ┌────────▼────────┐
 *                    │  💾 BACKUP      │  DB dump, nginx config
 *                    └────────┬────────┘
 *                             │ ✅ Бэкап создан
 *                    ┌────────▼────────┐
 *                    │  🏗️ BUILD       │  CI → Docker image → pull on VPS
 *                    └────────┬────────┘
 *                             │ ✅ Образ готов
 *                    ┌────────▼────────┐
 *                    │  🚀 DEPLOY      │  Blue-Green: GREEN(3003) → nginx → BLUE(3001)
 *                    └───┬────────┬────┘
 *                        │        │
 *                  ✅ OK  │        │ ❌ FAILED
 *                        │        │
 *               ┌────────▼──┐  ┌──▼──────────┐
 *               │ ✅ VERIFY  │  │ 🔄 ROLLBACK  │
 *               └────┬──────┘  └──┬──────────┬┘
 *                    │             │          │
 *              ✅ GO │        ✅ OK │     ❌ FAIL│
 *                    │             │          │
 *          ┌─────────▼──────┐ ┌───▼───┐  ┌──▼──────────┐
 *          │ 🧪 FULL TEST   │ │ Done  │  │ 🚨 CRITICAL │
 *          │ API + E2E hand │ │ +rep  │  │ Ручное      │
 *          └──┬────────┬────┘ └───────┘  │ вмешательство│
 *             │        │                  └─────────────┘
 *       ✅ GO │   ❌ NO │
 *             │         │
 *      ┌──────▼───┐ ┌───▼──────────┐
 *      │ 📋 FINAL │ │ 🔄 ROLLBACK  │
 *      │ + NOTIFY │ │ + Telegram   │
 *      └────┬─────┘ └──────────────┘
 *           │
 *    ┌──────▼──────┐
 *    │ 👁️ WATCH     │
 *    │ (5 мин)     │
 *    └─────────────┘
 *
 */

// ═══════════════════════════════════════════════════════════════════════
// РУЧНОЙ ОТКАТ (отдельная команда)
// ═══════════════════════════════════════════════════════════════════════

const MANUAL_ROLLBACK = {
  trigger: `Пользователь говорит:
    «откат», «rollback», «верни предыдущую версию»,
    «откатись», «roll back»`,

  steps: [
    {
      id: "MR1",
      action: `Вывести: '🔄 РУЧНОЙ ОТКАТ: Начинаю'
        Показать доступные образы для отката:
        ssh root@VPS "docker images --format 'table {{.Repository}}:{{.Tag}}\\t{{.CreatedAt}}\\t{{.Size}}' | grep cleaning"`,
    },
    {
      id: "MR2",
      action: `Спросить у пользователя: какой образ/тег откатить?
        Через question tool с вариантами:
        - Предыдущий образ (PREVIOUS_IMAGE)
        - Последний known-good (sha-XXXXXXX)
        - Указать вручную`,
    },
    {
      id: "MR3",
      action: `Выполнить откат:
        1. Бэкап текущего состояния
        2. Остановить ${PROD_CONFIG.APP_CONTAINER}
        3. Запустить с выбранным образом
        4. Healthcheck
        5. Переключить nginx
        6. Smoke tests
        7. Уведомление`,
    },
    {
      id: "MR4",
      action: `Вывести Rollback Report`,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// ЧЕКЛИСТ SELF-CHECK (перед каждым действием)
// ═══════════════════════════════════════════════════════════════════════

const SELF_CHECK = [
  "✅ Это продакшн конвейер? (PIPELINE_PROD.js) — НЕ dev (PIPELINE.js)",
  "✅ PROD_CONFIG заполнен (нет плейсхолдеров <...>)?",
  "✅ Версия bumped + git tag создан? (VERSIONING)",
  "✅ Бэкап БД создан? (PR1)",
  "✅ BLUE контейнер НЕ остановлен до проверки GREEN? (PR2)",
  "✅ Каждый шаг верифицирован? (PR3)",
  "✅ Автоматический откат при провале? (PR4)",
  "✅ Полный Docker-образ (не частичная пересборка)? (PR5)",
  "✅ Полное тестирование на проде (API + E2E)? (FULL TESTING)",
  "✅ Логирование и уведомления? (PR6)",
];
