# Компоненты, документы и композиции

## CSS-компоненты и поведение

Кнопки, формы, уведомления, бейджи и диалог используют публичные .af-* классы. Состояния задаются семантическими HTML-атрибутами, ARIA и data-*; disabled не заменяется только цветом. Для обычной разметки требуется корень .af и явно подключённый CSS. initComponents усиливает доверенную разметку и возвращает cleanup. Повторная инициализация не должна накапливать обработчики. [Живые примеры](/index.html#buttons).

## Кнопки: размеры и состояния

Icon-button использует существующий af-btn: добавьте af-btn--icon, для круга — af-btn--round, для размера S/L — af-btn--sm/af-btn--lg. Размеры кнопок 32/40/48 px, радиус квадрата 8 px; слот af-btn__icon — 16/20/24 px. Исключение Figma: Secondary Round L использует 20 px, в том числе для загрузки. af-btn__icon--info показывает исходную иконку информации из Figma нужного размера, встроенную в CSS; цвет следует кнопке. При передаче своей SVG-иконки сохраняйте её исходные размеры в слоте. af-btn__icon--placeholder оставлен для необязательного пустого слота; живые примеры используют настоящую иконку.

```html
<button class="af-btn af-btn--icon af-btn--round" type="button" aria-label="Подробнее">
  <span class="af-btn__icon af-btn__icon--info" aria-hidden="true"></span>
</button>
```

Имя задавайте на кнопке через aria-label или af-sr-only. Selected, hover, pressed, disabled, loading и фокус работают как у обычной af-btn. Во время загрузки сохраняются размер и доступное имя. Для disabled и загрузки используйте нативный button; aria-disabled у ссылки дополняется существующим initComponents. [Матрица размеров и состояний](/index.html#buttons).

## Компонентная типографика

Модификатор указывается вместе с базовым классом. Соответствие стилям Figma:

| Стиль | CSS-классы | Размер / высота строки | Вес |
| --- | --- | --- | --- |
| Display L | af-display | 44 / 100% | 800 |
| Heading H1 | af-heading | 32 / 100% | 800 |
| Heading H2 | af-heading af-heading--2 | 28 / 120% | 700 |
| Heading H3 | af-heading af-heading--3 | 24 / 120% | 700 |
| Title L | af-title | 22 / 120% | 500 |
| Title M | af-title af-title--md | 16 / 150% | 400 |
| Body L | af-body | 16 / 135% | 400 |
| Body M | af-body af-body--md | 14 / 140% | 400 |
| Body S | af-body af-body--sm | 12 / 135% | 400 |
| Body XS | af-body af-body--xs | 10 / 135% | 400 |
| Body XXS | af-body af-body--xxs | 8 / 135% | 400 |
| Label L | af-label af-label--lg | 16 / 130% | 500 |
| Label M | af-label | 14 / 130% | 500 |
| Label S | af-label af-label--sm | 12 / 130% | 500 |
| Label XS | af-label af-label--xs | 10 / 130% | 500 |

Заголовки используют Alabuga Heading, остальной текст — Alabuga Sans. Межбуквенный интервал компонентных классов — 0. Сохраняется полная высота строки без обрезки Body/Label; af-caption остаётся подписью 12 px с дополнительным цветом. XS/XXS предназначены для служебных подписей, основной текст — 14–16 px. af-field автоматически задаёт размеры своей подписи. Готовые композиции и fitted-презентации сохраняют собственные контекстные масштабы; в page-документах на ширине до 767 px Display уменьшается до 36 px. Самостоятельный Display остаётся 44 px на всех ширинах. [Живая шкала](/index.html#typography).

## Фирменные маркированные списки

Используйте ul.af-list с role="list": залитый ромб включён по умолчанию, af-list--outline задаёт контурный ромб, af-list--triangle — треугольник. Маркеры Bullet 33×33 px включены в CSS, промежуток до текста 12 px. Первая строка выровнена по центру маркера; переносы начинаются под текстом. Список остаётся левым при центрированном родителе. role="list" сохраняет семантику в Safari при отключённых стандартных маркерах; renderer добавляет его автоматически.

```html
<ul class="af-list af-list--triangle" role="list">
  <li>Проверить проектор и звук перед встречей.</li>
  <li>Подготовить бейджи и разложить материалы для участников.</li>
</ul>
<ol class="af-list">
  <li>Согласовать повестку встречи.</li>
  <li>Обсудить вопросы и зафиксировать решения.</li>
  <li>Назначить ответственных и сроки выполнения.</li>
</ol>
```

ol.af-list сохраняет нативную нумерацию, start/value и вложенные списки. Для отдельного декоративного маркера используйте span.af-bullet с aria-hidden="true"; доступны af-bullet--outline и af-bullet--triangle. Новых полей формата документа и JS-инициализации для этих стилей нет.

В справочнике каждый вид показан отдельным блоком с описанием, предпросмотром и HTML: [залитый ромб](/index.html#typography/example-2), [контурный ромб](/index.html#typography/list-outline), [треугольник](/index.html#typography/list-triangle), [нумерованный список](/index.html#typography/list-ordered).

## Дополнительные стили: буквица и разделители

af-dropcap, af-divider и af-divider--ornament были в первоначальном коде Framework; они уже присутствуют в коммите 57cc037 от 20 октября 2026. В проверенных Figma, PDF и брендовых материалах подтверждение этих приёмов не найдено. Это проектные расширения Framework, а не перенесённые компоненты дизайн-системы: буквица оформляет первую букву через ::first-letter, af-divider рисует обычную линию, af-divider--ornament — декоративную CSS-фигуру. Их использование необязательно; совместимость существующих документов сохраняется. [Пример с пометкой происхождения](/index.html#typography/example-3).

## Обычные кнопки

af-btn, af-btn--secondary, af-btn--ghost и af-btn--clear соответствуют четырём оформлениям. Размер по умолчанию M — 40 px; af-btn--sm — 32 px; af-btn--lg — 48 px. Обычные композиции сохраняют эти размеры. Презентационные af-slide-type отдельно используют рассчитанную типографику слайда.

aria-pressed="true" задаёт Selected: Primary и Clear используют синий фон; Secondary — светло-голубой; Ghost — белый фон и синий текст. Приложение управляет значением aria-pressed. Hover/Pressed работают через CSS; клавиатурный фокус сохраняется. Текстовые роли сохраняют контрастные поправки Framework.

aria-busy="true" показывает по центру SVG загрузки из Figma размером 16/20/24 px. Текст остаётся в DOM как доступное имя и сохраняет ширину, но скрывается визуально. Добавляйте disabled к нативной кнопке на время загрузки. При одновременных busy и disabled отображается Loading. initComponents блокирует click и auxclick для .af-btn с aria-busy="true" или aria-disabled="true", включая ссылки; cleanup снимает обработчики. Без JS для блокировки нативной кнопки нужен disabled, а недоступная ссылка должна быть без href.

```html
<button class="af-btn af-btn--secondary" aria-pressed="true">Выбрано</button>
<button class="af-btn" aria-busy="true" disabled>Сохранить</button>
```

af-btn--inverse явно задаёт белый CTA для тёмной поверхности. Renderer добавляет его кнопкам секций accent/contrast/image на поверхности plain; внутри белой card сохраняется обычное оформление. Для самостоятельного HTML назначайте модификатор вручную. [Размеры и все состояния](/index.html#buttons).

## Input и Textarea: размеры и состояния Field

Обычный input.af-input имеет размер M — 40 px и текст 14 px / 140%. af-input--sm задаёт 32 px, текст 12 px / 135% и радиус 6 px; af-input--lg — 48 px и текст 16 px / 135%. Радиус M/L — 8 px, горизонтальный отступ всех размеров — 12 px. Внутри af-field подпись и подсказка получают размеры S 10/8 px, M 12/10 px, L 14/12 px. Вводимый текст сохраняет полную высоту строки.

Для иконок используйте af-input-wrap. Размер задаётся на input; обёртка получает ту же общую высоту 32/40/48 px с учётом границы. Слот af-placeholder-icon и встроенный af-input-hint имеют размер 16/20/24 px и промежутки 8/10/12 px. Необязательный левый квадрат соответствует слоту-заглушке Figma; приложение может убрать его или поставить свою иконку нужного размера. SVG информации/ошибки/успеха встроены в CSS; af-input-hint декоративный, текстовую подсказку связывайте через aria-describedby.

```html
<div class="af-field">
  <label class="af-label" for="title">Название</label>
  <div class="af-input-wrap">
    <input class="af-input af-input--sm" id="title" name="title" required aria-describedby="title-help">
    <span class="af-input-hint" aria-hidden="true"></span>
  </div>
  <p class="af-help" id="title-help">Укажите название</p>
</div>
```

Error задаётся aria-invalid="true", Success — af-input--success или af-textarea--success. У обёртки состояние следует полю, включая цвет значка. Disabled имеет приоритет перед error/success/focus, error — перед success. Disabled наследуется от fieldset; label, helper и иконки получают согласованные цвета. Readonly сохраняет значение в FormData и позволяет выделять текст. Рамки error/success используют исходные сигнальные цвета Figma, а текст ошибок сохраняет контрастную поправку Framework. Фокус — одна граница 1 px; системная высокая контрастность сохраняет отдельный контур.

Textarea использует исходный вариант Figma высотой 128 px, текстом 16 px / 135% и padding 12 px. Растягивание по вертикали остаётся нативным. af-field__meta располагает подсказку слева и счётчик справа. Счётчик включается через data-af-counter-for и существующий initComponents:

```html
<div class="af-field">
  <label class="af-label" for="comment">Комментарий</label>
  <textarea class="af-textarea" id="comment" name="comment" maxlength="1000" aria-describedby="comment-help comment-count"></textarea>
  <div class="af-field__meta">
    <p class="af-help" id="comment-help">До 1000 символов</p>
    <span class="af-field__counter" id="comment-count" data-af-counter-for="comment"></span>
  </div>
</div>
```

Счётчик читает текущее value, обновляется на input/change, после reset и при изменении maxlength. Он считает UTF-16 единицы, как maxlength; при отсутствии лимита показывает только длину. После программного изменения value отправьте input или change. Отменённый reset сохраняет значение и счётчик. Повторный initComponents освобождает предыдущие обработчики; cleanup останавливает обновления и наблюдение, сохраняя последний текст счётчика. Без JS поле и maxlength работают нативно, а пустой счётчик не отображает устаревшее значение. [Живые примеры](/index.html#forms).

## Switch: нативный переключатель

Используйте input.af-switch type="checkbox" role="switch" внутри label.af-check. В Figma задан один размер L: 44×24 px, ползунок 20 px с отступом 2 px; подпись 16 px и промежуток 12 px. Отдельные S/M-варианты не вводятся. OFF/ON, hover и disabled оформлены раздельно; disabled сохраняет положение ползунка и получает собственные цвета вместо общей прозрачности.

```html
<label class="af-check">
  <input class="af-switch" type="checkbox" role="switch" name="autosave" value="yes" checked>
  Автосохранение
</label>
```

Оформление работает с CSS без initComponents. Tab/Space, нажатие на подпись, checked, required, disabled родительского fieldset, FormData и reset остаются нативными. В forced-colors используются системные цвета и видимый фокус; reduced-motion отключает движение ползунка.

## Checkbox и Radio: CSS и нативные поля

af-checkbox и af-radio оформляют настоящие input, без замены DOM и JS-инициализации. Размер значка по умолчанию M — 20 px; суффиксы --sm и --lg задают 16 и 24 px. af-check связывает поле с подписью: размер текста 12/14/16 px, отступ S — 6 px, M/L — 8 px; высота области нажатия не меньше 32 px. Радиус checkbox — 4 px; radio — круг. Встроенные SVG сохраняют геометрию каждого размера из Figma и входят в CSS.

```html
<label class="af-check">
  <input class="af-checkbox af-checkbox--sm" type="checkbox" name="consent" required>
  Согласен с условиями
</label>
<fieldset>
  <legend>Формат</legend>
  <label class="af-check"><input class="af-radio" type="radio" name="format" value="page" checked> Страница</label>
  <label class="af-check"><input class="af-radio" type="radio" name="format" value="slides"> Презентация</label>
</fieldset>
```

Состояния следуют :checked, :hover, :active и :disabled, включая disabled родительского fieldset. Required, FormData, reset, Tab/Space и стрелки radio остаются нативными. Частичный выбор задаётся свойством input.indeterminate = true; это HTML-расширение, а не состояние Loading из Figma. В режиме системной высокой контрастности возвращается нативный вид поля. [Живые примеры](/index.html#forms).

У выбранного radio внутренний кружок и фон отрисовываются в одном слое поля, чтобы сохранять центрирование при дробном масштабе и плотности пикселей. SVG остаются исходными и соответствуют размерам S/M/L.

## Select: подключение через JS и CSS

Достаточно подключить alabuga.css и alabuga.iife.js и вызвать Alabuga.initComponents(root) для корня .af. В ESM используется тот же initComponents и явный импорт standalone.css. Дополнительные библиотеки, новый renderer и изменение формата документов не нужны.

```html
<div class="af-field">
  <label class="af-label" for="topic">Тема обращения</label>
  <select class="af-select" id="topic" name="topic" required aria-describedby="topic-help">
    <option value="" selected disabled hidden>Выберите тему</option>
    <option value="cooperation">Сотрудничество</option>
    <option value="education">Обучение</option>
  </select>
  <p class="af-help" id="topic-help">Можно выбрать один вариант</p>
</div>
```

Default M — 40 px; af-select--lg — 48 px; af-select--sm — 32 px. Подпись, подсказка, стрелка и строки меню получают соответствующий размер. Радиус S — 6 px, M/L — 8 px. Контрастные цвета текста сохраняют поправки Framework. Левый значок в базовом варианте не задан.

Значение отображается полной строкой без обрезки высоты букв; длинный текст сокращается по ширине многоточием. Зазор между полем и раскрытым меню — 2 px, уточнён по обратной связи для веб-реализации (в Figma — 8 px). Отступ меню от края экрана остаётся 8 px и рассчитывается отдельно. Фокус input/select/textarea и поля с af-input-wrap использует одну синюю границу толщиной 1 px, без внешней двойной рамки; в forced-colors сохраняется системный контур фокуса. Кнопки и checkbox/radio сохраняют отдельный клавиатурный контур.

Исходный select сохраняется в DOM и участвует в FormData, required-валидации, reset и input/change. Пользовательский выбор отправляет input и change с исходного select. Запись value, selectedIndex и option.selected обновляет представление без создания пользовательских событий; изменение options и атрибутов отслеживается автоматически. Собственные accessors приложения не переопределяются: после их изменения отправьте обычный change.

Enter/Space открывают меню и подтверждают выбор; стрелки, Home/End и набор текста перемещают активный пункт. Escape отменяет неподтверждённый выбор, Tab закрывает меню и продолжает навигацию. disabled и недоступные optgroup учитываются. data-af-readonly или aria-readonly="true" запрещают изменение пользователем, сохраняя значение в форме. У hidden-пунктов нет видимой строки.

Вызов initComponents повторно для того же корня освобождает предыдущие обработчики. cleanup возвращает исходный select, удаляет созданные элементы и восстанавливает изменённые библиотекой свойства. После добавления новых select вызовите initComponents для их корня. multiple, size больше 1 и data-af-select-native оставляют нативное представление; без JavaScript нативное поле также продолжает работать.

Меню использует стандартный Popover API для выхода из обрезающих контейнеров; без него применяется фиксированное меню в body или текущем dialog. Для валидации формы используйте существующий form[data-af-validate] и data-af-error-for: ошибка и фокус передаются видимому control. Новые CSS-части: .af-select-box, .af-select__control, .af-select__value, .af-select__arrow, .af-select-list, .af-select-option. Они не заменяют маркированный текстовый .af-list. [Живые примеры](/index.html#forms).

## Блоки и поверхности

Именованные варианты af-card реализуют [правила внешних и внутренних блоков из Figma](https://www.figma.com/design/ObAoKiDwraibmQrxUNvGWI/Design-System?node-id=270-203) и PDF «Визуальные правила». Имена классов — API Framework; отдельного семейства Card в проверенном макете нет.

| Геометрия | Padding | Радиус | Gap |
| --- | --- | --- | --- |
| af-card af-card--outer | 32 px | 32 px | 16 px |
| af-card af-card--inner | 16 px | 16 px | 16 px |

Оба варианта располагают дочерние блоки вертикально и сохраняют указанные размеры на телефоне. У прямых дочерних заголовков, абзацев и списков убраны внешние вертикальные отступы: расстояние задаёт gap 16 px. Длинные слова и ссылки переносятся.

```html
<section class="af-card af-card--outer af-card--outline" aria-labelledby="materials">
  <h2 class="af-title" id="materials">Материалы встречи</h2>
  <p class="af-body">Подготовьте программу и вопросы для обсуждения.</p>
  <div class="af-card af-card--inner">
    <h3 class="af-title af-title--md">Программа</h3>
    <p class="af-body">Знакомство, обсуждение и согласование следующих шагов.</p>
  </div>
</section>
```

Для каждого объекта выбирайте один способ выделения:

| Модификатор | Оформление |
| --- | --- |
| af-card--filled | Синяя заливка и белый наследуемый текст, без обводки и тени |
| af-card--outline | Белая поверхность с синей обводкой 2 px, без тени |
| af-card--outline-thick | Белая поверхность с синей обводкой 3 px, без тени |
| af-card--elevated | Белая поверхность с тенью 0 2px 3px 0 neutral/300, без обводки |

Заливка, обводка 2–3 px и тень с y=2 описаны в правилах; blur=3 и neutral/300 взяты из иллюстрации Figma. Вложенные компоненты сохраняют свои цвета и размеры. Белая вложенная карточка с af-card--inner получает обычный цвет текста; белая CTA на синем фоне задаётся явным af-btn--inverse. В forced-colors заливка/тень заменяются системной границей, цветами Canvas/CanvasText и отключённой тенью. Для синей заливки задан print-color-adjust:exact.

Прежний af-card без --outer/--inner сохраняет блочную компоновку, нейтральную рамку 1 px и мобильные padding/radius 20 px. Это прежние решения Framework, а не новые варианты Figma. Классы af-surface--plain/card остаются флагами renderer. Формат документа, виджеты и fitted-презентации не меняются; новый CSS работает без initComponents. [Живые примеры](/index.html#surfaces).

## DatePicker: поле даты и календарь

Добавьте `af-datepicker` к полю даты и вызовите `initComponents`:

```html
<div class="af-field">
  <label class="af-label" for="meeting-date">Дата встречи</label>
  <input class="af-input af-input--lg af-datepicker" type="date"
    id="meeting-date" name="meetingDate" min="2026-10-01" max="2026-12-31">
</div>
```

```js
const dispose = Alabuga.initComponents(host);
// Перед удалением разметки: dispose();
```

Размеры поля: `af-input--sm` — S (32 px), без модификатора — M (40 px), `af-input--lg` — L (48 px). Иконки и подписи меняются вместе с полем; календарь сохраняет ширину 250 px. S/M добавлены по запросу как расширение исходного DatePicker L.

Ввод — ДД.ММ.ГГГГ; `input.value` и `FormData` — YYYY-MM-DD. Календарь открывается кнопкой или стрелкой вниз. «Подтвердить» применяет дату, «Отмена» и Escape сохраняют прежнюю.

Поддерживаются `required`, `min/max`, `disabled`, `readonly` и сброс формы. Ошибка — `aria-invalid="true"`, успех — `af-input--success`. После программного изменения `value` отправьте `input` или `change`. Атрибут `data-af-date-native` оставляет календарь браузера.

[Форма и состояния](/index.html#forms/datepicker) · [Календарь с полем ввода](/index.html#widgets/calendar-input). Диапазон дат описан ниже, в разделе Calendar.

## Календарь: навигация и выбор

Виджет calendar принимает дату YYYY-MM-DD. Стрелки меняют день/неделю, Home/End переходят к понедельнику/воскресенью, Page Up/Down — к соседнему месяцу, Shift + Page Up/Down — к соседнему году. Если такого числа нет, фокус переходит на последний день месяца. Основание клавиатурных команд — [WAI APG Date Picker](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/#kbd_label).

Перемещение фокуса и кнопки перелистывания не меняют выбранную дату. Enter, пробел или щелчок выбирают день. Среди дней только один входит в Tab-порядок; заголовок месяца остаётся в DOM как aria-live. Навигация ограничена годами 0000–9999, поддерживаемыми существующей схемой, включая годы до 100. В граничном месяце соответствующая кнопка перелистывания отключена.

Calendar сверен с приложенным скриншотом: ширина 250 px, дни 32×32 px, без горизонтального промежутка, 4 px между строками, заголовок 16 px, рамка/radius 1/8 px и тень. Месяц из пяти недель имеет высоту 260 px или 304 px с действиями. Число строк соответствует реальному месяцу; соседние даты показаны неактивными. В скриншоте ошибочно есть 31 сентября — рабочий календарь показывает после 30 сентября 1 октября. Подписи недель и текст начала периода темнее эталона для читаемого контраста.

Самостоятельный компонент доступен в обычном JS/CSS-подключении и ESM:

```js
const calendar = Alabuga.renderCalendar('2026-09-10', date => {
  console.log('Подтверждено:', date);
}, {confirm: true, value: null});
document.querySelector('#calendar-example').append(calendar);
```

Без третьего аргумента день применяется сразу — прежний вызов renderCalendar(date, onSelect) сохранён. С confirm:true выбор становится черновиком: «Подтвердить» применяет его, «Отмена» и Escape возвращают последнее подтверждённое значение. value:null убирает исходное выделение; подтверждение без выбора принимает дату фокуса. onCancel вызывается после отмены и позволяет приложению закрыть popover. Навигация сама не отправляет выбор.

```js
const calendar = Alabuga.renderCalendar('2026-09-10', range => {
  console.log(range.start, range.end);
}, {
  mode: 'range', confirm: true,
  value: {start: '2026-09-10', end: '2026-09-17'}
});
host.append(calendar);
```

Два выбора задают диапазон; обратный порядок автоматически нормализуется. После первого конца наведение и клавиатура показывают предварительный период; подтверждение недоступно, пока не выбран второй конец. Без confirm:true callback вызывается после второго выбора. Даты соседних месяцев неактивны: для продолжения диапазона перелистните месяц. CSS использует data-range=start/middle/end/single; рамки середины продолжаются через границу недели. Компонент возвращает HTMLElement, его DOM принадлежит Framework до удаления; внешних обработчиков и отдельного dispose нет. Значения options задают начальное состояние; для внешней замены создайте новый календарь.

Виджет в AFDocument сохраняет немедленный выбор одной даты и af:change:

```js
const host = document.querySelector('#calendar-example');
const controller = Alabuga.renderDocument(host, documentData);
host.addEventListener('af:change', event => {
  // detail: {widgetId, value: '2024-02-29'}
  // Выбранный день в DOM и getDocument() уже обновлён.
  console.log(event.detail, controller.getDocument());
});
```

Обработчик может синхронно вызвать update/destroy; календарь завершает работу с DOM и фокусом до отправки события или callback. Формат документа, CSS-классы и способ подключения JS/CSS сохранены. Диапазон и черновик не добавляют полей в AFDocument. [Все варианты с кодом](/index.html#widgets), включая подтверждение, диапазон и високосный год.

Calendar реализован по приложенному скриншоту. DatePicker использует его в отдельном поле с вводом и popover. Необязательные options min/max ограничивают доступные дни и навигацию Calendar; существующие вызовы без границ сохраняют поведение.

## Элементы выбора, метки и навигация

| Компонент | Разметка и размеры |
| --- | --- |
| Option-btn | `label.af-option` с `input.af-option__input` и `span.af-option__label`; checkbox для нескольких значений, radio с общим `name` для одного |
| Multi-switch | `fieldset.af-multi-switch` с Option-btn; `--sm` / без модификатора / `--lg` — 32/40/48 px |
| Chip | `af-chip`, те же размеры — 16/20/24 px; виды `--default`, `--info`, `--success`, `--warning`, `--error` |
| Alert | `af-alert`, размеры 32/40/48 px, виды как у Chip; прежний `--danger` поддерживается |
| Dialog | `af-dialog af-dialog--compact`: до 350 px, padding 16 px; слоты `af-dialog__header`, `__title`, `__body`, `__actions`, `__close` |
| Breadcrumbs | Именованный `nav.af-breadcrumbs` с `ol`; текущий пункт — `aria-current="page"` |

У Option-btn/Multi-switch выбранность задаёт `checked`; клавиатура, FormData, disabled, required и reset остаются нативными. Для удаления Chip используйте кнопку `af-chip__remove[data-af-dismiss]`, для Alert — `af-alert__close[data-af-dismiss]` и вызовите прежний `initComponents`. Динамическому результату задайте `role="status"`, срочной ошибке — `role="alert"`. Dialog требует `aria-labelledby`; `aria-describedby` связывает описание. Текущая ссылка — `af-link[aria-current="page"]`.

[Выбор форматов](/index.html#forms/option-button) · [Multi-switch](/index.html#forms/multi-switch) · [Chip](/index.html#feedback/chips) · [Alert](/index.html#feedback/alert-sizes) · [Dialog](/index.html#dialog/dialog-slots) · [Навигация](/index.html#navigation).

Option-btn и Multi-switch сверены с присланным эталоном: обычное начертание, прозрачные невыбранные состояния; у группы нет общей подложки и рамки, внутренний отступ и gap — по 4 px. У Chip/Alert восстановлены исходные цвета, значки состояний и размеры крестиков. У Alert L слева 20 px, справа 24 px. В Dialog промежутки между слотами — 16 px, кнопки равные и заполняют строку. Ссылки по умолчанию серые, текущие чёрные, при наведении синие; постоянного подчёркивания нет.

Исходная палитра не во всех состояниях обеспечивает AA-контраст текста. Для более тёмного текста добавьте `af-chip--accessible` / `af-alert--accessible`, для ссылки — `af-link--accessible`. Модификатор `af-link--inline` задаёт синюю подчёркнутую ссылку в тексте. Источники и размеры записаны в `design/secondary-components-rules.json`; новые запросы Figma не нужны. Прежние `af-badge` и обычные диалоги доступны.

## Иконки

[Каталог и примеры](/index.html#icons). Используйте `af-icon af-icon--info` (по умолчанию M, 20 px), `af-icon--sm` для 16 px и `af-icon--lg` для 24 px. Доступны `info`, `success`, `error`, `expand`, `collapse`, `previous`, `next`, `calendar`, `close`, `loading`, `loading-white`. Одноцветные значки наследуют цвет текста; загрузка сохраняет исходные цвета и учитывает сокращение движения.

В кнопке добавьте `af-btn__icon`: размер определяется кнопкой, включая Round Secondary L с иконкой 20 px. Декоративному значку задайте `aria-hidden="true"`, самостоятельному смысловому — `role="img" aria-label="…"`. Кнопке без текста нужна подпись `aria-label`.

`af-icon` без именованного значка сохраняет прежний контейнер 24 px для своего SVG. Исходные SVG встроены в CSS, новых JS-вызовов нет. У Previous/Next сохранён исходник 20 px, у Calendar/Close — 24 px; другие размеры масштабируют его. Полный набор 49 узлов Figma не экспортирован: недостающие Help/CancelRound/Check/Radio/Default не заменяются похожими значками. Происхождение и размеры: `design/icon-catalog.json`.

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

## Читаемая панель без вложенной прокрутки

В [примере панели](/index.html#grid) календарь занимает четыре колонки, комментарий — восемь, каждый показатель — четыре; таблица и текст размещены ниже. Для таблицы включён `wrap: true`, поэтому длинные значения переносятся внутри колонок.

Обёртка `.panel-demo` и стили `demos/panel.css` разрешают строкам расти по содержимому. Ширина контейнера определяет перестроение: до 1000 px — две колонки, до 600 px — одна с парой показателей в строке. Это оформление примера: фиксированная геометрия обычных документов и презентаций остаётся доступной. Подключите этот CSS вместе с готовыми стилями Framework, чтобы воспроизвести адаптацию. Не скрывайте переполнение для устранения полос прокрутки — увеличивайте доступное место и переносите текст.

## React

React владеет host-элементом через ref, Framework — его дочерним DOM. В useEffect создайте controller; отдельным эффектом обновляйте document; в cleanup вызовите destroy. Повторное монтирование StrictMode должно освобождать все обработчики. Проверенный пример находится в tests/consumers/react-document.mjs; отдельного React-пакета нет.

[Форматы и ресурсы](data.md). [Фирменные источники](brand.md). [Редактор]({{CONSTRUCTOR_URL}}/builder/).
