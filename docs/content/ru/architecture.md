# Архитектура библиотеки

## Слои и границы

| Слой | Ответственность |
| --- | --- |
| src/tokens/core.css | Базовые цвета, размеры, интервалы и радиусы |
| src/tokens/semantic.css | Текст, поверхности, границы и обратная связь |
| src/tokens/components.css | Токены отдельных компонентов |
| styles.css, compositions.css | CSS-компоненты, состояния, адаптивность |
| schema.ts | Zod-схема, типы и нормализация документов |
| components.ts, widgets.ts | Поведение и реестр виджетов |
| runtime.ts | Отображение, обновление, презентации и измерение |
| compositions.ts, layout-variants.ts | Чистые фабрики, семантические слоты и варианты |
| slide-fit.ts | Ограниченный подбор сетки, шрифта и фона |
| assets.ts, export.ts | Подготовка изображений и автономный HTML |

Единственная runtime-зависимость — Zod. Framework не читает IndexedDB, localStorage редактора, настройки ИИ или файлы соседнего checkout. Хранилище предоставляет resolveAsset; CSS/JS для экспорта передаются явно. Browser renderer и fit требуют DOM; импорт схемы работает в Node без DOM/CSS.

## Контракты

Публичны exports из package.json, типы, события, CSS-переменные и документированные DOM-опоры. DocumentController предоставляет update, synchronize в режиме editing, getDocument, destroy, goToSlide, next, previous и checkOverflow. update сначала валидирует данные, затем меняет дерево; повторный mount освобождает предыдущий renderer. destroy идемпотентен.

Редактор Constructor концентрирует зависимость от DOM в своём framework-adapter.ts. Перестройка публичных опор, нарушающая редактирование, требует major SemVer. Документ schemaVersion и переносимая оболочка приложения версионируются отдельно.

## Два независимых выпуска

Framework выпускает один npm-пакет; Constructor выбирает точную опубликованную версию собственным PR. Git/file-зависимости и alias на исходники не являются способом поставки. Публикация Framework не запускает выпуск приложения. Документация — отдельный статический сайт с обратными ссылками на CONSTRUCTOR_URL.

[API](reference.md), [данные](data.md), [разработка](development.md).
