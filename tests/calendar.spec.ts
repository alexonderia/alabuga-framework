import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

async function mount(page:Page,info:TestInfo,date:string){
  const file=info.outputPath(`calendar-${date}.html`);
  const css=pathToFileURL(resolve('dist/alabuga.css')).href,js=pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  const data={schemaVersion:1,kind:'page',title:'Calendar',pages:[{id:'page',title:'',grid:{columns:4,rowHeight:64,gap:16},widgets:[{id:'calendar',type:'calendar',title:'Выберите дату',date,position:{col:1,row:1,width:4,height:4}}]}]};
  await writeFile(file,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calendar</title><link rel="stylesheet" href="${css}"></head><body><main id="host"></main><button id="outside">Продолжить</button><script src="${js}"></script><script>
    window.controller=Alabuga.renderDocument(document.querySelector('#host'),${JSON.stringify(data)});
    window.changes=[];
    document.querySelector('#host').addEventListener('af:change',event=>window.changes.push({
      ...event.detail,
      selected:document.querySelector('[aria-pressed="true"]').dataset.date,
      focused:document.activeElement.dataset.date
    }));
  </script></body></html>`);
  await page.route(/^https?:\/\//,route=>route.abort());
  await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}

const day=(page:Page,date:string)=>page.locator(`[data-date="${date}"]`);
const changes=(page:Page)=>page.evaluate(()=>(window as any).changes);
const value=(page:Page)=>page.evaluate(()=>(window as any).controller.getDocument().pages[0].widgets[0].date);

test('offline JS/CSS calendar separates keyboard focus from selection and notifies after updating DOM',async({page},info)=>{
  await mount(page,info,'2026-09-30');await day(page,'2026-09-30').focus();
  for(const [key,date]of [['ArrowRight','2026-10-01'],['ArrowDown','2026-10-08'],['Home','2026-10-05'],['End','2026-10-11']]){
    await page.keyboard.press(key);await expect(day(page,date)).toBeFocused();
    await expect(page.locator('.af-calendar__day[tabindex="0"]')).toHaveCount(1);
  }
  expect(await changes(page)).toEqual([]);expect(await value(page)).toBe('2026-09-30');
  await page.keyboard.press('Enter');
  expect(await changes(page)).toEqual([{widgetId:'calendar',value:'2026-10-11',selected:'2026-10-11',focused:'2026-10-11'}]);
  expect(await value(page)).toBe('2026-10-11');
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('Space');
  await expect(day(page,'2026-10-10')).toHaveAttribute('aria-pressed','true');
  expect(await value(page)).toBe('2026-10-10');expect(await changes(page)).toHaveLength(2);
});

test('month and year paging clamps the day for leap and short months without choosing a value',async({page},info)=>{
  await mount(page,info,'2024-01-31');await day(page,'2024-01-31').focus();
  for(const [key,date]of [['PageDown','2024-02-29'],['Shift+PageDown','2025-02-28'],['Shift+PageUp','2024-02-28'],['PageUp','2024-01-28']]){
    await page.keyboard.press(key);await expect(day(page,date)).toBeFocused();
  }
  expect(await changes(page)).toEqual([]);expect(await value(page)).toBe('2024-01-31');
  await expect(day(page,'2024-01-31')).toHaveAttribute('aria-pressed','true');
  await day(page,'2024-01-28').press('Control+ArrowLeft');await expect(day(page,'2024-01-28')).toBeFocused();
});

test('early four-digit years retain their actual year, leap days and a single Tab stop',async({page},info)=>{
  for(const [initial,key,target,count]of [
    ['0099-12-31','ArrowRight','0100-01-01',31],
    ['0001-01-01','ArrowRight','0001-01-02',31],
    ['0000-02-28','ArrowRight','0000-02-29',29],
    ['0100-02-28','ArrowRight','0100-03-01',28],
  ] as const){
    await mount(page,info,initial);
    await expect(page.locator('.af-calendar__day:not([data-outside])')).toHaveCount(count);
    await expect(day(page,initial)).toHaveAttribute('tabindex','0');
    await day(page,initial).focus();await page.keyboard.press(key);await expect(day(page,target)).toBeFocused();
    await page.keyboard.press('Enter');expect(await value(page)).toBe(target);
    await expect(page.locator('.af-calendar__day[tabindex="0"]')).toHaveCount(1);
  }
});

test('navigation stays within the accepted 0000–9999 date domain',async({page},info)=>{
  for(const [date,key,disabled]of [['0000-01-01','ArrowLeft','prev'],['9999-12-31','ArrowRight','next']] as const){
    await mount(page,info,date);await expect(page.locator(`[data-${disabled}]`)).toBeDisabled();
    await day(page,date).focus();await page.keyboard.press(key);await expect(day(page,date)).toBeFocused();
    await page.keyboard.press(date.startsWith('0000')?'Shift+PageUp':'Shift+PageDown');
    await expect(day(page,date)).toBeFocused();expect(await changes(page)).toEqual([]);
    await page.keyboard.press('Enter');expect(await value(page)).toBe(date);
  }
  await mount(page,info,'9999-11-30');await page.locator('[data-next]').click();
  await expect(page.locator('[data-next]')).toBeDisabled();await expect(day(page,'9999-12-01')).toBeFocused();
});

test('month controls and live heading persist while same-month selection keeps the focused day',async({page},info)=>{
  await mount(page,info,'2026-09-30');
  await page.evaluate(()=>{(window as any).calendarNodes=['.af-calendar__head','.af-calendar__month','[data-prev]','[data-next]'].map(s=>document.querySelector(s))});
  await page.locator('[data-next]').click();await expect(page.locator('[data-next]')).toBeFocused();
  await page.keyboard.press('Tab');await expect(day(page,'2026-10-01')).toBeFocused();
  await page.keyboard.press('Enter');await expect(day(page,'2026-10-01')).toBeFocused();
  await page.locator('[data-prev]').click();
  await expect(day(page,'2026-09-01')).toHaveAttribute('tabindex','0');
  const persistent=await page.evaluate(()=>(window as any).calendarNodes.every((node:Element,i:number)=>node===document.querySelector(['.af-calendar__head','.af-calendar__month','[data-prev]','[data-next]'][i])));
  expect(persistent).toBe(true);await expect(page.locator('.af-calendar__month')).toHaveAttribute('aria-live','polite');
  expect(await changes(page)).toHaveLength(1);
});

test('selection handlers may synchronously update or destroy the host and move focus outside',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const action of ['update','destroy'] as const){
    await mount(page,info,'2026-09-30');
    await page.evaluate(action=>document.querySelector('#host')!.addEventListener('af:change',()=>{
      const controller=(window as any).controller;
      if(action==='update'){
        const data=controller.getDocument();data.pages[0].widgets[0].date='2027-01-15';controller.update(data);
      }else controller.destroy();
      document.querySelector<HTMLButtonElement>('#outside')!.focus();
    },{once:true}),action);
    await day(page,'2026-09-29').click();await expect(page.locator('#outside')).toBeFocused();
    expect((await changes(page))[0].selected).toBe('2026-09-29');
    if(action==='update'){
      expect(await value(page)).toBe('2027-01-15');await expect(day(page,'2027-01-15')).toHaveAttribute('aria-pressed','true');
    }else await expect(page.locator('#host')).toBeEmpty();
  }
  expect(errors).toEqual([]);
});

test('reference examples show independent working calendars and usable code on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/#widgets');
  const leap=page.locator('#calendar-leap-year'),first=page.locator('#example-0');
  await leap.locator('[data-date="2024-01-31"]').focus();await page.keyboard.press('PageDown');
  await expect(leap.locator('[data-date="2024-02-29"]')).toBeFocused();
  await expect(leap.locator('[role="status"]')).toHaveText('Выбрано: 2024-01-31');
  await page.keyboard.press('Space');await expect(leap.locator('[role="status"]')).toHaveText('Выбрано: 2024-02-29');
  await expect(first.locator('[role="status"]')).toHaveText('Выбрано: 2026-09-10');
  await expect(leap.locator('code').last()).toContainText("document.querySelector('#calendar-leap-example')");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});

async function component(page:Page,info:TestInfo,options:Record<string,unknown>={}){
  const file=info.outputPath('calendar-component.html');
  const css=pathToFileURL(resolve('dist/alabuga.css')).href,js=pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  await writeFile(file,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Calendar component</title><link rel="stylesheet" href="${css}"></head><body><main id="host"></main><button id="outside">Продолжить</button><script src="${js}"></script><script>
    window.calls=[];window.cancels=0;
    document.querySelector('#host').append(Alabuga.renderCalendar('2026-09-10',value=>window.calls.push(value),{...${JSON.stringify(options)},onCancel:()=>window.cancels++}));
  </script></body></html>`);
  await page.route(/^https?:\/\//,route=>route.abort());await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}

test('reference geometry has fixed square days, source arrow assets and disabled adjacent dates',async({page},info)=>{
  for(const confirm of [false,true]){
    await component(page,info,{confirm});
    const box=await page.locator('.af-calendar').boundingBox();expect(box?.width).toBe(250);expect(box?.height).toBe(confirm?304:260);
    await expect(page.locator('.af-calendar__month')).toHaveText('Сентябрь 2026');
    await expect(page.locator('.af-calendar__month')).toHaveCSS('font-size','16px');
    await expect(day(page,'2026-09-10')).toHaveCSS('width','32px');await expect(day(page,'2026-09-10')).toHaveCSS('height','32px');
    await expect(page.locator('.af-calendar__blank')).toHaveCount(1);await expect(day(page,'2026-10-01')).toBeDisabled();
    await expect(day(page,'2026-09-31')).toHaveCount(0);await expect(page.locator('[data-outside]')).toHaveCount(4);
    await expect(page.locator('[data-prev]')).toHaveText('');
    expect(await page.locator('[data-prev]').evaluate(n=>getComputedStyle(n,'::before').maskImage)).toContain('data:image/svg+xml');
    if(confirm){
      await expect(page.getByRole('button',{name:'Подтвердить',exact:true})).toHaveCSS('background-color','rgb(12, 111, 241)');
      await expect(page.getByRole('button',{name:'Подтвердить',exact:true})).toHaveCSS('font-size','14px');
      await expect(page.getByRole('button',{name:'Подтвердить',exact:true})).toHaveCSS('height','40px');
      const footer=await page.locator('.af-calendar__actions').evaluate(n=>({width:n.clientWidth,scroll:n.scrollWidth}));expect(footer.scroll).toBeLessThanOrEqual(footer.width);
    }
  }
});

test('single confirmation buffers drafts, cancels with Escape and commits only on confirmation',async({page},info)=>{
  await component(page,info,{confirm:true});await day(page,'2026-09-17').click();
  await expect(day(page,'2026-09-17')).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>(window as any).calls)).toEqual([]);
  await page.getByRole('button',{name:'Отмена',exact:true}).click();await expect(day(page,'2026-09-10')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>(window as any).cancels)).toBe(1);
  await day(page,'2026-09-18').click();await page.getByRole('button',{name:'Подтвердить',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).calls)).toEqual(['2026-09-18']);
  await day(page,'2026-09-23').click();await page.keyboard.press('Escape');await expect(day(page,'2026-09-18')).toBeFocused();
  await expect(day(page,'2026-09-18')).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>(window as any).calls)).toHaveLength(1);
});

