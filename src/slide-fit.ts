import {resolveAssetUrl,type ResourceOptions} from './resource.js';
import {type Section,type SlideTypography,validateDocument,backgroundPlacements} from './schema.js';
import {renderDocument} from './runtime.js';
import backgrounds from './slide-backgrounds.json' with {type:'json'};
export const slideBackgrounds=backgrounds;
export type BackgroundPlacement=typeof backgroundPlacements[number];
export type FitSlideOptions=ResourceOptions&{documentTitle?:string;keepLayout?:boolean;keepBackground?:boolean;keepTypography?:boolean;placement?:BackgroundPlacement; backgroundId?:string;previousBackgrounds?:string[];index?:number;signal?:AbortSignal;resolveAsset?:(id:string)=>string|undefined};
export type FitSlideResult={success:boolean;slide:Section;changes:string[];issues:string[];candidates:number};
const profiles:SlideTypography[]=[{heading:112,body:40,cardTitle:44,caption:28,table:32,metric:144},{heading:96,body:40,cardTitle:44,caption:28,table:32,metric:144},{heading:80,body:36,cardTitle:40,caption:28,table:32,metric:120},{heading:64,body:32,cardTitle:36,caption:24,table:28,metric:96}];
const supported=new Set(['brand-cover','hero','asymmetric','split','text','features','steps','metrics','gallery','quote','comparison','divider','thesis','final','table']);
const plain={theme:'light',spacing:'generous',width:'wide',layout:'fixed',decoration:'none',focal:'center',shade:'strong'} as const;
function measurementDocument(slide:Section,title='Проверка оформления'){const copy=structuredClone(slide);for(const w of copy.widgets)if(w.type==='button'&&'target'in w.action)w.action={type:'link',href:'#'};return {schemaVersion:3 as const,kind:'presentation' as const,title,pages:[copy]}}
async function deadline<T>(work:Promise<T>,signal?:AbortSignal):Promise<T>{let timer:ReturnType<typeof setTimeout>|undefined;let cancel:()=>void=()=>{};try{return await Promise.race([work,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Не удалось загрузить шрифт или изображение.')),8000);cancel=()=>reject(signal?.reason??new Error('Отменено'));signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel()})])}finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel)}}
export async function measureSlide(slide:Section,options:FitSlideOptions={}):Promise<string[]>{
 options.signal?.throwIfAborted();const doc=measurementDocument(slide,options.documentTitle),valid=validateDocument(doc);if(!valid.success)return valid.issues.map(i=>i.message);
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-20000px;top:0;width:1600px;visibility:hidden;pointer-events:none';document.body.append(host);
 let controller:ReturnType<typeof renderDocument>|undefined;
 try{
  controller=renderDocument(host,doc,{editing:true,resolveAsset:options.resolveAsset,assetsBaseUrl:options.assetsBaseUrl});
  await deadline(document.fonts.ready,options.signal);await deadline(Promise.all(Array.from(host.querySelectorAll('img')).map(img=>img.decode())),options.signal);
  await new Promise<void>(r=>requestAnimationFrame(()=>r()));options.signal?.throwIfAborted();
  const issues=controller.checkOverflow(),shell=host.querySelector<HTMLElement>('.af-slide')!,bounds=shell.getBoundingClientRect();
  const placement=slide.appearance?.backgroundPlacement,side=placement?.includes('quarter')?400:placement?.includes('third')?1600/3:0,scale=bounds.width/1600;
  const background=backgrounds.find(b=>b.id===slide.appearance?.backgroundId||b.src===slide.appearance?.background);
  const safe=placement==='full'&&background?background.safeArea:undefined;
  if(slide.appearance?.background&&(placement==='full'||!placement&&slide.appearance.theme==='image')&&(!background||background.overlay==='strong')&&(slide.appearance.theme!=='image'||slide.appearance.shade!=='strong'))issues.push('Для текста поверх этого фона требуется контрастная тема с сильным затемнением. Снимите закрепление фона или измените его настройки.');
  for(const w of slide.widgets){
   const box=host.querySelector<HTMLElement>(`[data-widget-id="${w.id}"]`)!,rect=box.getBoundingClientRect();
   if(rect.left<bounds.left+24||rect.right>bounds.right-24||rect.top<bounds.top+24||rect.bottom>bounds.bottom-48)issues.push('Блок выходит за безопасную область: '+w.id);
   if(side&&(placement?.startsWith('left')?rect.left<bounds.left+(side+16)*scale:rect.right>bounds.right-(side+16)*scale))issues.push('Текст и боковая графика пересекаются: '+w.id);
   if(safe&&(rect.left<bounds.left+safe.x*16*scale||rect.right>bounds.left+(safe.x+safe.width)*16*scale||rect.top<bounds.top+safe.y*9*scale||rect.bottom>bounds.top+(safe.y+safe.height)*9*scale))issues.push('Блок выходит за безопасную область фона: '+w.id);
   for(const n of box.querySelectorAll<HTMLElement>('.af-widget__content,.af-table-scroll'))if(n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2)issues.push('Содержание не помещается: '+w.id);
   const minima:Record<string,number>={'.af-title,.af-quote__text':64,'.af-prose p,.af-list,.af-feature__text':32,'.af-feature__title':36,'.af-caption,.af-quote__author':24,'.af-table th,.af-table td':28,'.af-metric__value':96};
   for(const [selector,min]of Object.entries(minima))for(const n of box.querySelectorAll<HTMLElement>(selector))if(parseFloat(getComputedStyle(n).fontSize)<min-.1)issues.push('Размер текста ниже читаемого минимума: '+w.id);
   if(w.type==='table'&&w.rows.length>w.pageSize)issues.push('В таблице скрыты строки: '+w.id);
  }
  return [...new Set(issues)];
 }finally{controller?.destroy();host.remove()}
}
function layout(p:Section,placement:BackgroundPlacement,headerRows=2){
 const reserve=placement.includes('quarter')?3:placement.includes('third')?4:0,start=placement.startsWith('left')?reserve+1:1,width=12-reserve;
 p.grid={columns:12,rowHeight:64,gap:16};
 const set=(w:Section['widgets'][number],col:number,span:number,row:number,height:number)=>w.position={col,width:span,row,height};
 const buttons=p.widgets.filter(w=>w.type==='button'),content=p.widgets.filter(w=>w.type!=='button'),texts=content.filter(w=>w.type==='text');
 const lastRow=p.title?7:8,end=buttons.length?lastRow-1:lastRow;
 if(buttons.length>1)return false;
 if(buttons[0])set(buttons[0],start,width,lastRow,1);
 if(p.composition==='brand-cover'&&content.length===2&&texts.length===1&&content.some(w=>w.type==='image')){const img=content.find(w=>w.type==='image')!;set(img,start,Math.min(4,width),1,2);set(texts[0],start,width,3,end-2);return true}
 if(content.length===1){set(content[0],start,width,1,end);return true}
 const img=content.find(w=>w.type==='image');
 if(img&&content.length===2&&texts.length===1){const iw=Math.max(3,Math.floor(width*.42));set(texts[0],start,width-iw,1,end);set(img,start+width-iw,iw,1,end);return true}
 if(texts.length===1&&content.filter(w=>w.type==='metric').length===content.length-1){set(texts[0],start,width,1,headerRows);const metrics=content.filter(w=>w.type==='metric');metrics.forEach((w,i)=>{const left=Math.floor(i*width/metrics.length),right=Math.floor((i+1)*width/metrics.length);set(w,start+left,right-left,headerRows+1,end-headerRows)});return true}
 if(texts.length===1&&content.length===2){set(texts[0],start,width,1,headerRows);set(content.find(w=>w!==texts[0])!,start,width,headerRows+1,end-headerRows);return true}
 if(texts.length===content.length&&texts.length<=3){texts.forEach((w,i)=>{const row=Math.floor(i*end/texts.length);set(w,start,width,row+1,Math.floor((i+1)*end/texts.length)-row)});return true}
 return false;
}
export async function fitSlide(input:Section,options:FitSlideOptions={}):Promise<FitSlideResult>{
 const original=structuredClone(input),result=(issues:string[],candidates=0):FitSlideResult=>({success:false,slide:original,issues,changes:[],candidates});
 options.signal?.throwIfAborted();
 if(!input.widgets.length)return result(['Слайд пуст. Добавьте содержание перед подбором.']);
 if(options.backgroundId&&!options.keepBackground){const bg=backgrounds.find(b=>b.id===options.backgroundId);if(!bg)return result(['Фон отсутствует в фирменном каталоге. Выберите другой материал.']);if(options.placement&&options.placement!=='none'&&!bg.placements.includes(options.placement))return result(['Этот фон нельзя использовать выбранной полосой. Выберите полный фон или другой материал.'])}
 const images=input.widgets.flatMap(w=>w.type==='image'?[w.src]:w.type==='gallery'?w.items.map(i=>i.src):[]);if(options.keepBackground&&input.appearance?.background)images.push(input.appearance.background);
 try{await deadline(Promise.all([...new Set(images)].map(async src=>{const img=new Image();img.src=src.startsWith('asset:')?options.resolveAsset?.(src.slice(6))??'':resolveAssetUrl(src,options);await img.decode()})),options.signal)}catch(e){options.signal?.throwIfAborted();return result(['Не удалось загрузить изображение. Проверьте материалы слайда. '+String(e)])}
 let best:Section|undefined,bestScore=-Infinity,candidates=0,last:string[]=[];const seen=new Set<string>();
 const known=supported.has(input.composition??''),canLayout=known&&!options.keepLayout&&!input.layoutVariant;
 const placements=options.keepBackground?[input.appearance?.backgroundPlacement??(input.appearance?.background?'full':'none')]:options.placement?[options.placement]:['right-third','left-quarter','full','none','right-quarter','left-third'] as BackgroundPlacement[];
 search:for(const placement of placements)for(const headerRows of (canLayout?[2,3,4]:[2])){
  const base=structuredClone(input);base.appearance={...plain,...base.appearance,fitted:true,layout:'fixed'};
  if(canLayout&&!layout(base,placement,headerRows)){base.widgets=structuredClone(input.widgets);base.grid=structuredClone(input.grid)}
  if(!options.keepBackground){
   base.appearance.decoration='none';base.appearance.backgroundPlacement=placement;
   if(placement==='none'){delete base.appearance.background;delete base.appearance.backgroundId;base.appearance.theme='light'}else{
    let choices=backgrounds.filter(b=>b.placements.includes(placement)&&(!options.backgroundId?b.automatic:b.id===options.backgroundId));
    const previous=(options.previousBackgrounds??[]).map(value=>backgrounds.find(b=>b.src===value)?.id??value);if(!options.backgroundId&&previous.length>=2&&previous.at(-1)===previous.at(-2)&&choices.some(b=>b.id!==previous.at(-1)))choices=choices.filter(b=>b.id!==previous.at(-1));
    if(!choices.length)continue;const bg=choices[(options.index??0)%choices.length];base.appearance.background=bg.src;base.appearance.backgroundId=bg.id;base.appearance.focalPoint=bg.focalPoint;base.appearance.shade='strong';base.appearance.theme=placement==='full'?(bg.overlay==='strong'?'image':'light'):'light';
   }
  }
  for(const [rank,profile]of profiles.entries()){
   if(options.keepTypography&&rank)break;options.signal?.throwIfAborted();const candidate=structuredClone(base);
   for(const w of candidate.widgets){if(!options.keepTypography&&!(w.style?.locked&&w.typography))w.typography={...profile};if(w.type==='table'&&w.rows.length<=100)w.pageSize=Math.max(1,w.rows.length);if(w.type==='image'&&/логотип|logo/i.test(w.alt))w.fit='contain'}
   const preferred=['right-third','full','left-quarter','none'][(options.index??0)%4];const score=100-rank*12+(placement===preferred?10:placement==='none'?0:4);
   if(score<=bestScore)break;const key=JSON.stringify(candidate);if(seen.has(key))continue;seen.add(key);candidates++;
   try{last=await measureSlide(candidate,options)}catch(e){options.signal?.throwIfAborted();last=[String(e)];continue}
   if(last.length)continue;
   if(score>bestScore){bestScore=score;best=candidate}
   if(score===110)break search;break;
  }
 }
 if(!best)return result([...new Set([...last,'Содержание не помещается при читаемом размере. Разделите слайд или снимите закрепление настроек.'])],candidates);
 return {success:true,slide:best,candidates,issues:known?[]:['Пользовательская структура сохранена без перестановки элементов.'],changes:['Подобраны читаемые размеры текста','Проверены границы и переносы',...(canLayout?['Подобрана сетка']:[]),...(!options.keepBackground?['Подобрано фирменное оформление']:[])]};
}
