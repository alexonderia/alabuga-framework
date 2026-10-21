# Компоненты, документы и композиции

## CSS-компоненты и поведение

Кнопки, формы, уведомления, бейджи и диалог используют публичные .af-* классы. Состояния задаются семантическими HTML-атрибутами, ARIA и data-*; disabled не заменяется только цветом. Для обычной разметки требуется корень .af и явно подключённый CSS. initComponents усиливает доверенную разметку и возвращает cleanup. Повторная инициализация не должна накапливать обработчики. [Живые примеры](/index.html#buttons).

## Документ и жизненный цикл

```ts
import '@alabuga/framework/standalone.css';
import {renderDocument} from '@alabuga/framework/runtime';
import {makeComposition} from '@alabuga/framework/compositions';
const documentData = {
  schemaVersion: 3, kind: 'page', title: 'Пример',
  pages: [makeComposition('split', 'page')]
};
const controller = renderDocument(host, documentData, {assetsBaseUrl: '/assets/'});
controller.update(documentData);
controller.destroy();
```

Runtime отображает страницу на адаптивной сетке, презентацию — на 1600×900 с общим масштабом 16:9. Сохраняйте IDs секций и виджетов при обновлениях. checkOverflow возвращает геометрические замечания; навигация презентации управляет также последовательными шагами. Печать и reduced-motion сохраняют всё содержание.

## Композиции и подбор

makeComposition создаёт готовую секцию. changeComposition и applyLayoutVariant переносят содержимое через семантические слоты. Не меняйте структуру произвольно: несовместимый вариант должен быть отклонён с сохранением исходного документа. Каталог layout-variants описывает ограничения; ручные настройки и locked имеют приоритет.

fitSlide и measureSlide используют браузер, шрифты и изображения. fitSlide возвращает результат, а не записывает его в приложение. Передайте signal для отмены, resolveAsset для локальных изображений и assetsBaseUrl для встроенных материалов. При неудаче не применяйте slide; движок не сокращает текст. [Живой подбор](/index.html#compositions). [Действия автора в Constructor]({{CONSTRUCTOR_URL}}/docs/ru/slide-fit.html).

## React

React владеет host-элементом через ref, Framework — его дочерним DOM. В useEffect создайте controller; отдельным эффектом обновляйте document; в cleanup вызовите destroy. Повторное монтирование StrictMode должно освобождать все обработчики. Проверенный пример находится в tests/consumers/react-document.mjs; отдельного React-пакета нет.

[Форматы и ресурсы](data.md). [Фирменные источники](brand.md). [Редактор]({{CONSTRUCTOR_URL}}/builder/).
