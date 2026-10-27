import {resolveAssetUrl,type ResourceOptions} from './resource.js';
import { validateDocument, type AFDocument } from './schema.js';
import { el, button } from './dom.js';
import { renderWidget } from './widgets.js';
import {styleSection,experience} from './experience.js';

export interface DocumentController {
  update(input: unknown): void;
  /** Synchronize data after an inline editor has already updated the DOM. Editing mode only. */
  synchronize(input:unknown):void;
  destroy(): void;
  getDocument(): AFDocument;
  goToSlide(index: number): void;
  next():void;
  previous():void;
  checkOverflow(): string[];
}
const mounted = new WeakMap<HTMLElement, DocumentController>();
export function renderDocument(container: HTMLElement, input: unknown,options:ResourceOptions&{editing?:boolean;slideOffset?:number;slideCount?:number;resolveAsset?:(id:string)=>string|undefined}={}): DocumentController {
  const parsed=validateDocument(input);
  if(!parsed.success)throw new Error(parsed.issues.map(i=>`${i.path}: ${i.message}`).join('\n'));
  const resolveAsset=(src:string)=>src.startsWith('asset:')?(options.resolveAsset?.(src.slice(6))??''):resolveAssetUrl(src,options);
  mounted.get(container)?.destroy();
  let doc=parsed.data, index=0, disposed=false, observer:ResizeObserver|undefined, events:AbortController;
  let slides:HTMLElement[]=[],viewport:HTMLElement|undefined,stage:HTMLElement|undefined,status:HTMLElement|undefined;
  let step=0,fx:ReturnType<typeof experience>|undefined;
  const steps=(i:number)=>[...new Set(doc.pages[i]?.widgets.map(w=>w.motion?.step??0).filter(n=>n>0)??[])].sort((a,b)=>a-b);
  const reveal=()=>slides.forEach((s,i)=>s.querySelectorAll<HTMLElement>('[data-widget-id]').forEach(n=>{const w=doc.pages[i].widgets.find(w=>w.id===n.dataset.widgetId)!;const hidden=!options.editing&&(w.motion?.step??0)>(steps(i)[step-1]??0);n.classList.toggle('af-step-hidden',hidden);n.inert=hidden;n.setAttribute('aria-hidden',String(hidden))}));
  const requireLive=()=>{if(disposed)throw new Error('Документ уже уничтожен')};
  const overflow=()=>slides.flatMap((slide,i)=>{
    const problems:string[]=[];
    const panel=slide.querySelector<HTMLElement>('.af-panel');
    if(panel && panel.offsetTop+panel.offsetHeight>slide.clientHeight-48)problems.push(`Слайд ${i+1}: заголовок и панель превышают высоту холста`);
    for(const n of slide.querySelectorAll<HTMLElement>('.af-widget__content,.af-table-scroll')){
      if(n.scrollHeight>n.clientHeight+2 || n.scrollWidth>n.clientWidth+2)problems.push(`Слайд ${i+1}: ${n.closest<HTMLElement>('[data-widget-id]')?.dataset.widgetId}`);
    }
    return problems;
  });
  const resize=()=>{if(!viewport||!stage)return;const scale=Math.min(1,viewport.clientWidth/1600,document.fullscreenElement?Math.max(100,innerHeight-80)/900:1);stage.style.transform=`scale(${scale})`;viewport.style.height=`${900*scale}px`};
  const show=(next:number)=>{
    step=0;
    index=Math.max(0,Math.min(slides.length-1,next));
    slides.forEach((s,i)=>{s.classList.toggle('af-slide--active',i===index);s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index))});
    if(status)status.textContent=`${index+1} / ${slides.length}`;
    reveal();
    if(!options.editing)doc.pages[index]?.widgets.filter(w=>!w.motion?.step).forEach(w=>{const n=slides[index]?.querySelector<HTMLElement>('[data-widget-id="'+w.id+'"]');if(n)fx?.play(n,w)});
    if(!options.editing&&slides[index]&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const transition=doc.pages[index].transition;if(transition&&transition!=='none')slides[index].animate([{opacity:0,transform:transition==='slide'?'translateX(30px)':'none'},{opacity:1,transform:'none'}],{duration:400});}
  };
  const nextStep=()=>{if(step<steps(index).length){step++;reveal();doc.pages[index].widgets.filter(w=>w.motion?.step===steps(index)[step-1]).forEach(w=>{const n=slides[index].querySelector<HTMLElement>('[data-widget-id="'+w.id+'"]');if(n)fx?.play(n,w)});if(status)status.textContent=`${index+1} / ${slides.length} · шаг ${step}`}else if(index<slides.length-1)show(index+1)};
  const previousStep=()=>{if(step>0){step--;reveal();if(status)status.textContent=`${index+1} / ${slides.length} · шаг ${step}`}else if(index>0){show(index-1);step=steps(index).length;reveal()}};
  const draw=()=>{
    fx?.destroy();events?.abort();observer?.disconnect();events=new AbortController();slides=[];viewport=undefined;stage=undefined;status=undefined;
    container.replaceChildren();
    const root=el('div',`af af-document af-document--${doc.kind}`);
    if(doc.kind==='presentation'||!doc.pages[0].title)root.append(el('h1','af-sr-only',doc.title));
    if(doc.kind==='presentation'){
      root.tabIndex=0;root.setAttribute('role','region');root.setAttribute('aria-label',doc.title);
      viewport=el('div','af-deck');stage=el('div','af-deck__stage');viewport.append(stage);root.append(viewport);
    }
    for(const page of doc.pages){
      const shell=el(doc.kind==='page'&&page.role==='header'?'header':doc.kind==='page'&&page.role==='footer'?'footer':'section',doc.kind==='presentation'?'af-slide':'af-page');
      if(page.role)shell.classList.add('af-section--'+page.role);
      shell.dataset.sectionId=page.id;
      shell.id=page.id;
      if(doc.kind==='presentation'){
        const header=el('span','af-eyebrow',page.chrome?.header?.text?.trim()||'АЛАБУГА / '+doc.title);
        if(page.chrome?.header?.visible===false){header.style.visibility='hidden';header.setAttribute('aria-hidden','true')}
        shell.append(header);
      }
      if(page.title)shell.append(el(doc.kind==='presentation'||page!==doc.pages[0]?'h2':'h1',doc.kind==='presentation'?'af-slide__title':'af-heading',page.title));
      const panel=el('div','af-panel');panel.style.setProperty('--af-columns',String(page.grid.columns));panel.style.setProperty('--af-row-height',page.grid.rowHeight+'px');panel.style.setProperty('--af-panel-gap',page.grid.gap+'px');
      for(const w of page.widgets){
        const rendered=w.type==='image'?{...w,src:resolveAsset(w.src)}:w.type==='gallery'?{...w,items:w.items.map(item=>({...item,src:resolveAsset(item.src)}))}:w;
        const box=renderWidget(rendered,(id,date)=>{
          for(const p of doc.pages){const target=p.widgets.find(x=>x.id===id);if(target?.type==='calendar')target.date=date;}
          container.dispatchEvent(new CustomEvent('af:change',{detail:{widgetId:id,value:date}}));
        });
        box.style.gridColumn=`${w.position.col} / span ${w.position.width}`;box.style.gridRow=`${w.position.row} / span ${w.position.height}`;
        if(page.role&&w.type==='text'&&w.content.length&&w.content.every(b=>b.type==='link')){const content=box.querySelector<HTMLElement>('.af-widget__content')!,nav=el('nav');nav.setAttribute('aria-label',page.role==='header'?'Навигация сайта':'Ссылки в подвале');nav.append(...Array.from(content.childNodes));content.append(nav)}
        box.style.setProperty('--af-widget-rows',String(w.position.height));panel.append(box);
      }
      shell.append(panel);
      styleSection(shell,page.appearance?.background?{...page,appearance:{...page.appearance,background:resolveAsset(page.appearance.background)}}:page,doc.kind);
      if(doc.kind==='presentation'){
        const config=page.chrome?.number,n=slides.length+1+(options.slideOffset??0),total=options.slideCount??doc.pages.length;
        if(config?.visible!==false){const number=el('span','af-slide__number',config?.value?.trim()||(config?.format==='total'?`${n} / ${total}`:config?.format==='plain'?String(n):String(n).padStart(2,'0')));number.dataset.position=config?.position??'right';if(config?.background)number.dataset.numberBackground=config.background;if(config?.color)number.dataset.numberColor=config.color;shell.append(number)}
        slides.push(shell);stage!.append(shell);
      }else root.append(shell);
    }
    if(doc.kind==='presentation'){
      const controls=el('nav','af-deck__controls');controls.setAttribute('aria-label','Навигация презентации');
      status=el('span','af-caption');status.setAttribute('aria-live','polite');
      const warning=el('p','af-alert af-alert--warning');warning.hidden=true;warning.setAttribute('role','status');
      const check=()=>{const issues=overflow();warning.hidden=!issues.length;warning.textContent=issues.length?'Содержимое не помещается. Измените размеры или сократите текст. '+[...new Set(issues)].join('; '):'';return issues};
      controls.append(button('← Назад',previousStep),status,button('Далее →',nextStep),button('На весь экран',()=>{if(document.fullscreenElement)void document.exitFullscreen();else void root.requestFullscreen?.()}),button('Печать / PDF',()=>{if(!check().length)window.print()}));
      root.append(controls,warning);
      root.addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('button,input,textarea,select,a,.af-widget__content,[contenteditable]'))return;if(['ArrowRight','PageDown','ArrowLeft','PageUp','Home','End',' '].includes(e.key)){e.preventDefault();if(e.key==='Home'||e.key==='End')show(e.key==='Home'?0:slides.length-1);else if(['ArrowRight','PageDown',' '].includes(e.key))nextStep();else previousStep()}},{signal:events.signal});
      window.addEventListener('beforeprint',()=>{slides.forEach(s=>{s.inert=false});check()},{signal:events.signal});
      window.addEventListener('afterprint',()=>show(index),{signal:events.signal});
      document.addEventListener('fullscreenchange',resize,{signal:events.signal});
    }
    container.append(root);
    fx=experience(root,doc,!!options.editing,show);
    if(viewport){observer=new ResizeObserver(resize);observer.observe(viewport);resize();show(index)}
  };
  const controller:DocumentController={
    synchronize(input){requireLive();if(!options.editing)throw new Error('Синхронизация доступна только редактору');const r=validateDocument(input);if(!r.success)throw new Error(r.issues.map(i=>i.message).join('\n'));doc=r.data},
    update(next){requireLive();const r=validateDocument(next);if(!r.success)throw new Error(r.issues.map(i=>`${i.path}: ${i.message}`).join('\n'));
      const previous=doc;doc=r.data;
      if(options.editing&&previous.kind===doc.kind&&previous.title===doc.title&&JSON.stringify(previous.modals)===JSON.stringify(doc.modals)&&previous.pages.map(p=>p.id).join()===doc.pages.map(p=>p.id).join()){
        doc.pages.forEach((p,i)=>{const old=previous.pages[i];if(JSON.stringify(old)===JSON.stringify(p))return;
          const shell=container.querySelector<HTMLElement>('[data-section-id="'+p.id+'"]')!;
          // Render a single changed section. Targets are preserved by validating the full document above.
          const isolated=structuredClone(p);isolated.widgets.forEach(w=>{if(w.type==='button'&&'target'in w.action)w.action={type:'link',href:'#'}});
          const host=el('div'),temp=renderDocument(host,{...doc,pages:[isolated]},{editing:true,resolveAsset:options.resolveAsset,assetsBaseUrl:options.assetsBaseUrl});const fresh=host.querySelector<HTMLElement>('[data-section-id]')!;
          const {widgets:ow,...oa}=old,{widgets:nw,...na}=p;
          if(JSON.stringify(oa)===JSON.stringify(na)){
            const panel=shell.querySelector('.af-panel')!;for(const w of p.widgets){const existing=panel.querySelector<HTMLElement>('[data-widget-id="'+w.id+'"]');if(JSON.stringify(old.widgets.find(x=>x.id===w.id))===JSON.stringify(w))continue;const replacement=fresh.querySelector<HTMLElement>('[data-widget-id="'+w.id+'"]')!;if(existing)existing.replaceWith(replacement);else panel.append(replacement)}
            for(const box of panel.querySelectorAll<HTMLElement>('[data-widget-id]'))if(!p.widgets.some(w=>w.id===box.dataset.widgetId))box.remove();
          }else{shell.replaceWith(fresh);if(doc.kind==='presentation')slides[i]=fresh}
          temp.destroy();
        });
        fx?.destroy();fx=experience(container.firstElementChild as HTMLElement,doc,true,show);if(doc.kind==='presentation'){resize();show(index)}
      }else draw();
    },
    destroy(){if(disposed)return;disposed=true;fx?.destroy();events?.abort();observer?.disconnect();container.replaceChildren();if(mounted.get(container)===controller)mounted.delete(container)},
    getDocument(){return structuredClone(doc)},
    goToSlide(next){requireLive();if(doc.kind!=='presentation'||!Number.isInteger(next))throw new Error('Ожидается индекс слайда');show(next)},
    checkOverflow(){requireLive();return overflow()},
    next(){requireLive();if(doc.kind==='presentation')nextStep()},previous(){requireLive();if(doc.kind==='presentation')previousStep()},
  };
  draw();mounted.set(container,controller);return controller;
}
