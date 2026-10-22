import '@alabuga/framework/standalone.css';
import {slideFitDocs} from './slide-fit-docs';
import { initComponents, renderDocument, renderCalendar, VERSION, widgetRegistry, type DocumentController, type AFDocument, type CalendarRange } from '@alabuga/framework';
import { panelExample, presentationExample } from '@alabuga/framework/examples';
import { el, button } from '@alabuga/framework/dom';
import { examples } from './examples';
import baseCss from '@alabuga/framework/styles.css?raw';
import compositionCss from '@alabuga/framework/compositions.css?raw';
import {makeComposition,showcase} from '@alabuga/framework/compositions';
const libraryCss=baseCss+compositionCss;
import tokens from '../../design/figma-tokens.json';
import './site.css';
const constructorOrigin=new URL(import.meta.env.VITE_CONSTRUCTOR_URL||'http://127.0.0.1:4176').origin;

const pages = [
  ['ai','Локальный ИИ','Документы'],
  ['start','Начало работы','Обзор'],['colors','Цвета и токены','Основа'],['typography','Типографика','Основа'],['grid','Панельная сетка','Основа'],
  ['buttons','Кнопки','Компоненты'],['forms','Формы и выбор','Компоненты'],['feedback','Уведомления и бейджи','Компоненты'],['dialog','Диалог','Компоненты'],
  ['surfaces','Блоки и поверхности','Компоненты'],
  ['navigation','Навигация','Компоненты'],
  ['icons','Иконки','Компоненты'],
  ['compositions','Композиции и эффекты','Документы'],['widgets','Виджеты','Документы'],['slides','Презентации','Документы'],['builder','Конструктор','Документы'],['workspace','Проекты и материалы','Документы'],['classes','Справочник классов','Справочник'],['api','JavaScript API','Справочник'],['changes','Изменения и решения','Справочник'],
];
const constructorGuides:Record<string,string>={ai:'ai',workspace:'projects'};
const pageHref=(id:string)=>constructorGuides[id]?`${constructorOrigin}/docs/ru/${constructorGuides[id]}.html`:'#'+id;
const descriptions: Record<string,string>={
  ai:'Qwen3.5-2B: запрос, редактируемый черновик и применение в локальном конструкторе.',
  workspace:'Фирменная библиотека, кадрирование, история проектов и приёмка с авторами.',
  start:'Фирменный язык для интерфейсов и презентаций. Подключите библиотеку и собирайте из готовых элементов.',
  colors:'От базовых значений к смысловым ролям. 117 переменных связывают все компоненты в одну систему.',
  typography:'Alabuga Sans для текста. Расширенные Bold и Extra Bold — для выразительных заголовков.',
  grid:'Колонки, строки и предсказуемые размеры. Панель управляет размещением, виджет — своим содержимым.',
  buttons:'Одно главное действие. Четыре визуальных веса. Три размера.',forms:'Понятные подписи, заметный фокус и сообщения, которые помогают исправить ошибку.',
  feedback:'Сообщайте о результате с помощью цвета и текста. Цвет не должен быть единственным признаком состояния.',dialog:'Сфокусированное действие без потери контекста.',
  surfaces:'Внешние и внутренние блоки, отступы и три способа выделения объекта из визуальных правил.',
  navigation:'Путь к разделу и текущая страница: доступные ссылки и навигационная цепочка.',
  icons:'Доступные исходные SVG, размеры 16/20/24 px и примеры с текстом и кнопками.',
  widgets:'Самостоятельные блоки для вашей композиции. Один контракт — разные сценарии.',slides:'Та же библиотека на холсте 16:9. Собирайте, показывайте и печатайте.',
  compositions:'Готовые фирменные композиции, адаптивная сетка и сценарии движения.',
  builder:'Визуальная сборка страниц и презентаций. Выберите виджет, настройте содержимое и разместите его в сетке.',
  classes:'Найдите нужный класс по имени или назначению. Внутренние классы __ описывают части компонентов.',api:'Проверка документа, отображение и управление жизненным циклом.',changes:'Что перенесено из Figma, что уточнено для браузера и что осталось за границами версии 0.6.',
};
const app=document.querySelector<HTMLElement>('#app')!;app.className='af docs';
app.innerHTML=`<a class="skip-link" href="#content">К содержимому</a>
<header class="site-header"><a class="wordmark" href="#start"><span class="brand-mark" aria-hidden="true">A</span><span>alabuga<span class="wordmark-sub">framework</span></span></a><span class="header-label">ДИЗАЙН → КОД</span><nav class="header-nav" aria-label="Верхняя навигация"><a href="#start">Документация</a><a href="${constructorOrigin}/builder/">Конструктор ↗</a><a href="/docs/ru/start.html" lang="ru">RU</a><a href="/docs/en/start.html" lang="en">EN</a><a href="#changes" class="version">v${VERSION}</a></nav></header>
<aside class="sidebar"><label class="search-box"><span class="af-sr-only">Поиск классов и разделов</span><input id="search" type="search" placeholder="Поиск классов…" autocomplete="off"><kbd>/</kbd></label><div id="search-results" role="status"></div><nav id="navigation" aria-label="Разделы документации"></nav><div class="sidebar-footer"><span class="status-dot"></span> Рабочее ядро <span>${VERSION}</span></div></aside>
<main id="content" class="content" tabindex="-1"></main><aside class="toc" aria-label="На этой странице"><span>НА ЭТОЙ СТРАНИЦЕ</span><nav id="toc"></nav><div class="toc-note">Один источник.<br>Живой пример.<br>Точный код.</div></aside>`;
const main=document.querySelector<HTMLElement>('#content')!;
const navigation=document.querySelector<HTMLElement>('#navigation')!;
let category='';for(const [id,title,group] of pages){if(group!==category){navigation.append(el('p','nav-group',group));category=group}const a=el('a','nav-link',title);a.href=pageHref(id);a.dataset.page=id;navigation.append(a)}
let dispose:()=>void=()=>{};let controllers:DocumentController[]=[];
const classNames=[...new Set([...libraryCss.matchAll(/\.(af(?:-[a-z0-9_-]+)?)(?![\w-])/g)].map(m=>m[1]))].sort();
const classGroup=(name:string)=>/btn/.test(name)?'buttons':/^af-card(?:$|--)/.test(name)?'surfaces':/^af-surface--/.test(name)?'compositions':/^(af-label|af-body|af-title|af-heading|af-display|af-bullet|af-list)/.test(name)?'typography':/breadcrumb|^af-link/.test(name)?'navigation':/chip|alert|badge/.test(name)?'feedback':/^af-icon(?:$|--)/.test(name)?'icons':/option|input|field|required|check|radio|switch|select|textarea|help|error|placeholder|icon/.test(name)?'forms':/dialog/.test(name)?'dialog':/slide|deck/.test(name)?'slides':/calendar|table|widget|metric|image|empty/.test(name)?'widgets':/panel|page/.test(name)?'grid':'typography';
function codeBlock(code:string,language='HTML'){
  const box=el('div','code-block');const top=el('div','code-bar');top.append(el('span','',language));
  const copy=button('Копировать',async()=>{try{await navigator.clipboard.writeText(code);copy.textContent='Скопировано';setTimeout(()=>{if(copy.isConnected)copy.textContent='Копировать'},1500)}catch{const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);copy.textContent='Выделено · Ctrl+C'}},'copy-button');
  copy.setAttribute('aria-label','Копировать '+language);top.append(copy);const pre=el('pre');pre.tabIndex=0;pre.setAttribute('aria-label',language);pre.append(el('code','',code));box.append(top,pre);return box;
}
function section(title:string,id:string){const s=el('section','doc-section');s.id=id;const h=el('h2','doc-heading',title);s.append(h);main.append(s);const a=el('a','',title);a.href='#'+current+'/'+id;document.querySelector('#toc')!.append(a);return s}
function paragraph(parent:HTMLElement,text:string){parent.append(el('p','doc-copy',text))}
let current='start';
function mountExample(parent:HTMLElement,example:(typeof examples)[string][number],i:number){
  const s=section(example.title,example.id??`example-${i}`);if(example.description)paragraph(s,example.description);
  const live=el('div','example-preview');live.innerHTML=example.html;s.append(live);
  let codeHost:HTMLElement=s;
  if(example.collapseCode){
    const details=el('details','example-code');
    details.append(el('summary','','Код примера'));s.append(details);codeHost=details;
  }
  codeHost.append(codeBlock(example.html));
  if(example.js&&!['panel','calendar','table'].includes(example.enhancement??''))codeHost.append(codeBlock(example.js,'JavaScript'));
  const kind=example.enhancement;
  if(kind==='choices')live.querySelector<HTMLInputElement>('#choice-mixed')!.indeterminate=true;
  if(kind==='form')live.querySelector('form')!.addEventListener('af:submit',()=>{live.querySelector<HTMLElement>('#form-success')!.hidden=false});
  if(kind==='date-form'){
    const output=live.querySelector<HTMLElement>('#meeting-date-result')!;
    live.querySelector('form')!.addEventListener('af:submit',event=>{output.textContent='Встреча запланирована: '+(event as CustomEvent<FormData>).detail.get('meetingDate')});
    live.querySelector('form')!.addEventListener('reset',()=>{output.textContent='Выберите дату и запланируйте встречу. Данные остаются в браузере.'});
  }
  if(kind==='calendar-component'){
    const target=live.firstElementChild as HTMLElement,output=live.querySelector<HTMLElement>('[role="status"]')!;
    const date=example.calendarDate!,options=example.calendarOptions??{};
    const select=(value:string|CalendarRange)=>{output.textContent='Выбрано: '+(typeof value==='string'?value:value.start+' — '+value.end)};
    target.append(options.mode==='range'?renderCalendar(date,select,options):renderCalendar(date,select,options));
    live.classList.add('example-preview--calendar');
    s.append(codeBlock(`const host = document.querySelector('#${target.id}');\nconst output = document.querySelector('#${output.id}');\nconst calendar = Alabuga.renderCalendar('${date}', value => {\n  output.textContent = 'Выбрано: ' + (typeof value === 'string'\n    ? value : value.start + ' — ' + value.end);\n}, ${JSON.stringify(options,null,2)});\nhost.append(calendar);`,'JavaScript'));
  }
  if(kind==='panel'){
    const target=live.querySelector<HTMLElement>('#panel-example')!;const c=renderDocument(target,panelExample);controllers.push(c);
    const controls=el('div','af-row demo-controls');
    controls.append(button('Комментарий 1×1 / показатель 1×2',()=>{const d=c.getDocument();d.pages[0].widgets[1].position.width=1;d.pages[0].widgets[2].position.height=2;d.pages[0].widgets[4].position.row=4;c.update(d)}),button('Сбросить',()=>c.update(panelExample)));live.prepend(controls);
    const a=el('a','af-link af-link--inline','Открыть панель на всю ширину ↗');a.href='demos/panel.html';s.append(a);s.append(codeBlock(`const documentData = ${JSON.stringify(panelExample,null,2)};\nconst controller = Alabuga.renderDocument(document.querySelector('#panel-example'), documentData);`,'JavaScript'));
  }
  if(kind==='calendar'||kind==='table'){
    const w=structuredClone(panelExample.pages[0].widgets.find(w=>w.type===kind)!);w.position={col:1,row:1,width:4,height:4};
    const d:AFDocument={schemaVersion:1,kind:'page',title:example.title,pages:[{id:'example-page',title:'',grid:{columns:4,rowHeight:64,gap:16},widgets:[w]}]};
    if(w.type==='table'){w.rows=Array.from({length:12},(_,i)=>({name:`Задача ${i+1}`,status:i%2?'Готово':'В работе'}));w.pageSize=4}
    if(w.type==='calendar'){w.title=example.title;if(example.calendarDate)w.date=example.calendarDate}
    const target=live.firstElementChild as HTMLElement;
    let selectionCode='';
    if(w.type==='calendar'){
      const output=live.querySelector<HTMLElement>('[role="status"]')!;
      output.textContent='Выбрано: '+w.date;
      target.addEventListener('af:change',event=>{output.textContent='Выбрано: '+(event as CustomEvent).detail.value});
      selectionCode=`\nconst output = document.querySelector('#${output.id}');\nhost.addEventListener('af:change', event => {\n  output.textContent = 'Выбрано: ' + event.detail.value;\n});`;
    }
    live.classList.add(kind==='calendar'?'example-preview--calendar':'example-preview--table');controllers.push(renderDocument(target,d));
    s.append(codeBlock(`const documentData = ${JSON.stringify(d,null,2)};\nconst host = document.querySelector('#${target.id}');\nconst controller = Alabuga.renderDocument(host, documentData);${selectionCode}`,'JavaScript'));
  }
}
function render(){
  dispose();controllers.forEach(c=>c.destroy());controllers=[];
  const [route,anchor]=location.hash.slice(1).split('/');
  if(constructorGuides[route]){location.replace(pageHref(route));return}
  current=pages.some(p=>p[0]===route)?route:'start';
  main.replaceChildren();document.querySelector('#toc')!.replaceChildren();
  navigation.querySelectorAll('a').forEach(a=>{if(a.dataset.page===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  document.title=`${pages.find(p=>p[0]===current)![1]} — Alabuga Framework`;
  const header=el('header','page-header');header.append(el('p','breadcrumb','ALABUGA FRAMEWORK / '+pages.find(p=>p[0]===current)![2].toUpperCase()),el('h1','page-title',pages.find(p=>p[0]===current)![1]),el('p','page-intro',descriptions[current]));main.append(header);
  if(current==='start'){
    const hero=el('section','hero');hero.innerHTML=`<div class="hero-content"><span class="hero-label">СОЗДАНО ДЛЯ АЛАБУГИ</span><h2>Один язык.<br>Любая композиция.</h2><p>Компоненты, которые работают вместе.<br>От первого блока до целой презентации.</p><a class="hero-link" href="#buttons">Изучить компоненты <span>↗</span></a></div><div class="hero-art" aria-hidden="true"><div class="art-panel"><div class="art-top"><span></span><i></i><i></i></div><div class="art-main"><div class="art-cell"><b>24</b><small>Возможности</small></div><div class="art-bars"><i></i><i></i><i></i><i></i></div><div class="art-lines"><i></i><i></i><i></i></div><div class="art-check">✓</div></div></div><div class="art-tag">4 × 4</div></div>`;main.append(hero);
    const links=el('div','quick-links');for(const [number,title,copy,href]of[['01','Компоненты','Готовые состояния и размеры','#buttons'],['02','Панельная сетка','Собирайте из виджетов','#grid'],['03','Презентации','Тот же язык на слайдах','#slides']]){const a=el('a','quick-card');a.href=href;a.append(el('span','quick-number',number),el('h2','',title),el('p','',copy),el('span','quick-arrow','↗'));links.append(a)}main.append(links);
    const install=section('Быстрое подключение','installation');paragraph(install,'Установите @alabuga/framework из приватного реестра. Готовые файлы находятся в dist; публичные точки входа — standalone.css и standalone.js. Пример ниже не требует сборщика на вашем сайте. Все классы применяются внутри контейнера .af.');install.append(codeBlock(`<link rel="stylesheet" href="alabuga.css">
<script src="alabuga.iife.js"></script>
<main class="af">
  <h1 class="af-heading">Начните с главного</h1>
  <button class="af-btn af-btn--lg">Создать документ</button>
</main>`));
    const principles=section('Общие правила','principles');paragraph(principles,'Используйте семантические HTML-элементы, назначайте понятные подписи и выбирайте одно основное действие. Для интерактивности формы и диалога вызовите Alabuga.initComponents().');
    const development=section('Запуск и проверка','development');paragraph(development,'Для разработки нужны Node.js 24.19.0 и npm 11.17.0. Готовые WOFF2 находятся в src/fonts. Исходный шрифт — fonts/alabuga-sans.ttc.');development.append(codeBlock(`npm ci
npm run dev

# Проверка и сборка
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:browser`,'Команды'));
    paragraph(development,'dist — CSS, ES-модули, IIFE, TypeScript-типы и ресурсы. npm run build:docs создаёт независимый сайт в dist/docs. dist/standalone/index.html открывается напрямую с диска. Статический справочник запускается через docker compose up --build -d docs. Constructor не нужен для сборки Framework.');
    paragraph(development,'Новый компонент сопровождается живым примером, описанием классов и состояний, клавиатурного управления и ограничений. HTML примера и показанный код берутся из одного источника; код виджетов формируется из того же документа, который отображается.');
  }
  if(current==='colors'){
    const palette=section('Фирменная палитра','palette');const swatches=el('div','swatches');
    tokens.variables.filter(v=>v.name.startsWith('color/brand/')).forEach(v=>{const raw=Object.values(v.values)[0] as {r:number;g:number;b:number};const hex='#'+[raw.r,raw.g,raw.b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');const card=el('div','swatch');const color=el('div','swatch-color');color.style.background=hex;card.append(color,el('strong','',v.name.split('/').at(-1)),el('code','',hex.toUpperCase()));swatches.append(card)});palette.append(swatches);
    const semantics=section('Смысловые роли','semantics');paragraph(semantics,'Базовые цвета описывают палитру. Семантические переменные описывают назначение: текст, поверхность, границу или состояние. При оформлении компонентов используйте роли.');semantics.append(codeBlock(`.my-panel {
  color: var(--af-text-primary);
  background: var(--af-bg-surface);
  border: 1px solid var(--af-border-default);
  border-radius: var(--af-radius-16);
}`,'CSS'));
    const all=section('Все переменные','tokens');const list=el('div','token-list');list.tabIndex=0;list.setAttribute('role','region');list.setAttribute('aria-label','CSS tokens');tokens.variables.forEach(v=>{const row=el('div','token-row');row.append(el('code','', '--af-'+v.name.replace(/[\s/+]+/g,'-').toLowerCase()),el('span','',v.type==='COLOR'?'Цвет':'Число'));list.append(row)});all.append(list);paragraph(all,'Исходные значения сохранены в design/figma-tokens.json. Коррекции доступности описаны в разделе «Изменения и решения».');
  }
  for(const [i,example] of (examples[current]??[]).entries())mountExample(main,example,i);
  if(current==='grid'){const rules=section('Правила размещения','rules');paragraph(rules,'По умолчанию: 12 колонок, строка 64 px, промежуток 16 px. col/row начинаются с 1, width/height задают число ячеек. validateDocument отклоняет пересечения и выход за границы. При ширине окна менее 768 px страница становится одноколоночной; порядок виджетов берётся из массива документа.');paragraph(rules,'Размер 1×1 — единица сетки, а не квадрат. Текст и таблица прокручиваются внутри. Состояние календаря хранится в документе; сортировка и страница таблицы при update сбрасываются.');}
  if(current==='widgets'){const registry=section('Реестр виджетов','registry');const table=el('table','af-table');table.innerHTML='<thead><tr><th>Виджет</th><th>Тип</th><th>Минимум</th></tr></thead>';const body=el('tbody');for(const [type,r]of Object.entries(widgetRegistry)){const tr=el('tr');tr.append(el('td','',r.title),el('td','',type),el('td','',`${r.minWidth}×${r.minHeight}`));body.append(tr)}table.append(body);registry.append(table);paragraph(registry,'Изображение принимает HTTP(S), относительный путь или встроенный растр, alt и режим cover/contain. Текст хранится блоками paragraph, heading, list, divider, callout и link. Показатель содержит value и необязательную note.');}
  if(current==='slides'){
    const s=section('Восемь слайдов, одна система','presentation');paragraph(s,'Холст 1600×900 масштабируется целиком. Для стрелок навигации установите фокус на презентации вне интерактивных элементов. Печать использует реальный размер слайда; включите фоновые изображения в настройках браузера.');const target=el('div');s.append(target);controllers.push(renderDocument(target,presentationExample()));const a=el('a','af-link af-link--inline','Открыть презентацию на всю ширину ↗');a.href='demos/slides.html';s.append(a);
    const print=section('Перед печатью','print');paragraph(print,'Кнопка «Печать / PDF» проверяет переполнение текстовых областей. Если текст или таблица не помещаются, увеличьте блок или разделите материал на слайды. Таблица печатает текущую страницу данных; для полного вывода укажите pageSize не меньше числа строк.');
    print.append(codeBlock(`const deck = Alabuga.renderDocument(container, presentationData);
deck.goToSlide(2); // индекс начинается с 0
deck.checkOverflow(); // список переполненных областей
// В интерфейсе: «Печать / PDF».`,'JavaScript'));
  }
  if(current==='compositions'){
    const intro=section('Два эталона','showcases');paragraph(intro,'Лендинг из 10 секций и презентация из 11 слайдов об Alabuga Framework. Все элементы доступны в конструкторе через меню «Проект». Это демонстрация возможностей, а не бизнес-показатели компании.');for(const [kind,label]of [['page','Открыть лендинг'],['presentation','Открыть презентацию']]){const a=el('a','af-btn',label);a.href='demos/showcase.html?kind='+kind;intro.append(a)}
    const rules=section('Фирменные правила и новые решения','brand-rules');paragraph(rules,'Основной визуальный ориентир — новый PPTX. Палитра и переменные из рабочей копии Figma, локальный Alabuga Sans и иерархия компонентов сохранены. Новые проектные решения: крупные композиционные заголовки, четыре темы секций, декоративные окружности и линии, адаптивные композиции и анимационные пресеты. Эти расширения не выдаются за правила исходного макета.');paragraph(rules,'Светлая тема — для чтения; контрастная — для обложки и завершения; акцентная — для одной ключевой мысли. Изображение на фоне всегда затемняется. Используйте один главный акцент на секцию и короткие заголовки.');
    const layouts=section('Композиция и адаптивность','layout');paragraph(layouts,'Секция управляет темой, фоном, отступами и шириной содержимого. Виджеты занимают ячейки сетки. В режиме flow высота растёт с текстом; fixed сохраняет размер панели. Ниже 1024 px содержимое новых секций перестраивается в две колонки, ниже 640 px — в одну. Порядок на планшете и телефоне задаётся отдельно. Слайды сохраняют формат 16:9.');layouts.append(codeBlock(JSON.stringify(makeComposition('features'),null,2),'JSON'));paragraph(layouts,'Классы: af-composition, af-flow, af-theme--light / contrast / accent / image, af-spacing--compact / normal / generous, af-width--wide / narrow, af-surface--plain / card. При смене композиции типы и количество мест должны совпадать; иначе редактор сохраняет прежнюю композицию и объясняет причину.');
    const motion=section('Эффекты и действия','motion');paragraph(motion,'Эффекты fade, rise, scale и sequence запускаются один раз при появлении секции в окне. Выберите быстрый, обычный или спокойный темп; сдержанную или выразительную интенсивность. В презентации step: 0 показывает элемент сразу, положительные шаги — по команде «Далее». Кнопка «Назад» возвращает предыдущий шаг. При печати все шаги видны.');const live=el('div');motion.append(live);const sample=makeComposition('features');sample.widgets[1].motion={effect:'sequence',speed:'normal',intensity:'subtle',step:0};const demo={schemaVersion:2 as const,kind:'page' as const,title:'Пример анимации',pages:[sample]};const ctrl=renderDocument(live,demo);controllers.push(ctrl);motion.prepend(button('Повторить эффект',()=>ctrl.update(demo)));paragraph(motion,'Действия кнопок: link — ссылка, section — секция сайта, slide — слайд, modal — окно проекта. Недоступные цели отклоняются. Окна создаются в настройках секции. При ограничении движения эффекты отключаются, управление продолжает работать.');motion.append(codeBlock('const controller = Alabuga.renderDocument(host, documentData);\ncontroller.next(); // следующий шаг или слайд\ncontroller.previous();\ncontroller.goToSlide(2);\ncontroller.destroy();','JavaScript'));
    const exportInfo=section('Сохранение и ограничения','delivery');paragraph(exportInfo,'Экспорт содержит библиотеку, шрифт и загруженные изображения, включая галереи и фон. Внешние HTTP(S)-ресурсы требуют сети. HTML предназначен для просмотра, JSON-проект — для дальнейшего редактирования. Свободный холст, произвольный код, сложная режиссура прокрутки и облачная публикация не входят в версию.');
  }
  if(current==='builder'){
    const slideMenu=section('Настройки слайда','slide-settings');paragraph(slideMenu,'В презентации нажмите «Оформление и показ» рядом со списком слайдов или «Настройки слайда» в верхней панели. Вкладка «Шаблон и структура» содержит выбор шаблона, сетку и список элементов. «Фон» — фирменные цвета, изображение, кадрирование и декор. «Поведение» — переход слайда, показ всех элементов сразу или по шагам, эффекты и просмотр текущего слайда. Шаг 0 виден сразу; элементы с одинаковым номером появляются вместе. Пустому слайду можно назначить любой шаблон; для заполненного сохраняется проверка совместимости содержимого.');
    const launch=section('Собрать документ','launch');const link=el('a','af-btn','Открыть конструктор ↗');link.href=constructorOrigin+'/builder/';launch.append(link);paragraph(launch,'Начните с примера или создайте пустую страницу либо презентацию. Конструктор использует те же компоненты и формат документа, что и библиотека.');
    const workflow=section('Работа с блоками','workflow');const steps=el('ol','af-list');['Нажмите «Добавить секцию» между секциями и выберите готовую композицию, в том числе Header — шапку или Footer — подвал. Замените демонстрационные ссылки и контакты своими. Кнопка «+ Блок» добавляет отдельный виджет в сетку текущей секции.','Нажмите на текст, заголовок, показатель или ячейку таблицы и редактируйте прямо на странице. Содержимое сохраняется по мере ввода. «Настройки блока» открывает дополнительную панель; изменения в ней сразу видны на странице.','Наведите указатель на блок: появятся настройки, копирование, удаление и ручки. На сенсорном экране выберите блок касанием. Ручка ↕ перемещает блок, угол ↘ меняет размер. На ручках работают стрелки клавиатуры. Красная рамка означает недопустимое положение; после отпускания блок вернётся на прежнее место.','В настройках блока используйте ползунок горизонтального смещения или команды «Слева / По центру / Справа». «Выравнивание содержимого» меняет положение текста внутри блока. Полноширинный блок сначала нужно сузить, чтобы освободить место для сдвига.','Пересечения и выход за границы отклоняются. Остальные блоки автоматически не сдвигаются.','Ctrl+Z отменяет действие, Ctrl+Shift+Z возвращает его. История хранит до 30 действий в пределах текущего сеанса и ограничена по объёму.','Предпросмотр включает интерактивные компоненты и мобильную компоновку. Секции по содержимому адаптируются к ширине холста. Фиксированные панели сохраняют сетку; на узком экране доступен предпросмотр.'].forEach(t=>steps.append(el('li','',t)));workflow.append(steps);
    const content=section('Содержимое и слайды','editor-content');paragraph(content,'Текст собирается из абзацев, заголовков, списков, ссылок, акцентов и разделителей. Буквица включается у отдельного абзаца. Таблица редактируется по ячейкам; строки редактора показываются порциями по десять. Изображения PNG, JPEG, WebP и GIF до 2 МБ можно загрузить в проект или указать ссылкой.');paragraph(content,'Презентация поддерживает добавление, копирование, перестановку и удаление слайдов. Перед экспортом проверяется переполнение: сократите текст или увеличьте блок. Для полной печати таблицы задайте достаточное число записей на странице.');
    const files=section('Сохранение и экспорт','editor-files');paragraph(files,'Корректные изменения автоматически сохраняются в этом браузере. Ввод текста на странице группируется в одно действие истории до потери фокуса. Некорректные размеры не меняют документ. Проекты и материалы хранятся в библиотеке IndexedDB. «Мои проекты» переключает документы, «История версий» восстанавливает до 20 сохранённых состояний. История отмены текущего сеанса не переживает перезагрузку. «Сохранить проект» скачивает файл .json для дальнейшей работы через «Открыть проект». Это файл проекта, а не редактор кода.');paragraph(files,'«Скачать HTML» создаёт готовый документ со встроенными библиотекой, шрифтом и загруженными изображениями. Его можно открыть с диска. Изображения по внешним HTTP(S)-ссылкам требуют доступа к сети. HTML предназначен для просмотра; для дальнейшего редактирования сохраняйте файл проекта.');paragraph(files,'Если память браузера заполнена или недоступна, конструктор сообщает об этом. Скачайте проект, чтобы сохранить изменения. Облачное хранение, совместное редактирование и публикация пока не подключены.');
  }
  if(current==='classes'){
    const s=section('Классы библиотеки','class-list');const label=el('label','af-field');label.append(el('span','af-label','Фильтр по имени класса'));const filter=el('input','af-input');filter.type='search';filter.placeholder='Например: btn, calendar, dialog';label.append(filter);s.append(label);const table=el('table','af-table class-table');table.innerHTML='<thead><tr><th>Класс</th><th>Раздел</th><th>Назначение</th></tr></thead>';const body=el('tbody');table.append(body);s.append(table);const empty=el('p','af-empty','Ничего не найдено');s.append(empty);
    const fill=()=>{body.replaceChildren();let count=0;classNames.filter(n=>n.includes(filter.value.toLowerCase())).forEach(n=>{count++;const group=classGroup(n);const row=el('tr');const name=el('td');name.append(el('code','',n));const link=el('a','af-link af-link--inline',pages.find(p=>p[0]===group)![1]);link.href='#'+group;const cell=el('td');cell.append(link);row.append(name,cell,el('td','',n.includes('__')?'Внутренняя часть':n.includes('--')?'Модификатор':'Базовый класс'));body.append(row)});empty.hidden=!!count};filter.addEventListener('input',fill);fill();
  }
  if(current==='api'){
    const s=section('Проверка и отображение','lifecycle');s.append(codeBlock(`const result = Alabuga.validateDocument(documentData);
if (!result.success) {
  console.error(result.issues); // { path, message }[]
} else {
  const controller = Alabuga.renderDocument(container, result.data);
  const saved = controller.getDocument(); // независимая копия
  controller.update(saved); // повторная проверка перед отображением
  controller.destroy(); // обработчики, наблюдатели и DOM удаляются
}`,'JavaScript'));paragraph(s,'renderDocument проверяет документ до изменения DOM. Повторный вызов на том же контейнере уничтожает предыдущий экземпляр. update недопустимым документом оставляет прежнее представление. После destroy методы изменения недоступны.');
    const events=section('События и компоненты','events');events.append(codeBlock(`const dispose = Alabuga.initComponents(root);
root.addEventListener('af:submit', event => {
  const formData = event.detail; // FormData; отправки на сервер нет
});
container.addEventListener('af:change', event => {
  const { widgetId, value } = event.detail; // выбранная дата ISO
});
dispose();`,'JavaScript'));
    const assets=section('Материалы схемы 3','asset-api');paragraph(assets,'src и background могут содержать asset:<SHA-256>. Передайте resolveAsset для разрешения идентификатора в URL изображения. getDocument сохраняет исходные ссылки. В переносимом файле редактора поле document содержит структуру, assets — уникальные изображения; формат оболочки alabuga-project, version: 3.');assets.append(codeBlock('Alabuga.renderDocument(host, doc, {\n  resolveAsset: id => images.get(id)\n});','JavaScript'));
    const format=section('Формат документа','document');paragraph(format,'schemaVersion: 3. Версии 1 и 2 автоматически преобразуются без изменения прежней сетки. kind: page или presentation. В kind: page массив pages задаёт вертикальные секции одной страницы, каждая со своей сеткой. В kind: presentation это слайды. Односекционные проекты совместимы без преобразования. У страниц и виджетов уникальные ID. Неизвестные поля, виджеты, пересечения и опасные схемы URL отклоняются. Формат не поддерживает исполняемые строки или произвольную HTML-разметку.');format.append(codeBlock(JSON.stringify({schemaVersion:1,kind:'page',title:'Пример',pages:[{id:'main',title:'Заголовок',grid:{columns:12,rowHeight:64,gap:16},widgets:[{id:'note',type:'text',title:'Комментарий',position:{col:1,row:1,width:4,height:2},content:[{type:'paragraph',text:'Текст отображается буквально.',dropCap:false}]}]}]},null,2),'JSON'));paragraph(format,'Ограничения: до 100 страниц, 100 виджетов на странице, 5000 строк таблицы, 30 колонок. Таблица допускает строки, конечные числа и null. Сборка экспортирует TypeScript-типы AFDocument, Widget, TextBlock и DocumentController.');
  }
  if(current==='slides')dispose=slideFitDocs(main);
  if(current==='changes'){
    const candidate=section('1.1.0 — опубликовано в локальном реестре','release-1-1-0');
    paragraph(candidate,'Новая версия включает фирменный Select, DatePicker и Calendar, размеры и состояния компонентов, каталог иконок и локальный архив исходников Figma. Формат документов и подключение JS/CSS сохранены. Текстовые ссылки и вставки renderer используют читаемые модификаторы; компонентные матрицы показывают исходную палитру.');
    const candidateLink=el('a','af-link af-link--inline','Пакет, JS/CSS и отчёт приёмки');candidateLink.href='releases/1.1.0/';candidate.append(candidateLink);
    paragraph(candidate,'Версия 1.1.0 опубликована в авторизованном Verdaccio 127.0.0.1:4873 с тегом latest. Проверены установка из реестра и контрольная сумма архива. Ручная проверка со скринридером отложена по решению пользователя и не выполнялась.');
    const alignment=section('21 октября 2026 — компоненты Figma','figma-2026-10-21');
    paragraph(alignment,'В текущей рабочей версии: Select/List/ListItem в S/M/L с клавиатурой и нативным значением формы; независимые Selected/Pressed/Loading у кнопок; checkbox/radio в размерах 16/20/24 px. SVG встроены в CSS. Подключение остаётся через готовые JS/CSS и существующий initComponents.');
    paragraph(alignment,'Убраны общие переопределения размеров и цветов кнопок в композициях. Белый CTA на тёмном фоне задаётся af-btn--inverse. Сохранены контрастные поправки текста, видимый фокус и нативная работа форм.');
    paragraph(alignment,'После проверки: стабилизирован внутренний кружок radio при дробном масштабе, убрана обрезка букв в Select, зазор под меню уменьшен до 2 px. Фокус полей соответствует одной границе 1 px из Figma; в системной высокой контрастности сохраняется отдельный контур.');
    paragraph(alignment,'Switch приведён к размеру 44×24 px, ползунку 20 px и отдельным hover/disabled для OFF/ON. Input S/M/L согласован с обёрткой, подписями, подсказками и исходными SVG состояний. Textarea получил исходную типографику и счётчик через initComponents.');
    paragraph(alignment,'Добавлены квадратные и круглые icon-button S/M/L на основе af-btn, три исходных маркера Bullet и левое выравнивание маркированных списков. Полная компонентная шкала Display/Heading/Title/Body/Label доступна через CSS-классы; исправлен межбуквенный интервал заголовков. Нумерация списков и fitted-типографика презентаций сохранены. Далее — именованные поверхности и оставшиеся семейства компонентов из аудита.');
    paragraph(alignment,'По итогам просмотра: icon-button показывают действие «Подробнее» с исходной иконкой информации; списки содержат задачи, материалы и порядок деловой встречи. Буквица и разделители отмечены как дополнительные стили первоначальной реализации Framework: их происхождение в проверенных Figma и брендовых материалах не подтверждено.');
    paragraph(alignment,'Уточнено центрирование рисунка и загрузки в icon-button при дробном масштабе. Каждый вид списка теперь оформлен отдельным блоком с описанием, предпросмотром и HTML-кодом, как остальные примеры типографики.');
    paragraph(alignment,'Добавлены именованные поверхности на основе af-card: внешний/внутренний блок 32/16 px с gap 16 px, заливка, обводка 2–3 px и исходная тень Figma. Геометрия сохраняется на телефоне; старые карточки и флаги поверхности renderer совместимы. Новый раздел «Блоки и поверхности» показывает отдельные примеры и код. Далее — Calendar/DatePicker и семейства P2.');
    paragraph(alignment,'Доработано поведение календаря: переходы по месяцам и годам с клавиатуры, конец короткого месяца, годы 0000–0099 и границы формата 0000–9999. Фокус и узел заголовка сохраняются; af:change отправляется после обновления выбранного дня. В разделе «Виджеты» добавлен пример с 29 февраля.');
    paragraph(alignment,'Calendar сверен с приложенным скриншотом: компактные 250 px, квадратные дни 32 px, заголовок и SVG-стрелки, неактивные даты следующего месяца, рамка и тень. Добавлены пустое состояние, подтверждение/отмена и диапазон 10–17 сентября с переходом через неделю. Календарь в справочнике показан отдельно от панели; AFDocument сохраняет выбор одной даты. Даты соответствуют реальному месяцу, а подписи недель и начало периода сохраняют читаемый контраст. При недоступной Figma используем исходные снимки. Далее — поле DatePicker.');
    paragraph(alignment,'Добавлен DatePicker по контексту Default и снимку состояний Figma: поле L 48 px, исходные иконки, календарь с подтверждением и ввод ДД.ММ.ГГГГ. Значение и FormData остаются ISO; работают required/min/max, readonly, disabled, reset и очистка через прежний initComponents. Невозможная дата не отправляет старое значение; для браузеров без type=date проверяются формат и границы. Схема документа сохранена. Новые форма встречи и состояния доступны в разделе «Формы и выбор». Далее — семейства P2.');
    paragraph(alignment,'DatePicker поддерживает S/M/L 32/40/48 px. Option-btn/Multi-switch, Chip/Alert всех размеров, Dialog и навигация перепроверены по трём присланным скриншотам. Восстановлены прозрачные состояния группы, исходная палитра, значки, размеры крестиков, равные кнопки Dialog и серые/чёрные/синие состояния ссылок. Для более тёмного текста доступны модификаторы --accessible. Уточнённые правила и наблюдения сохранены локально; повторных обращений к Figma нет.');
    paragraph(alignment,'Добавлен каталог иконок: 11 доступных значков/оформлений, размеры 16/20/24 px, наследование цвета и исходные двухцветные спиннеры. Размер иконки внутри кнопки задаётся кнопкой. Источники, масштабируемые варианты и недостающие SVG отмечены отдельно. Матрица всех 23 семейств обновлена по фактической реализации.');
    const review=el('div','af-row');
    for(const [label,href]of [['Кнопки и состояния','#buttons'],['Формы и выбор','#forms'],['Типографика и списки','#typography'],['Подключение и ограничения','docs/ru/author.html']]){const link=el('a','af-link af-link--inline',label);link.href=href;review.append(link)}
    alignment.append(review);
    const release=section('0.6.0 — фирменные материалы и рабочее пространство','release-v6');paragraph(release,'Библиотека PPTX, проекты и версии в IndexedDB, схема 3, отдельное хранение материалов, миниатюры, контекстные свойства, кадрирование, сценарии показа и проверка качества. Приёмка с пятью авторами ожидает проведения.');
    const s=section('0.5.0 — композиции и сценарии','release');paragraph(s,'Фирменные композиции сайтов и слайдов, адаптивная высота, фоновые изображения, новые виджеты, готовые анимации, действия и модальные окна. Проекты версии 1 автоматически преобразуются в версию 2.');
    const roadmap=section('План развития','roadmap');const stages=el('ol','af-list');[
      'Библиотека: токены, шрифты, компоненты, панельная сетка, виджеты и формат документа — реализовано в 0.1.0.',
      'Проверка: автоматические тесты, доступность, три браузерных движка, контрольные страницы и печать — выполнено. Следующий шаг: оценить реальные материалы и удобство выбранных размеров.',
      'Конструктор: базовая версия реализована — выбор виджетов, добавление и удаление, перемещение и размеры в сетке, панель свойств, отмена и повтор, сохранение документа. Следующий шаг — проверить рабочие сценарии на реальных материалах.',
      'Страницы и презентации: реализованы вертикальные секции с независимыми сетками, управление слайдами, режим просмотра, проверка переполнения и экспорт HTML. Для многостраничного сайта потребуется отдельная модель навигации.',
      'Расширение: дополнительные виджеты и шаблоны по реальным задачам; публикация и автодеплой отдельным этапом.'
    ].forEach(t=>stages.append(el('li','',t)));roadmap.append(stages);
    const verification=section('Что проверяется','verification');paragraph(verification,'Проверки схемы, истории и размещения; браузерные сценарии в Chromium, Firefox и WebKit: библиотека, документация, конструктор, доступность с axe, сохранение и открытие проекта, экспорт без сети и безопасное отображение текста. Скриншоты и PDF сохраняются в test-results. Автоматические проверки дополняют визуальную оценку и не заменяют её.');
    paragraph(verification,'Для ссылок и текстовых состояний добавлены контрастные значения: --af-text-link, --af-action-secondary-text, --af-action-clear-text-default — #0956BB; --af-action-ghost-text — #505A64. Палитра Figma в tokens.css сохранена; эти роли переопределяются в styles.css.');
    const changes=section('Уточнения к Figma','decisions');const ul=el('ul','af-list');['В работе используется только копия ObAoKiDwraibmQrxUNvGWI. Исходный макет не изменяется.','Значения переменных сохранены отдельно. Chip и Alert по умолчанию используют исходную палитру; --accessible включает более тёмные роли текста: success #176B38, warning #874700, danger #9B1717, info #0956BB.','Добавлен видимый клавиатурный фокус. Веб-поля не используют обрезку высоты текста из макета.','В компонентной типографике не используем 8–10 px для вводимого текста; маленькие подписи показателей отделены от основного текста.','Вместо конфликтующих вариантов иконок используется ограниченный проверенный набор. SVG info, success и close сохранены из Figma.','Размеры основываются на действующих компонентах. Raster-таблицы в макете считаются справочными, а не источником автоматической генерации.','Шрифт преобразован из fonts/alabuga-sans.ttc в четыре WOFF2 без изменения исходного TTC.','Сложное обтекание, тёмная тема, серверные данные и автодеплой отложены. Редактор HTML/CSS/JS в конструкторе не предусмотрен.'].forEach(t=>ul.append(el('li','',t)));changes.append(ul);
  }
  const footer=el('footer','page-footer');footer.append(el('span','','Alabuga Framework · '+VERSION),el('span','','Общие правила. Свобода композиции.'));main.append(footer);
  dispose=initComponents(main);
  if(anchor)requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView());else window.scrollTo(0,0);
}
window.addEventListener('hashchange',render);render();
const search=document.querySelector<HTMLInputElement>('#search')!;const results=document.querySelector<HTMLElement>('#search-results')!;
search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();results.replaceChildren();if(!q)return;const matches=pages.filter(p=>p[1].toLowerCase().includes(q)||p[0].includes(q)).map(p=>({title:p[1],href:'#'+p[0]}));matches.push(...classNames.filter(n=>n.includes(q)).map(n=>({title:n,href:'#'+classGroup(n)})));for(const match of matches.slice(0,12)){const a=el('a','search-result',match.title);a.href=match.href;a.addEventListener('click',()=>{search.value='';results.replaceChildren()});results.append(a)}if(!matches.length)results.append(el('p','af-caption','Ничего не найдено'));});
window.addEventListener('keydown',e=>{if(e.key==='/'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();search.focus()}});
