import {makeComposition} from './compositions.js';
import {type AFDocument,type Section,type Widget} from './schema.js';
import {brandAssets} from './brand.js';
import {slideTypeDefaults} from './element-style.js';
const stories:[string,string,string][]=[
 ['thesis','Из идеи — в результат','Создавайте сайты и презентации, не собирая оформление заново.'],
 ['asymmetric','Один визуальный язык','Композиции, Alabuga Sans и фирменные материалы помогают держать единый стиль.'],
 ['comparison','Два формата работы',''],
 ['features','Начните с композиции',''],
 ['split','Меняйте расположение','Сохраните содержание. Перестройте композицию под свою историю.'],
 ['features','Настройте каждый элемент',''],
 ['split','Изображение задаёт ритм','Выбирайте материалы, кадрируйте изображения и добавляйте фирменные фоны.'],
 ['steps','ИИ готовит черновик',''],
 ['comparison','Покажите результат',''],
 ['steps','От замысла до показа',''],
 ['final','Ваша следующая история','Откройте рабочую копию и попробуйте сами.']
];
function heading(p:Section,title:string,body:string){const w=p.widgets.find(w=>w.type==='text');if(w?.type==='text')w.content=[{type:'heading',text:title},...(body?[{type:'paragraph' as const,text:body,dropCap:false}]:[])]}
function cards(p:Section,items:[string,string][]){const w=p.widgets.find(w=>w.type==='cards');if(w?.type==='cards')w.items=items.map(([title,text])=>({title,text}))}
function image(p:Section,src:string,alt:string){const w=p.widgets.find(w=>w.type==='image');if(w?.type==='image'){w.src=src;w.alt=alt;w.fit='contain'}}
export function demoDocument(kind:AFDocument['kind']):AFDocument{
 const pages=stories.map(([composition,title,body])=>{const p=makeComposition(composition,kind);heading(p,title,body);p.widgets=p.widgets.filter(w=>w.type!=='button');return p});
 cards(pages[2],[['Сайт','Адаптивные секции и прокрутка.'],['Презентация','Слайды 16:9 и последовательный показ.']]);
 cards(pages[3],[['Выберите','Найдите структуру для своей идеи.'],['Заполните','Замените текст и изображения.'],['Перестройте','Смените расположение элементов.']]);
 image(pages[4],'../assets/demo/editor.png','Настоящий интерфейс визуального редактора Alabuga Framework');
 cards(pages[5],[['Текст','Размер, цвет и выравнивание.'],['Изображение','Свой материал и кадрирование.'],['Расположение','Положение и размер в сетке.']]);
 image(pages[6],brandAssets.glass,'Фирменная графика из библиотеки');
 cards(pages[7],[['Запрос','Укажите задачу и исходные факты.'],['Черновик','Проверьте структуру и содержание.'],['Применение','Продолжайте редактировать результат.']]);
 cards(pages[8],[['Предпросмотр','Проверьте экран, переходы и показ.'],['Экспорт HTML','Откройте результат без конструктора.']]);
 cards(pages[9],[['Соберите','Используйте готовую композицию.'],['Уточните','Настройте содержание и оформление.'],['Сохраните','Вернитесь к проекту или скачайте HTML.']]);
 const final=pages[10].widgets.filter(w=>w.type==='text');if(final[1]?.type==='text')final[1].content=[{type:'paragraph',text:'Локально. Редактируемо. В фирменном стиле.',dropCap:false}];
 if(kind==='page'){
  const header=makeComposition('header',kind),footer=makeComposition('footer',kind),cover=makeComposition('brand-cover',kind);
  heading(cover,'Соберите свою историю','Сайты и презентации из композиций — с настройкой каждого элемента.');
  const process=pages[9];const chosen=[header,cover,pages[2],pages[3],pages[5],pages[6],pages[7],process,pages[10],footer];
  for(const p of [header,footer])for(const w of p.widgets)if(w.type==='text')for(const b of w.content)if(b.type==='link')b.href='#'+chosen[3].id;
  for(const w of cover.widgets)if(w.type==='button'){w.label='Как это работает';w.action={type:'section',target:process.id}}
  image(chosen[5],'../assets/demo/editor.png','Настройка слайда в реальном редакторе');
  for(const p of chosen){p.appearance!.layout='flow';delete p.appearance!.fitted;p.widgets.forEach(w=>{delete w.typography})}
  chosen[2].appearance!.theme='contrast';chosen[6].appearance!.theme='accent';chosen[7].appearance!.theme='light';
  const action:Widget={id:'demo-return-'+crypto.randomUUID(),title:'',type:'button',label:'Вернуться к началу',variant:'secondary',action:{type:'section',target:cover.id},surface:'plain',position:{col:1,row:8,width:5,height:1}};chosen[8].widgets.push(action);
  return {schemaVersion:3,kind,title:'Alabuga Framework — создавайте свою историю',pages:chosen};
 }
 for(const [i,p]of pages.entries()){
  p.appearance={...p.appearance!,fitted:true,layout:'fixed',theme:i===0||i===10?'contrast':i===7?'accent':'light'};
  p.widgets.forEach((w,j)=>{w.typography={...slideTypeDefaults,heading:w.type==='text'&&p.widgets.length===1?112:64,body:32};w.motion={effect:'fade',speed:'normal',intensity:'subtle',step:j};if(w.type==='text')w.style={padding:'none'}});
  if(p.composition==='features'||p.composition==='steps'||p.composition==='comparison'){p.widgets[0].position={col:1,row:1,width:12,height:2};p.widgets[1].position={col:1,row:3,width:12,height:5}}
 }
 return {schemaVersion:3,kind,title:'Alabuga Framework — от идеи к показу',pages};
}
