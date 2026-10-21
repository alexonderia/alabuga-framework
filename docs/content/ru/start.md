# Начало работы с Framework

Alabuga Framework — независимая дизайн-система, CSS-компоненты и renderer сайтов и презентаций. Редактор, проекты, IndexedDB, ИИ и сервер принадлежат Alabuga Constructor. Для использования библиотеки Constructor не устанавливается.

## Установка опубликованного пакета

Настройте scoped HTTPS registry @alabuga и read token в пользовательском npm config. Затем установите точную версию:

```sh
npm install --save-exact @alabuga/framework@1.0.2
```

Для локальной приёмки используется авторизованный Verdaccio на 127.0.0.1:4873. Production-адрес пока не подключён. Собранное приложение не обращается к реестру при работе.

## CSS и JavaScript

```ts
import '@alabuga/framework/standalone.css';
import {initComponents} from '@alabuga/framework';
const cleanup = initComponents(document.querySelector('.af')!);
// Перед удалением UI:
cleanup();
```

CSS подключается явно. Размещайте обычные CSS-компоненты внутри .af. Для документа вызовите renderDocument; его контроллер управляет дочерней разметкой и освобождает обработчики через destroy. [Компоненты и композиции](author.md).

## Обычный HTML

Экспорт standalone.js указывает на dist/alabuga.iife.js, standalone.css — на полный CSS со встроенными шрифтами. Разместите эти файлы и каталог assets на своём статическом сервере; глобальный объект называется Alabuga. Относительно URL script определяется база встроенных материалов, явный assetsBaseUrl имеет приоритет. [Ресурсы и форматы](data.md).

## Разработка и справочник

В репозитории библиотеки используйте Node.js 24.19.0/npm 11.17.0, npm ci, npm run build:docs и npm run dev. Самостоятельный статический справочник: docker compose up --build -d docs, адрес 127.0.0.1:4391. Оригинальные шрифты и PDF/PPTX нужны только регенерации, обычная сборка использует готовые файлы.

[Интерактивные примеры](/index.html). [Редактор]({{CONSTRUCTOR_URL}}/builder/). [Руководство Constructor]({{CONSTRUCTOR_URL}}/docs/ru/start.html).
