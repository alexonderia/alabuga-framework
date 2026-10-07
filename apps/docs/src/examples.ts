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
    <select class="af-select" id="topic" name="topic"><option>Сотрудничество</option><option>Обучение</option><option>Другое</option></select>
  </div>
  <div class="af-field">
    <label class="af-label" for="message">Комментарий</label>
    <textarea class="af-textarea" id="message" name="message" maxlength="1000" placeholder="Расскажите о задаче"></textarea>
    <p class="af-help">До 1000 символов</p>
  </div>
  <label class="af-check"><input class="af-checkbox" type="checkbox" name="consent" id="consent" required aria-describedby="consent-error"> Согласен на обработку данных</label>
  <p class="af-error" id="consent-error" data-af-error-for="consent" hidden></p>
  <div class="af-row"><button class="af-btn af-btn--lg" type="submit">Отправить заявку</button><button class="af-btn af-btn--ghost" type="button" data-af-dialog-open="details">Подробности</button></div>
</form>
<p class="af-alert af-alert--success" id="form-success" role="status" hidden>Проверка пройдена. Демонстрационная форма ничего не отправляет.</p>
<dialog class="af-dialog" id="details" aria-labelledby="dialog-title">
  <h2 class="af-title" id="dialog-title">Перед отправкой</h2>
  <p>Это пример формы. Данные остаются в браузере.</p>
  <button class="af-btn" type="button" data-af-dialog-close>Понятно</button>
</dialog>`;

export type Example = { title:string; description?:string; html:string; js?:string; enhancement?:'form'|'panel'|'calendar'|'table'|'slides' };
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
    {title:'Состояния',description:'Наведение и нажатие работают через CSS. Клавиатурный фокус появляется при Tab. Загрузка сохраняет текстовую подпись.',html:`<div class="af-row">
  <button class="af-btn" aria-pressed="true">Выбрано</button>
  <button class="af-btn" disabled>Недоступно</button>
  <button class="af-btn" aria-busy="true" disabled>Сохраняем</button>
</div>`},
  ],
  forms:[
    {title:'Поле с иконкой',description:'Геометрия из Figma: высота L — 48 px, радиус — 8 px, промежуток — 12 px. SVG сохранён локально из рабочей копии.',html:`<div class="af-field">
  <label class="af-label" for="sample-name">Название <span class="af-required">*</span></label>
  <div class="af-input-wrap">
    <span class="af-placeholder-icon" aria-hidden="true"></span>
    <input class="af-input af-input--lg" id="sample-name" required placeholder="Введите название" aria-describedby="sample-help">
    <img src="assets/info.svg" width="24" height="24" alt="">
  </div>
  <p class="af-help" id="sample-help">Подсказка к полю</p>
</div>`},
    {title:'Ошибка, успех и чтение',html:`<div class="af-stack">
  <div class="af-field"><label class="af-label" for="bad">Поле с ошибкой</label><input class="af-input" id="bad" value="Неверное значение" aria-invalid="true" aria-describedby="bad-help"><p class="af-error" id="bad-help">Проверьте значение</p></div>
  <div class="af-field"><label class="af-label" for="good">Проверенное значение</label><input class="af-input af-input--success" id="good" value="Готово"><p class="af-help">Проверка пройдена</p></div>
  <div class="af-field"><label class="af-label" for="read">Только чтение</label><input class="af-input" id="read" value="AF-2026" readonly></div>
  <div class="af-field"><label class="af-label" for="disabled">Недоступное поле</label><input class="af-input" id="disabled" value="Недоступно" disabled></div>
