# ERA2 Card

AI-сервис для создания продающих карточек товаров для маркетплейсов (Ozon, Wildberries, Яндекс Маркет).

Часть экосистемы **ERA2** — AI agents & tools.

## Стек

- Next.js 14 (App Router) + React 18
- TypeScript (strict)
- Tailwind CSS 3.4
- framer-motion (анимации)
- lucide-react (иконки)
- Шрифты: Inter + Unbounded + JetBrains Mono

## Установка

```bash
npm install
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Структура

```
app/
├── (marketing)/                # Публичная зона (Header + Footer)
│   └── page.tsx                # Главная страница (landing)
└── (app)/                      # Продуктовая зона (AppTopbar)
    ├── studio/                 # Главный генератор
    │   └── editor/             # Тёмный редактор (заглушка)
    ├── projects/               # Список проектов
    ├── account/                # Кабинет пользователя
    └── billing/                # Баланс и пакеты зарядов

components/
├── layout/                     # Header, Footer, AppTopbar
├── ui/                         # Атомы: Button, Badge, Modal, Tabs, ...
├── landing/                    # Секции лендинга
├── studio/                     # Панели генератора
├── modals/                     # ResultModal, OnboardingModal, PaywallModal
├── pages/                      # Композиции для /projects, /account, /billing
└── mockups/                    # SVG-визуалы (карточки маркетплейсов)

lib/
├── mockData.ts                 # Все данные приложения
├── motion.ts                   # framer-motion variants
└── utils.ts                    # cn(), форматтеры

types/
└── index.ts                    # Все типы
```

## Mock-логика

Все данные — frontend-only. Глобальное state-приложение в `app/providers.tsx`:

- `user` — фиктивный пользователь (всегда авторизован)
- `charges` — баланс зарядов ⚡
- `projects` — список проектов
- `onboardingDone` — флаг прохождения онбординга
- Модалки: `result`, `paywall`, `createProject`, `onboarding`

## Главный пользовательский путь

1. `/` → нажать «Попробовать бесплатно»
2. `/studio` → onboarding (3 шага)
3. Загрузить товар или «На демо»
4. Выбрать тип контента (Фото / Карточка / Видео)
5. Сгенерировать → loading → результат
6. Открыть в `ResultModal` → скачать / улучшить / создать видео
7. Если не хватает зарядов → `PaywallModal`

## Бренд

- **Имя:** ERA2 Card
- **Валюта:** Заряды ⚡ (с tooltip-объяснением в Header)
- **Акцент:** Lime `#C6F94D`
- **Базовый тёмный:** `#0A0A0F` (унаследован из era2.ai)
- **ERA2 aurora:** pink-400 / purple-400 / orange-300 — фоновые glow-акценты

## Состав главной страницы

| Секция | Что показывает |
|---|---|
| Hero | Главный заголовок про WB/Ozon + before/after визуал |
| Marquee | Бегущая строка с возможностями (✦ separator) |
| HowItWorks | 3 шага: загрузка → выбор формата → скачать |
| WhatYouCanCreate | 7 форматов: титульная, инфографика, на модели, каталог, lifestyle, видеообложка, серия |
| GeneratorDemo | Интерактивный мини-генератор прямо на лендинге |
| Features | 8 возможностей сервиса |
| Examples | 24 примера, 8 категорий, бейджи resultType (Карточка / Lifestyle / До-После / Видеообложка) |
| Templates | Готовые шаблоны под популярные сценарии |
| AudiencesAndComparison | Для кого + сравнение со студией/дизайнером |
| Pricing | 4 тарифа: Старт / Креатор / Студия / Бизнес |
| Testimonials | 4 отзыва от селлеров |
| FAQ | 8 вопросов про заряды, маркетплейсы, форматы |
| FinalCTA | Итоговый призыв на тёмном фоне с aurora |

## Состав продуктовой зоны (app)

