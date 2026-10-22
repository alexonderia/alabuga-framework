import type {CalendarSingleOptions,CalendarRangeOptions} from '@alabuga/framework';

export const formMarkup = `<form class="af-stack" data-af-validate>
  <div class="af-field">
    <label class="af-label" for="name">Имя <span class="af-required">*</span></label>
    <input class="af-input af-input--lg" id="name" name="name" required autocomplete="given-name" placeholder="Как к вам обращаться?" aria-describedby="name-error">
    <p class="af-error" id="name-error" data-af-error-for="name" hidden></p>
  </div>
  <div class="af-field">
    <label class="af-label" for="email">Электронная почта <span class="af-required">*</span></label>
    <input class="af-input" id="email" name="email" type="email" required autocomplete="email" placeholder="name@company.ru" aria-describedby="email-error">
    <p class="af-error" id="email-error" data-af-error-for="email" hidden></p>
  </div>
  <div class="af-field">
    <label class="af-label" for="topic">Тема обращения</label>
    <select class="af-select" id="topic" name="topic" aria-describedby="topic-help"><option>Сотрудничество</option><option>Обучение</option><option>Другое</option></select>
    <p class="af-help" id="topic-help">Выберите тему обращения</p>
  </div>
  <div class="af-field">
    <label class="af-label" for="message">Комментарий</label>
    <textarea class="af-textarea" id="message" name="message" maxlength="1000" placeholder="Расскажите о задаче" aria-describedby="message-help message-count"></textarea>
    <div class="af-field__meta"><p class="af-help" id="message-help">До 1000 символов</p><span class="af-field__counter" id="message-count" data-af-counter-for="message"></span></div>
  </div>
  <label class="af-check"><input class="af-checkbox" type="checkbox" name="consent" id="consent" required aria-describedby="consent-error"> Согласен на обработку данных</label>
  <p class="af-error" id="consent-error" data-af-error-for="consent" hidden></p>
  <div class="af-row"><button class="af-btn af-btn--lg" type="submit">Отправить заявку</button><button class="af-btn af-btn--ghost" type="button" data-af-dialog-open="details">Подробности</button></div>
</form>
<p class="af-alert af-alert--success af-alert--accessible" id="form-success" role="status" hidden>Проверка пройдена. Демонстрационная форма ничего не отправляет.</p>
<dialog class="af-dialog" id="details" aria-labelledby="dialog-title">
  <h2 class="af-title" id="dialog-title">Перед отправкой</h2>
  <p>Это пример формы. Данные остаются в браузере.</p>
  <button class="af-btn" type="button" data-af-dialog-close>Понятно</button>
</dialog>`;

