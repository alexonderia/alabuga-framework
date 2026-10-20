import type {AFDocument,Section} from './schema.js';
import {el,button} from './dom.js';
import {styleElements} from './element-style.js';

export function styleSection(shell:HTMLElement,page:Section,kind:AFDocument['kind']){
 styleElements(shell,page,kind);
 const a=page.appearance;if(!a)return;
 shell.classList.add('af-composition','af-theme--'+a.theme,'af-spacing--'+a.spacing,'af-width--'+a.width,'af-decoration--'+a.decoration);
 shell.dataset.composition=page.composition??'blank';
 if(kind==='page'&&a.layout==='flow')shell.classList.add('af-flow');
 if(a.fitted)shell.classList.add('af-slide-fitted');
 if(a.fitted&&kind==='presentation')shell.style.setProperty('--af-fit-section-heading',(page.widgets.find(w=>w.typography)?.typography?.heading??64)+'px');
 if(a.backgroundPlacement)shell.dataset.backgroundPlacement=a.backgroundPlacement;
 if((a.theme==='image'||a.backgroundPlacement&&a.backgroundPlacement!=='none')&&a.background){const img=el('img','af-section-background');img.src=a.background;img.alt='';img.style.objectPosition=a.focal;if(a.focalPoint)img.style.setProperty('--af-focus',`${a.focalPoint.x}% ${a.focalPoint.y}%`);if(a.mobileFocalPoint)img.style.setProperty('--af-mobile-focus',`${a.mobileFocalPoint.x}% ${a.mobileFocalPoint.y}%`);shell.prepend(img);shell.classList.add('af-shade--'+a.shade)}
 page.widgets.forEach((w,i)=>{const box=shell.querySelector<HTMLElement>('[data-widget-id="'+w.id+'"]')!;const content=box.querySelector<HTMLElement>('.af-widget__content')!;if(kind==='presentation'&&w.typography){box.classList.add('af-slide-type');for(const [key,value]of Object.entries(w.typography))box.style.setProperty('--af-fit-'+key,value+'px');}if(['text','image','metric'].includes(w.type)){content.removeAttribute('role');content.removeAttribute('aria-label');content.removeAttribute('tabindex')}if(w.type==='image'){const img=box.querySelector('img');if(img&&w.focalPoint)img.style.setProperty('--af-focus',`${w.focalPoint.x}% ${w.focalPoint.y}%`);if(img&&w.mobileFocalPoint)img.style.setProperty('--af-mobile-focus',`${w.mobileFocalPoint.x}% ${w.mobileFocalPoint.y}%`)}box.style.setProperty('--af-tablet-span',w.position.width>6?'2':'1');box.classList.add('af-surface--'+(w.surface??'plain'));box.style.setProperty('--af-col',String(w.position.col));box.style.setProperty('--af-span',String(w.position.width));box.style.setProperty('--af-tablet-order',String(w.tabletOrder??i));box.style.setProperty('--af-mobile-order',String(w.mobileOrder??i));box.style.setProperty('--af-min-height',Math.max(48,w.position.height*32)+'px');});
}

export function experience(root:HTMLElement,doc:AFDocument,editable:boolean,goTo:(index:number)=>void){
 const events=new AbortController(),observers:IntersectionObserver[]=[];let reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const animate=(node:HTMLElement,effect:string,speed:string,intensity:string,delay=0)=>{
  if(reduced.matches||effect==='none')return;
  const distance=intensity==='expressive'?32:14;
  const from:Keyframe={opacity:0,transform:effect==='rise'?`translateY(${distance}px)`:effect==='scale'?'scale(.97)':'none'};
  node.animate([from,{opacity:1,transform:'none'}],{duration:speed==='fast'?220:speed==='slow'?650:400,delay,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
 };
 const play=(node:HTMLElement,w:AFDocument['pages'][number]['widgets'][number])=>{const m=w.motion;if(!m)return;const baseDelay=doc.kind==='page'?m.step*(m.speed==='slow'?240:m.speed==='fast'?90:160):0;if(m.effect==='sequence'){const children=Array.from(node.querySelector('.af-cards,.af-gallery,.af-prose')?.children??[]);children.forEach((child,i)=>animate(child as HTMLElement,'rise',m.speed,m.intensity,baseDelay+i*80));}else animate(node,m.effect,m.speed,m.intensity,baseDelay)};
 if(!editable&&doc.kind==='page')doc.pages.forEach(p=>p.widgets.forEach(w=>{if(!w.motion||w.motion.effect==='none')return;const node=root.querySelector<HTMLElement>('[data-widget-id="'+w.id+'"]')!;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();play(node,w)}},{threshold:.15});observer.observe(node);observers.push(observer)}));
 const reorder=()=>{if(doc.kind!=='page')return;const width=root.clientWidth;doc.pages.filter(p=>p.appearance?.layout==='flow').forEach(p=>{const panel=root.querySelector<HTMLElement>('[data-section-id="'+p.id+'"] > .af-panel');if(!panel)return;const sorted=p.widgets.map((w,i)=>({w,i,order:width<640?w.mobileOrder??i:width<1024?w.tabletOrder??i:i})).sort((a,b)=>a.order-b.order||a.i-b.i);for(const {w}of sorted){const box=panel.querySelector<HTMLElement>('[data-widget-id="'+w.id+'"]');if(box)panel.append(box)}})};
 window.addEventListener('beforeprint',()=>root.getAnimations({subtree:true}).forEach(a=>a.cancel()),{signal:events.signal});
 const layoutObserver=new ResizeObserver(reorder);layoutObserver.observe(root);reorder();
 const dialogs=new Map<string,HTMLDialogElement>(),returnFocus=new WeakMap<HTMLDialogElement,HTMLElement>();
 for(const modal of doc.modals??[]){const dialog=el('dialog','af-dialog af-content-dialog');const title=el('h2','',modal.title);title.id='dialog-'+modal.id;dialog.setAttribute('aria-labelledby',title.id);dialog.append(title,el('p','',modal.text),button('Закрыть',()=>dialog.close()));dialog.addEventListener('close',()=>returnFocus.get(dialog)?.focus({preventScroll:true}),{signal:events.signal});root.append(dialog);dialogs.set(modal.id,dialog)}
 root.addEventListener('click',event=>{const trigger=(event.target as HTMLElement).closest<HTMLElement>('[data-action-id]');if(!trigger)return;const w=doc.pages.flatMap(p=>p.widgets).find(w=>w.id===trigger.dataset.actionId);if(w?.type!=='button')return;if(editable){event.preventDefault();return}const a=w.action;if(a.type==='link')return;event.preventDefault();if(a.type==='modal'){const dialog=dialogs.get(a.target);if(dialog){returnFocus.set(dialog,trigger);dialog.showModal()}}else if(a.type==='close')trigger.closest('dialog')?.close();else if(a.type==='slide')goTo(doc.pages.findIndex(p=>p.id===a.target));else root.querySelector<HTMLElement>('[data-section-id="'+a.target+'"]')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});},{signal:events.signal});
 reduced.addEventListener('change',()=>{if(reduced.matches)root.getAnimations({subtree:true}).forEach(a=>a.cancel())},{signal:events.signal});
 return {play,destroy(){events.abort();layoutObserver.disconnect();observers.forEach(o=>o.disconnect());root.getAnimations({subtree:true}).forEach(a=>a.cancel());dialogs.forEach(d=>{if(d.open)d.close();d.remove()})}};
}