test('empty selection stays empty on cancel and can confirm the focused date',async({page},info)=>{
  await component(page,info,{confirm:true,value:null});await expect(page.locator('[aria-pressed=true]')).toHaveCount(0);
  await day(page,'2026-09-10').focus();await page.keyboard.press('ArrowRight');await page.getByRole('button',{name:'Подтвердить',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).calls)).toEqual(['2026-09-11']);
  await expect(day(page,'2026-09-11')).toHaveAttribute('aria-pressed','true');
});

test('range draws start/middle/end across weeks and buffers, sorts and cancels cross-month changes',async({page},info)=>{
  await component(page,info,{mode:'range',confirm:true,value:{start:'2026-09-10',end:'2026-09-17'}});
  await expect(day(page,'2026-09-10')).toHaveAttribute('data-range','start');await expect(day(page,'2026-09-17')).toHaveAttribute('data-range','end');
  await expect(page.locator('[data-range=middle]')).toHaveCount(6);
  await expect(day(page,'2026-09-13')).toHaveCSS('border-radius','0px');await expect(day(page,'2026-09-14')).toHaveCSS('border-radius','0px');
  await day(page,'2026-09-28').click();await expect(page.getByRole('button',{name:'Подтвердить',exact:true})).toBeDisabled();
  await page.locator('[data-next]').click();await day(page,'2026-10-03').click();
  expect(await page.evaluate(()=>(window as any).calls)).toEqual([]);await page.getByRole('button',{name:'Подтвердить',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).calls)).toEqual([{start:'2026-09-28',end:'2026-10-03'}]);
  await day(page,'2026-10-20').click();await day(page,'2026-10-05').click();await page.keyboard.press('Escape');
  await expect(day(page,'2026-09-28')).toHaveAttribute('data-range','start');
  expect(await page.evaluate(()=>(window as any).calls)).toHaveLength(1);
});

