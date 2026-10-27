import type { AFDocument, Widget } from './schema.js';
export const panelExample: AFDocument = {
  schemaVersion:1,kind:'page',title:'Рабочая панель',pages:[{
    id:'dashboard',title:'План на сегодня',grid:{columns:12,rowHeight:64,gap:16},widgets:[
      {id:'calendar',type:'calendar',title:'Календарь',date:'2026-09-30',position:{col:1,row:1,width:4,height:4}},
      {id:'comment',type:'text',title:'Комментарий',content:[{type:'paragraph',text:'Встреча команды — в 14:00. Согласуем следующую итерацию.',dropCap:false}],position:{col:5,row:1,width:8,height:2}},
      {id:'tasks',type:'metric',title:'Задачи',value:'12',note:'',position:{col:5,row:3,width:4,height:2}},
      {id:'people',type:'metric',title:'Команда',value:'08',note:'',position:{col:9,row:3,width:4,height:2}},
      {id:'table',type:'table',title:'План работ',wrap:true,columns:[{key:'name',label:'Задача'},{key:'status',label:'Статус'}],rows:[{name:'Библиотека',status:'В работе'},{name:'Документация',status:'В работе'},{name:'Конструктор',status:'Позже'}],pageSize:5,position:{col:1,row:5,width:6,height:4}},
      {id:'welcome',type:'text',title:'Общая основа',content:[{type:'heading',text:'Меньше повторений. Больше смысла.'},{type:'paragraph',text:'Собирайте интерфейсы из знакомых элементов. Цвета, типографика и размеры уже согласованы между собой.',dropCap:true},{type:'divider',decorative:true},{type:'callout',tone:'info',text:'Размер виджета задаётся сеткой. Содержимое остаётся на своём месте.'}],position:{col:7,row:5,width:6,height:4}},
    ]
  }]
};
const pos=(col:number,row:number,width:number,height:number)=>({col,row,width,height});
const paragraph=(id:string,text:string,position=pos(1,1,12,6)):Widget=>({id,type:'text',title:'',position,content:[{type:'paragraph',text,dropCap:false}]});
export function presentationExample(image='assets/brand-landscape.svg'):AFDocument {
  const grid={columns:12,rowHeight:64,gap:16};
  return {schemaVersion:1,kind:'presentation',title:'Framework',pages:[
    {id:'cover',title:'Один язык. Любая композиция.',grid,widgets:[paragraph('cover-text','Alabuga Framework объединяет страницы и презентации. Общие компоненты, предсказуемые размеры и фирменная типографика.',pos(1,2,7,4)),{id:'cover-image',type:'image',title:'',position:pos(9,1,4,6),src:image,alt:'Геометрическая композиция в фирменной палитре',fit:'cover',caption:''}]},
    {id:'story',title:'Текст, который удобно читать',grid,widgets:[{id:'story-text',type:'text',title:'',position:pos(1,1,10,7),content:[{type:'paragraph',text:'Каждый документ начинается с содержания. Заголовки расставляют акценты, абзацы задают ритм, а детали помогают увидеть главное.',dropCap:true},{type:'divider',decorative:true},{type:'list',ordered:false,items:['Единая шкала типографики','Управляемые акценты','Компоненты с понятными состояниями']}]}]},
    {id:'image-slide',title:'Изображение и подпись',grid,widgets:[{id:'landscape',type:'image',title:'',position:pos(1,1,8,7),src:image,alt:'Абстрактный индустриальный пейзаж',fit:'cover',caption:'Композиция для демонстрации размещения изображения.'},paragraph('image-caption','Картинка занимает заданную область. Вариант contain сохраняет изображение целиком, cover заполняет контейнер.',pos(9,1,4,6))]},
    {id:'metrics',title:'Главное — в цифрах',grid,widgets:[{id:'metric-a',type:'metric',title:'Базовые переменные',value:'64',note:'Core / Primitives',position:pos(1,2,4,4)},{id:'metric-b',type:'metric',title:'Семантические цвета',value:'53',note:'Semantic / Color',position:pos(5,2,4,4)},{id:'metric-c',type:'metric',title:'Текстовые стили Figma',value:'25',note:'Единая типографика',position:pos(9,2,4,4)}]},
    {id:'comparison',title:'Одна библиотека — два сценария',grid,widgets:[{id:'web-text',type:'text',title:'Страница',position:pos(1,1,6,6),content:[{type:'list',ordered:false,items:['Панельная сетка','Интерактивные компоненты','Адаптация к узким экранам']}]},{id:'slides-text',type:'text',title:'Презентация',position:pos(7,1,6,6),content:[{type:'list',ordered:false,items:['Холст 16:9','Клавиатурная навигация','Печать слайдов в PDF']}]}]},
    {id:'data-slide',title:'План реализации',grid,widgets:[{id:'roadmap-table',type:'table',title:'Этапы',position:pos(1,1,12,7),columns:[{key:'stage',label:'Этап'},{key:'result',label:'Результат'}],rows:[{stage:'01 / Библиотека',result:'Компоненты, виджеты, сетка'},{stage:'02 / Проверка',result:'Примеры и документация'},{stage:'03 / Конструктор',result:'Визуальная сборка'},{stage:'04 / Публикация',result:'Версии и автодеплой'}],pageSize:10}]},
    {id:'divider-slide',title:'От компонентов к документам',grid,widgets:[{id:'section-text',type:'text',title:'',position:pos(1,2,12,4),content:[{type:'divider',decorative:true},{type:'heading',text:'Основа готова к развитию.'},{type:'paragraph',text:'Визуальный редактор будет использовать тот же механизм отображения.',dropCap:false}]}]},
    {id:'closing',title:'Собираем вместе',grid,widgets:[paragraph('closing-text','Начните с рабочего ядра. Проверьте его на реальном содержимом. Затем переходите к конструктору.',pos(1,2,9,4))]},
  ]};
}