export type Example = { id?:string; title:string; description?:string; html:string; js?:string; collapseCode?:boolean; calendarDate?:string; calendarOptions?:CalendarSingleOptions|CalendarRangeOptions; enhancement?:'form'|'date-form'|'panel'|'calendar'|'calendar-component'|'table'|'slides'|'choices' };
export const examples: Record<string,Example[]> = {
  buttons:[
    {title:'Четыре оформления',description:'Primary — основное действие. Secondary, Ghost и Clear — действия с меньшим визуальным весом.',html:`<div class="af-row">
  <button class="af-btn">Основное действие</button>
  <button class="af-btn af-btn--secondary">Дополнительное</button>
  <button class="af-btn af-btn--ghost">Нейтральное</button>
  <button class="af-btn af-btn--clear">Текстовое</button>
</div>`},
    {title:'Размеры S / M / L',html:`<div class="af-row">
  <button class="af-btn af-btn--sm">Маленькая · 32</button>
  <button class="af-btn">Средняя · 40</button>
  <button class="af-btn af-btn--lg">Большая · 48</button>
</div>`},
    {title:'Selected · четыре оформления',description:'aria-pressed="true" показывает выбранное действие. Primary и Clear синие; Secondary светло-голубая; Ghost сохраняет белый фон. Приложение управляет aria-pressed. Наведение и нажатие работают через CSS, фокус — через Tab.',html:`<div class="af-row">
  <button class="af-btn" aria-pressed="true">Primary · выбрано</button>
  <button class="af-btn af-btn--secondary" aria-pressed="true">Secondary · выбрано</button>
  <button class="af-btn af-btn--ghost" aria-pressed="true">Ghost · выбрано</button>
  <button class="af-btn af-btn--clear" aria-pressed="true">Clear · выбрано</button>
</div>`},
    {title:'Loading · четыре оформления',description:'В центре — исходный SVG из Figma. Подпись скрыта визуально, остаётся доступным именем и сохраняет ширину кнопки. disabled предотвращает повторную отправку даже без JS. initComponents также блокирует активацию aria-busy и aria-disabled на кнопках и ссылках.',html:`<div class="af-row">
  <button class="af-btn" aria-busy="true" disabled>Сохранить · Primary</button>
  <button class="af-btn af-btn--secondary" aria-busy="true" disabled>Сохранить · Secondary</button>
  <button class="af-btn af-btn--ghost" aria-busy="true" disabled>Сохранить · Ghost</button>
  <button class="af-btn af-btn--clear" aria-busy="true" disabled>Сохранить · Clear</button>
</div>`,js:'const dispose = Alabuga.initComponents(document.body);'},
    {title:'Disabled',html:`<div class="af-row">
  <button class="af-btn" disabled>Primary · недоступно</button>
  <button class="af-btn af-btn--secondary" disabled>Secondary · недоступно</button>
  <button class="af-btn af-btn--ghost" disabled>Ghost · недоступно</button>
  <button class="af-btn af-btn--clear" disabled>Clear · недоступно</button>
</div>`},
    {title:'Кнопки на тёмной поверхности',description:'af-btn--inverse — явное оформление CTA на тёмном фоне. Renderer добавляет его кнопкам на тёмной поверхности секции. Композиции сохраняют размеры S/M/L и больше не перекрашивают все вложенные кнопки.',html:`<div class="af-row" style="background:var(--af-color-brand-deep);padding:24px;border-radius:8px">
  <button class="af-btn af-btn--inverse af-btn--sm">Маленькая · 32</button>
  <button class="af-btn af-btn--inverse">Средняя · 40</button>
  <button class="af-btn af-btn--inverse af-btn--lg">Большая · 48</button>
</div>`},
    {title:'Icon-button · квадратная и круглая',description:'Действие «Подробнее» с иконкой информации из Figma. Размеры S/M/L — 32/40/48 px, иконки — 16/20/24 px. У Secondary Round L иконка 20 px. SVG встроен в CSS и получает цвет кнопки; доступное имя задаётся через aria-label.',html:`<div class="af-stack">
${['sm','','lg'].map((size,i)=>`  <div><p class="af-caption">${['S · 32 px','M · 40 px','L · 48 px'][i]}</p><div class="af-row">
${['',' af-btn--round'].flatMap(round=>['','secondary','ghost','clear'].map((view,v)=>`    <button class="af-btn af-btn--icon${size?' af-btn--'+size:''}${round}${view?' af-btn--'+view:''}" type="button" aria-label="Подробнее · ${['Primary','Secondary','Ghost','Clear'][v]} ${round?'Round':'Default'} ${['S','M','L'][i]}"><span class="af-btn__icon af-btn__icon--info" aria-hidden="true"></span></button>`)).join('\n')}
  </div></div>`).join('\n')}
</div>`},
    {title:'Icon-button · Selected, Disabled и Loading',description:'Состояния и клавиатурный фокус общие с af-btn. aria-pressed управляется приложением. При загрузке сохраняются имя, форма и размер; оригинальная иконка скрывается, в центре появляется SVG загрузки.',html:`<div class="af-stack">
${['aria-pressed="true"','disabled','aria-busy="true" disabled'].map((state,i)=>`  <div><p class="af-caption">${['Selected','Disabled','Loading'][i]}</p><div class="af-row">
${['','secondary','ghost','clear'].map((view,v)=>`    <button class="af-btn af-btn--icon af-btn--round${view?' af-btn--'+view:''}" type="button" aria-label="Подробнее · ${['Primary','Secondary','Ghost','Clear'][v]} ${['Selected','Disabled','Loading'][i]}" ${state}><span class="af-btn__icon af-btn__icon--info" aria-hidden="true"></span></button>`).join('\n')}
  </div></div>`).join('\n')}
</div>`},
  ],
  forms:[
    {title:'Выпадающий список',description:'Select, List и ListItem из Figma. JS создаёт фирменное меню поверх контейнеров, исходный select сохраняет значение и участие в форме. Размеры L/M/S: 48/40/32 px.',html:`<div class="af-row" style="align-items:flex-start">
  <div class="af-field" style="width:278px">
    <label class="af-label" for="select-large">Тема обращения · L</label>
    <select class="af-select af-select--lg" id="select-large" name="topic-large" aria-describedby="select-large-help">
      <option value="">Выберите тему</option><option value="cooperation">Сотрудничество</option><option value="education">Обучение</option><option value="other">Другое</option>
    </select>
    <p class="af-help" id="select-large-help">Можно выбрать один вариант</p>
  </div>
  <div class="af-field" style="width:278px">
    <label class="af-label" for="select-medium">Тема обращения · M</label>
    <select class="af-select" id="select-medium" name="topic-medium" aria-describedby="select-medium-help">
      <option value="">Выберите тему</option><option value="cooperation">Сотрудничество</option><option value="education" disabled>Обучение · недоступно</option><option value="other">Другое</option>
    </select>
    <p class="af-help" id="select-medium-help">Недоступные пункты пропускаются</p>
  </div>
  <div class="af-field" style="width:278px">
    <label class="af-label" for="select-small">Тема обращения · S</label>
    <select class="af-select af-select--sm" id="select-small" name="topic-small" aria-describedby="select-small-help">
      <option value="">Выберите тему</option><option value="cooperation">Сотрудничество</option><option value="education">Обучение</option><option value="other">Другое</option>
    </select>
    <p class="af-help" id="select-small-help">Компактный размер</p>
  </div>
</div>`,js:'const dispose = Alabuga.initComponents(document.body);\n// Перед удалением разметки: dispose();'},
    {title:'Состояния списка',description:'Disabled, только чтение и ошибка сохраняют семантику. Для data-af-readonly значение входит в FormData, но не меняется пользователем. Текст сохраняет полную высоту строки; зазор под раскрытым меню — 2 px. Фокус поля — одна синяя граница 1 px.',html:`<div class="af-stack">
  <div class="af-field"><label class="af-label" for="select-disabled">Недоступно</label><select class="af-select" id="select-disabled" disabled><option>Сотрудничество</option></select></div>
  <div class="af-field"><label class="af-label" for="select-readonly">Только чтение</label><select class="af-select" id="select-readonly" data-af-readonly><option>Обучение</option></select></div>
  <div class="af-field"><label class="af-label" for="select-error">Требуется выбор</label><select class="af-select" id="select-error" aria-invalid="true" aria-describedby="select-error-help"><option value="">Выберите тему</option><option>Сотрудничество</option></select><p class="af-error" id="select-error-help">Выберите один вариант</p></div>
</div>`,js:'Alabuga.initComponents(document.body);'},
    {title:'Input с иконками · размеры S / M / L',description:'Высота поля вместе с обёрткой — 32/40/48 px. Подпись, подсказка, промежутки и исходные SVG меняются вместе с размером input. Левый квадрат — слот-заглушка из Figma; его можно убрать или заменить своей иконкой соответствующего размера. Оформление работает через CSS.',html:`<div class="af-row" style="align-items:flex-start">
${[['sm','S'],['','M'],['lg','L']].map(([size,label])=>`  <div class="af-field" style="width:258px;max-width:100%">
    <label class="af-label" for="input-${label}">Название · ${label} <span class="af-required">*</span></label>
    <div class="af-input-wrap">
      <span class="af-placeholder-icon" aria-hidden="true"></span>
      <input class="af-input${size?' af-input--'+size:''}" id="input-${label}" required placeholder="Введите название" aria-describedby="input-${label}-help">
      <span class="af-input-hint" aria-hidden="true"></span>
    </div>
    <p class="af-help" id="input-${label}-help">Подсказка к полю</p>
  </div>`).join('\n')}
</div>`},
    {title:'Input без обёртки · размеры S / M / L',description:'Те же размеры доступны обычному input. Обёртка нужна, когда есть иконки; размеры и нативные свойства остаются у поля.',html:`<div class="af-row" style="align-items:flex-start">
${[['sm','S'],['','M'],['lg','L']].map(([size,label])=>`  <div class="af-field" style="width:258px;max-width:100%"><label class="af-label" for="plain-${label}">Название · ${label}</label><input class="af-input${size?' af-input--'+size:''}" id="plain-${label}" value="Сотрудничество · Другое" aria-describedby="plain-${label}-help"><p class="af-help" id="plain-${label}-help">Текст сохраняет полную высоту строки</p></div>`).join('\n')}
</div>`},
    {title:'Input · состояния обёртки',description:'Состояние задаётся на input; граница, фон и значок обёртки обновляются через CSS. aria-invalid имеет приоритет перед success; disabled — перед остальными состояниями. Required и ошибки валидации показаны в полной форме ниже.',html:`<div class="af-stack">
  <div class="af-field"><label class="af-label" for="bad">Поле с ошибкой</label><div class="af-input-wrap"><input class="af-input" id="bad" value="Неверное значение" aria-invalid="true" aria-describedby="bad-help"><span class="af-input-hint" aria-hidden="true"></span></div><p class="af-error" id="bad-help">Проверьте значение</p></div>
  <div class="af-field"><label class="af-label" for="good">Проверенное значение</label><div class="af-input-wrap"><input class="af-input af-input--success" id="good" value="Готово" aria-describedby="good-help"><span class="af-input-hint" aria-hidden="true"></span></div><p class="af-help" id="good-help">Проверка пройдена</p></div>
  <div class="af-field"><label class="af-label" for="read">Только чтение</label><div class="af-input-wrap"><input class="af-input" id="read" value="AF-2026" readonly><span class="af-input-hint" aria-hidden="true"></span></div></div>
  <fieldset disabled><legend>Недоступное поле</legend><div class="af-field"><label class="af-label" for="disabled">Название</label><div class="af-input-wrap"><span class="af-placeholder-icon" aria-hidden="true"></span><input class="af-input" id="disabled" value="Недоступно" aria-describedby="disabled-help"><span class="af-input-hint" aria-hidden="true"></span></div><p class="af-help" id="disabled-help">Disabled наследуется от fieldset</p></div></fieldset>
</div>`},
    {title:'Textarea · текст и счётчик',description:'Исходный вариант из Figma: высота 128 px, текст 16 px / 135%, отступы 12 px. Поле можно растянуть по вертикали. Счётчик обновляется через initComponents; maxlength, ввод и reset остаются нативными. Для программного изменения value отправьте input.',html:`<form class="af-stack">
  <div class="af-field">
    <label class="af-label" for="textarea-demo">Комментарий</label>
    <textarea class="af-textarea" id="textarea-demo" name="comment" maxlength="1000" placeholder="Расскажите о задаче" aria-describedby="textarea-demo-help textarea-demo-count"></textarea>
    <div class="af-field__meta"><p class="af-help" id="textarea-demo-help">До 1000 символов</p><span class="af-field__counter" id="textarea-demo-count" data-af-counter-for="textarea-demo"></span></div>
  </div>
  <div><button class="af-btn af-btn--secondary" type="reset">Сбросить комментарий</button></div>
</form>`,js:'const dispose = Alabuga.initComponents(document.body);\n// После программного изменения value:\n// textarea.dispatchEvent(new Event("input", {bubbles:true}));'},
    {title:'Textarea · состояния',html:`<div class="af-row" style="align-items:flex-start">
  <div class="af-field" style="width:278px;max-width:100%"><label class="af-label" for="textarea-error">Ошибка</label><textarea class="af-textarea" id="textarea-error" aria-invalid="true" aria-describedby="textarea-error-help">Проверьте содержание</textarea><div class="af-field__meta"><p class="af-error" id="textarea-error-help">Уточните комментарий</p></div></div>
  <div class="af-field" style="width:278px;max-width:100%"><label class="af-label" for="textarea-success">Проверенное значение</label><textarea class="af-textarea af-textarea--success" id="textarea-success">Комментарий проверен</textarea></div>
  <div class="af-field" style="width:278px;max-width:100%"><label class="af-label" for="textarea-readonly">Только чтение</label><textarea class="af-textarea" id="textarea-readonly" readonly>Можно выделить и скопировать текст</textarea></div>
  <div class="af-field" style="width:278px;max-width:100%"><label class="af-label" for="textarea-disabled">Недоступно</label><textarea class="af-textarea" id="textarea-disabled" disabled>Редактирование недоступно</textarea></div>
</div>`},
    {title:'Switch · OFF / ON и disabled',description:'Один размер из Figma: 44×24 px, ползунок 20 px с отступом 2 px, подпись 16 px. Наведите указатель на переключатель или подпись. Tab/Space, checked, disabled, FormData и reset работают нативно, без JS.',html:`<form class="af-stack">
  <label class="af-check"><input class="af-switch" type="checkbox" role="switch" name="notifications" value="yes"> Уведомления</label>
  <label class="af-check"><input class="af-switch" type="checkbox" role="switch" name="autosave" value="yes" checked> Автосохранение</label>
  <fieldset disabled><legend>Недоступные переключатели</legend><div class="af-stack">
    <label class="af-check"><input class="af-switch" type="checkbox" role="switch"> Disabled · OFF</label>
    <label class="af-check"><input class="af-switch" type="checkbox" role="switch" checked> Disabled · ON</label>
  </div></fieldset>
  <div><button class="af-btn af-btn--secondary" type="reset">Сбросить переключатели</button></div>
</form>`},
    {title:'Checkbox и Radio · размеры S / M / L',description:'Фирменное оформление работает только через CSS. Сохраняются настоящие input, checked, required, disabled, name, FormData и reset. Размер значка S/M/L — 16/20/24 px; подпись — 12/14/16 px. Область нажатия подписи не ниже 32 px.',html:`<div class="af-stack">
  <div class="af-row">
    <label class="af-check"><input class="af-checkbox af-checkbox--sm" type="checkbox" checked> Checkbox S</label>
    <label class="af-check"><input class="af-checkbox" type="checkbox" checked> Checkbox M</label>
    <label class="af-check"><input class="af-checkbox af-checkbox--lg" type="checkbox" checked> Checkbox L</label>
  </div>
  <fieldset><legend>Radio · S</legend><div class="af-row"><label class="af-check"><input class="af-radio af-radio--sm" type="radio" name="size-s" value="page" checked> Страница</label><label class="af-check"><input class="af-radio af-radio--sm" type="radio" name="size-s" value="slides"> Презентация</label></div></fieldset>
  <fieldset><legend>Radio · M</legend><div class="af-row"><label class="af-check"><input class="af-radio" type="radio" name="size-m" value="page" checked> Страница</label><label class="af-check"><input class="af-radio" type="radio" name="size-m" value="slides"> Презентация</label></div></fieldset>
  <fieldset><legend>Radio · L</legend><div class="af-row"><label class="af-check"><input class="af-radio af-radio--lg" type="radio" name="size-l" value="page" checked> Страница</label><label class="af-check"><input class="af-radio af-radio--lg" type="radio" name="size-l" value="slides"> Презентация</label></div></fieldset>
</div>`},
    {title:'Checkbox и Radio · состояния',description:'Наведите указатель или нажмите на подпись; используйте Tab, Space и стрелки для radio. Disabled наследуется от fieldset. Частичный выбор — нативное свойство indeterminate, расширение для HTML; оно не заменяет Loading из Figma.',enhancement:'choices',html:`<form class="af-stack">
  <label class="af-check"><input class="af-checkbox" type="checkbox" name="notifications" checked> Получать уведомления</label>
  <label class="af-check"><input class="af-checkbox" type="checkbox" id="choice-mixed"> Частичный выбор</label>
  <fieldset disabled><legend>Недоступные действия</legend><div class="af-row">
    <label class="af-check"><input class="af-checkbox" type="checkbox"> Не выбрано</label>
    <label class="af-check"><input class="af-checkbox" type="checkbox" checked> Выбрано</label>
    <label class="af-check"><input class="af-radio" type="radio" name="disabled-choice" checked> Первый</label>
    <label class="af-check"><input class="af-radio" type="radio" name="disabled-choice"> Второй</label>
  </div></fieldset>
  <div><button class="af-btn af-btn--secondary" type="reset">Сбросить выбор</button></div>
</form>`,js:'document.querySelector("#choice-mixed").indeterminate = true;'},
    {title:'Элементы выбора в форме',html:`<div class="af-stack">
  <label class="af-check"><input class="af-checkbox" type="checkbox" checked> Включить уведомления</label>
  <fieldset><legend>Формат документа</legend><div class="af-row"><label class="af-check"><input class="af-radio" type="radio" name="format" checked> Страница</label><label class="af-check"><input class="af-radio" type="radio" name="format"> Презентация</label></div></fieldset>
  <label class="af-check"><input class="af-switch" type="checkbox" role="switch" checked> Автосохранение</label>
</div>`},
    {title:'Форма целиком',enhancement:'form',html:formMarkup,js:`const dispose = Alabuga.initComponents(document.body);
document.querySelector('form').addEventListener('af:submit', event => {
  document.querySelector('#form-success').hidden = false;
  // event.detail — FormData. Отправку подключает приложение.
});
// Перед удалением формы: dispose();`},
    {id:'datepicker',title:'DatePicker · дата встречи',description:'Введите ДД.ММ.ГГГГ или выберите дату в календаре и нажмите «Подтвердить». В форму передаётся YYYY-MM-DD; min/max задают доступный период.',collapseCode:true,enhancement:'date-form',html:`<form class="af-stack" data-af-validate id="meeting-date-form">
  <div class="af-field" style="width:280px;max-width:100%">
    <label class="af-label" for="meeting-date">Дата встречи <span class="af-required">*</span></label>
    <input class="af-input af-input--lg af-datepicker" type="date" id="meeting-date" name="meetingDate" value="2026-10-22" min="2026-10-01" max="2026-12-31" required aria-describedby="meeting-date-help meeting-date-error">
    <p class="af-help" id="meeting-date-help">С 1 октября по 31 декабря 2026 года</p>
    <p class="af-error" id="meeting-date-error" data-af-error-for="meeting-date" hidden></p>
  </div>
  <div class="af-row"><button class="af-btn" type="submit">Запланировать встречу</button><button class="af-btn af-btn--secondary" type="reset">Сбросить</button></div>
  <p class="af-help" id="meeting-date-result" role="status">Выберите дату и запланируйте встречу. Данные остаются в браузере.</p>
</form>`,js:`const dispose = Alabuga.initComponents(document.body);
document.querySelector('#meeting-date-form').addEventListener('af:submit', event => {
  const isoDate = event.detail.get('meetingDate');
  document.querySelector('#meeting-date-result').textContent = 'Встреча запланирована: ' + isoDate;
});
// Перед удалением формы: dispose();`},
    {id:'datepicker-states',title:'DatePicker · состояния',description:'Пустое, заполненное, ошибка, успех, disabled и readonly. Наведение и фокус проверьте мышью и клавишей Tab.',collapseCode:true,html:`<div class="af-row" style="align-items:flex-start">
${[
  ['empty','Без значения',''],
  ['filled','Заполнено','value="2026-09-10"'],
  ['error','Ошибка','value="2026-09-10" aria-invalid="true"'],
  ['success','Успех','value="2026-09-10"'],
  ['disabled','Недоступно','value="2026-09-10" disabled'],
  ['readonly','Только чтение','value="2026-09-10" readonly'],
].map(([state,label,attrs])=>`  <div class="af-field" style="width:280px;max-width:100%">
    <label class="af-label" for="date-${state}">${label}</label>
    <input class="af-input af-input--lg af-datepicker${state==='success'?' af-input--success':''}" type="date" id="date-${state}" ${attrs}>
  </div>`).join('\n')}
</div>`,js:'const dispose = Alabuga.initComponents(document.body);'},
    {id:'option-button',title:'Option-btn · выбор форматов',description:'Нативные checkbox сохраняют несколько выбранных форматов. Для единственного выбора используйте radio с общим name.',collapseCode:true,html:`<form class="af-stack">
  <div class="af-row" role="group" aria-label="Форматы экспорта">
    <label class="af-option"><input class="af-option__input" type="checkbox" name="format" value="pdf" checked><span class="af-option__label">PDF</span></label>
    <label class="af-option"><input class="af-option__input" type="checkbox" name="format" value="docx"><span class="af-option__label">DOCX</span></label>
    <label class="af-option"><input class="af-option__input" type="checkbox" name="format" value="xlsx" disabled><span class="af-option__label">XLSX</span></label>
  </div>
  <button class="af-btn af-btn--secondary" type="reset">Сбросить форматы</button>
</form>`},
    {id:'multi-switch',title:'Multi-switch · S/M/L',description:'Переключение представления: стрелки выбирают соседний вариант, Tab переходит к группе. Состояние, FormData и reset обеспечивает нативная radio-группа.',collapseCode:true,html:`<form class="af-stack">
${[
  ['sm','S · 32 px','af-multi-switch--sm'],
  ['md','M · 40 px',''],
  ['lg','L · 48 px','af-multi-switch--lg'],
  ['disabled','Недоступно',''],
].map(([size,label,modifier])=>`  <div class="af-stack" style="gap:8px">
    <span class="af-caption">${label}</span>
    <fieldset class="af-multi-switch ${modifier}"${size==='disabled'?' disabled':''}>
      <legend class="af-sr-only">Представление · ${label}</legend>
${[['list','Список'],['grid','Сетка'],['table','Таблица']].map(([value,text],index)=>`      <label class="af-option"><input class="af-option__input" type="radio" name="view-${size}" value="${value}"${index===0?' checked':''}><span class="af-option__label">${text}</span></label>`).join('\n')}
    </fieldset>
  </div>`).join('\n')}
  <button class="af-btn af-btn--secondary" type="reset">Сбросить представление</button>
</form>`},
  ],
  feedback:[{title:'Уведомления',description:'По умолчанию цвета соответствуют эталону. Для повышенного контраста добавьте af-alert--accessible. Статичные подсказки не объявляются как срочные сообщения; для динамического результата используйте role="status".',html:`<div class="af-stack">
  <div class="af-alert af-alert--info">Информация: новая версия доступна.</div>
  <div class="af-alert af-alert--success"><img src="assets/success.svg" width="20" height="20" alt="">Готово: изменения сохранены.<button class="af-alert__close" type="button" data-af-dismiss aria-label="Закрыть уведомление"><img src="assets/close.svg" width="24" height="24" alt=""></button></div>
  <div class="af-alert af-alert--warning">Внимание: проверьте содержимое перед публикацией.</div>
  <div class="af-alert af-alert--danger">Ошибка: документ не прошёл проверку.</div>
</div>`,js:'Alabuga.initComponents(document.body);'},
    {title:'Бейджи',html:`<div class="af-row"><span class="af-badge">В работе</span><span class="af-badge af-badge--success">Готово</span></div>`},
    {id:'chips',title:'Chip · S/M/L и виды',description:'Как в эталоне: столбцы L/M/S (24/20/16 px), строки Info, Success, Warning, Error и Default. Успех показывает галочку, предупреждение и ошибка — восклицательный знак. Для повышенного контраста добавьте af-chip--accessible.',collapseCode:true,html:`<div style="display:grid;grid-template-columns:repeat(3,max-content);gap:10px 8px;align-items:center">
  <span class="af-caption">L · 24 px</span><span class="af-caption">M · 20 px</span><span class="af-caption">S · 16 px</span>
${[['info','Информация'],['success','Успех'],['warning','Предупреждение'],['error','Ошибка'],['default','Обычная']].flatMap(([view,label])=>[['lg','af-chip--lg'],['md',''],['sm','af-chip--sm']].map(([size,modifier])=>`  <span class="af-chip ${modifier} af-chip--${view}"><span class="af-chip__icon" aria-hidden="true"></span><span class="af-chip__text">Text</span><button class="af-chip__remove" type="button" data-af-dismiss aria-label="Удалить метку ${label} · ${size}"></button></span>`)).join('\n')}
</div>`,js:'const dispose = Alabuga.initComponents(document.body);'},
    {id:'alert-sizes',title:'Alert · S/M/L и виды',description:'Высота одной строки — 32/40/48 px. Длинный текст переносится. Для динамического результата задайте role="status", для срочной ошибки — role="alert".',collapseCode:true,html:`<div class="af-row" style="align-items:flex-start">
${[['lg','L · 48 px','af-alert--lg',292],['md','M · 40 px','',263],['sm','S · 32 px','af-alert--sm',230]].map(([size,label,modifier,width])=>`  <div class="af-stack" style="width:${width}px;max-width:100%;gap:10px">
    <span class="af-caption">${label}</span>
${[['info','Новые материалы'],['success','Изменения сохранены'],['warning','Проверьте данные'],['error','Ошибка отправки'],['default','Без изменений']].map(([view,text])=>`    <div class="af-alert ${modifier} af-alert--${view}"><span class="af-alert__icon" aria-hidden="true"></span><span class="af-alert__text">${text}</span><button class="af-alert__close" type="button" data-af-dismiss aria-label="Закрыть ${text} · ${size}"></button></div>`).join('\n')}
  </div>`).join('\n')}
</div>`,js:'const dispose = Alabuga.initComponents(document.body);'}],
  dialog:[{title:'Диалог с возвратом фокуса',description:'Открытие через showModal(), закрытие кнопкой или Escape. После закрытия фокус возвращается к кнопке открытия.',html:`<button class="af-btn" type="button" data-af-dialog-open="example-dialog">Открыть диалог</button>
<dialog class="af-dialog" id="example-dialog" aria-labelledby="example-dialog-title">
  <h2 class="af-title" id="example-dialog-title">Сохранить изменения?</h2>
  <p>Документ останется доступен для следующего редактирования.</p>
  <div class="af-row"><button class="af-btn af-btn--secondary" data-af-dialog-close>Отмена</button><button class="af-btn" data-af-dialog-close>Подтвердить</button></div>
</dialog>`,js:'const dispose = Alabuga.initComponents(document.body);'},
    {id:'dialog-slots',title:'Dialog · заголовок, содержимое и действия',description:'Компактный вариант шириной 350 px с отступом 16 px. Кнопка закрытия и Escape возвращают фокус к открывшему действию.',collapseCode:true,html:`<button class="af-btn" type="button" data-af-dialog-open="review-dialog">Отправить на согласование</button>
<dialog class="af-dialog af-dialog--compact" id="review-dialog" aria-labelledby="review-dialog-title" aria-describedby="review-dialog-description">
  <div class="af-dialog__header">
    <h2 class="af-dialog__title" id="review-dialog-title">Согласование</h2>
    <button class="af-dialog__close" type="button" data-af-dialog-close aria-label="Закрыть согласование"></button>
  </div>
  <p class="af-dialog__body" id="review-dialog-description">Информация для пользователя</p>
  <div class="af-dialog__actions">
    <button class="af-btn af-btn--secondary" type="button" data-af-dialog-close>Отмена</button>
    <button class="af-btn" type="button" data-af-dialog-close>Подтвердить</button>
  </div>
</dialog>`,js:'const dispose = Alabuga.initComponents(document.body);'}],
  typography:[{title:'Display, Heading и Title',description:'Компонентная шкала Figma. Межбуквенный интервал — 0. Title M использует Regular, а Title L — Medium. Стандартный Display — 44 px; в мобильных page-документах сохранено отдельное правило 36 px. Fitted-презентации используют собственную шкалу.',html:`<div class="af-stack">
  <p class="af-display">Display L · 44 / 100%</p>
  <h2 class="af-heading">Heading H1 · 32 / 100%</h2>
  <h3 class="af-heading af-heading--2">Heading H2 · 28 / 120%</h3>
  <h4 class="af-heading af-heading--3">Heading H3 · 24 / 120%</h4>
  <p class="af-title">Title L · 22 / 120%</p>
  <p class="af-title af-title--md">Title M · 16 / 150%</p>
</div>`},{title:'Body и Label',description:'Размер задаётся модификатором вместе с базовым классом. Body по умолчанию L (16 px), Label — M (14 px). XS/XXS предназначены для вспомогательных подписей, основной текст остаётся 14–16 px. Полная высота строки сохраняет нижние элементы букв; поля af-field задают свои размеры подписей.',html:`<div class="af-stack">
  <p class="af-body">Body L · 16 / 135% · Сотрудничество, Другое, gypq</p>
  <p class="af-body af-body--md">Body M · 14 / 140% · Сотрудничество, Другое, gypq</p>
  <p class="af-body af-body--sm">Body S · 12 / 135% · Дополнительные сведения</p>
  <p class="af-body af-body--xs">Body XS · 10 / 135% · Вспомогательная подпись</p>
  <p class="af-body af-body--xxs">Body XXS · 8 / 135% · Компактная служебная подпись</p>
  <p class="af-label af-label--lg">Label L · 16 / 130% · Medium</p>
  <p class="af-label">Label M · 14 / 130% · Medium</p>
  <p class="af-label af-label--sm">Label S · 12 / 130% · Medium</p>
  <p class="af-label af-label--xs">Label XS · 10 / 130% · Medium</p>
</div>`},{title:'Список · залитый ромб',description:'Основной маркер Bullet из Figma, 33×33 px. Пример задач подготовки деловой встречи. Список выровнен слева; переносы начинаются под текстом, промежуток до маркера — 12 px. role="list" сохраняет семантику в Safari.',html:`<ul class="af-list" role="list">
  <li>Согласовать дату и время с участниками.</li>
  <li>Забронировать переговорную и отправить приглашение с адресом, программой встречи и контактами организатора.</li>
</ul>`},{id:'list-outline',title:'Список · контурный ромб',description:'Модификатор af-list--outline. Пример материалов, которые нужно подготовить для участников встречи.',html:`<ul class="af-list af-list--outline" role="list">
  <li>Программа встречи.</li>
  <li>Схема проезда и расположение переговорной.</li>
  <li>Презентация для обсуждения.</li>
</ul>`},{id:'list-triangle',title:'Список · фирменный треугольник',description:'Модификатор af-list--triangle. Пример проверок перед началом встречи.',html:`<ul class="af-list af-list--triangle" role="list">
  <li>Проверить проектор и звук.</li>
  <li>Подготовить бейджи и разложить материалы.</li>
  <li>Встретить участников у стойки регистрации.</li>
</ul>`},{id:'list-ordered',title:'Нумерованный список',description:'Обычная нумерация браузера с оформлением af-list. Пример порядка проведения встречи. HTML-атрибуты start и value позволяют продолжить нумерацию.',html:`<ol class="af-list">
  <li>Представить участников и согласовать повестку.</li>
  <li>Обсудить вопросы и зафиксировать решения.</li>
  <li>Назначить ответственных и сроки выполнения.</li>
</ol>`},{id:'example-3',title:'Дополнительные стили Framework · буквица и разделитель',description:'Эти приёмы существовали в первоначальной реализации Framework. В проверенных материалах Figma и приложенных правилах их источник не подтверждён: буквица — CSS-оформление первой буквы, обычный разделитель — линия, декоративный — CSS-орнамент. Это необязательные расширения, которые не входят в подтверждённый набор компонентов Figma.',html:`<div class="af-prose">
  <p class="af-dropcap">Каждый документ начинается с содержания. Единая типографика помогает видеть главное и сохранять спокойный ритм чтения.</p>
  <hr class="af-divider af-divider--ornament">
  <aside class="af-alert af-alert--info af-alert--accessible">Важную мысль можно вынести в отдельную вставку.</aside>
</div>`}],
  surfaces:[
    {id:'outer-inner',title:'Внешний и внутренние блоки',description:'Правило из Figma и PDF: внешний блок — padding/radius 32 px, внутренний — 16 px, gap — 16 px. Явные размеры сохраняются на телефоне. Классы реализуют правило средствами CSS; отдельного семейства Card в проверенном макете нет. Нейтральная рамка 1 px у варианта без выделения сохранена от существующего af-card.',html:`<section class="af-card af-card--outer" aria-labelledby="meeting-materials">
  <h3 class="af-title" id="meeting-materials">Материалы встречи</h3>
  <p class="af-body">Подготовьте программу и контактную информацию для участников.</p>
  <section class="af-card af-card--inner" aria-labelledby="meeting-agenda">
    <h4 class="af-title af-title--md" id="meeting-agenda">Программа</h4>
    <p class="af-body">Знакомство, обсуждение вопросов и согласование следующих шагов.</p>
  </section>
  <section class="af-card af-card--inner" aria-labelledby="meeting-location">
    <h4 class="af-title af-title--md" id="meeting-location">Место и время</h4>
    <p class="af-body">Укажите адрес, переговорную и время начала в приглашении.</p>
  </section>
</section>`},
    {id:'filled',title:'Выделение · заливка',description:'Синяя заливка из Figma без дополнительной обводки и тени. Текст наследует белый цвет. Вложенные компоненты сохраняют собственное оформление; для белой CTA-кнопки явно задан af-btn--inverse.',html:`<section class="af-card af-card--outer af-card--filled" aria-labelledby="meeting-registration">
  <h3 class="af-title" id="meeting-registration">Регистрация на встречу</h3>
  <p class="af-body">Ознакомьтесь с программой и подготовьте вопросы для обсуждения.</p>
  <div class="af-row"><a class="af-btn af-btn--inverse" href="#surfaces/outer-inner">Материалы встречи</a></div>
</section>`},
    {id:'outline',title:'Выделение · обводка 2 px',description:'Разрешённая правилами обводка 2 px. Белая поверхность и обычный цвет текста; тень отключена. Выбирайте один способ выделения для каждого объекта.',html:`<section class="af-card af-card--outer af-card--outline" aria-labelledby="meeting-topics">
  <h3 class="af-title" id="meeting-topics">Повестка встречи</h3>
  <p class="af-body">Согласуйте вопросы заранее, чтобы участники успели подготовиться.</p>
  <a class="af-link af-link--inline" href="#surfaces/outer-inner">Посмотреть материалы</a>
</section>`},
    {id:'outline-thick',title:'Выделение · обводка 3 px',description:'Обводка 3 px показана в иллюстрации Figma. Геометрия внешнего блока сохраняется: радиус и padding 32 px, промежутки 16 px.',html:`<section class="af-card af-card--outer af-card--outline-thick" aria-labelledby="meeting-documents">
  <h3 class="af-title" id="meeting-documents">Документы для участников</h3>
  <p class="af-body">Программа, презентация и список вопросов для обсуждения.</p>
  <p class="af-caption">Проверьте доступ к файлам перед отправкой приглашений.</p>
</section>`},
    {id:'elevated',title:'Выделение · тень',description:'Исходная тень Figma: x=0, y=2 px, blur=3 px, spread=0, цвет neutral/300. Дополнительная обводка отключена. В системной высокой контрастности тень заменяется видимой системной границей.',html:`<section class="af-card af-card--outer af-card--elevated" aria-labelledby="meeting-contact">
  <h3 class="af-title" id="meeting-contact">Контакты организатора</h3>
  <p class="af-body">Уточните программу, время начала и порядок участия.</p>
  <a class="af-link af-link--inline" href="mailto:events@example.org">events@example.org</a>
</section>`},
  ],
  navigation:[{id:'breadcrumbs',title:'Breadcrumbs · путь к разделу',description:'Навигация по иерархии: текущий раздел помечен aria-current="page". Длинный путь переносится на узком экране.',collapseCode:true,html:`<nav class="af-breadcrumbs" aria-label="Навигационная цепочка">
  <ol>
    <li><a class="af-link" href="#start">Главная</a></li>
    <li><a class="af-link" href="#widgets">Виджеты</a></li>
    <li><span aria-current="page">Календарь</span></li>
  </ol>
</nav>`},
    {id:'active-link',title:'Link · текущий раздел',description:'aria-current отмечает текущую страницу. Наведение и клавиатурный фокус сохраняют обычное поведение ссылки.',html:`<div class="af-row">
  <a class="af-link" href="#navigation" aria-current="page">Навигация</a>
  <a class="af-link" href="#forms">Формы и выбор</a>
</div>`}],
  grid:[{title:'Панель 12 колонок',description:'Позиция и размеры задаются в единицах родительской сетки. Меняйте размер — содержимое остаётся в документе.',enhancement:'panel',html:`<div id="panel-example"></div>`,js:`const controller = Alabuga.renderDocument(
  document.querySelector('#panel-example'), documentData
);
// documentData — проверенный документ schemaVersion: 1.
// controller.update(nextDocument); controller.destroy();`}],
  icons:[
    {id:'icon-catalog',title:'Иконки · S/M/L',description:'Именованные иконки: S — 16, M — 20, L — 24 px. По умолчанию M. Цвет одноцветных значков наследуется от текста; загрузка сохраняет исходные два цвета. Все SVG встроены в CSS.',collapseCode:true,html:`<div style="display:grid;grid-template-columns:minmax(0,1fr) repeat(3,36px);gap:12px 8px;align-items:center;max-width:400px">
  <span class="af-caption">Значок</span><span class="af-caption">S · 16</span><span class="af-caption">M · 20</span><span class="af-caption">L · 24</span>
${[['info','Информация'],['success','Успех'],['error','Ошибка'],['expand','Развернуть'],['collapse','Свернуть'],['previous','Назад'],['next','Вперёд'],['calendar','Календарь'],['close','Закрыть'],['loading','Загрузка'],['loading-white','На тёмном']].map(([name,label])=>`  <span>${label}</span>${['sm','md','lg'].map(size=>`<span style="display:grid;place-items:center;width:36px;height:36px;${name==='loading-white'?'background:var(--af-color-brand-deep);border-radius:4px':''}"><span class="af-icon af-icon--${name} af-icon--${size}" aria-hidden="true"></span></span>`).join('')}`).join('\n')}
</div>`},
    {id:'icon-usage',title:'Иконки в тексте и кнопках',description:'Рядом с текстом значок скрыт от скринридера. Кнопка без текста получает aria-label. Внутри af-btn__icon размер задаёт кнопка, включая исключение Round Secondary L — 20 px.',collapseCode:true,html:`<div class="af-stack">
  <div class="af-row"><span class="af-icon af-icon--success" aria-hidden="true"></span><span>Документ сохранён</span></div>
  <div class="af-row">
    <a class="af-btn af-btn--sm" href="#forms/datepicker"><span class="af-btn__icon af-icon af-icon--calendar" aria-hidden="true"></span>Выбрать дату</a>
    <button class="af-btn af-btn--secondary" type="button" data-af-dialog-open="icon-info-dialog"><span class="af-btn__icon af-icon af-icon--info" aria-hidden="true"></span>Подробнее</button>
    <a class="af-btn af-btn--icon af-btn--round af-btn--secondary af-btn--lg" href="#navigation" aria-label="Перейти к навигации"><span class="af-btn__icon af-icon af-icon--next" aria-hidden="true"></span></a>
  </div>
  <div class="af-row" role="status"><span class="af-icon af-icon--loading" aria-hidden="true"></span><span>Подготовка документа</span></div>
</div>
<dialog class="af-dialog af-dialog--compact" id="icon-info-dialog" aria-labelledby="icon-info-title">
  <div class="af-dialog__header"><h2 class="af-dialog__title" id="icon-info-title">Информация</h2><button class="af-dialog__close" type="button" data-af-dialog-close aria-label="Закрыть информацию"></button></div>
  <p class="af-dialog__body">Документ сохранён и доступен для дальнейшего редактирования.</p>
  <div class="af-dialog__actions"><button class="af-btn" type="button" data-af-dialog-close>Понятно</button></div>
</dialog>`,js:'Alabuga.initComponents(document.body);'},
    {id:'icon-sources',title:'Исходники и покрытие',description:'Для Info, Success, Error, Expand, Collapse и двух вариантов Loading сохранены отдельные SVG 16/20/24 px. У Calendar и Close исходник 24 px, у Previous/Next — 20 px: остальные размеры масштабируют этот SVG, не меняя файл. Help, CancelRound и остальные недостающие исходники не подменяются похожими значками.',html:`<p class="af-body">Контейнер <code>af-icon</code> без именованного значка сохраняет прежние 24 px и поддерживает вложенные изображения. Классы <code>af-icon--sm</code>, <code>af-icon--md</code>, <code>af-icon--lg</code> задают слот 16/20/24 px. Для своего SVG используйте этот контейнер, сохраняя пропорции изображения.</p>`}
  ],
  widgets:[{id:'calendar-input',title:'Календарь · поле ввода S/M/L',description:'Стандартные размеры: S — 32, M — 40, L — 48 px. Введите ДД.ММ.ГГГГ или выберите дату в календаре и подтвердите.',collapseCode:true,html:`<div class="af-row" id="calendar-input-example" style="align-items:flex-start">
${[
  ['sm','S · 32 px','af-input--sm'],
  ['md','M · 40 px',''],
  ['lg','L · 48 px','af-input--lg'],
].map(([size,label,modifier])=>`  <div class="af-field" style="width:280px;max-width:100%">
    <label class="af-label" for="calendar-date${size==='lg'?'':'-'+size}">Дата события · ${label}</label>
    <input class="af-input ${modifier} af-datepicker" type="date"
      id="calendar-date${size==='lg'?'':'-'+size}" name="calendarDate-${size}" value="2026-09-10">
  </div>`).join('\n')}
</div>`,js:`const host = document.querySelector('#calendar-input-example');
const dispose = Alabuga.initComponents(host);
// Перед удалением поля: dispose();`},
    {id:'example-0',title:'Календарь',description:'Компактный Calendar по приложенному эталону: 250 px, дни 32×32 px, неактивные соседние даты и выбор без подтверждения. Стрелки перемещают фокус; Home/End — к понедельнику/воскресенью, Page Up/Down — по месяцам, с Shift — по годам. Щелчок, Enter или пробел выбирают день. В примерах используется реальный календарь: в сентябре 30 дней.',enhancement:'calendar-component',calendarDate:'2026-09-10',html:'<div id="calendar-example"></div>\n<p class="af-caption" id="calendar-selection" role="status">Выбрано: 2026-09-10</p>'},
    {id:'example-1',title:'Таблица данных',description:'Сортировка по нажатию на заголовок, локальная пагинация, пустое состояние и горизонтальная прокрутка.',enhancement:'table',html:'<div id="table-example"></div>',js:`// type: 'table', columns: [{key:'name',label:'Название'}],
// rows: [{name:'Первый элемент'}], pageSize: 5.
// Точный документ доступен в контрольном примере панели.`},
    {id:'calendar-empty',title:'Календарь · без выбранной даты',description:'Вариант с кнопками «Отмена» и «Подтвердить». День сначала выбирается в черновике; подпись обновляется после подтверждения. Если день ещё не выбран, «Подтвердить» принимает дату фокуса. Отмена или Escape возвращают исходное значение.',enhancement:'calendar-component',calendarDate:'2026-09-10',calendarOptions:{confirm:true,value:null},html:'<div id="calendar-empty-example"></div>\n<p class="af-caption" id="calendar-empty-selection" role="status">Дата не выбрана</p>'},
    {id:'calendar-confirm',title:'Календарь · подтверждение даты',description:'Выбрано 10 сентября. Измените день: синяя ячейка показывает черновик, а подпись сохраняет подтверждённую дату. «Подтвердить» применяет выбор, «Отмена» или Escape возвращают его к последнему подтверждённому значению.',enhancement:'calendar-component',calendarDate:'2026-09-10',calendarOptions:{confirm:true},html:'<div id="calendar-confirm-example"></div>\n<p class="af-caption" id="calendar-confirm-selection" role="status">Выбрано: 2026-09-10</p>'},
    {id:'calendar-range',title:'Календарь · диапазон',description:'Период 10–17 сентября: начало со светлой заливкой, середина с верхней/нижней линией, конец с синей заливкой. Два щелчка задают новый период, в том числе через месяц; обратный выбор упорядочивается. Подтверждение доступно после выбора обоих концов.',enhancement:'calendar-component',calendarDate:'2026-09-10',calendarOptions:{mode:'range',confirm:true,value:{start:'2026-09-10',end:'2026-09-17'}},html:'<div id="calendar-range-example"></div>\n<p class="af-caption" id="calendar-range-selection" role="status">Выбрано: 2026-09-10 — 2026-09-17</p>'},
    {id:'calendar-leap-year',title:'Календарь · конец месяца и високосный год',description:'Начните с 31 января 2024 года: Page Down переведёт фокус на 29 февраля, Shift + Page Down — на 28 февраля 2025 года. Выбор остаётся на 31 января, пока вы не нажмёте Enter или пробел. Каждый календарь хранит свой выбор независимо.',enhancement:'calendar-component',calendarDate:'2024-01-31',html:'<div id="calendar-leap-example"></div>\n<p class="af-caption" id="calendar-leap-selection" role="status">Выбрано: 2024-01-31</p>'},
    {id:'calendar-document',title:'Календарь в документе',description:'Существующий виджет calendar использует тот же компактный календарь с немедленным выбором. Контейнер отправляет af:change, а controller.getDocument() сохраняет дату. Схема документа не меняется; подтверждение и диапазон подключаются отдельно через renderCalendar.',enhancement:'calendar',calendarDate:'2026-09-10',html:'<div id="calendar-document-example"></div>\n<p class="af-caption" id="calendar-document-selection" role="status">Выбрано: 2026-09-10</p>'}],
};
