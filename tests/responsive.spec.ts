import {test,expect} from '@playwright/test';

test('responsive sizes preserve independent geometry, DOM order and growing content',async({page})=>{
 await page.goto('/demos/panel.html');
 await page.evaluate(async()=>{
  const {renderDocument}=await import('/src/runtime.ts' as string);
  const link=document.createElement('link');link.rel='stylesheet';link.href='/src/compositions.css';document.head.append(link);
  const host=document.createElement('main');host.id='responsive-test';host.style.width='800px';document.body.replaceChildren(host);
  const widget=(id:string,col:number,width:number,tabletOrder:number,mobileOrder:number)=>({id,type:'text',title:'',position:{col,row:1,width:6,height:2},tabletOrder,mobileOrder,responsive:{tablet:{width,minHeight:230},mobile:{width:id==='first'?61:39,minHeight:310}},content:[{type:'paragraph',text:id==='first'?'Первый блок':'Второй блок',dropCap:false}]});
  (window as any).responsiveController=renderDocument(host,{schemaVersion:4,kind:'page',title:'Responsive',pages:[{id:'flow',title:'Responsive',appearance:{layout:'flow',theme:'light'},grid:{columns:12,rowHeight:64,gap:16},widgets:[widget('first',1,37,1,0),widget('second',7,63,0,1)]}]});
 });
 const first=page.locator('[data-widget-id=first]'),second=page.locator('[data-widget-id=second]'),panel=page.locator('#responsive-test .af-panel');
 await expect.poll(()=>panel.evaluate(n=>getComputedStyle(n).display)).toBe('flex');
 for(const [width,percentage,height,order]of [[800,37,230,['second','first']],[390,61,310,['first','second']]] as const){
  await page.locator('#responsive-test').evaluate((n,width)=>n.style.width=width+'px',width);
  await expect.poll(()=>panel.evaluate(n=>[...n.children].map(c=>(c as HTMLElement).dataset.widgetId))).toEqual(order);
  await expect.poll(async()=>Math.abs((await first.boundingBox())!.width-((await panel.boundingBox())!.width+(width<640?24:16))*percentage/100+(width<640?24:16))).toBeLessThan(1);
  expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(height);
  expect(Math.abs((await first.boundingBox())!.y-(await second.boundingBox())!.y)).toBeLessThan(1);
 }
 await first.locator('.af-prose').evaluate(n=>n.textContent='Длинный текст для проверки роста блока. '.repeat(120));
 await expect.poll(async()=>(await first.boundingBox())!.height).toBeGreaterThan(310);
 const result=await page.evaluate(()=>{const c=(window as any).responsiveController;return {doc:c.getDocument(),overflow:c.checkOverflow()}});
 expect(result.doc.schemaVersion).toBe(4);expect(result.doc.pages[0].widgets[0].position).toEqual({col:1,row:1,width:6,height:2});
 expect(result.doc.pages[0].widgets[0].responsive).toEqual({tablet:{width:37,minHeight:230},mobile:{width:61,minHeight:310}});
});
