import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,type AFDocument} from '@alabuga/framework/schema';
import {makeComposition,changeComposition} from '@alabuga/framework/compositions';

test('slide annotations round-trip with explicit schema compatibility',()=>{
 const doc:AFDocument={schemaVersion:3,kind:'presentation',title:'Annotations',pages:[makeComposition('blank','presentation')]};
 assert.equal(validateDocument(doc).success,true);
 doc.pages[0].chrome={header:{text:'АЛАБУГА / Проект',visible:false},number:{value:'A-07',format:'total',position:'center',visible:true,background:'white',color:'ink'}};
 const result=validateDocument(doc);assert.ok(result.success);assert.equal(result.data.schemaVersion,5);assert.deepEqual(result.data.pages[0].chrome,doc.pages[0].chrome);
 assert.deepEqual(changeComposition(doc.pages[0],'text','presentation').chrome,doc.pages[0].chrome);
 for(const chrome of [{header:{text:'x'.repeat(241)}},{number:{value:'x'.repeat(21)}},{number:{format:'html'}},{number:{position:'top'}},{number:{color:'url(example)'}},{number:{background:'red'}},{header:{visible:'false'}},{unknown:true}]){
  assert.equal(validateDocument({...doc,pages:[{...doc.pages[0],chrome}]}).success,false);
 }
});