test('immediate range completes in reverse order using the native keyboard',async({page},info)=>{
  await component(page,info,{mode:'range'});await day(page,'2026-09-10').focus();await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('Space');
  expect(await page.evaluate(()=>(window as any).calls)).toEqual([{start:'2026-09-09',end:'2026-09-10'}]);
  await expect(day(page,'2026-09-09')).toHaveAttribute('data-range','start');await expect(day(page,'2026-09-10')).toHaveAttribute('data-range','end');
});

test('bounded calendar clamps initial and canceled focus and rejects dates beyond either edge',async({page},info)=>{
  await component(page,info,{confirm:true,min:'2026-09-15',max:'2026-10-05'});
  await expect(day(page,'2026-09-14')).toBeDisabled();await expect(day(page,'2026-09-15')).toHaveAttribute('tabindex','0');
  await page.locator('[data-next]').click();await expect(page.locator('[data-next]')).toBeDisabled();await expect(day(page,'2026-10-06')).toBeDisabled();
  await page.getByRole('button',{name:'Отмена',exact:true}).click();await expect(day(page,'2026-09-15')).toBeFocused();
  await page.getByRole('button',{name:'Подтвердить',exact:true}).click();expect(await page.evaluate(()=>(window as any).calls)).toEqual(['2026-09-15']);
});
