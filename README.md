# Alabuga Framework

[Отчёт рефакторинга и приёмки](docs/refactor-report.ru.md)

[English](README.en.md) · [Руководства RU](apps/docs/content/ru/start.md) · [Architecture](apps/docs/content/en/architecture.md)

Приватный монорепозиторий визуального конструктора сайтов и презентаций. Локальные проекты, фирменные композиции, поэлементное редактирование, автономный HTML и дополнительный помощник Qwen3.5-2B. Интерфейс приложения — русский; документация — RU/EN.

## Быстрый запуск

Требуются Node.js 24.19.0 и npm 11.17.0.

```sh
npm ci
npm run dev
```

Откройте `http://127.0.0.1:5173/demo/`. Модель и GPU для разработки редактора не нужны.

```sh
npm run build
npm run ai:server
```

Собранная версия: `http://127.0.0.1:4176/demo/`. Документация: `/docs/ru/start.html` и `/docs/en/start.html`.

## Docker

```sh
docker compose up --build -d
docker compose --profile ai up --build -d
```

Без профиля запускается приложение без модели. Профиль `ai` автоматически загружает Ollama и закреплённую модель при первом запуске, сохраняя веса в томе. Для GPU требуется настроенный NVIDIA runtime; см. [эксплуатацию](apps/docs/content/ru/operations.md). Для изменения исходников: `docker compose -f compose.dev.yaml up --build`.

## Пакеты

- `packages/framework`: схема, renderer, композиции, оформление и экспорт.
- `packages/ai`: контракты и генерация без UI редактора.
- `apps/editor`: витрина, конструктор, IndexedDB, демонстрация.
- `apps/ai-server`: локальный API, Ollama, инициализация.
- `apps/docs`: двуязычные руководства и примеры.

Общий `package-lock.json` обязателен. Подробности: [разработка](apps/docs/content/ru/development.md) и [CONTRIBUTING](CONTRIBUTING.md).

## Проверки

```sh
npm test
npm run test:ai
npm run test:bootstrap
npm run build
npm run check:docs
npx playwright install
npm run test:browser -- --workers=1
```

Реальная модель: после подготовки Ollama выполните `npm run test:model`. Модель проверяется отдельно от тестов с имитацией API. Известные ограничения и исторические результаты: [качество](apps/docs/content/ru/quality.md).

## Данные и права

Проекты находятся в браузере, не в Docker. Смена адреса/порта не переносит IndexedDB. Скачивайте переносимые проекты перед сменой среды. Корпоративные исходники PPTX/PDF/TTC хранятся через Git LFS; для обычной сборки они не требуются. Модели, отчёты и локальные настройки исключены из Git.

Репозиторий предназначен для приватной работы команды. Открытая лицензия на код, шрифты и корпоративные материалы этим выпуском не предоставляется. Удалённый репозиторий и реальные владельцы областей назначаются отдельно.
