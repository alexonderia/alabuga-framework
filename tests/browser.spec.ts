import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
class AxeBuilder {
  constructor(private options:{page:import('@playwright/test').Page}){}
  async analyze(){await this.options.page.evaluate(axe.source);return this.options.page.evaluate(async()=>({violations:(await (window as any).axe.run()).violations.map((v:any)=>({id:v.id,nodes:v.nodes.map((n:any)=>({target:n.target,reason:n.failureSummary}))}))}));}
}

// The reference explicitly shows low-contrast source colors. Admit only these
// exact palette roles inside component previews, then audit the readable variants.
async function auditSourcePreviews(page:import('@playwright/test').Page,info:import('@playwright/test').TestInfo,route:string){
  await page.evaluate(axe.source);
  const source=await page.evaluate(async()=>{
    const result=await (window as any).axe.run();
    const colors=['rgb(12, 111, 241)','rgb(62, 172, 100)','rgb(247, 144, 9)','rgb(230, 38, 38)','rgb(134, 142, 150)'];
    return result.violations.map((v:any)=>({id:v.id,nodes:v.nodes.map((n:any)=>{
      const element=document.querySelector(n.target.join(' '));
      const component=element?.closest('.af-alert:not(.af-alert--accessible),.af-chip:not(.af-chip--accessible),.af-link:not(.af-link--accessible):not(.af-link--inline)');
      return {target:n.target,documented:v.id==='color-contrast'&&!!component?.closest('.example-preview')&&colors.includes(getComputedStyle(element).color)};
    })}));
  });
  await info.attach(`source-palette-${route}.json`,{body:JSON.stringify(source,null,2),contentType:'application/json'});
  expect(source.every((v:any)=>v.id==='color-contrast'&&v.nodes.every((n:any)=>n.documented)),`${route}: unexpected accessibility failure ${JSON.stringify(source)}`).toBe(true);
  const originals=await page.locator('.example-preview :is(.af-alert,.af-chip,.af-link)').evaluateAll(nodes=>nodes.map(n=>({id:n,className:n.className})).map(({className},i)=>{
    const n=nodes[i];n.setAttribute('data-audit-original',className);
    n.classList.add(n.classList.contains('af-alert')?'af-alert--accessible':n.classList.contains('af-chip')?'af-chip--accessible':'af-link--accessible');return className;
  }));
  try{expect((await new AxeBuilder({page}).analyze()).violations,`${route}: readable variants`).toEqual([]);}
  finally{await page.locator('[data-audit-original]').evaluateAll(nodes=>nodes.forEach(n=>{n.setAttribute('class',n.getAttribute('data-audit-original')!);n.removeAttribute('data-audit-original')}));}
  expect(originals.length).toBeGreaterThan(0);
}

test('documentation search, examples and accessibility',async({page},info)=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('.hero')).toBeVisible();
  await page.locator('#search').fill('af-btn');await expect(page.locator('.search-result').first()).toBeVisible();await page.locator('.search-result').first().click();
  await expect(page.locator('.example-preview .af-btn').first()).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:info.outputPath('buttons.png'),fullPage:true});
  for(const route of ['start','colors','typography','grid','forms','feedback','dialog','surfaces','navigation','icons','widgets','slides','builder','classes','api','changes']){
    await page.goto('/#'+route);await expect(page.locator('.page-title')).toBeVisible();
    if(route==='feedback'||route==='navigation')await auditSourcePreviews(page,info,route);
    else expect((await new AxeBuilder({page}).analyze()).violations,route).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test('panel calendar keyboard selection survives resizing and mobile layout',async({page},info)=>{
  await page.goto('/demos/panel.html');
  await page.locator('[data-date="2026-09-30"]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-date="2026-10-01"]')).toBeFocused();await page.keyboard.press('Enter');
  await page.locator('#resize').click();await expect(page.locator('[data-date="2026-10-01"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-widget-id="tasks"]')).toHaveCSS('grid-row','2 / span 2');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:info.outputPath('panel-mobile.png'),fullPage:true});
});
test('table sorting and pagination',async({page})=>{
  await page.goto('/#widgets');const table=page.locator('.example-preview--table');
  await expect(table.locator('tbody tr')).toHaveCount(4);
  await table.locator('[data-sort="name"]').click();await expect(table.locator('th').first()).toHaveAttribute('aria-sort','ascending');
  await table.locator('[data-sort="name"]').click();await expect(table.locator('tbody tr').first()).toContainText('Задача 12');
  await table.locator('[data-page-next]').click();await expect(table.locator('.af-table__pagination')).toContainText('2 / 3');
});
test('form validation and modal focus',async({page})=>{
  await page.goto('/demos/form.html');await page.getByRole('button',{name:'Отправить заявку'}).click();await expect(page.locator('#name')).toBeFocused();await expect(page.locator('#name')).toHaveAttribute('aria-invalid','true');
  await page.locator('#name').fill('Анна');await page.locator('#email').fill('anna@example.com');await page.locator('#consent').check();await page.getByRole('button',{name:'Отправить заявку'}).click();await expect(page.locator('#form-success')).toBeVisible();
  await page.getByRole('button',{name:'Подробности'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('button',{name:'Подробности'})).toBeFocused();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
test('slides fit, navigate and print all eight pages',async({page,browserName},info)=>{
  await page.goto('/demos/slides.html');await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.af-slide')).toHaveCount(8);
  expect(await page.evaluate(()=>(window as any).demoController.checkOverflow())).toEqual([]);
  await page.locator('.af-document').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('.af-slide--active')).toContainText('Текст, который удобно читать');
  await page.keyboard.press('End');await expect(page.locator('.af-slide--active')).toContainText('Собираем вместе');
  await page.keyboard.press('Home');await page.screenshot({path:info.outputPath('slide-cover.png')});
  await page.emulateMedia({media:'print'});await expect(page.locator('.af-slide:visible')).toHaveCount(8);
  if(browserName==='chromium')await page.pdf({path:info.outputPath('slides.pdf'),preferCSSPageSize:true,printBackground:true});
});
test('standalone bundle works without development server',async({page})=>{
  await page.route(/^https?:\/\//,route=>route.abort());
  for(const [name,selector,count]of [['index','.af-widget',6],['slides','.af-slide',8],['landing','.af-page',10],['presentation','.af-slide',11]] as const){
    await page.goto(pathToFileURL(resolve(`dist/standalone/${name}.html`)).href);await expect(page.locator(selector)).toHaveCount(count);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
  }
  expect(await page.evaluate(()=>document.fonts.load('16px "Alabuga Sans"').then(f=>f.length))).toBe(1);
});