- **/studio** — главный генератор: загрузка → быстрые сценарии → выбор формата → результаты. Sticky CTA внизу на мобильном.
- **/projects** — карточки проектов с marketplace-бейджем, статусом, счётчиками (карточек / видео), датой обновления, кнопкой «Открыть проект»
- **/account** — статистика, ERA2 API, реферал-блок, команда, **«Другие инструменты ERA2»** (Voice / Music / Video / Hub)
- **/billing** — баланс, тарифы, пакеты зарядов, история транзакций

## Security & Production notes

Текущая версия зафиксирована на **Next.js 14.2.35** — последняя LTS-ветка 14.x с закрытыми security advisories на момент сборки (включая critical CVE, актуальный для 14.2.15).

`npm audit` всё ещё показывает несколько `moderate`/`high` предупреждений из транзитивных зависимостей (`postcss`, и т.п.). На фронтенд без бэкенда и пользовательских данных это **не влияет на безопасность пользователей**, но **перед production рекомендуется миграция** на один из вариантов ниже.

### 🎯 Рекомендуемые версии для production

| Зависимость | Текущая (MVP) | Минимум для prod | Причина |
|---|---|---|---|
| `next` | 14.2.35 | **15.5.16+** или **16.x** | Закрывает все оставшиеся SSRF/auth advisories из 14.x ветки |
| `postcss` | 8.4.47 (через next) | **8.5.10+** | XSS в Stringify (GHSA-qx2v-qp2m-jg93) |
| `react` | 18.3.1 | 18.3.1 или 19.x | OK как есть |

### Вариант A — мажорное обновление до Next 15.5+ (рекомендуется через 1–2 спринта)

Миграция на Next 15.5.16+ или Next 16.x закроет все оставшиеся advisories и обновит postcss транзитивно.

```bash
# 1. Сделать ветку
git checkout -b chore/next-major-upgrade

# 2. Запустить codemod для миграции 14 → 15 (или 14 → 16)
npx @next/codemod@canary upgrade latest

# 3. Прогнать сборку
npm run build
npm run lint
npm audit

# 4. Что проверить руками после миграции:
#    - app/layout.tsx — изменения в next/font, viewport, metadata API
#    - cookies() / headers() / params / searchParams стали async в Next 15
#    - dynamic routing — поведение могло измениться
#    - <Image> — параметры loader/sizes
```

Breaking changes в 15 → 16 в основном касаются Server Components и cookies API — для фронтенд-only проекта (без БД, без auth) миграция пройдёт практически без правок. Закладывайте 1-2 дня на ручную проверку.

### Вариант B — точечный override уязвимых deps (быстрое решение)

Если миграцию откладываем, можно зафиксировать безопасные версии транзитивных зависимостей через `overrides` в `package.json`:

```json
{
  "overrides": {
    "postcss": "^8.5.10"
  }
}
```

После — `npm install` и `npm audit`. Этот вариант временный — он не закрывает CVE в самом `next`, но снимает шум от `postcss`.

### Текущий статус CVE
| Уязвимость | Severity | Статус |
|---|---|---|
| `next@14.2.15` SSRF / auth bypass | Critical | ✅ Закрыто (обновлено до 14.2.35) |
| `postcss` XSS в Stringify (GHSA-qx2v-qp2m-jg93) | Moderate | ⚠️ Транзитивная — закроется миграцией на Next 15.5+ или override |
| Прочие из вложенных deps Next 14 | High/Mod | ⚠️ Уйдут с миграцией на Next 15.5+ / 16.x |

### Проверка локально

```bash
npm audit              # подробный отчёт
npm audit --json       # для CI
npm outdated           # покажет, что отстаёт от latest
```

> **Важно:** все указанные «high/moderate» в текущем `npm audit` относятся к зависимостям dev-tooling (build-time), не к runtime. То есть в production-bundle, который попадёт пользователю в браузер, уязвимостей нет. Это не оправдание не обновляться, но снимает срочность.
