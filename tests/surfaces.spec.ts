import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import axe from 'axe-core';
import {examples} from '../docs/app/examples';

async function mount(page:Page,info:TestInfo,html:string){
  const file=info.outputPath('surfaces.html'),css=pathToFileURL(resolve('dist/alabuga.css')).href;
  await writeFile(file,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Surfaces</title><link rel="stylesheet" href="${css}"></head><body style="margin:24px;background:white"><main class="af"><h1 class="af-sr-only">Блоки и поверхности</h1>${html}</main></body></html>`);
  await page.route(/^https?:\/\//,route=>route.abort());
  await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}

test('explicit outer/inner geometry keeps source spacing on mobile while legacy cards stay compatible',async({page},info)=>{
  await mount(page,info,examples.surfaces[0].html+'<div class="af-card" id="legacy">Прежняя карточка</div>');
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    for(const [selector,size]of [['.af-card--outer',32],['.af-card--inner',16]] as const){
      for(const card of await page.locator(selector).all()){
        await expect(card).toHaveCSS('padding',size+'px');await expect(card).toHaveCSS('border-radius',size+'px');
        await expect(card).toHaveCSS('gap','16px');
        const gaps=await card.evaluate(n=>{const children=[...n.children];return children.slice(1).map((c,i)=>c.getBoundingClientRect().top-children[i].getBoundingClientRect().bottom)});
        gaps.forEach(gap=>expect(gap).toBeCloseTo(16,2));
      }
    }
    await expect(page.locator('#legacy')).toHaveCSS('display','block');
    await expect(page.locator('#legacy')).toHaveCSS('padding',width<768?'20px':'32px');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  }
});

test('appearances use the source fill, 2/3 px outlines or shadow without stacking emphasis',async({page},info)=>{
  await mount(page,info,examples.surfaces.slice(1).map(e=>e.html).join(''));
  const fill=page.locator('.af-card--filled');
  await expect(fill).toHaveCSS('background-color','rgb(12, 111, 241)');await expect(fill).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(fill).toHaveCSS('border-width','0px');await expect(fill).toHaveCSS('box-shadow','none');
  for(const [selector,width]of [['.af-card--outline',2],['.af-card--outline-thick',3]] as const){
    await expect(page.locator(selector)).toHaveCSS('border-width',width+'px');
    await expect(page.locator(selector)).toHaveCSS('border-color','rgb(12, 111, 241)');
    await expect(page.locator(selector)).toHaveCSS('background-color','rgb(255, 255, 255)');
    await expect(page.locator(selector)).toHaveCSS('box-shadow','none');
  }
  await expect(page.locator('.af-card--elevated')).toHaveCSS('border-width','0px');
  await expect(page.locator('.af-card--elevated')).toHaveCSS('box-shadow','rgb(204, 207, 216) 0px 2px 3px 0px');
  await page.emulateMedia({media:'print'});await expect(fill).toHaveCSS('print-color-adjust','exact');
});

test('nested white surfaces reset text and keep native control colors and sizes',async({page},info)=>{
  await mount(page,info,`<div class="af-card af-card--outer af-card--filled"><p class="af-body">Цветной блок</p><div class="af-card af-card--inner"><p class="af-body">Белый вложенный блок</p><div class="af-row"><button class="af-btn" type="button">Основное действие</button><button class="af-btn af-btn--secondary" type="button">Дополнительное</button></div><label class="af-check"><input class="af-checkbox" type="checkbox">Участие подтверждено</label></div><div class="af-row"><button class="af-btn af-btn--inverse" type="button">Материалы встречи</button></div></div>`);
  await expect(page.locator('.af-card--inner')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('.af-card--inner .af-body')).toHaveCSS('color','rgb(22, 22, 22)');
  await expect(page.locator('.af-card--inner .af-btn').first()).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(page.locator('.af-btn--secondary')).toHaveCSS('color','rgb(9, 86, 187)');
  for(const button of await page.getByRole('button').all())await expect(button).toHaveCSS('min-height','40px');
  await page.getByRole('checkbox').check();await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.locator('.af-btn--inverse')).toHaveCSS('background-color','rgb(255, 255, 255)');
});

test('source surface matrix stays accessible and matches the reviewed visual geometry offline',async({page,browserName},info)=>{
  await mount(page,info,`<div id="matrix" style="max-width:1000px;padding:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px">${examples.surfaces.map(e=>e.html).join('')}</div>`);
  await page.evaluate(axe.source);
  const violations=await page.evaluate(async()=>{const r=await (window as any).axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return r.violations.map((v:any)=>v.id)});
  expect(violations).toEqual([]);
  if(browserName==='chromium')await expect(page.locator('#matrix')).toHaveScreenshot('surfaces.png');
});

test('fill and elevation retain visible system boundaries in forced colors',async({page,browserName},info)=>{
  test.skip(browserName==='webkit','WebKit does not emulate forced colors');
  await mount(page,info,examples.surfaces.slice(1).map(e=>e.html).join(''));
  await page.emulateMedia({forcedColors:'active'});
  for(const selector of ['.af-card--filled','.af-card--elevated']){
    await expect(page.locator(selector)).toHaveCSS('border-width','1px');
    await expect(page.locator(selector)).toHaveCSS('border-style','solid');
    await expect(page.locator(selector)).toHaveCSS('box-shadow','none');
  }
});
