import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDocument, isSafeUrl } from '@alabuga/framework/schema';
import { panelExample, presentationExample } from '@alabuga/framework/examples';
import {showcase,compositionCatalog,makeComposition,changeComposition} from '@alabuga/framework/compositions';

test('optional slide typography stays in schema 3 and rejects non-brand sizes',()=>{
 const doc={schemaVersion:3 as const,kind:'presentation' as const,title:'Typography',pages:[makeComposition('text','presentation')]};
 const legacy=validateDocument(doc);assert.ok(legacy.success);assert.equal(legacy.data.pages[0].widgets[0].typography,undefined);assert.equal(legacy.data.pages[0].appearance?.fitted,undefined);
 doc.pages[0].widgets[0].typography={heading:96,body:36,cardTitle:40,caption:24,table:28,metric:120};doc.pages[0].appearance!.backgroundPlacement='right-third';doc.pages[0].appearance!.fitted=true;
 const result=validateDocument(doc);assert.ok(result.success);assert.equal(result.data.schemaVersion,3);assert.deepEqual(result.data.pages,doc.pages);
 const invalid=structuredClone(doc) as any;invalid.pages[0].widgets[0].typography.body=20;assert.equal(validateDocument(invalid).success,false);
});

test('all compositions and showcases validate, v1 migrates without layout changes',()=>{for(const kind of ['page','presentation'] as const){assert.deepEqual(validateDocument(showcase(kind)).issues,[]);for(const [name]of compositionCatalog(kind)){assert.deepEqual(validateDocument({schemaVersion:2,kind,title:name,pages:[makeComposition(name,kind)]}).issues,[])}}const before=JSON.stringify(panelExample);const result=validateDocument(panelExample);assert.ok(result.success);assert.equal(result.data.schemaVersion,3);assert.deepEqual(result.data.pages,panelExample.pages);assert.equal(JSON.stringify(panelExample),before)});
test('composition changes retain content and reject incompatible slots atomically',()=>{const p=makeComposition('features'),before=structuredClone(p);const next=changeComposition(p,'steps','page');assert.deepEqual(next.widgets.map(w=>w.id),p.widgets.map(w=>w.id));assert.deepEqual(next.widgets,p.widgets);assert.throws(()=>changeComposition(p,'gallery','page'));assert.deepEqual(p,before)});
test('actions reject broken targets and cross-mode slide targets',()=>{const doc=showcase();const w=doc.pages.flatMap(p=>p.widgets).find(w=>w.type==='button')!;if(w.type!=='button')throw new Error();w.action={type:'modal',target:'missing'};assert.equal(validateDocument(doc).success,false);w.action={type:'slide',target:doc.pages[0].id};assert.equal(validateDocument(doc).success,false);w.action={type:'section',target:doc.pages[0].id};assert.equal(validateDocument(doc).success,true)});
test('all shipped examples validate',()=>{for(const doc of [panelExample,presentationExample()])assert.deepEqual(validateDocument(doc).issues,[])});
test('parsed document is isolated from input',()=>{const r=validateDocument(panelExample);assert.ok(r.success);r.data.pages[0].widgets[0].title='changed';assert.equal(panelExample.pages[0].widgets[0].title,'Календарь')});
test('geometry, IDs, version and unknown fields are rejected',()=>{
  const mutations=[(d:any)=>d.schemaVersion=999,(d:any)=>d.html='<script/>',(d:any)=>d.pages[0].widgets[1].id='calendar',(d:any)=>d.pages[0].widgets[1].position.col=1,(d:any)=>d.pages[0].widgets[0].position.width=3,(d:any)=>d.pages[0].widgets[0].position.col=12];
  for(const mutate of mutations){const d=structuredClone(panelExample);mutate(d);assert.equal(validateDocument(d).success,false)}
});
test('only safe relative and HTTP URLs',()=>{for(const s of ['javascript:alert(1)','data:text/html,x','//evil.test','https:\\evil.test','\nhttps://x.test','file:///x'])assert.equal(isSafeUrl(s),false,s);for(const s of ['assets/a.svg','../photo.png','https://example.com/a','#anchor'])assert.equal(isSafeUrl(s),true,s)});
test('invalid calendar dates and table keys are rejected',()=>{const d:any=structuredClone(panelExample);d.pages[0].widgets[0].date='2026-02-30';assert.equal(validateDocument(d).success,false);d.pages[0].widgets[0].date='2024-02-29';assert.equal(validateDocument(d).success,true);d.pages[0].widgets[4].rows[0].unexpected='bad';assert.equal(validateDocument(d).success,false)});
test('slides outside canvas are rejected',()=>{const d=presentationExample();d.pages[0].widgets[0].position.row=20;assert.equal(validateDocument(d).success,false)});
