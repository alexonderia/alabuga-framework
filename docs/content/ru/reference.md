# Публичные API и DOM-контракт

## Точки входа

| Экспорт | Возможности |
| --- | --- |
| Корень пакета | VERSION, schema, renderer, поведение, композиции и экспорт |
| schema | AFDocument, Section, Widget, validateDocument, isSafeUrl |
| runtime | renderDocument, DocumentController |
| components, dom, widgets | initComponents, DOM-помощники, реестр |
| compositions, layout-variants | compositionCatalog, makeComposition, changeComposition, semanticSlots, applyLayoutVariant |
| slide-fit | fitSlide, measureSlide, slideBackgrounds, типы настроек и результата |
| experience, element-style | Действия, движение, типографика и оформление |
| assets, export | Подготовка изображений, exportHTML и ExportOptions |
| brand, examples, demo-documents | Фирменные ссылки и чистые примеры документов |
| tokens.css, styles.css, compositions.css | Явное подключение CSS-частей |
| standalone.js, standalone.css | Самодостаточный IIFE и полный CSS |
| assets/*, tokens.json, slide-backgrounds.json | Статика, snapshot и каталог фонов |

Все JS exports направлены в готовый dist/esm и соответствующие dist/types. /src и /dist не являются публичными подмодулями. CSS подключается отдельно; root/schema импортируются в Node без DOM.

## Проверка и жизненный цикл

```ts
import {validateDocument} from '@alabuga/framework/schema';
import {renderDocument} from '@alabuga/framework/runtime';
const result = validateDocument(input);
if (!result.success) throw new Error(result.issues.map(i => i.message).join('; '));
const controller = renderDocument(host, result.data, {editing: true, assetsBaseUrl: '/assets/'});
controller.update(result.data);
const issues = controller.checkOverflow();
controller.destroy();
```

synchronize обновляет данные после inline-редактирования DOM только в режиме editing. Навигация: goToSlide, next, previous. getDocument возвращает документ контроллера. initComponents возвращает отдельный cleanup. Не удаляйте host без освобождения renderer.

## Подбор и экспорт

```ts
import {fitSlide} from '@alabuga/framework/slide-fit';
const result = await fitSlide(slide, {keepLayout: false, assetsBaseUrl: '/assets/', signal});
if (result.success) documentData.pages[index] = result.slide;
```

keepBackground/keepTypography сохраняют выбранные настройки; resolveAsset разрешает asset:. fit возвращает changes/issues/candidates и не записывает результат самостоятельно. Экспорт принимает runtime.css, runtime.script, assetsBaseUrl и async resolveAsset. [Форматы и ресурсы](data.md).

## DOM и совместимость

Редакторские опоры: data-section-id, data-widget-id, data-action-id; .af-page, .af-slide, .af-panel, .af-widget, .af-widget__title, .af-widget__content, .af-prose, .af-heading, .af-slide__title, .af-section-background, .af-table-scroll, .af-title, .af-label, .af-caption, .af-metric__value, .af-quote__text, .af-quote__author, .af-feature и его title/text. Порядок prose, list items, figcaption, строк/ячеек и карточек соответствует данным. Полный контракт хранится в docs/public-contract.md. Нарушение этих опор требует major-версии.

[Живые примеры](/index.html#api), [композиции](author.md), [бренд](brand.md).
