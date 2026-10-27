import type {AFDocument,Section,Widget} from './schema.js';
import {brandAssets} from './brand.js';
import {semanticSlots} from './layout-variants.js';

export const compositions=[
 ['brand-cover','Фирменная обложка','Логотип, крупный тезис и свободное поле'],['asymmetric','Асимметрия','Фирменная графика и смещённый тезис'],
 ['header','Шапка','Название и навигация'],['hero','Обложка','Крупный тезис и главное действие'],['text','Текст','Заголовок и абзац'],['split','История','Текст и изображение'],['features','Преимущества','Три аргумента'],['metrics','Показатели','Факты крупным планом'],['steps','Этапы','Последовательность действий'],['gallery','Галерея','Визуальный рассказ'],['quote','Цитата','Одна сильная мысль'],['comparison','Сравнение','Два подхода рядом'],['cta','Призыв к действию','Следующий шаг'],['footer','Подвал','Ссылки и контакты'],['divider','Разделитель','Начало главы'],['thesis','Тезис','Фокус на главном'],['final','Финал','Итог и действие'],['blank','Пустая композиция','Своя история'],
] as const;
export const compositionCatalog=(kind:AFDocument['kind'])=>compositions.filter(([id])=>kind==='page'?!['divider','thesis','final'].includes(id):!['header','footer','cta'].includes(id));
const uid=(prefix:string)=>prefix+'-'+crypto.randomUUID();
const art='../assets/brand-landscape.svg';
export function makeComposition(name:string,kind:AFDocument['kind']='page'):Section{
 const page:Section={id:uid('section'),title:'',composition:name,grid:{columns:12,rowHeight:64,gap:16},widgets:[],appearance:{theme:'light',spacing:'generous',width:'wide',layout:kind==='page'?'flow':'fixed',decoration:'none',focal:'center',shade:'strong'},transition:'fade'};
 const add=(type:Widget['type'],col:number,width:number,row=1,height=3)=>{const base={id:uid('block'),title:'',position:{col,row,width,height},surface:'plain' as const};let w:Widget;
 switch(type){case 'text':w={...base,type,content:[]};break;case 'image':w={...base,type,src:art,alt:'Фирменная геометрическая композиция',fit:'cover',caption:''};break;case 'button':w={...base,type,label:'Узнать больше',variant:'primary',action:{type:'link',href:'https://example.com'}};break;case 'metric':w={...base,type,value:'01',note:'Пояснение'};break;case 'quote':w={...base,type,text:'Сильная идея заслуживает ясной формы.',author:'Принцип Alabuga Framework'};break;case 'cards':w={...base,type,items:[]};break;case 'gallery':w={...base,type,items:[{src:art,alt:'Фирменная графика',caption:'Композиция и ритм'},{src:art,alt:'Геометрическая графика',caption:'Цвет и масштаб'}]};break;default:throw new Error('Неподдерживаемый элемент композиции')};page.widgets.push(w);return w;
 };
 const text=(title:string,body:string,col=1,width=12,row=1,height=3)=>{const w=add('text',col,width,row,height);if(w.type==='text')w.content=[{type:'heading',text:title},...(body?[{type:'paragraph' as const,text:body,dropCap:false}]:[])];return w};
 if(name==='brand-cover'){
  const logo=add('image',1,3,1,2);if(logo.type==='image'){logo.src=brandAssets.logo;logo.alt='Алабуга';logo.fit='contain'}
  text('Сильная идея.\nФирменная форма.','Сайты и презентации, которые вы создаёте сами.',1,10,3,4);const b=add('button',1,4,7,1);if(b.type==='button')b.label='Создать свою историю';
 }
 if(name==='asymmetric'){
  page.appearance!.theme='contrast';const graphic=add('image',1,5,1,7);if(graphic.type==='image'){graphic.src=brandAssets.glass;graphic.alt='Световая геометрия из фирменного шаблона'}
  text('Управляйте\nвниманием.','Форма, ритм и акцент помогают раскрыть вашу мысль.',7,6,2,4);const b=add('button',7,4,6,1);if(b.type==='button')b.label='Выбрать композицию';
 }
 if(['hero','divider','thesis','final','cta'].includes(name)){
  page.appearance!.theme=name==='hero'||name==='final'?'contrast':'accent';page.appearance!.decoration='orbit';
  text(name==='hero'?'Одна идея.\nРазные формы.':name==='divider'?'От идеи\nк форме.':name==='thesis'?'Содержание\nстановится дизайном.':name==='final'?'Создавайте\nследующую историю.':'Начните с сильной идеи.',name==='divider'?'':'Alabuga Framework — сайты и презентации на одном визуальном языке.',1,10,1,5);
  if(!['divider','thesis'].includes(name))add('button',1,4,6,1);
  if(name==='final')text('Продолжим историю?','Команда проекта · добавьте контакт для обратной связи.',7,6,6,2);
 }
 if(name==='split'){text('Расскажите\nо главном.','Соедините ясный текст, выразительное изображение и свободное пространство.',1,6,1,5);const w=add('image',8,5,1,5);if(w.type==='image'){w.src=brandAssets.blue;w.alt='Фирменная геометрия и свет'}}
 if(name==='text')text('Расскажите о главном','Нажмите на текст и добавьте свою историю.',1,12,1,4);
 if(name==='features'||name==='steps'){text(name==='steps'?'От замысла\nдо публикации.':'Всё работает\nвместе.','',1,12,1,2);const w=add('cards',1,12,3,4);if(w.type==='cards')w.items=name==='steps'?[{title:'01 / Выберите',text:'Найдите композицию для своей истории.'},{title:'02 / Настройте',text:'Добавьте содержание и фирменные акценты.'},{title:'03 / Покажите',text:'Скачайте HTML или проведите презентацию.'}]:[{title:'Единый стиль',text:'Типографика, палитра и ритм уже согласованы.'},{title:'Живой редактор',text:'Изменения видны прямо на странице.'},{title:'Своя история',text:'Сочетайте композиции и управляйте вниманием.'}]}
 if(name==='metrics'){text('Одна система.\nДва формата.','',1,12,1,2);for(let i=0;i<3;i++){const w=add('metric',1+i*4,4,3,3);if(w.type==='metric'){w.value=['01','02','∞'][i];w.note=['Визуальный язык','Формата: сайт и презентация','Идей для ваших историй'][i]}}}
 if(name==='gallery'){text('Показывайте,\nа не только рассказывайте.','',1,12,1,2);const w=add('gallery',1,12,3,4);if(w.type==='gallery'){w.items[0].src=brandAssets.blue;w.items[1].src=brandAssets.glass}}
 if(name==='quote'){page.appearance!.theme='image';page.appearance!.background=brandAssets.quote;add('quote',2,10,1,5)}
 if(name==='comparison'){text('Общее основание.\nРазные сценарии.','',1,12,1,2);const w=add('cards',1,12,3,4);if(w.type==='cards')w.items=[{title:'Сайт',text:'Прокрутка, адаптивные секции и действия посетителя.'},{title:'Презентация',text:'Формат 16:9, последовательный показ и переходы.'}]}
 if(name==='header'||name==='footer'){page.role=name;page.appearance!.spacing='compact';text('alabuga / framework',name==='footer'?'Создавайте в едином стиле.':'',1,4,1,2);const w=add('text',6,7,1,2);if(w.type==='text')w.content=[{type:'link',text:'О системе',href:'#'},{type:'link',text:'Композиции',href:'#'},{type:'link',text:'Начать',href:'#'}];if(name==='footer')page.appearance!.theme='contrast'}
 return page;
}

