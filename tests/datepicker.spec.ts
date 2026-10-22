import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import axe from 'axe-core';

const field=(id='date',attrs='value="2026-09-10"',extra='')=>`<div class="af-field" style="width:280px;max-width:100%"><label class="af-label" for="${id}">Дата встречи${id==='date'?'':' '+id}</label><input class="af-input af-input--lg af-datepicker ${extra}" type="date" id="${id}" name="${id}" ${attrs} aria-describedby="${id}-help ${id}-error"><p class="af-help" id="${id}-help">ДД.ММ.ГГГГ</p><p class="af-error" id="${id}-error" data-af-error-for="${id}" hidden></p></div>`;
async function mount(page:Page,info:TestInfo,markup=field()){
  const file=info.outputPath('datepicker.html'),css=pathToFileURL(resolve('dist/alabuga.css')).href,js=pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  await writeFile(file,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DatePicker</title><link rel="stylesheet" href="${css}"></head><body style="margin:16px"><main class="af"><h1 class="af-sr-only">DatePicker</h1><form data-af-validate class="af-stack">${markup}<div class="af-row"><button class="af-btn" type="submit">Сохранить</button><button class="af-btn" type="reset">Сбросить</button><button class="af-btn" id="outside" type="button">Продолжить</button></div></form></main><script src="${js}"></script><script>
    window.events=[];window.submissions=[];window.init=()=>window.cleanup=Alabuga.initComponents(document.querySelector('main'));init();
    const native=document.querySelector('#date');
    if(native)for(const type of ['input','change'])native.addEventListener(type,()=>window.events.push({type,value:native.value}));
    document.querySelector('form').addEventListener('af:submit',event=>window.submissions.push([...event.detail]));
  </script></body></html>`);
  await page.route(/^https?:\/\//,route=>route.abort());await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}
const proxy=(page:Page)=>page.getByRole('combobox',{name:'Дата встречи',exact:true});
const popup=(page:Page)=>page.getByRole('dialog',{name:'Выбор даты: Дата встречи',exact:true});
const date=(page:Page,iso:string)=>popup(page).locator(`[data-date="${iso}"]`);

test('DatePicker enhances standalone JS/CSS with source field geometry, assets and native form values',async({page},info)=>{
  await mount(page,info,field('date','required'));
  await expect(proxy(page)).toHaveValue('');await expect(proxy(page)).toHaveAttribute('placeholder','ДД.ММ.ГГГГ');
  await expect(proxy(page).locator('..')).toHaveCSS('height','48px');await expect(proxy(page)).toHaveCSS('font-size','16px');
  await expect(page.locator('.af-label')).toHaveCSS('font-size','14px');
  for(const selector of ['.af-datepicker__toggle','.af-datepicker__hint']){
    await expect(page.locator(selector)).toHaveCSS('width','24px');await expect(page.locator(selector)).toHaveCSS('height','24px');
    expect(await page.locator(selector).evaluate(n=>getComputedStyle(n).maskImage)).toContain('data:image/svg+xml');
  }
  await page.locator('label').click();await expect(proxy(page)).toBeFocused();
  await proxy(page).fill('15092026');await page.locator('#outside').click();
  await expect(proxy(page)).toHaveValue('15.09.2026');await expect(page.locator('#date')).toHaveValue('2026-09-15');
  await page.getByRole('button',{name:'Сохранить',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).submissions)).toEqual([[['date','2026-09-15']]]);
  expect(await page.evaluate(()=>(window as any).events)).toEqual([{type:'input',value:'2026-09-15'},{type:'change',value:'2026-09-15'}]);
});

test('typed impossible or out-of-range dates invalidate the native field and never retain a stale value',async({page},info)=>{
  await mount(page,info,field('date','value="2026-09-10" min="2026-09-05" max="2026-09-20" required'));
  await proxy(page).fill('31.02.2026');await page.getByRole('button',{name:'Сохранить',exact:true}).click();
  await expect(page.locator('#date')).toHaveValue('');await expect(proxy(page)).toHaveValue('31.02.2026');
  await expect(proxy(page)).toBeFocused();await expect(proxy(page)).toHaveAttribute('aria-invalid','true');await expect(page.locator('#date-error')).toBeVisible();
  expect(await page.evaluate(()=>(window as any).submissions)).toEqual([]);
  await proxy(page).fill('21.09.2026');await page.getByRole('button',{name:'Сохранить',exact:true}).click();
  expect(await page.locator('#date').evaluate((n:HTMLInputElement)=>n.type==='date'?n.validity.rangeOverflow:n.validity.customError&&n.value>n.max)).toBe(true);
  await proxy(page).fill('19.09.2026');await page.getByRole('button',{name:'Сохранить',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).submissions)).toEqual([[['date','2026-09-19']]]);
});

test('calendar obeys native min/max, buffers drafts and confirms one pair of native events',async({page},info)=>{
  await mount(page,info,field('date','value="2026-09-10" min="2026-09-10" max="2026-09-20"'));
  await proxy(page).focus();await page.keyboard.press('Alt+ArrowDown');await expect(popup(page)).toBeVisible();
  await page.locator('#date').evaluate((n:HTMLInputElement)=>n.style.setProperty('caret-color','transparent'));
  await expect(popup(page)).toBeVisible();
  await expect(date(page,'2026-09-09')).toBeDisabled();await expect(date(page,'2026-09-21')).toBeDisabled();
  await expect(popup(page).locator('[data-prev]')).toBeDisabled();await expect(popup(page).locator('[data-next]')).toBeDisabled();
  await expect(date(page,'2026-09-10')).toBeFocused();await page.keyboard.press('ArrowLeft');await expect(date(page,'2026-09-10')).toBeFocused();
  await date(page,'2026-09-15').click();await expect(page.locator('#date')).toHaveValue('2026-09-10');
  await popup(page).getByRole('button',{name:'Отмена',exact:true}).click();await expect(proxy(page)).toBeFocused();
  expect(await page.evaluate(()=>(window as any).events)).toEqual([]);
  await page.getByRole('button',{name:'Открыть календарь: Дата встречи',exact:true}).click();await date(page,'2026-09-17').click();
  await popup(page).getByRole('button',{name:'Подтвердить',exact:true}).click();
  await expect(popup(page)).not.toBeVisible();await expect(proxy(page)).toHaveValue('17.09.2026');await expect(proxy(page)).toBeFocused();
  expect(await page.evaluate(()=>(window as any).events)).toEqual([{type:'input',value:'2026-09-17'},{type:'change',value:'2026-09-17'}]);
});

test('popover flips near a screen edge, traps modal Tab and dismisses without committing',async({page},info)=>{
  await page.setViewportSize({width:390,height:540});await mount(page,info,`<div style="height:330px"></div>${field()}`);
  await proxy(page).focus();await page.keyboard.press('ArrowDown');
  const box=await popup(page).boundingBox(),control=await page.locator('.af-datepicker-box').boundingBox();
  expect(box!.y+box!.height).toBeLessThanOrEqual(control!.y-3);expect(box!.x).toBeGreaterThanOrEqual(8);expect(box!.x+box!.width).toBeLessThanOrEqual(382);
  await popup(page).getByRole('button',{name:'Подтвердить',exact:true}).focus();await page.keyboard.press('Tab');await expect(popup(page).locator('[data-prev]')).toBeFocused();
  await page.keyboard.press('Escape');await expect(proxy(page)).toBeFocused();await expect(popup(page)).not.toBeVisible();
  await page.keyboard.press('ArrowDown');await page.mouse.click(1,1);await expect(popup(page)).not.toBeVisible();
  expect(await page.evaluate(()=>(window as any).events)).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});

test('external updates, reset, readonly and disabled fieldsets synchronize without duplicate enhancement',async({page},info)=>{
  await mount(page,info,`<fieldset id="group">${field()}</fieldset>`);
  await proxy(page).focus();await page.keyboard.press('ArrowDown');
  await page.locator('#date').evaluate((n:HTMLInputElement)=>{n.value='2026-10-22';n.dispatchEvent(new Event('change',{bubbles:true}))});
  await expect(popup(page)).not.toBeVisible();await expect(proxy(page)).toHaveValue('22.10.2026');
  await page.getByRole('button',{name:'Сбросить',exact:true}).click();await expect(proxy(page)).toHaveValue('10.09.2026');
  await page.locator('#date').evaluate((n:HTMLInputElement)=>n.readOnly=true);await expect(proxy(page)).toHaveAttribute('readonly','');
  await expect(page.locator('.af-datepicker__toggle')).toBeDisabled();
  await page.getByRole('button',{name:'Сохранить',exact:true}).click();expect(await page.evaluate(()=>(window as any).submissions)).toEqual([[['date','2026-09-10']]]);
  await page.locator('#group').evaluate((n:HTMLFieldSetElement)=>n.disabled=true);await expect(proxy(page)).toBeDisabled();
  await page.evaluate(()=>(window as any).cleanup());await expect(page.locator('.af-datepicker-box')).toHaveCount(0);
  await expect(page.locator('#date')).not.toHaveAttribute('aria-hidden','true');
  await page.evaluate(()=>(window as any).init());await expect(page.locator('.af-datepicker-box')).toHaveCount(1);
  await page.evaluate(()=>(window as any).init());await expect(page.locator('.af-datepicker-box')).toHaveCount(1);
});

test('host input handlers may remove the enhancement synchronously after confirmation',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await mount(page,info);
  await page.locator('#date').evaluate(n=>n.addEventListener('input',()=>{(window as any).cleanup();document.querySelector<HTMLButtonElement>('#outside')!.focus()},{once:true}));
  await proxy(page).focus();await page.keyboard.press('ArrowDown');await date(page,'2026-09-18').click();await popup(page).getByRole('button',{name:'Подтвердить',exact:true}).click();
  await expect(page.locator('.af-datepicker-box')).toHaveCount(0);await expect(page.locator('#date')).toHaveValue('2026-09-18');await expect(page.locator('#outside')).toBeFocused();expect(errors).toEqual([]);
});

test('source states retain accessible labels and can be used in ordinary standalone markup',async({page},info)=>{
  await mount(page,info,`<div style="display:flex;gap:24px;flex-wrap:wrap">${field('date','')}${field('filled')}${field('error','value="2026-09-10" aria-invalid="true"')}${field('success','value="2026-09-10"','af-input--success')}${field('disabled','value="2026-09-10" disabled')}${field('readonly','value="2026-09-10" readonly')}</div>`);
  await page.evaluate(axe.source);const violations=await page.evaluate(async()=>{const result=await (window as any).axe.run();return result.violations.map((v:any)=>({id:v.id,nodes:v.nodes.map((n:any)=>({target:n.target,reason:n.failureSummary}))}))});expect(violations).toEqual([]);
  await expect(page.locator('#error').locator('..')).toHaveCSS('border-top-color','rgb(230, 38, 38)');
  await expect(page.locator('#success').locator('..')).toHaveCSS('border-top-color','rgb(62, 172, 100)');
  await expect(page.locator('#success').locator('..').locator('.af-datepicker__hint')).toHaveCSS('background-color','rgb(62, 172, 100)');
  await expect(page.locator('#disabled').locator('..').locator('.af-datepicker__hint')).toHaveCSS('background-color','rgb(222, 226, 230)');
  await expect(page.locator('#readonly').locator('..')).toHaveCSS('background-color','rgb(241, 243, 245)');
});

test('host custom validation survives typing, external updates and cleanup',async({page},info)=>{
  await mount(page,info);await page.locator('#date').evaluate((n:HTMLInputElement)=>n.setCustomValidity('Дата занята'));
  await proxy(page).fill('12.09.2026');await page.getByRole('button',{name:'Сохранить',exact:true}).click();
  await expect(page.locator('#date-error')).toHaveText('Дата занята');expect(await page.evaluate(()=>(window as any).submissions)).toEqual([]);
  await page.locator('#date').evaluate((n:HTMLInputElement)=>{n.setCustomValidity('');n.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.getByRole('button',{name:'Сохранить',exact:true}).click();expect(await page.evaluate(()=>(window as any).submissions)).toEqual([[['date','2026-09-12']]]);
  await proxy(page).fill('31.02.2026');await page.locator('#date').evaluate((n:HTMLInputElement)=>n.setCustomValidity('Проверка приложения'));
  await page.evaluate(()=>(window as any).cleanup());expect(await page.locator('#date').evaluate((n:HTMLInputElement)=>n.validationMessage)).toBe('Проверка приложения');
});

for(const [size,modifier,height,font,icon,label,help] of [
  ['S','af-input--sm',32,12,16,10,8],
  ['M','',40,14,20,12,10],
  ['L','af-input--lg',48,16,24,14,12],
] as const){
  test(`DatePicker ${size} sizes its field, text, icons and labels while retaining confirmed form values`,async({page},info)=>{
    await mount(page,info,field().replace('af-input--lg',modifier));
    await expect(page.locator('.af-datepicker-box')).toHaveCSS('height',height+'px');
    await expect(proxy(page)).toHaveCSS('font-size',font+'px');
    await expect(page.locator('.af-label')).toHaveCSS('font-size',label+'px');
    await expect(page.locator('#date-help')).toHaveCSS('font-size',help+'px');
    for(const slot of ['.af-datepicker__toggle','.af-datepicker__hint']){
      await expect(page.locator(slot)).toHaveCSS('width',icon+'px');
      await expect(page.locator(slot)).toHaveCSS('height',icon+'px');
    }
    await proxy(page).fill('15092026');await page.locator('#outside').click();
    await expect(proxy(page)).toHaveValue('15.09.2026');
    await page.locator('.af-datepicker__toggle').click();
    await expect(popup(page).locator('.af-calendar')).toHaveCSS('width','250px');
    await date(page,'2026-09-17').click();await expect(page.locator('#date')).toHaveValue('2026-09-15');
    await popup(page).getByRole('button',{name:'Подтвердить',exact:true}).click();
    await expect(proxy(page)).toHaveValue('17.09.2026');
    await page.getByRole('button',{name:'Сохранить',exact:true}).click();
    expect(await page.evaluate(()=>(window as any).submissions)).toEqual([[['date','2026-09-17']]]);
  });
}

test('changing the DatePicker size preserves the open calendar draft and updates its anchor',async({page},info)=>{
  await mount(page,info);await page.locator('.af-datepicker__toggle').click();await date(page,'2026-09-17').click();
  for(const [modifier,height,icon] of [['af-input--sm',32,16],['',40,20],['af-input--lg',48,24]] as const){
    await page.locator('#date').evaluate((n:HTMLInputElement,size)=>{n.classList.remove('af-input--sm','af-input--lg');if(size)n.classList.add(size)},modifier);
    await expect(page.locator('.af-datepicker-box')).toHaveCSS('height',height+'px');
    await expect(page.locator('.af-datepicker__toggle')).toHaveCSS('width',icon+'px');
    await expect(popup(page)).toBeVisible();await expect(date(page,'2026-09-17')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#date')).toHaveValue('2026-09-10');
  }
  await popup(page).getByRole('button',{name:'Подтвердить',exact:true}).click();await expect(proxy(page)).toHaveValue('17.09.2026');
});
