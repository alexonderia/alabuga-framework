import {el,button} from '@alabuga/framework/dom';
import {readImage} from './export';
import {loadBrandManifest} from './brand-manifest';
import {listAssets} from './storage';

export async function chooseAsset(apply:(src:string)=>void){
 const manifest=await loadBrandManifest();
 const dialog=el('dialog','asset-library'),grid=el('div','asset-grid'),filter=el('select','af-select'),error=el('p','af-error');filter.setAttribute('aria-label','Категория материалов');
 for(const [value,label] of [['background','Фоны'],['logo','Логотипы'],['photo','Фотографии'],['decoration','Графика'],['local','Материалы моих проектов']]){const o=el('option','',label);o.value=value;filter.append(o)}
 const upload=el('input','af-input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp,image/gif';upload.setAttribute('aria-label','Загрузить свой материал');upload.addEventListener('change',async()=>{try{if(upload.files?.[0]){apply(await readImage(upload.files[0]));dialog.close()}}catch(e){error.textContent=String(e)}});
 const draw=()=>{grid.replaceChildren();if(filter.value==='local'){void listAssets().then(assets=>{if(filter.value!=='local'||!dialog.isConnected)return;for(const [i,a]of assets.entries()){const b=button('',()=>{apply(a.data);dialog.close()},'asset-card'),img=el('img');img.src=a.data;img.alt='';img.loading='lazy';b.append(img,el('strong','',`Материал ${i+1}`),el('small','',a.id.slice(0,12)));grid.append(b)}if(!assets.length)grid.append(el('p','','Пока нет сохранённых материалов.'))}).catch(e=>error.textContent=String(e));return}for(const a of manifest.assets.filter(a=>a.category===filter.value&&'url'in a)){const b=button('',()=>{apply(a.url!);dialog.close()},'asset-card'),img=el('img');img.src=a.thumbnail!;img.alt='';img.loading='lazy';b.append(img,el('strong','',a.name),el('small','',`${a.width} × ${a.height} · слайды ${a.slides.join(', ')||'шаблон'}`),el('small','',a.usage));grid.append(b)}};
 dialog.append(el('h2','','Библиотека материалов'),button('Закрыть',()=>dialog.close()),filter,el('label','','Или загрузите своё изображение'),upload,error,grid);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());filter.addEventListener('change',draw);draw();dialog.showModal();
}

export type FocalPoint={x:number;y:number};
export function cropControl(host:HTMLElement,src:string,point:FocalPoint|undefined,change:(p:FocalPoint)=>void,label:string,options:{fit?:'cover'|'contain';aspectRatio?:number}={}){
 const wrap=el('fieldset','crop-control');wrap.append(el('legend','',label));const frame=el('div','crop-frame'),img=el('img');img.src=src;img.alt='Перетащите изображение для изменения кадра';img.draggable=false;frame.tabIndex=0;frame.setAttribute('role','slider');frame.setAttribute('aria-label',label);frame.setAttribute('aria-valuemin','0');frame.setAttribute('aria-valuemax','100');let p=point??{x:50,y:50};
 const paint=()=>{img.style.objectPosition=`${p.x}% ${p.y}%`;frame.setAttribute('aria-valuenow',String(p.x));frame.setAttribute('aria-valuetext',`${p.x}% по горизонтали, ${p.y}% по вертикали`)};
 const disabled=options.fit==='contain';img.style.objectFit=options.fit??'cover';if(disabled){frame.tabIndex=-1;frame.setAttribute('aria-disabled','true')}
 if(options.aspectRatio){frame.style.cssText=`height:auto;aspect-ratio:${options.aspectRatio};position:relative`;img.style.position='absolute';img.style.inset='0'}
 frame.append(img);wrap.append(frame,el('p','af-help',disabled?'Изображение показано целиком. Для кадрирования выберите «Заполнить блок» в поле «Размещение».':'Перетаскивайте или используйте стрелки. Если изображение точно совпадает с рамкой, сдвиг не меняет видимый кадр.'));host.append(wrap);paint();
 frame.addEventListener('keydown',e=>{if(disabled)return;const d=({ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]} as Record<string,number[]>)[e.key];if(!d)return;e.preventDefault();p={x:Math.max(0,Math.min(100,p.x+d[0])),y:Math.max(0,Math.min(100,p.y+d[1]))};paint();change(p)});
 frame.addEventListener('pointerdown',e=>{if(disabled)return;frame.setPointerCapture(e.pointerId);const origin={x:e.clientX,y:e.clientY,p:{...p}},abort=new AbortController();frame.addEventListener('pointermove',ev=>{p={x:Math.round(Math.max(0,Math.min(100,origin.p.x-(ev.clientX-origin.x)/frame.clientWidth*100))),y:Math.round(Math.max(0,Math.min(100,origin.p.y-(ev.clientY-origin.y)/frame.clientHeight*100)))};paint()},{signal:abort.signal});frame.addEventListener('pointerup',()=>{abort.abort();change(p)},{once:true,signal:abort.signal});frame.addEventListener('pointercancel',()=>{abort.abort();p=origin.p;paint()},{once:true,signal:abort.signal})});
}
