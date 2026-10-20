import {test,expect} from '@playwright/test';

test('50 slides and 500 widgets update without replacing unrelated nodes or losing focus',async({page},info)=>{
 await page.goto('/demos/showcase.html');
 const result=await page.evaluate(async()=>{
  // @ts-ignore browser module
  const {renderDocument}=await import('/src/runtime.ts' as string);
  const pages=Array.from({length:50},(_,i)=>({id:'p'+i,title:'Slide '+i,grid:{columns:12,rowHeight:64,gap:16},widgets:Array.from({length:10},(_,j)=>({id:`w${i}-${j}`,title:'',type:'text',position:{col:1+(j%5)*2,row:1+Math.floor(j/5)*3,width:2,height:2},content:[{type:'paragraph',text:'Editable content',dropCap:false}]}))}));
  const doc={schemaVersion:3,kind:'presentation',title:'Large document',pages};const host=document.createElement('div');document.body.replaceChildren(host);const start=performance.now();const c=renderDocument(host,doc,{editing:true});const renderMs=performance.now()-start;
  const untouched=host.querySelector('[data-widget-id="w0-1"]') as HTMLElement;untouched.contentEditable='true';untouched.focus();const selection=window.getSelection()!,range=document.createRange();range.selectNodeContents(untouched);range.collapse(false);selection.removeAllRanges();selection.addRange(range);const node=selection.anchorNode,offset=selection.anchorOffset;
  doc.pages[25].widgets[2].content[0].text='Updated';const updateStart=performance.now();c.update(doc);const updateMs=performance.now()-updateStart;
  return {renderMs,updateMs,identity:untouched===host.querySelector('[data-widget-id="w0-1"]'),focus:document.activeElement===untouched,selection:selection.anchorNode===node&&selection.anchorOffset===offset,count:host.querySelectorAll('[data-widget-id]').length};
 });
 await info.attach('performance.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});expect(result.count).toBe(500);expect(result.identity&&result.focus&&result.selection).toBe(true);expect(result.updateMs).toBeLessThan(1500);expect(result.renderMs).toBeLessThan(5000);
});
