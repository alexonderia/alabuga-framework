import {type AFDocument,type Section,type Widget,validateDocument} from './schema.js';
export const layoutVariants=[['primary','Колонки / слева'],['stacked','Вертикально / сверху'],['asymmetric','Асимметрия / справа']] as const;
export type LayoutVariant=typeof layoutVariants[number][0];
const supported=new Set(['text','thesis','divider','hero','split','asymmetric','features','comparison','steps','metrics']);
export function semanticSlots(section:Section):Map<string,Widget>{
 const result=new Map<string,Widget>();const count=new Map<string,number>();
 for(const w of section.widgets){const n=count.get(w.type)??0;count.set(w.type,n+1);const key=w.slot??`${w.type}-${n}`;if(result.has(key))throw new Error('Повторяется смысловое место: '+key);result.set(key,w)}return result;
}
export function applyLayoutVariant(section:Section,variant:LayoutVariant,kind:AFDocument['kind']):Section{
 if(!supported.has(section.composition??''))throw new Error('Для этой композиции сохраните текущую сетку или добавьте секцию из каталога.');
 const p=structuredClone(section);const slots=semanticSlots(p);for(const [slot,w]of slots)w.slot=slot;
 const texts=p.widgets.filter(w=>w.type==='text'),images=p.widgets.filter(w=>w.type==='image'),cards=p.widgets.filter(w=>w.type==='cards'),metrics=p.widgets.filter(w=>w.type==='metric'),buttons=p.widgets.filter(w=>w.type==='button');
 if(texts.length!==1||images.length>1||cards.length>1||buttons.length>1||p.widgets.length!==texts.length+images.length+cards.length+metrics.length+buttons.length||images.length+cards.length+Number(!!metrics.length)>1)throw new Error('Дополнительные элементы не помещаются в этот вариант. Текущая компоновка сохранена.');
 p.layoutVariant=variant;p.grid={columns:12,rowHeight:64,gap:16};
 const set=(w:Widget,col:number,row:number,width:number,height:number)=>w.position={col,row,width,height};
 const end=buttons.length?6:7;
 if(images.length){
  if(variant==='stacked'){set(images[0],1,1,12,3);set(texts[0],1,4,12,end-3)}
  else{const left=variant==='primary';set(images[0],left?1:8,1,5,end);set(texts[0],left?7:1,1,6,end)}
 }else if(cards.length||metrics.length){
  const aside=variant==='asymmetric';set(texts[0],1,1,aside?4:12,aside?end:2);
  if(cards.length)set(cards[0],aside?5:1,aside?1:3,aside?8:12,aside?end:end-2);
  else metrics.forEach((w,i)=>{if(metrics.length>3)throw new Error('Вариант рассчитан максимум на три показателя.');if(variant==='stacked')set(w,1,3+i*2,12,2);else{const span=Math.floor((aside?8:12)/metrics.length);set(w,(aside?5:1)+i*span,aside?1:3,span,aside?end:end-2)}});
 }else set(texts[0],variant==='asymmetric'?5:variant==='stacked'?2:1,1,variant==='asymmetric'?8:variant==='stacked'?10:12,end);
 if(buttons[0])set(buttons[0],1,7,4,1);
 // Validate geometry without requiring unrelated targets from the complete document.
 const isolated=structuredClone(p);for(const w of isolated.widgets)if(w.type==='button')w.action={type:'link',href:'#'};
 const valid=validateDocument({schemaVersion:3,kind,title:'Layout',pages:[isolated]});if(!valid.success)throw new Error(valid.issues.map(i=>i.message).join('; '));
 return p;
}
