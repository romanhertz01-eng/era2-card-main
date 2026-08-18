# ERA2 Card · Developer Handoff

Документ описывает текущее состояние проекта: что уже реализовано, что ещё предстоит.

**Версия: 4.0** · Дата: 21 мая 2026

---

## 0. TL;DR

Проект полностью реализован как fullstack-приложение. Frontend на Next.js 14 + Backend на FastAPI работают в Docker-compose, генерации через Gemini и Kling 3.0 функционируют в production на `http://leaderlist.ru`.

Остаётся: реферальная система, observability, admin-дашборд, тарифные пакеты из XLS (Draft/Pro-card/Similar), восстановление pending-видео при рестарте.

---

## 1. Реализованный стек

| Слой | Технология |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Python 3.12 + FastAPI + SQLModel |
| **БД** | PostgreSQL 15 (Docker) |
| **Auth** | JWT (HS256) + Yandex ID OAuth + VK ID OAuth |
| **AI изображения** | Google Gemini через Vertex AI (`GOOGLE_CLOUD_PROJECT`) |
| **AI видео** | Kling 3.0 через kie.ai API |
| **Object Storage** | MinIO (local) / S3-совместимое хранилище |
| **Payments** | ЮKassa |
| **Rate limiting** | slowapi — 5/min на login (по IP), 20/min на генерации (по user_id из JWT) |
| **Deploy** | Docker Compose, Nginx reverse proxy |

---

## 2. Структура проекта

```
era2-card/
├── api/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py             # точка входа, middleware, CORS
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── models.py           # SQLModel: User, Generation, Project
│   │   ├── database.py         # engine, get_session
│   │   ├── deps.py             # get_current_user
│   │   ├── limiter.py          # slowapi: get_user_id (JWT → user:id, fallback IP)
│   │   ├── routes/
│   │   │   ├── auth.py         # login, register, yandex OAuth, vk OAuth
│   │   │   ├── generations.py  # image, batch, video, improve, upload
│   │   │   ├── projects.py     # CRUD проектов
│   │   │   ├── admin.py        # stats, users, charts; brute-force защита (3 попытки → блок 1 мин)
│   │   │   └── billing.py      # YooKassa checkout, webhook, баланс
│   │   └── services/
│   │       ├── gemini.py       # Vertex AI / Gemini (2 попытки retry, 5 сек пауза)
│   │       └── kling.py        # Kling 3.0: create_task (retry×2), poll (transient tolerance), generate_and_update (retry×2)
│   ├── requirements.txt
│   └── .env                    # локальный env (не в git)
├── app/                        # Next.js App Router
│   ├── (app)/studio/           # главная страница генерации
│   ├── (app)/projects/         # список проектов
│   ├── (app)/account/          # аккаунт
│   ├── (app)/billing/          # тарифы и оплата
│   ├── (marketing)/            # лендинг, /terms, /offer
│   ├── auth/callback/          # OAuth redirect handler
│   └── providers.tsx           # AppProvider: состояние приложения
├── components/
│   ├── studio/
│   │   ├── StudioPage.tsx      # основная логика: генерация, polling, URL-sync (?project=id)
│   │   ├── GenerationPanel.tsx # настройки: тип (Фото/Карточка/Видео NEW), концепция, варианты ×1-4
│   │   ├── VideoSettings.tsx   # длина 5с/10с, качество 720p/1080p, звук, динамическая цена
│   │   ├── ProductPanel.tsx    # загрузка фото товара
│   │   ├── ResultsArea.tsx     # прогрессбар → скелетоны → картинки по мере готовности
│   │   └── ProjectHistoryGrid.tsx  # история проекта
│   ├── modals/
│   │   ├── AuthModal.tsx       # форма входа/регистрации (isAuthLoading, 152-ФЗ согласие)
│   │   ├── ResultModal.tsx     # просмотр результата + улучшение
│   │   └── PaywallModal.tsx    # недостаточно зарядов
│   └── pages/
│       ├── BillingPage.tsx     # цены берутся из contentTypes + calculateVideoCost (единый источник)
│       └── AccountPage.tsx
├── lib/
│   ├── api.ts                  # fetch-обёртка (token из localStorage)
│   ├── videoPricing.ts         # матрица цен видео, DEFAULT_VIDEO_SETTINGS
│   └── mockData.ts             # контент: концепции, сценарии, чипы
├── types/index.ts
├── .env.prod                   # production env (не в git)
├── .dockerignore               # era2-card-ideas-only исключена из сборки
└── docker-compose.yml
```

---

## 3. Реализованные API endpoints

### Auth
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация email/пароль |
| POST | `/api/auth/login` | Вход, rate limit 5/min по IP |
| GET | `/api/auth/yandex` | Редирект на Yandex OAuth |
| GET | `/api/auth/yandex/callback` | Callback Yandex, возвращает JWT |
| GET | `/api/auth/vk` | Редирект на VK OAuth |
| GET | `/api/auth/vk/callback` | Callback VK, возвращает JWT |
| GET | `/api/me` | Профиль текущего пользователя |

