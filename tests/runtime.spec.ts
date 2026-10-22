import {test,expect} from '@playwright/test';
import axe from 'axe-core';

test('rendered prose preserves readable links and callouts after source-palette component changes',async({page})=>{
  await page.goto('/demos/panel.html');
  await page.evaluate(async()=>{
    const {renderText}=await import('/src/widgets.ts' as string);
    const host=document.createElement('main');host.id='prose-regression';host.className='af';
    const title=document.createElement('h1');title.textContent='Документ';host.append(title,renderText([{type:'heading',text:'Материалы встречи'},{type:'callout',tone:'warning',text:'Проверьте материалы перед отправкой.'},{type:'link',text:'Открыть материалы',href:'#materials'}],'h2'));document.body.replaceChildren(host);
  });
  await expect(page.locator('#prose-regression .af-alert')).toHaveClass(/af-alert--accessible/);
  await expect(page.getByRole('link',{name:'Открыть материалы'})).toHaveClass(/af-link--inline/);
  await expect(page.getByRole('link')).toHaveCSS('text-decoration-line','underline');
  await page.evaluate(axe.source);expect(await page.evaluate(async()=>((await (window as any).axe.run(document.querySelector('main'))).violations).map((v:any)=>v.id))).toEqual([]);
});
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