</div>`},
    {title:'Элементы выбора',html:`<div class="af-stack">
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
  ],
  feedback:[{title:'Уведомления',description:'Более тёмный текст обеспечивает читаемость. Статичные подсказки не объявляются как срочные сообщения; для динамического результата используйте role="status".',html:`<div class="af-stack">
  <div class="af-alert af-alert--info">Информация: новая версия доступна.</div>
  <div class="af-alert af-alert--success"><img src="assets/success.svg" width="20" height="20" alt="">Готово: изменения сохранены.<button class="af-alert__close" type="button" data-af-dismiss aria-label="Закрыть уведомление"><img src="assets/close.svg" width="24" height="24" alt=""></button></div>
  <div class="af-alert af-alert--warning">Внимание: проверьте содержимое перед публикацией.</div>
  <div class="af-alert af-alert--danger">Ошибка: документ не прошёл проверку.</div>
</div>`,js:'Alabuga.initComponents(document.body);'},
    {title:'Бейджи',html:`<div class="af-row"><span class="af-badge">В работе</span><span class="af-badge af-badge--success">Готово</span></div>`}],
  dialog:[{title:'Диалог с возвратом фокуса',description:'Открытие через showModal(), закрытие кнопкой или Escape. После закрытия фокус возвращается к кнопке открытия.',html:`<button class="af-btn" type="button" data-af-dialog-open="example-dialog">Открыть диалог</button>
<dialog class="af-dialog" id="example-dialog" aria-labelledby="example-dialog-title">
  <h2 class="af-title" id="example-dialog-title">Сохранить изменения?</h2>
  <p>Документ останется доступен для следующего редактирования.</p>
  <div class="af-row"><button class="af-btn af-btn--secondary" data-af-dialog-close>Отмена</button><button class="af-btn" data-af-dialog-close>Подтвердить</button></div>
</dialog>`,js:'const dispose = Alabuga.initComponents(document.body);'}],
  typography:[{title:'Иерархия',html:`<div class="af-stack">
  <p class="af-display">Заголовок дисплея</p>
  <h2 class="af-heading">Основной заголовок</h2>
  <h3 class="af-heading--2">Раздел документа</h3>
  <p class="af-title">Название блока</p>
  <p>Основной текст. Alabuga Sans Regular, 16 px.</p>
  <p class="af-caption">Подпись и дополнительная информация.</p>
</div>`},{title:'Буквица, список и разделитель',html:`<div class="af-prose">
  <p class="af-dropcap">Каждый документ начинается с содержания. Единая типографика помогает видеть главное и сохранять спокойный ритм чтения.</p>
  <ul class="af-list"><li>Первый важный пункт</li><li>Второй важный пункт</li></ul>
  <hr class="af-divider af-divider--ornament">
  <aside class="af-alert af-alert--info">Важную мысль можно вынести в отдельную вставку.</aside>
</div>`}],
  grid:[{title:'Панель 12 колонок',description:'Позиция и размеры задаются в единицах родительской сетки. Меняйте размер — содержимое остаётся в документе.',enhancement:'panel',html:`<div id="panel-example"></div>`,js:`const controller = Alabuga.renderDocument(
  document.querySelector('#panel-example'), documentData
);
// documentData — проверенный документ schemaVersion: 1.
// controller.update(nextDocument); controller.destroy();`}],
  widgets:[{title:'Календарь',description:'Выбор даты, переход между месяцами, стрелки и Home/End внутри календаря. При выборе корневой контейнер отправляет af:change.',enhancement:'calendar',html:'<div id="calendar-example"></div>',js:`Alabuga.renderDocument(document.querySelector('#calendar-example'), {
  schemaVersion: 1, kind: 'page', title: 'Календарь',
  pages: [{ id: 'page', title: '', grid: { columns: 4, rowHeight: 64, gap: 16 },
    widgets: [{ id: 'calendar', type: 'calendar', title: 'Выберите дату',
      date: '2026-09-30', position: { col: 1, row: 1, width: 4, height: 4 } }]
  }]
});`},{title:'Таблица данных',description:'Сортировка по нажатию на заголовок, локальная пагинация, пустое состояние и горизонтальная прокрутка.',enhancement:'table',html:'<div id="table-example"></div>',js:`// type: 'table', columns: [{key:'name',label:'Название'}],
// rows: [{name:'Первый элемент'}], pageSize: 5.
// Точный документ доступен в контрольном примере панели.`}],
};
