import { type Widget, type TextBlock } from './schema.js';
import { el, button } from './dom.js';

export function renderText(blocks: TextBlock[], heading:'h2'|'h3'='h3'): HTMLElement {
  const box = el('div', 'af-prose');
  for (const block of blocks) {
    switch (block.type) {
      case 'heading': box.append(el(heading, 'af-title', block.text)); break;
      case 'paragraph': box.append(el('p', block.dropCap ? 'af-dropcap' : '', block.text)); break;
      case 'divider': box.append(el('hr', block.decorative ? 'af-divider af-divider--ornament' : 'af-divider')); break;
      case 'callout': { const n = el('aside', `af-alert af-alert--${block.tone}`, block.text); box.append(n); break; }
      case 'list': { const n = el(block.ordered ? 'ol' : 'ul', 'af-list'); block.items.forEach(t => n.append(el('li', '', t))); box.append(n); break; }
      case 'link': { const n = el('a', 'af-link', block.text); n.href = block.href; box.append(n); break; }
    }
  }
  return box;
}

export function renderCalendar(dateString: string, onSelect: (date: string) => void): HTMLElement {
  const root = el('div', 'af-calendar');
  let selected = dateString;
  let view = new Date(dateString + 'T12:00:00');
  const format = (d: Date) => `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const draw = (focusDate?: string) => {
    root.replaceChildren();
    const head = el('div', 'af-calendar__head');
    const changeMonth = (delta: number) => { view = new Date(view.getFullYear(), view.getMonth() + delta, 1, 12); draw(); root.querySelector<HTMLButtonElement>(delta < 0 ? '[data-prev]' : '[data-next]')?.focus(); };
    const prev = button('‹', () => changeMonth(-1), 'af-btn af-btn--clear af-btn--sm'); prev.setAttribute('aria-label', 'Предыдущий месяц'); prev.dataset.prev = '';
    const next = button('›', () => changeMonth(1), 'af-btn af-btn--clear af-btn--sm'); next.setAttribute('aria-label', 'Следующий месяц'); next.dataset.next = '';
    const title = el('span', 'af-calendar__month', view.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })); title.setAttribute('aria-live','polite');
    head.append(prev, title, next);
    const days = el('div', 'af-calendar__days'); days.setAttribute('role','group'); days.setAttribute('aria-label','Дни месяца');
    ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => days.append(el('span', 'af-calendar__weekday', d)));
    const year = view.getFullYear(), month = view.getMonth();
    const offset = (new Date(year, month, 1, 12).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0, 12).getDate();
    for (let i=0; i<offset; i++) days.append(el('span'));
    for (let day=1; day<=total; day++) {
      const d = new Date(year,month,day,12), iso = format(d);
      const b = button(String(day), () => { selected = iso; onSelect(iso); draw(iso); }, 'af-calendar__day');
      b.dataset.date = iso;
      b.setAttribute('aria-label', d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}));
      b.setAttribute('aria-pressed', String(selected === iso));
      b.tabIndex = iso === (focusDate || (selected.startsWith(`${year}-${String(month+1).padStart(2,'0')}`) ? selected : format(new Date(year,month,1,12)))) ? 0 : -1;
      b.addEventListener('keydown', e => {
        let delta = ({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7} as Record<string,number>)[e.key];
        if (e.key === 'Home') delta = -((d.getDay()+6)%7);
        if (e.key === 'End') delta = 6-((d.getDay()+6)%7);
        if (delta === undefined) return;
        e.preventDefault(); const target = new Date(year,month,day+delta,12); view=target; draw(format(target));
      });
      days.append(b);
    }
    root.append(head, days);
    if (focusDate) root.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
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
