import { type Widget, type TextBlock } from './schema.js';
import { el, button } from './dom.js';

export function renderText(blocks: TextBlock[], heading:'h2'|'h3'='h3'): HTMLElement {
  const box = el('div', 'af-prose');
  for (const block of blocks) {
    switch (block.type) {
      case 'heading': box.append(el(heading, 'af-title', block.text)); break;
      case 'paragraph': box.append(el('p', block.dropCap ? 'af-dropcap' : '', block.text)); break;
      case 'divider': box.append(el('hr', block.decorative ? 'af-divider af-divider--ornament' : 'af-divider')); break;
      case 'callout': { const n = el('aside', `af-alert af-alert--${block.tone} af-alert--accessible`, block.text); box.append(n); break; }
      case 'list': { const n = el(block.ordered ? 'ol' : 'ul', 'af-list'); if (!block.ordered) n.setAttribute('role', 'list'); block.items.forEach(t => n.append(el('li', '', t))); box.append(n); break; }
      case 'link': { const n = el('a', 'af-link af-link--inline', block.text); n.href = block.href; box.append(n); break; }
    }
  }
  return box;
}

export type CalendarRange = {start:string; end:string};
type CalendarBaseOptions = {confirm?:boolean; onCancel?:()=>void; min?:string; max?:string};
export type CalendarSingleOptions = CalendarBaseOptions & {mode?:'single'; value?:string|null};
export type CalendarRangeOptions = CalendarBaseOptions & {mode:'range'; value?:CalendarRange|null};

