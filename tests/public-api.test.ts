import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,type AFDocument} from '@alabuga/framework/schema';
import {exportHTML} from '@alabuga/framework/export';
const id='a'.repeat(64),data='data:image/png;base64,iVBORw0KGgo=';
const doc:AFDocument={schemaVersion:3,kind:'page',title:'API contract',pages:[{id:'section',title:'Image',grid:{columns:12,rowHeight:64,gap:16},widgets:[{id:'image',title:'Image',type:'image',src:'asset:'+id,alt:'Description',fit:'contain',caption:'',position:{col:1,row:1,width:4,height:4}}]}]};
test('schema can validate in Node without DOM or editor initialization',()=>{
 assert.equal(typeof document,'undefined');assert.equal(validateDocument(doc).success,true);
});
test('export resolves assets through an adapter and preserves the input document',async()=>{
 const before=structuredClone(doc),requests:string[]=[];
 const html=await exportHTML(doc,{runtime:{css:'/* supplied style */',script:'/* supplied runtime */'},resolveAsset:async key=>{requests.push(key);return data}});
 assert.deepEqual(requests,[id]);assert.ok(html.includes(data));assert.ok(!html.includes('asset:'+id));assert.deepEqual(doc,before);
});
test('export rejects missing materials rather than silently dropping content',async()=>{
 await assert.rejects(exportHTML(doc,{runtime:{css:'',script:''}}),/Missing asset resolver/);
 await assert.rejects(exportHTML(doc,{runtime:{css:'',script:''},resolveAsset:async()=>undefined}),/Missing asset:/);
});