### Генерации
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/generations/image` | Одна генерация изображения (Gemini), rate limit 20/min per user |
| POST | `/api/generations/batch` | 1-4 генерации в фоне (asyncio.create_task), rate limit 20/min per user |
| POST | `/api/generations/video` | Видео через Kling 3.0, rate limit 20/min per user |
| POST | `/api/generations/improve` | Улучшение существующего результата (3 ⚡) |
| GET | `/api/generations` | История (50 последних) |
| GET | `/api/generations/{id}` | Одна генерация по ID |
| GET | `/api/generations/{id}/versions` | Дерево версий (оригинал + улучшения) |
| POST | `/api/upload` | Загрузка фото на kie.ai CDN (max 10 MB, jpeg/png/webp) |

### Проекты
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/projects` | Список проектов пользователя |
| POST | `/api/projects` | Создать проект |
| PATCH | `/api/projects/{id}` | Обновить (status и др.) |
| DELETE | `/api/projects/{id}` | Удалить |
| GET | `/api/projects/{id}/generations` | Генерации проекта |

### Биллинг
| Метод | URL | Описание |
|---|---|---|
| POST | `/api/billing/checkout` | Создать платёж ЮKassa |
| POST | `/api/billing/webhook` | Webhook от ЮKassa (пополнение баланса) |
| GET | `/api/billing/transactions` | История операций |

### Admin (заголовок `x-admin-secret`)
| Метод | URL | Описание |
|---|---|---|
| GET | `/api/admin/stats` | Общая статистика |
| GET | `/api/admin/users` | Поиск пользователей |
| GET | `/api/admin/charts` | Графики пополнений/расходов за 7 дней |
| GET | `/api/admin/top-users` | Топ по пополнениям и тратам |
| POST | `/api/admin/users/{id}/topup` | Ручное пополнение баланса |

> Защита от брутфорса: 3 неверных попытки с одного IP → блок на 1 минуту (in-memory).

---

## 4. Цены и тарификация

### Изображения
| Тип | Стоимость |
|---|---|
| Фото товара | 5 ⚡ за штуку |
| Карточка | 5 ⚡ за штуку |
| Улучшение | 3 ⚡ |

Batch (×1/×2/×3/×4 варианта) — цена умножается на количество. Выбор на фронте.

### Видео (Kling 3.0)
| Качество | Длина | Без звука | Со звуком |
|---|---|---|---|
| 720p | 5 сек | 20 ⚡ | 25 ⚡ |
| 720p | 10 сек | 40 ⚡ | 50 ⚡ |
| 1080p | 5 сек | 25 ⚡ | 35 ⚡ |
| 1080p | 10 сек | 50 ⚡ | 70 ⚡ |

Маппинг на Kling API: `720p → mode: "std"`, `1080p → mode: "pro"`.  
Источник цен: `lib/videoPricing.ts` → `calculateVideoCost()`. BillingPage использует тот же файл.

---

## 5. Переменные окружения (`.env.prod`)

```env
# PostgreSQL
POSTGRES_USER=era2
POSTGRES_PASSWORD=...
POSTGRES_DB=era2card

# API
JWT_SECRET=...           # длинный случайный ключ
ADMIN_SECRET=...         # ⚠️ сменить! текущий слабый

# OAuth
YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...
VK_CLIENT_ID=...
VK_CLIENT_SECRET=...

# Next.js
NEXT_PUBLIC_API_URL=http://leaderlist.ru
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://leaderlist.ru
FRONTEND_URL=http://leaderlist.ru     # критично для OAuth redirect и CORS

# Google Vertex AI (Gemini)
GOOGLE_CLOUD_PROJECT=...
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_SA_JSON_PATH=data/sa.json

# Kling
KLING_API_KEY=...

# ЮKassa
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...

# MinIO / S3
S3_ENDPOINT=http://minio:9000
S3_BUCKET=era2card
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_PUBLIC_URL=http://leaderlist.ru:9022
```

---

## 6. Архитектура генераций

### Фото / Карточка (batch)
```
Frontend → POST /api/generations/batch (count=1..4)
Backend:
  1. Создаёт N записей Generation (status=pending) в БД
  2. Списывает баланс авансом (cost × count)
  3. asyncio.create_task(_run_batch) → N генераций последовательно через Gemini
     Gemini: 2 попытки, 5 сек пауза между ними
  4. Каждая пишет output_url в БД (status=completed/failed)
Frontend: polling GET /api/generations/{id} каждые 3 сек
  → прогрессбар анимация → при progress=100% сетка скелетонов
  → картинки заменяют скелетоны по мере готовности
```

