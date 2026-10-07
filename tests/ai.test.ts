import {test} from 'node:test';
import {relevantFacts} from '@alabuga/ai/context';
import assert from 'node:assert/strict';
import {catalog,executeCommands,insertDraft,sectionFormat} from '@alabuga/ai/commands';
import {newDraft,generateDraft} from '@alabuga/ai/generate';
import {requestSchema,type AIProvider,type GenerationRequest,type DraftResult} from '@alabuga/ai/contracts';
import {validateDocument} from '@alabuga/framework/schema';
import {EditorModel} from '../apps/editor/src/model';
import {fixtureCommands,testMaterials} from './ai-fixtures';
const request:GenerationRequest={kind:'page',scope:'section',count:1,prompt:'Расскажи о конструкторе',audience:'Авторы',sources:''};
test('all catalog compositions compile into editable valid documents',()=>{
 for(const kind of ['page','presentation'] as const)for(const {id}of catalog(kind)){
  const result=executeCommands(fixtureCommands(id,kind),kind,id,testMaterials,'24 Ясность важнее сложности. Автор');
  assert.ok(validateDocument({schemaVersion:3,kind,title:'Тест',pages:[result.section]}).success,id);assert.ok(result.section.widgets.length);assert.ok(sectionFormat(id,kind));
 }
});
test('rejects code, unknown tools, missing/duplicate slots and unknown images',()=>{
 assert.throws(()=>executeCommands({commands:[{tool:'eval',code:'alert(1)'}]},'page','text',[],''));
 const bad=fixtureCommands('text');bad.commands.push(bad.commands[1]);assert.throws(()=>executeCommands(bad,'page','text',[],''));
 assert.throws(()=>executeCommands(fixtureCommands('split'),'page','split',[],''));
 assert.throws(()=>executeCommands({commands:[fixtureCommands('features').commands[0],fixtureCommands('features').commands[1]]},'page','features',[],''));
});
test('keyed model envelope requires each specific tool and slot',()=>{
 const array=fixtureCommands('features').commands;
 const envelope={commands:{create:array[0],slot0:array[1],slot1:array[2]}};
 assert.equal(executeCommands(envelope,'page','features',[],'').section.widgets.length,2);
 assert.throws(()=>executeCommands({commands:{...envelope.commands,slot1:array[1]}},'page','features',[],''));
 assert.throws(()=>executeCommands({commands:{create:array[0],slot0:array[1]}},'page','features',[],''));
});
test('requires provided facts for metrics, quotes and URLs; never keeps example links',()=>{
 assert.throws(()=>executeCommands(fixtureCommands('metrics'),'page','metrics',testMaterials,''));
 assert.throws(()=>executeCommands(fixtureCommands('quote'),'page','quote',testMaterials,''));
 const hero=fixtureCommands('hero'),button=hero.commands.find(c=>c.tool==='setButton')!;button.href='javascript:alert(1)';assert.throws(()=>executeCommands(hero,'page','hero',[],'javascript:alert(1)'));
 button.href='https://example.com';assert.throws(()=>executeCommands(hero,'page','hero',[],''));button.href='';assert.ok(!executeCommands(hero,'page','hero',[],'').section.widgets.some(w=>w.type==='button'));
});
test('insert uses latest document, rejects stale anchor and is a single undo operation',()=>{
 const a=executeCommands(fixtureCommands('text'),'page','text',[],'' ).section;
 const model=new EditorModel({schemaVersion:3,kind:'page',title:'Текущая версия',pages:[a]});model.change(d=>d.title='Изменён во время генерации');const before=model.document;
 const next=insertDraft(before,[a],a.id,'page');model.replace(next);assert.equal(model.document.title,before.title);assert.equal(model.document.pages.length,2);assert.notEqual(next.pages[0].id,next.pages[1].id);model.undo();assert.deepEqual(model.document,before);
 assert.throws(()=>insertDraft(before,[a],'deleted','page'));assert.throws(()=>insertDraft(before,[a],a.id,'presentation'));
});
test('scope and count limits are enforced',()=>{assert.throws(()=>requestSchema.parse({...request,count:2}));assert.throws(()=>requestSchema.parse({...request,scope:'document',count:6}));assert.ok(requestSchema.safeParse({...request,scope:'document',kind:'presentation',count:6}).success)});
function provider(generate:AIProvider['generate']):AIProvider{return {status:async()=>({model:'qwen3.5:2b',version:'test',digest:'test',context:4096}),generate}}
test('one repair per section; generated document stays separate and progress is persisted',async()=>{
 let calls=0;const states:DraftResult[]=[],draft=newDraft(request,'project','anchor');
 const ai=provider(async()=>{calls++;if(calls===1)return {title:'Конструктор',sections:[{composition:'text',title:'Секция',purpose:'Введение'}]};return calls===2?{commands:[]} :fixtureCommands('text')});
 const result=await generateDraft(draft,ai,[],new AbortController().signal,async d=>{states.push(d)},async()=>[]);
 assert.equal(calls,3);assert.equal(result.status.stage,'ready');assert.equal(draft.sections.length,0);assert.ok(states.some(s=>s.status.stage==='check'));
});
test('cancel retains finished sections and resume generates only missing sections',async()=>{
 const draft=newDraft({...request,scope:'document',count:2},'p','a'),abort=new AbortController();let calls=0;
 const ai=provider(async()=>{calls++;if(calls===1)return {title:'Проект',sections:[{composition:'text',title:'Введение',purpose:'Старт'},{composition:'features',title:'Возможности',purpose:'Основное'}]};if(calls===3){abort.abort();throw new Error('cancel')}return fixtureCommands('text')});
 const partial=await generateDraft(draft,ai,[],abort.signal,async()=>{},async()=>[]);assert.equal(partial.status.stage,'cancelled');assert.ok(partial.sections[0]);assert.equal(partial.sections[1],null);
 let resumeCalls=0;const resumed=await generateDraft(partial,provider(async()=>{resumeCalls++;return fixtureCommands('features')}),[],new AbortController().signal,async()=>{},async()=>[]);assert.equal(resumeCalls,1);assert.equal(resumed.status.stage,'ready');assert.equal(resumed.sections[0]?.id,partial.sections[0]?.id);
});
test('quality errors trigger one repair then remain actionable',async()=>{
 const draft=newDraft(request,'p','a');draft.outline=[{composition:'text',title:'Текст',purpose:'Введение'}];draft.sections=[null];let calls=0;
 const result=await generateDraft(draft,provider(async()=>{calls++;return fixtureCommands('text')}),[],new AbortController().signal,async()=>{},async()=>['Переполнение']);assert.equal(calls,2);assert.equal(result.status.stage,'error');assert.ok(result.sections[0]);assert.match(result.errors[0],/Переполнение/);
});
test('section context selects relevant whole facts and never cuts a long fact',()=>{
 const source='Проекты сохраняются в IndexedDB. Сайт адаптируется к экрану. Презентация сохраняет формат 16:9. Текст можно редактировать.';
 const selected=relevantFacts(source,'Сравни сайт и презентацию');assert.match(selected,/Сайт адаптируется к экрану\./);assert.match(selected,/Презентация сохраняет формат 16:9\./);assert.doesNotMatch(selected,/IndexedDB/);
 const long='Данные '+ 'очень '.repeat(1000)+'длинные.';assert.equal(relevantFacts(long,'данные'),long);
});
