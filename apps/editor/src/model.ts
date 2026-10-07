import {validateDocument,widgetRegistry,type AFDocument,type Widget} from '@alabuga/framework/schema';
export function checked(input:unknown):AFDocument {
  const result=validateDocument(input);
  if(!result.success)throw new Error(result.issues.map(i=>i.message).slice(0,3).join('. '));
  return result.data;
}
export function emptyDocument(kind:AFDocument['kind']='page'):AFDocument {
  return {schemaVersion:3,kind,title:kind==='page'?'Новая страница':'Новая презентация',pages:[{id:uid('page'),title:'Начните с главного',grid:{columns:12,rowHeight:64,gap:16},widgets:[]}]};
}
export function uid(prefix='widget'){return prefix+'-'+crypto.randomUUID()}
export class EditorModel {
  private value:AFDocument;
  private past:string[]=[];
  private future:string[]=[];
  private group:string|undefined;
  constructor(input:unknown){this.value=checked(input)}
  get document(){return structuredClone(this.value)}
  get canUndo(){return !!this.past.length}
  get canRedo(){return !!this.future.length}
  replace(input:unknown,group?:string){const next=checked(input),before=JSON.stringify(this.value);if(JSON.stringify(next)===before)return false;if(!group||group!==this.group)this.past.push(before);this.group=group;while(this.past.length>30||this.past.length>1&&this.past.reduce((n,s)=>n+s.length,0)>10000000)this.past.shift();this.future=[];this.value=next;return true}
  change(edit:(draft:AFDocument)=>void,group?:string){const next=this.document;edit(next);return this.replace(next,group)}
  undo(){this.group=undefined;const prev=this.past.pop();if(!prev)return false;this.future.push(JSON.stringify(this.value));this.value=JSON.parse(prev);return true}
  redo(){this.group=undefined;const next=this.future.pop();if(!next)return false;this.past.push(JSON.stringify(this.value));this.value=JSON.parse(next);return true}
}
export function findSpace(doc:AFDocument,pageIndex:number,width:number,height:number):Widget['position']{
  const page=doc.pages[pageIndex],g=page.grid;
  const last=doc.kind==='presentation'?Math.floor((688+g.gap)/(g.rowHeight+g.gap)):1000;
  for(let row=1;row<=last-height+1;row++)for(let col=1;col<=g.columns-width+1;col++){
    if(!page.widgets.some(w=>{const p=w.position;return col<p.col+p.width&&col+width>p.col&&row<p.row+p.height&&row+height>p.row}))return {col,row,width,height};
  }
  throw new Error('Нет свободного места для блока. Уменьшите другие блоки или добавьте слайд.');
}
export function createWidget(type:Widget['type'],doc:AFDocument,pageIndex:number):Widget{
  const sizes:Record<Widget['type'],[number,number]>={text:[4,3],metric:[3,2],image:[4,4],calendar:[4,4],table:[6,4],button:[4,1],quote:[6,3],cards:[12,4],gallery:[12,4]};
  const [wanted,height]=sizes[type],width=Math.min(wanted,doc.pages[pageIndex].grid.columns);
  if(width<widgetRegistry[type].minWidth)throw new Error('В сетке недостаточно колонок для этого виджета.');
  const base={id:uid(),title:widgetRegistry[type].title,position:findSpace(doc,pageIndex,width,height)};
  switch(type){
    case 'button':return {...base,type,label:'Подробнее',variant:'primary',action:{type:'link',href:'https://example.com'}};
    case 'quote':return {...base,type,text:'Сильная идея заслуживает ясной формы.',author:'Автор'};
    case 'cards':return {...base,type,items:[{title:'Первый аргумент',text:'Расскажите о преимуществе.'},{title:'Второй аргумент',text:'Добавьте подробности.'}]};
    case 'gallery':return {...base,type,items:[{src:'../assets/brand-landscape.svg',alt:'Фирменная графика',caption:'Описание изображения'}]};
    case 'text':return {...base,type,content:[{type:'paragraph',text:'Добавьте свой текст. Выберите блок, чтобы изменить содержимое и оформление.',dropCap:false}]};
    case 'metric':return {...base,type,value:'24',note:'Ключевой показатель'};
    case 'calendar':return {...base,type,date:new Date().toLocaleDateString('sv-SE')};
    case 'image':return {...base,type,src:'../assets/brand-landscape.svg',alt:'Геометрическая композиция',fit:'cover',caption:''};
    case 'table':return {...base,type,variant:'corporate',columns:[{key:'name',label:'Название'},{key:'status',label:'Статус'}],rows:[{name:'Первый пункт',status:'В работе'},{name:'Второй пункт',status:'Готово'}],pageSize:5};
  }
}