### Видео (Kling 3.0)
```
Frontend → POST /api/generations/video (prompt, image_url?, duration, quality, audio_enabled)
Backend:
  1. Создаёт Generation (status=pending)
  2. Списывает баланс
  3. asyncio.create_task(kling_service.generate_and_update) — 2 попытки:
     → create_task у Kling (retry×2, 5 сек пауза)
     → poll каждые 10 сек, до 10 мин (60 попыток), transient HTTP ошибки игнорируются
     → готово → обновляет Generation (status=completed, output_url)
     → если обе попытки провалились → status=failed
Frontend: polling GET /api/generations/{id} каждые 5 сек
```

> Закрытие вкладки браузера **не прерывает** генерацию — задача живёт в event loop FastAPI.  
> Единственный риск: рестарт FastAPI-процесса теряет задачу (статус зависнет в `pending`).

### Режимы Kling
- **text-to-video**: только промпт (без `image_url`)
- **image-to-video**: промпт + `image_url` (фото товара загружается на kie.ai CDN через `/api/upload`)

---

## 7. Особенности фронтенда

### Активный проект
URL синхронизируется: `/studio?project=<id>`. При обновлении страницы проект восстанавливается из URL-параметра.

### Auth flash
`isAuthLoading` в providers.tsx стартует `true`, становится `false` после проверки JWT. AuthModal не показывается пока `isAuthLoading === true`.

### Ошибки авторизации
Бэкенд возвращает русские тексты (`Неверный email или пароль`, `Такой email уже зарегистрирован`).  
Фронт (AuthModal) обрабатывает Pydantic 422 ошибки отдельно (`Введите корректный email`, `Пароль слишком короткий`).

---

## 8. Что ещё предстоит сделать

### P0 — Безопасность
- [ ] Сменить `ADMIN_SECRET` в `.env.prod` — текущий слабый
- [ ] Nginx: `client_max_body_size 20m` — без этого загрузка фото возвращает 413

### P1 — Надёжность
- [ ] **Pending video recovery** — при рестарте FastAPI генерации в `pending` зависают. Нужен startup-хук: переопрашивать незавершённые задачи у Kling
- [ ] **Kling webhook** — вместо polling лучше получать callback (экономит запросы)
- [ ] **Idempotency keys** — защита от двойного списания при двойном клике

### P2 — Функции (UX)
- [ ] **"Пополнить баланс"** вместо задисабленной кнопки генерации при нехватке заряда
- [ ] **"Финальный" ⭐** — кнопка в ResultModal + бейдж на карточке + счётчик в проекте
- [ ] **Лайк на карточке** — сейчас `liked` только локальный state в ResultModal, не передаётся на карточку

### P3 — Функции (бэкенд)
- [ ] **Реферальная система** — фронт-заглушка есть, бэкенд (`referral_code`/`referred_by` в User, `/api/me/referral`) не реализован
- [ ] **ERA2 API ключи** — заглушка в AccountPage, бэкенда нет
- [ ] **Draft** 3 ⚡ (Gemini Flash), **Pro-card** 10 ⚡ (Gemini Pro), **Similar** 5 ⚡ — из XLS, не реализованы
- [ ] **Ограничение trial** — только 720p для новых пользователей (из XLS)

### P4 — Инфраструктура
- [ ] **Admin dashboard** — UI для поиска, ручного refund, audit log
- [ ] **Observability** — Sentry + структурные логи + алерты в Telegram
- [ ] **CI/CD** — GitHub Actions → Docker build → деплой

---

## 9. Известные проблемы

| Проблема | Статус | Решение |
|---|---|---|
| `ADMIN_SECRET` слабый | ⚠️ Открыто | Сменить в `.env.prod` и перезапустить |
| Nginx режет загрузку фото (413) | ⚠️ Открыто | `client_max_body_size 20m` в nginx.conf |
| Рестарт FastAPI теряет pending видео | ⚠️ Открыто | P1: startup recovery hook |
| `asyncio.create_task` без event loop guard | ℹ️ Известно | Работает, но не production-grade; замена — Celery/ARQ |

---

## 10. Запуск локально

```bash
# 1. Скопировать env
cp api/.env.example api/.env
# заполнить GOOGLE_CLOUD_PROJECT, KLING_API_KEY

# 2. Поднять всё
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
# MinIO:    http://localhost:9001 (UI)
```

Без `GOOGLE_CLOUD_PROJECT` генерации работают в mock-режиме (picsum.photos).  
Без `KLING_API_KEY` видео сразу возвращает заглушку BigBuckBunny.mp4.

---

## 11. Справочные документы

| Документ | Что содержит |
|---|---|
| `ERA2_Card_Backend_AI_Prompts_Spec_v1_1.docx` | Prompt engineering, JSON-схемы, модели, Operation Layer (idempotency, moderation, evals, rate limits) — **primary source** по AI-слою |
| `HANDOFF.md` (этот файл) | Текущее состояние реализации, задачи, архитектура |
