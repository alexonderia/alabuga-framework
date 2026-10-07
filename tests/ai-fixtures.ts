import {template} from '@alabuga/ai/commands';
import type {AICommand,Material} from '@alabuga/ai/contracts';
import type {AFDocument} from '@alabuga/framework/schema';
export const testMaterials:Material[]=[{id:'brand',name:'Фирменная графика',description:'Абстрактная геометрия',src:'../assets/brand-landscape.svg',category:'decoration'}];
export function fixtureCommands(composition:string,kind:AFDocument['kind']='page',heading='Ваша идея в действии'):{commands:AICommand[]}{
 const commands:AICommand[]=[{tool:'createSection',composition,theme:composition==='hero'?'contrast':'light',motion:'none'}];
 template(composition,kind).widgets.forEach((w,slot)=>{
  if(w.type==='text')commands.push({tool:'setText',slot,heading:w.position.width<6?'Ваша идея':heading,text:w.position.height<=2?'':'Собирайте страницы и презентации из готовых фирменных композиций.'});
  if(w.type==='cards')commands.push({tool:'setCards',slot,items:[{title:'Выберите',text:'Начните с композиции.'},{title:'Наполните',text:'Добавьте свои материалы.'},{title:'Покажите',text:'Сохраните готовую историю.'}].slice(0,composition==='comparison'?2:3)});
  if(w.type==='image')commands.push({tool:'setImage',slot,asset:'brand',alt:'Фирменная графика'});
  if(w.type==='gallery')commands.push({tool:'setGallery',slot,items:[{asset:'brand',alt:'Фирменная графика',caption:'Визуальный язык'}]});
  if(w.type==='metric')commands.push({tool:'setMetric',slot,value:'24',note:'Часа'});
  if(w.type==='quote')commands.push({tool:'setQuote',slot,text:'Ясность важнее сложности.',author:'Автор'});
  if(w.type==='button')commands.push({tool:'setButton',slot,label:'Подробнее',href:''});
  if(w.type==='table')commands.push({tool:'setTable',slot,columns:['Название','Описание'],rows:[['Сайт','Секции'],['Презентация','Слайды']]});
 });return {commands};
}