export function renderCalendar(dateString:string, onSelect:(date:string)=>void, options?:CalendarSingleOptions):HTMLElement;
export function renderCalendar(dateString:string, onSelect:(range:CalendarRange)=>void, options:CalendarRangeOptions):HTMLElement;
export function renderCalendar(dateString:string, onSelect:((date:string)=>void)|((range:CalendarRange)=>void), options:CalendarSingleOptions|CalendarRangeOptions={}):HTMLElement {
  const valid = (s:string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(+new Date(s+'T12:00:00Z')) && new Date(s+'T12:00:00Z').toISOString().slice(0,10) === s;
  if (!valid(dateString)) throw new TypeError('Некорректная дата календаря');
  const minimum=options.min??'0000-01-01',maximum=options.max??'9999-12-31';
  if(!valid(minimum)||!valid(maximum)||minimum>maximum)throw new RangeError('Некорректные границы календаря');
  const ordered = (start:string,end:string):CalendarRange => start <= end ? {start,end} : {start:end,end:start};
  const isRange = options.mode === 'range';
  let selected = options.mode === 'range' ? null : options.value === undefined ? dateString : options.value;
  let range = options.mode === 'range' && options.value ? ordered(options.value.start, options.value.end) : null;
  if (selected !== null && !valid(selected) || range && (!valid(range.start) || !valid(range.end))) throw new TypeError('Некорректная выбранная дата');
  let committed = selected, committedRange = range, choosingEnd = false, previewEnd:string|null = null;
  const root = el('div', 'af af-calendar'); root.dataset.mode = isRange ? 'range' : 'single';
  let view = new Date(dateString + 'T12:00:00');
  let active = dateString, renderedMonth = '';
  const format = (d: Date) => `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  // The numeric Date constructor maps years 0–99 to 1900–1999. Keep the schema's four-digit years.
  const date = (year: number, month: number, day: number) => {
    const d = new Date(0); d.setHours(12, 0, 0, 0); d.setFullYear(year, month, day); return d;
  };
  const clamp = (d: Date) => d.getFullYear()<0||format(d)<minimum ? new Date(minimum+'T12:00:00') : d.getFullYear()>9999||format(d)>maximum ? new Date(maximum+'T12:00:00') : d;
  view=clamp(view);active=format(view);
  const shiftMonth = (d: Date, delta: number) => {
    const first = date(d.getFullYear(), d.getMonth() + delta, 1);
    const lastDay = date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return clamp(date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), lastDay)));
  };
  const head = el('div', 'af-calendar__head');
  const changeMonth = (delta: number) => {
    view = clamp(date(view.getFullYear(), view.getMonth() + delta, 1));
    const month = format(view).slice(0, 7);
    active = selected?.slice(0, 7) === month && selected>=minimum && selected<=maximum ? selected : format(view);
    previewEnd = null;
    draw();
    const control = delta < 0 ? prev : next;
    if (control.disabled) focusDay(); else control.focus();
  };
  const prev = button('', () => changeMonth(-1), 'af-calendar__nav'); prev.setAttribute('aria-label', 'Предыдущий месяц'); prev.dataset.prev = '';
  const next = button('', () => changeMonth(1), 'af-calendar__nav'); next.setAttribute('aria-label', 'Следующий месяц'); next.dataset.next = '';
  const title = el('span', 'af-calendar__month'); title.setAttribute('aria-live','polite'); title.setAttribute('aria-atomic','true');
  head.append(prev, title, next);
  const days = el('div', 'af-calendar__days'); days.setAttribute('role','group'); days.setAttribute('aria-label','Дни месяца');
  root.append(head, days);
  const notify = () => {
    if (isRange) { if (range) (onSelect as (value:CalendarRange)=>void)({...range}); }
    else if (selected) (onSelect as (value:string)=>void)(selected);
  };
  const commit = () => {
    if (isRange && (!range || choosingEnd)) return;
    if (!isRange && (!selected||selected<minimum||selected>maximum)) selected = active;
    committed = selected; committedRange = range ? {...range} : null;
    syncDays(); notify();
  };
  const cancel = () => {
    selected = committed; range = committedRange ? {...committedRange} : null; choosingEnd = false; previewEnd = null;
    view = clamp(new Date((selected ?? range?.start ?? dateString)+'T12:00:00')); active=format(view);
    draw(); focusDay(); options.onCancel?.();
  };
  const confirm = button('Подтвердить', commit, 'af-btn');
  if (options.confirm) {
    const actions = el('div','af-calendar__actions');
    actions.append(button('Отмена', cancel, 'af-btn af-btn--secondary'), confirm); root.append(actions);
  }
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && options.confirm) { e.preventDefault(); e.stopPropagation(); cancel(); } });
  days.addEventListener('mouseleave', () => { if (previewEnd) { previewEnd = null; syncDays(); } });
  const syncDays = () => {
    const shownRange = choosingEnd && range && previewEnd ? ordered(range.start,previewEnd) : range;
    for (const b of days.querySelectorAll<HTMLButtonElement>('[data-date]')) {
      const iso = b.dataset.date!, outside = b.hasAttribute('data-outside');
      b.tabIndex = !b.disabled && iso === active ? 0 : -1;
      const inRange = !!shownRange && iso >= shownRange.start && iso <= shownRange.end;
      b.setAttribute('aria-pressed', String(!b.disabled && (isRange ? inRange : iso === selected)));
      if (isRange && inRange && !b.disabled) {
        b.dataset.range = iso === shownRange!.start ? (iso === shownRange!.end && !choosingEnd ? 'single' : 'start') : iso === shownRange!.end ? 'end' : 'middle';
      } else delete b.dataset.range;
    }
    confirm.disabled = isRange && (!range || choosingEnd || range.start<minimum || range.end>maximum);
  };
  const focusDay = () => days.querySelector<HTMLButtonElement>(`[data-date="${active}"]`)?.focus();
  const draw = () => {
    const year = view.getFullYear(), month = view.getMonth();
    const currentMonth=format(view).slice(0,7);
    prev.disabled = currentMonth<=minimum.slice(0,7);
    next.disabled = currentMonth>=maximum.slice(0,7);
    const monthKey = format(view).slice(0, 7);
    if (renderedMonth === monthKey) { syncDays(); return; }
    renderedMonth = monthKey;
    const monthName = view.toLocaleDateString('ru-RU', { month: 'long' });
    title.textContent = `${monthName[0].toUpperCase()+monthName.slice(1)} ${String(year).padStart(4,'0')}`;
    days.replaceChildren();
    ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => days.append(el('span', 'af-calendar__weekday', d)));
    const offset = (date(year, month, 1).getDay() + 6) % 7;
    const total = date(year, month + 1, 0).getDate();
    const count = Math.ceil((offset+total)/7)*7;
    for (let day=1-offset; day<=count-offset; day++) {
      if (day < 1) { const blank = el('span','af-calendar__blank'); blank.setAttribute('aria-hidden','true'); days.append(blank); continue; }
      const d = date(year,month,day), iso = format(d);
      const outside = day > total;
      // Finish DOM/focus work before notifying a host that may update or destroy the document.
      const b = button(String(d.getDate()), () => {
        active = iso; previewEnd = null;
        if (isRange) {
          if (!choosingEnd || !range) { range = {start:iso,end:iso}; choosingEnd = true; }
          else { range = ordered(range.start,iso); choosingEnd = false; }
        } else selected = iso;
        syncDays(); b.focus();
        if (!options.confirm && (!isRange || !choosingEnd)) commit();
      }, 'af-calendar__day');
      if (d.getFullYear() >= 0 && d.getFullYear() <= 9999) b.dataset.date = iso;
      b.disabled = outside||iso<minimum||iso>maximum; if (outside) { b.dataset.outside = ''; b.tabIndex = -1; }
      b.setAttribute('aria-label', d.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long',year:'numeric', ...(d.getFullYear() <= 0 ? {era:'short'} as const : {})}));
      b.addEventListener('focus', () => { active = iso; if (choosingEnd) previewEnd = iso; syncDays(); });
      b.addEventListener('mouseenter', () => { if (choosingEnd && !b.disabled) { previewEnd = iso; syncDays(); } });
      b.addEventListener('keydown', e => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        let delta = ({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7} as Record<string,number>)[e.key];
        if (e.key === 'Home') delta = -((d.getDay()+6)%7);
        if (e.key === 'End') delta = 6-((d.getDay()+6)%7);
        const page = e.key === 'PageUp' ? -1 : e.key === 'PageDown' ? 1 : 0;
        if (delta === undefined && !page) return;
        e.preventDefault();
        view = page ? shiftMonth(d, page * (e.shiftKey ? 12 : 1)) : clamp(date(year,month,day+delta));
        active = format(view); draw(); focusDay();
      });
      days.append(b);
    }
    syncDays();
  };
  draw(); return root;
}

export function renderTable(widget: Extract<Widget,{type:'table'}>): HTMLElement {
  const root = el('div','af-data-table');
  let key = '', ascending = true, page = 0;
  const draw = (focusKey?: string) => {
    root.replaceChildren();
    const scroller = el('div','af-table-scroll'); scroller.tabIndex=0; scroller.setAttribute('role','region'); scroller.setAttribute('aria-label',widget.title || 'Таблица');
    const table = el('table','af-table'+(widget.wrap?' af-table--wrap':'')+(widget.variant?' af-table--'+widget.variant:''));
    const caption = el('caption','af-sr-only',widget.title || 'Данные');
    const head=el('thead'), tr=el('tr');
    for (const c of widget.columns) {
      const th=el('th'); th.scope='col'; th.setAttribute('aria-sort', key===c.key ? (ascending?'ascending':'descending') : 'none');
      const b=button(c.label + (key===c.key ? (ascending?' ↑':' ↓') : ''),()=>{ascending=key===c.key ? !ascending : true;key=c.key;page=0;draw(c.key)},'af-table__sort');
      b.dataset.sort=c.key; th.append(b);tr.append(th);
    }
    head.append(tr); const body=el('tbody');
    const rows=[...widget.rows];
    if(key) rows.sort((a,b)=>{const x=a[key]??'',y=b[key]??'';const order=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'ru',{numeric:true});return ascending?order:-order});
    const pages=Math.max(1,Math.ceil(rows.length/widget.pageSize)); page=Math.min(page,pages-1);
    for(const row of rows.slice(page*widget.pageSize,(page+1)*widget.pageSize)) {const r=el('tr');widget.columns.forEach(c=>r.append(el('td','',String(row[c.key]??'—'))));body.append(r)}
    if(!rows.length){const r=el('tr'),td=el('td','af-empty','Пока нет данных');td.colSpan=widget.columns.length;r.append(td);body.append(r)}
    table.append(caption,head,body);scroller.append(table);
    const nav=el('div','af-table__pagination');
    const prev=button('‹',()=>{page--;draw();root.querySelector<HTMLButtonElement>('[data-page-prev]')?.focus()});prev.disabled=page===0;prev.dataset.pagePrev='';prev.setAttribute('aria-label','Предыдущая страница таблицы');
    const next=button('›',()=>{page++;draw();root.querySelector<HTMLButtonElement>('[data-page-next]')?.focus()});next.disabled=page===pages-1;next.dataset.pageNext='';next.setAttribute('aria-label','Следующая страница таблицы');
    const status=el('span','af-caption',`${page+1} / ${pages}`);status.setAttribute('aria-live','polite');status.title=`${rows.length} записей`;nav.append(prev,status,next);root.append(scroller);if(pages>1)root.append(nav);
    if(focusKey) root.querySelector<HTMLButtonElement>(`[data-sort="${focusKey}"]`)?.focus();
  };
  draw();return root;
}

export function renderWidget(widget: Widget, changed: (id:string,date:string)=>void): HTMLElement {
  const box=el('section',`af-widget af-widget--${widget.type}`);box.dataset.widgetId=widget.id;
  if(widget.align)box.style.textAlign=widget.align;
  if(widget.surface)box.classList.add('af-surface--'+widget.surface);
  if(widget.position.height===1 || widget.type==='table' && widget.position.height===2)box.classList.add('af-widget--compact');
  if(widget.title) box.append(el('h2','af-widget__title',widget.title));
  const content=el('div','af-widget__content');
  if(widget.type==='button')content.style.justifyContent=widget.align==='right'?'flex-end':widget.align==='center'?'center':'flex-start';
  switch(widget.type){
    case 'button':{const b=widget.action.type==='link'?el('a','af-btn'):el('button','af-btn');b.textContent=widget.label;if(b instanceof HTMLAnchorElement&&widget.action.type==='link')b.href=widget.action.href;else (b as HTMLButtonElement).type='button';if(widget.variant==='secondary')b.classList.add('af-btn--secondary');b.dataset.actionId=widget.id;content.append(b);break;}
    case 'quote':{const q=el('blockquote','af-quote');q.append(el('p','af-quote__text',widget.text),el('cite','af-quote__author',widget.author));content.append(q);break;}
    case 'cards':{const cards=el('div','af-cards');cards.style.setProperty('--af-items',String(widget.items.length));widget.items.forEach((item,i)=>{const card=el('article','af-feature');card.append(el('span','af-feature__number',String(i+1).padStart(2,'0')),el('h3','af-feature__title',item.title),el('p','af-feature__text',item.text));cards.append(card)});content.append(cards);break;}
    case 'gallery':{const gallery=el('div','af-gallery');widget.items.forEach(item=>{const figure=el('figure'),img=el('img');img.src=item.src;img.alt=item.alt;figure.append(img,el('figcaption','af-caption',item.caption));gallery.append(figure)});content.append(gallery);break;}
    case 'text': content.append(renderText(widget.content,widget.title?'h3':'h2'));break;
    case 'metric': content.append(el('strong','af-metric__value',widget.value));if(widget.note)content.append(el('span','af-caption',widget.note));break;
    case 'image': {
      const img=el('img','af-image');img.src=widget.src;img.alt=widget.alt;img.style.objectFit=widget.fit;img.style.objectPosition=widget.focal??'center';
      if(widget.focalPoint)img.style.setProperty('--af-focus',`${widget.focalPoint.x}% ${widget.focalPoint.y}%`);
      if(widget.mobileFocalPoint)img.style.setProperty('--af-mobile-focus',`${widget.mobileFocalPoint.x}% ${widget.mobileFocalPoint.y}%`);
      img.addEventListener('error',()=>{img.hidden=true;content.append(el('p','af-empty','Изображение недоступно: '+widget.alt))},{once:true});content.append(img);if(widget.caption)content.append(el('p','af-caption',widget.caption));break;
    }
    case 'calendar':content.append(renderCalendar(widget.date,date=>changed(widget.id,date)));break;
    case 'table':content.append(renderTable(widget));break;
  }
  if(['text','calendar','metric','image'].includes(widget.type)){content.tabIndex=0;content.setAttribute('role','region');content.setAttribute('aria-label',widget.title || widget.type)}
  box.append(content);return box;
}