export function changeComposition(section:Section,name:string,kind:AFDocument['kind']):Section{
 const target=makeComposition(name,kind);
 if(!section.widgets.length)return {...target,id:section.id,title:section.title,appearance:section.appearance??target.appearance,...(section.chrome?{chrome:structuredClone(section.chrome)}:{})};
 const source=semanticSlots(section),dest=semanticSlots(target);
 if(source.size!==dest.size||[...dest].some(([slot,w])=>source.get(slot)?.type!==w.type))throw new Error('В этой композиции другие места для содержимого. Выберите совместимый вариант или добавьте новую секцию.');
 const result=structuredClone(section);result.composition=name;delete result.layoutVariant;
 const current=semanticSlots(result);for(const [slot,w]of current){w.position={...dest.get(slot)!.position}}return result;
}
export function showcase(kind:AFDocument['kind']='page'):AFDocument{
 const names=kind==='page'?['header','brand-cover','split','features','metrics','steps','asymmetric','quote','cta','footer']:['brand-cover','asymmetric','thesis','split','features','metrics','comparison','steps','gallery','quote','final'];
 const pages=names.map(n=>makeComposition(n,kind));
 const final=pages.find(p=>p.composition==='final');if(final){const contacts=final.widgets.at(-1);if(contacts?.type==='text')contacts.content=[{type:'paragraph',text:'Alabuga Framework\nСохраните проект. Поделитесь результатом.',dropCap:false}]}
  pages.forEach((p,i)=>{p.widgets.forEach((w,j)=>{w.motion={effect:j?'rise':'fade',speed:'normal',intensity:'subtle',step:kind==='presentation'&&j>0?j:0};if(w.type==='button')w.action={type:'modal',target:'about-framework'};if(kind==='page'&&(p.role==='header'||p.role==='footer')&&w.type==='text')w.content.forEach((b,k)=>{if(b.type==='link')b.href='#'+pages[[2,3,8][k]].id})});if(i%3===2)p.appearance!.decoration='lines';});
 return {schemaVersion:3,kind,title:kind==='page'?'Alabuga Framework — от идеи к форме':'Alabuga Framework — один визуальный язык',pages,modals:[{id:'about-framework',title:'Начните свою историю',text:'Выберите композицию в конструкторе, добавьте содержание и скачайте готовый HTML. Проект можно сохранить и продолжить позже.'}]};
}
