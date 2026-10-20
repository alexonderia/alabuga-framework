import {test,expect} from '@playwright/test';
test('validation is atomic, text is literal, controllers are isolated and disposable',async({page})=>{
  await page.goto('/demos/panel.html');
  const result=await page.evaluate(async()=>{
    const {renderDocument}=await import('/src/index.ts' as string);
    const {panelExample}=await import('/src/examples.ts' as string);
    const host=document.createElement('div');document.body.append(host);
    const source=structuredClone(panelExample);source.pages[0].widgets[1].content=[{type:'paragraph',text:'<img src=x onerror="window.injected=true">',dropCap:false}];
    const first=renderDocument(host,source);const original=host.innerHTML;
    let rejected=false;try{first.update({...source,schemaVersion:99})}catch{rejected=true}
    const unchanged=host.innerHTML===original;
    const snapshot=first.getDocument();snapshot.title='changed';const isolated=first.getDocument().title!==snapshot.title;
    const literal=host.textContent!.includes('<img src=x')&&!host.querySelector('img');
    const second=renderDocument(host,source);let disposed=false;try{first.update(source)}catch{disposed=true}
    first.destroy();const currentRemains=!!host.querySelector('.af-panel');second.destroy();second.destroy();
    return {rejected,unchanged,isolated,literal,disposed,currentRemains,empty:host.childElementCount===0};
  });
  expect(result).toEqual({rejected:true,unchanged:true,isolated:true,literal:true,disposed:true,currentRemains:true,empty:true});
});
test('overflow catches long content and oversized slide headings',async({page})=>{
  await page.goto('/demos/slides.html');await page.evaluate(()=>document.fonts.ready);
  const issues=await page.evaluate(()=>{const c=(window as any).demoController;const d=c.getDocument();d.pages[0].title='Очень длинный заголовок '.repeat(8);d.pages[0].widgets[1].position.height=8;d.pages[1].widgets[0].content[0].text='Длинный абзац '.repeat(500);c.update(d);return c.checkOverflow()});
  expect(issues.some((s:string)=>s.includes('Слайд 1'))).toBe(true);expect(issues.some((s:string)=>s.includes('story-text'))).toBe(true);
});
