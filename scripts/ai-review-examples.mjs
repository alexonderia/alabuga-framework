// Explicit editorial corrections to demonstration drafts. Raw model outputs remain unchanged.
import {readFile,writeFile} from 'node:fs/promises';
const root='artifacts/ai/examples';
const text=(page,index,heading,paragraph='')=>{page.widgets.filter(w=>w.type==='text')[index].content=[{type:'heading',text:heading},...(paragraph?[{type:'paragraph',text:paragraph,dropCap:false}]:[])]};
for(const name of ['landing','presentation']){
 const source=JSON.parse(await readFile(`${root}/${name}-source.json`,'utf8')),reviewed=structuredClone(source),p=reviewed.document.pages;
 const expected=name==='landing'?'hero,asymmetric,text,steps,footer':'hero,features,asymmetric,steps,divider,thesis';
 if(p.map(p=>p.composition).join(',')!==expected)throw new Error('This editorial patch belongs to the recorded reference drafts. Review newly generated compositions separately.');
 for(const page of p)for(const w of page.widgets)if(w.type==='image'&&/логотип/i.test(w.alt))w.fit='contain';
 if(name==='landing'){
  text(p[0],0,'Alabuga Framework','Локальный визуальный конструктор для сайтов и презентаций.');
  text(p[1],0,'Ваш проект — локально','Проекты сохраняются в браузере в IndexedDB.');
  text(p[2],0,'Фирменные композиции','Выбирайте композицию и заменяйте тексты и изображения своими материалами.');
  p[3].widgets.find(w=>w.type==='cards').items=[{title:'Выберите композицию',text:'Начните с готового расположения элементов.'},{title:'Добавьте содержание',text:'Измените тексты и изображения на холсте.'},{title:'Экспортируйте HTML',text:'Сохраните документ для автономного просмотра.'}];
  text(p[4],0,'Следующий шаг');text(p[4],1,'Создайте свою первую секцию');
 }else{
  text(p[0],0,'Alabuga Framework','Создавайте сайты и презентации из фирменных композиций.');
  text(p[1],0,'Единый визуальный язык');p[1].widgets.find(w=>w.type==='cards').items=[{title:'Композиции',text:'Готовое расположение элементов.'},{title:'Содержание',text:'Редактируемые тексты и изображения.'},{title:'Форматы',text:'Адаптивный сайт или презентация 16:9.'}];
  text(p[2],0,'Редактируйте на холсте','Меняйте тексты и изображения, просматривайте результат.');
  text(p[3],0,'От идеи к документу');p[3].widgets.find(w=>w.type==='cards').items=[{title:'Выберите',text:'Начните с готовой композиции.'},{title:'Наполните',text:'Добавьте свои тексты и изображения.'},{title:'Экспортируйте',text:'Сохраните автономный HTML.'}];
  text(p[4],0,'Два формата','Сайт адаптируется к экрану. Презентация сохраняет пропорции 16:9.');
  text(p[5],0,'Начните с черновика','ИИ создаёт до 5 секций сайта или до 6 слайдов. Проверьте содержание перед применением.');
 }
 reviewed.editorialReview={performedBy:'Codex',rawSource:`${name}-source.json`,changes:'Исправлены факты, повторения, служебные фразы и кадрирование логотипа. Композиции и структура созданы локальной моделью; тексты после редакторской правки.'};
 await writeFile(`${root}/${name}-reviewed.json`,JSON.stringify(reviewed,null,2));
}
