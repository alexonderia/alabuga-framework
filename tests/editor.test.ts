import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorModel,emptyDocument,createWidget,findSpace,checked} from '../apps/editor/src/model';
import {makeSection} from '../apps/editor/src/sections';

test('header and footer templates validate alongside older sections',()=>{const doc=emptyDocument();doc.pages.push(makeSection('header'),makeSection('footer'));const result=checked(doc);assert.equal(result.pages[1].role,'header');assert.equal(result.pages[2].role,'footer');assert.equal(result.pages[1].widgets[1].align,'right');assert.equal(result.pages[0].role,undefined)});
test('sections retain independent grids and typing is one undo step',()=>{const doc=emptyDocument();doc.pages.push(makeSection('split'));assert.doesNotThrow(()=>checked(doc));const model=new EditorModel(doc);model.change(d=>d.title='A','typing');model.change(d=>d.title='AB','typing');model.change(d=>d.title='ABC','typing');model.undo();assert.equal(model.document.title,doc.title);model.redo();assert.equal(model.document.title,'ABC')});
test('history rejects invalid changes atomically and clears redo branch',()=>{
  const model=new EditorModel(emptyDocument());const old=model.document;
  assert.throws(()=>model.change(d=>d.title=''));assert.deepEqual(model.document,old);assert.equal(model.canUndo,false);
  model.change(d=>d.title='A');model.change(d=>d.title='B');model.undo();assert.equal(model.document.title,'A');model.redo();assert.equal(model.document.title,'B');model.undo();model.change(d=>d.title='C');assert.equal(model.canRedo,false);
});
test('placement finds free cells and fails on a full slide',()=>{
  const doc=emptyDocument('presentation');const widget=createWidget('text',doc,0);widget.position={col:1,row:1,width:12,height:8};doc.pages[0].widgets.push(widget);assert.throws(()=>findSpace(doc,0,1,1));
  const page=emptyDocument();page.pages[0].widgets.push(createWidget('calendar',page,0));assert.deepEqual(findSpace(page,0,4,4),{col:5,row:1,width:4,height:4});
});
test('history is bounded and document copies cannot mutate model',()=>{const model=new EditorModel(emptyDocument());for(let i=0;i<50;i++)model.change(d=>d.title=String(i));let count=0;while(model.undo())count++;assert.equal(count,30);const copy=model.document;copy.title='outside';assert.notEqual(model.document.title,'outside')});
test('embedded raster images are allowed only for images',()=>{
  const doc=emptyDocument();const image=createWidget('image',doc,0);if(image.type!=='image')throw new Error();image.src='data:image/png;base64,AAAA';doc.pages[0].widgets.push(image);assert.doesNotThrow(()=>checked(doc));
  image.src='data:image/svg+xml;base64,AAAA';assert.throws(()=>checked(doc));
  const text=createWidget('text',emptyDocument(),0);if(text.type!=='text')throw new Error();text.content=[{type:'link',text:'bad',href:'data:image/png;base64,AAAA'}];doc.pages[0].widgets=[text];assert.throws(()=>checked(doc));
});
