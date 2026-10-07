import {makeComposition} from '@alabuga/framework/compositions';
import type {Section} from '@alabuga/framework/schema';
export function slideFitFixtures():Section[]{
 const names=['thesis','divider','text','text','text','text','features','features','comparison','steps','steps','metrics','quote','quote','split','asymmetric','brand-cover','hero','final','text','text','text','text','text'];
 return names.map((name,i)=>{
  const p=makeComposition(name,'presentation');p.id='fixture-'+i;p.widgets.forEach((w,j)=>w.id=`fixture-${i}-widget-${j}`);
  for(const w of p.widgets){
   if(w.type==='text')w.content=[{type:'heading',text:i%3?'От идеи к результату':'Создавайте вместе'},...(i%3&&!(i>=6&&i<=11)?[{type:'paragraph' as const,dropCap:false,text:'Единая библиотека помогает собирать страницы и презентации. '.repeat(i%3)}]:[])];
   if(w.type==='cards')w.items=w.items.map((it,j)=>({...it,title:['Композиция','Содержание','Оформление'][j%3],text:'Настраивайте результат прямо на холсте.'}));
  }
  const first=p.widgets[0];
  if(first.type==='text'&&[3,4,5].includes(i))first.content.push({type:'list',ordered:i===5,items:['Выберите композицию','Добавьте своё содержание','Проверьте результат и экспортируйте']});
  if(i===19&&first.type==='text')first.content=[{type:'paragraph',dropCap:false,text:'Проект сохраняется локально. Его можно открыть, изменить и экспортировать без изменения исходных материалов. '.repeat(5)}];
  if(i>=20){
   if(first.type==='text')first.content=[{type:'heading',text:'Сайт и презентация'}];
   p.widgets.push({id:`fixture-${i}-table`,type:'table',title:'',align:'left',surface:'plain',position:{col:1,width:12,row:3,height:5},columns:[{key:'name',label:'Возможность'},{key:'page',label:'Сайт'},{key:'slides',label:'Презентация'}],rows:[{name:'Формат',page:'Адаптивный',slides:'16:9'},{name:'Экспорт',page:'HTML',slides:'HTML и PDF'},{name:'Изменение',page:'На холсте',slides:'На холсте'}].slice(0,i-19),pageSize:2,variant:'corporate'});
   first.position={col:1,width:12,row:1,height:2};
  }
  return p;
 });
}
