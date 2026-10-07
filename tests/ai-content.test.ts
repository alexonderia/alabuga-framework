import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentFormat,contentCommands} from '@alabuga/ai/content-format';
import {executeCommands} from '@alabuga/ai/commands';
import {newDraft,generateDraft} from '@alabuga/ai/generate';
import {fixtureCommands} from './ai-fixtures';
import {contentPrompt} from '@alabuga/ai/prompt-policy';
import {requestedComposition} from '@alabuga/ai/planning';
import {reviewContent,reviewDraftContent} from '@alabuga/ai/content-review';
import {rankedFacts,topicGuidance,hasSourceCards} from '@alabuga/ai/topic-guidance';
test('card evidence refers to stable source IDs, independent of their order in the prompt',()=>{
 const sources='Изображения можно загрузить.\nЭкспортированный HTML работает без модели.\nТекст редактируется на холсте.';
 const format=contentFormat('features','presentation',undefined,[],sources,'Возможности: текст, изображения, экспорт',sources) as any;
 const items=format.properties.content.properties.slot1.properties.items.properties;
 assert.deepEqual(items.item0.properties.sourceId.enum,['F3']);assert.deepEqual(items.item1.properties.sourceId.enum,['F1']);assert.deepEqual(items.item2.properties.sourceId.enum,['F2']);
 assert.ok(hasSourceCards(format));assert.equal(hasSourceCards(contentFormat('text','page',undefined,[],sources)),false);
 const raw={composition:'features',content:{slot0:{heading:'Возможности',text:''},slot1:{items:{item0:{title:'текст',sourceId:'F3'},item1:{title:'изображения',sourceId:'F1'},item2:{title:'экспорт',sourceId:'F2'}}}}};
 const before=structuredClone(raw),result=executeCommands(contentCommands(raw,'features','presentation','light',sources,format),'presentation','features',[],sources);
 assert.deepEqual(raw,before);const cards=result.section.widgets.find(w=>w.type==='cards')!;assert.equal(cards.type,'cards');if(cards.type==='cards')assert.deepEqual(cards.items.map(i=>i.text),['Текст редактируется на холсте.','Изображения можно загрузить.','Экспортированный HTML работает без модели.']);
 for(const invalid of [{title:'экспорт',sourceId:'F99'},{title:'экспорт',sourceId:'F3'},{title:'экспорт',sourceId:'F2',text:'Выдумка'},{title:'Выдумка',sourceId:'F2'}]){const bad=structuredClone(raw);bad.content.slot1.items.item2=invalid;assert.throws(()=>contentCommands(bad,'features','presentation','light',sources,format));}
 const prompt='ЗАДАНИЕ: Экспорт\nФАКТЫ ДЛЯ ЭТОЙ СЕКЦИИ:\nselected';
 assert.match(contentPrompt(prompt,sources,true),/F2: Экспортированный HTML/);
 assert.doesNotMatch(contentPrompt(prompt,sources),/F[123]:/);
 assert.ok(contentPrompt(prompt,sources).includes(sources));
});
test('rechecking a generated section retains factual errors and ignores geometry numbers',()=>{
 const request={kind:'page' as const,scope:'section' as const,count:1,prompt:'Расскажи о презентации',audience:'',sources:'Презентация сохраняет формат 16:9.'};
 const section=executeCommands({commands:[{tool:'createSection',composition:'text',theme:'light',motion:'none'},{tool:'setText',slot:0,heading:'Презентация',text:'Презентация включает 16 слайдов.'}]},'page','text',[],request.sources).section;
 assert.match(reviewDraftContent(section,request).join(' '),/16 слайдов/);
 const w=section.widgets[0];if(w.type==='text')w.content=[{type:'heading',text:'Презентация'},{type:'paragraph',dropCap:false,text:request.sources}];
 assert.deepEqual(reviewDraftContent(section,request),[]);
});
test('source instructions keep their controls verbatim and cannot inject a substitute paragraph',()=>{
 const sources='Чтобы просмотреть сайт, нажмите «Предпросмотр» и выберите «Телефон».',task='Объясни, как просмотреть сайт';
 const format=contentFormat('text','page','Просмотр',[],sources,task,sources) as any;
 assert.deepEqual(format.properties.content.properties.slot0.properties.sourceId.enum,['F1']);
 const raw={composition:'text',content:{slot0:{heading:'Просмотр',sourceId:'F1'}}};
 const result=executeCommands(contentCommands(raw,'text','page','light',sources,format),'page','text',[],sources);
 assert.deepEqual(reviewDraftContent(result.section,{kind:'page',scope:'section',count:1,prompt:task,audience:'',sources}),[]);
 assert.throws(()=>contentCommands({...raw,content:{slot0:{...raw.content.slot0,text:'Другая инструкция'}}},'text','page','light',sources,format));
 const long=sources.slice(0,-1)+', '+ 'полное исходное предложение '.repeat(20),large=contentFormat('text','page','Просмотр',[],long,task,long);
 assert.throws(()=>executeCommands(contentCommands(raw,'text','page','light',long,large),'page','text',[],long));
});
test('unsupported outline quantities are repaired before becoming a fixed heading',async()=>{
 let calls=0;const provider={contentOnly:true,status:async()=>({model:'test',version:'test',digest:'test',context:4096}),generate:async()=>({title:'Презентация',sections:[{composition:'text',title:++calls===1?'16 слайдов':'Формат презентации',purpose:'F1'}]})};
 const draft=await generateDraft(newDraft({kind:'page',scope:'section',count:1,prompt:'Расскажи о презентации',audience:'',sources:'Презентация сохраняет формат 16:9.'},'p','a'),provider,[],new AbortController().signal,async()=>{},async()=>[],undefined,{outlineOnly:true});
 assert.equal(calls,2);assert.equal(draft.outline[0].title,'Формат презентации');assert.equal(draft.awaitingOutline,true);
});
test('topic ordering preserves every whole fact and prioritizes the requested subject',()=>{
 const source='Экспорт доступен в HTML.\nАвтор выбирает фирменную композицию.\nСлайды имеют формат 16:9.\n! Обязательно сохранить последний факт.';
 const ordered=rankedFacts(source,'Фирменный стиль').map(f=>f.text).join('\n');
 assert.equal(ordered.split('\n')[0],'Автор выбирает фирменную композицию.');
 assert.deepEqual(new Set(ordered.split('\n')),new Set(source.split('\n')));
 assert.equal(topicGuidance('процесс')?.composition,'steps');
 assert.equal(topicGuidance('следующий шаг')?.composition,'hero');
 assert.equal(topicGuidance('Процессор и видеокарта'),undefined);
});
test('procedural copy retains source control labels without constraining ordinary prose',()=>{
 const make=(text:string)=>executeCommands({commands:[{tool:'createSection',composition:'text',theme:'light',motion:'none'},{tool:'setText',slot:0,heading:'Просмотр',text}]},'page','text',[],'').section;
 const sources='Чтобы посмотреть сайт на телефоне, нажмите «Предпросмотр» и выберите «Телефон».';
 assert.match(reviewContent(make('Откройте меню устройств.'),'',[],{task:'Объясни, как просмотреть сайт на мобильном экране.',sources}).join(' '),/Предпросмотр.*Телефон/);
 assert.deepEqual(reviewContent(make('Нажмите «Предпросмотр» и выберите «Телефон».'),'',[],{task:'Как просмотреть сайт?',sources}),[]);
 assert.deepEqual(reviewContent(make('Выберите удобный экран.'),'',[],{task:'Расскажи о возможностях',sources}),[]);
});
test('a missing procedural control gets one repair and the draft stays isolated',async()=>{
 const request={kind:'page' as const,scope:'section' as const,count:1,prompt:'Объясни, как просмотреть сайт.',audience:'',sources:'Чтобы посмотреть сайт, нажмите «Предпросмотр» и выберите «Телефон».'};
 const draft=newDraft(request,'original','anchor');draft.outline=[{composition:'text',title:'Просмотр',purpose:'Просмотр сайта'}];draft.sections=[null];
 let calls=0;const provider={status:async()=>({model:'test',version:'test',digest:'test',context:4096}),generate:async()=>{calls++;return {commands:[{tool:'createSection',composition:'text',theme:'light',motion:'none'},{tool:'setText',slot:0,heading:'Просмотр',text:calls===1?'Выберите экран в меню.':'Нажмите «Предпросмотр» и выберите «Телефон».'}]}}};
 const result=await generateDraft(draft,provider,[],new AbortController().signal,async()=>{},async()=>[]);
 assert.equal(calls,2);assert.equal(result.status.stage,'ready');assert.deepEqual(draft.sections,[null]);
});
test('document narrative roles are applied before outline review and remain editable',async()=>{
 const provider={contentOnly:true,status:async()=>({model:'test',version:'test',digest:'test',context:4096}),generate:async()=>({title:'Проект',sections:[{composition:'table',title:'Пункты',purpose:'F1'},{composition:'text',title:'Пункты',purpose:'F1'}]})};
 const draft=await generateDraft(newDraft({kind:'page',scope:'document',count:2,prompt:'Создай страницу: процесс, следующий шаг.',audience:'',sources:'Автор выбирает композицию и экспортирует HTML.'},'p','a'),provider,[],new AbortController().signal,async()=>{},async()=>[],undefined,{outlineOnly:true});
 assert.equal(draft.awaitingOutline,true);assert.deepEqual(draft.outline.map(s=>s.composition),['steps','hero']);
 assert.equal(draft.outline[0].purpose,'Автор выбирает композицию и экспортирует HTML.');assert.deepEqual(draft.sections,[null,null]);
});
test('source context retains every sentence, including facts beyond the first three',()=>{
 const facts=['Композиции задают структуру.','Композиции допускают замену текста.','Композиции сохраняют изображения.','Композиции можно перестроить.','Композиции доступны в каталоге.','Презентация имеет формат 16:9.','! Обязательно: проверяйте результат.'].join('\n');
 const prompt=contentPrompt('ЗАДАНИЕ: Преимущества готовых композиций\nФАКТЫ ДЛЯ ЭТОЙ СЕКЦИИ:\nselected',facts);
 assert.match(prompt,/доступны в каталоге/);assert.match(prompt,/Обязательно: проверяйте результат/);assert.match(prompt,/16:9/);
});
test('real-provider outline selects a source reference and persists its exact text',async()=>{
 let calls=0;const provider={contentOnly:true,status:async()=>({model:'test',version:'test',digest:'test',context:4096}),generate:async(_system:string,prompt:string,format:any)=>{
  calls++;assert.match(prompt,/Последний обязательный факт/);assert.deepEqual(format.properties.sections.items.properties.purpose.enum,['F1','F2']);
  return {title:'Проект',sections:[{composition:'text',title:'Факт',purpose:'F2'}]};
 }};
 const draft=await generateDraft(newDraft({kind:'page',scope:'document',count:1,prompt:'Создай страницу',audience:'',sources:'Первый факт\nПоследний обязательный факт'},'p','a'),provider,[],new AbortController().signal,async()=>{},async()=>[],undefined,{outlineOnly:true});
 assert.equal(calls,1);assert.equal(draft.outline[0].purpose,'Последний обязательный факт');assert.equal(draft.awaitingOutline,true);
});
test('grounded footer, illustration role and comparison columns have explicit contracts',()=>{
 const materials=[{id:'logo',name:'Logo',description:'',category:'logo',src:'logo.svg'},{id:'art',name:'Art',description:'',category:'decoration',src:'art.svg'}];
 const split=contentFormat('split','page',undefined,materials,'','Иллюстрация') as any;
 assert.deepEqual(split.properties.content.properties.slot1.properties.asset.enum,['art']);
 const logo=contentFormat('split','page',undefined,materials,'','Покажи логотип') as any;
 assert.deepEqual(logo.properties.content.properties.slot1.properties.asset.enum,['logo']);
 const footer=contentFormat('footer','page','Контакты',[],'Alabuga Framework — конструктор сайтов.','Подвал') as any;
 assert.equal(footer.properties.content.properties.slot0.properties.heading.const,'Alabuga Framework');
 const table=contentFormat('table','page',undefined,[],'Сайт и презентация','Таблица сравнения форматов') as any;
 assert.deepEqual(table.properties.content.properties.slot1.properties.columns.const,['Свойство','Сайт','Презентация']);
 const commands={commands:[{tool:'createSection',composition:'table',theme:'light',motion:'none'},{tool:'setText',slot:0,heading:'Форматы',text:''},{tool:'setTable',slot:1,columns:['Формат','Размер'],rows:[['Слайд','16:9'],['Слайд','16:9']]}]};
 const result=executeCommands(commands,'page','table',[],'16:9');assert.match(reviewContent(result.section).join(' '),/повторяются строки/);
});
test('generation only exposes compatible media and omits metadata for a fixed single choice',async()=>{
 const draft=newDraft({kind:'page',scope:'section',count:1,prompt:'Текст с иллюстрацией',audience:'',sources:''},'p','a');draft.outline=[{composition:'split',title:'Идея',purpose:'Графика'}];draft.sections=[null];
 const provider={contentOnly:true,status:async()=>({model:'test',version:'test',digest:'test',context:4096}),generate:async(system:string,_prompt:string,format:any)=>{
  assert.doesNotMatch(system,/EXCLUDED LOGO|UNNECESSARY NAME/);assert.deepEqual(format.properties.content.properties.slot1.properties.asset.enum,['art']);
  return {composition:'split',content:{slot0:{heading:'Идея',text:'Добавьте свои материалы.'},slot1:{asset:'art',alt:'Графика'}}};
 }};
 const result=await generateDraft(draft,provider,[{id:'logo',name:'EXCLUDED LOGO',description:'',category:'logo',src:'logo.svg'},{id:'art',name:'UNNECESSARY NAME',description:'',category:'decoration',src:'art.svg'}],new AbortController().signal,async()=>{},async()=>[]);
 assert.equal(result.status.stage,'ready');
});
test('unsupported numbers trigger one repair instead of being silently accepted',async()=>{
 let calls=0;const provider={status:async()=>({model:'test',version:'test',digest:'test',context:4096}),generate:async()=>{
  calls++;if(calls===1)return {title:'Слайды',sections:[{composition:'text',title:'Презентация',purpose:'Формат'}]};
  return {commands:[{tool:'createSection',composition:'text',theme:'light',motion:'none'},{tool:'setText',slot:0,heading:'Презентация',text:calls===2?'Презентация включает 16 слайдов.':'Презентация сохраняет формат 16:9.'}]};
 }};
 const draft=await generateDraft(newDraft({kind:'page',scope:'section',count:1,prompt:'Расскажи о слайдах',audience:'',sources:'Презентация сохраняет формат 16:9.'},'p','a'),provider,[],new AbortController().signal,async()=>{},async()=>[]);
 assert.equal(calls,3);assert.equal(draft.status.stage,'ready');
});
test('composition classification follows requested form instead of listed content types',()=>{
 assert.equal(requestedComposition('Покажи три возможности: текст, изображения, таблицы.'),'features');
 assert.equal(requestedComposition('Покажи таблицу сравнения форматов.'),'table');
 assert.equal(requestedComposition('Сделай тезис о редактируемых компонентах.'),'thesis');
 assert.equal(requestedComposition('Создай секцию с текстом и фирменной иллюстрацией.'),'split');
});
test('requested card topics stay in their slots and unknown keys are rejected',()=>{
 const format=contentFormat('features','presentation',undefined,[],'Факты','Три возможности: композиции, элементы, экспорт') as any;
 const fields=format.properties.content.properties.slot1.properties.items;
 assert.deepEqual(fields.required,['item0','item1','item2']);assert.equal(fields.properties.item2.properties.title.const,'экспорт');
 const raw={composition:'features',content:{slot0:{heading:'Возможности',text:''},slot1:{items:{item0:{title:'композиции',text:'Выберите шаблон'},item1:{title:'элементы',text:'Настройте текст'},item2:{title:'экспорт',text:'Сохраните HTML'}}}}};
 const result=executeCommands(contentCommands(raw,'features','presentation','light'),'presentation','features',[],'');
 assert.equal(result.section.widgets[1].type,'cards');
 assert.throws(()=>contentCommands({...raw,content:{...raw.content,slot1:{items:{item0:{},extra:{}}}}},'features','presentation','light'));
});
test('all facts and final delivery requirements survive prompt preparation',()=>{
 const prompt=contentPrompt('ЗАДАНИЕ: Три возможности\nЧИТАТЕЛЬ (не включай название аудитории в текст): Авторы\nФАКТЫ ДЛЯ ЭТОЙ СЕКЦИИ:\nЧасть фактов\nТРЕБОВАНИЯ К ПОДАЧЕ: коротко','Первый факт\nПоследний обязательный факт');
 assert.match(prompt,/Последний обязательный факт/);assert.match(prompt,/ТРЕБОВАНИЯ К ПОДАЧЕ: коротко$/);assert.doesNotMatch(prompt,/Авторы/);
});
test('compact content cannot select tools or add unrecognized slots',()=>{
 const raw={composition:'text',content:{slot0:{heading:'Идея',text:'Своя история'}}};
 assert.equal(executeCommands(contentCommands(raw,'text','page','light'),'page','text',[],'').section.widgets[0].type,'text');
 assert.throws(()=>contentCommands({...raw,content:{slot0:{tool:'eval',heading:'Идея',text:''}}},'text','page','light'));
 assert.throws(()=>contentCommands({...raw,content:{...raw.content,slot1:{heading:'Extra'}}},'text','page','light'));
 const format=contentFormat('hero','page','Идея',[],'Нет ссылок') as any;assert.equal(format.properties.content.properties.slot1.properties.href.const,'');assert.equal(format.properties.content.properties.slot1.properties.label.const,'');
});
test('outline review stops before filling and resumes the amended outline',async()=>{
 const draft=newDraft({kind:'page',scope:'document',count:1,prompt:'Создай страницу',audience:'Авторы',sources:''},'p','a');let calls=0;
 const provider={status:async()=>({model:'test',version:'test',digest:'test',context:4096}),generate:async()=>{calls++;return calls===1?{title:'История',sections:[{composition:'text',title:'Идея',purpose:'Введение'}]}:fixtureCommands('text')}};
 const planned=await generateDraft(draft,provider,[],new AbortController().signal,async()=>{},async()=>[],undefined,{outlineOnly:true});assert.equal(calls,1);assert.equal(planned.awaitingOutline,true);assert.deepEqual(planned.sections,[null]);planned.outline[0].title='Новая идея';
 const completed=await generateDraft(planned,provider,[],new AbortController().signal,async()=>{},async()=>[]);assert.equal(calls,2);assert.equal(completed.status.stage,'ready');assert.equal(completed.outline[0].title,'Новая идея');assert.equal(completed.awaitingOutline,undefined);
});
