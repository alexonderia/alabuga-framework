import {test, expect, type Page, type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import axe from 'axe-core';

const views = ['', 'secondary', 'ghost', 'clear'];
const sizes = ['sm', '', 'lg'];
const buttonClass = (view = '', size = '') => `af-btn${view ? ' af-btn--'+view : ''}${size ? ' af-btn--'+size : ''}`;

async function mount(page: Page, info: TestInfo, markup: string, initialize = false) {
  const css = pathToFileURL(resolve('dist/alabuga.css')).href;
  const js = pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  const file = info.outputPath('standalone-controls.html');
  await writeFile(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Controls</title><link rel="stylesheet" href="${css}"></head><body style="margin:24px"><main class="af" id="fixture"><h1 class="af-sr-only">Controls</h1>${markup}</main>${initialize ? `<script src="${js}"></script><script>window.cleanup=Alabuga.initComponents(document.querySelector('main'));</script>` : ''}</body></html>`);
  await page.route(/^https?:\/\//, route => route.abort());
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
}

test('each button appearance uses its Figma selected state and Clear hover/pressed border', async ({page}, info) => {
  await mount(page, info, `<div class="af-row">${views.map((v,i) => `<button id="b${i}" class="${buttonClass(v)}" aria-pressed="true">${v || 'primary'}</button>`).join('')}</div><button id="clear" class="af-btn af-btn--clear">Clear default</button>`);
  const backgrounds = ['rgb(12, 111, 241)','rgb(222, 238, 253)','rgb(255, 255, 255)','rgb(12, 111, 241)'];
  const foregrounds = ['rgb(255, 255, 255)','rgb(9, 86, 187)','rgb(9, 86, 187)','rgb(255, 255, 255)'];
  for (let i=0;i<4;i++) {
    await expect(page.locator('#b'+i)).toHaveCSS('background-color',backgrounds[i]);
    await expect(page.locator('#b'+i)).toHaveCSS('color',foregrounds[i]);
    await expect(page.locator('#b'+i)).toHaveCSS('height','40px');
  }
  const clear = page.locator('#clear');
  await clear.hover();
  await expect(clear).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(clear).toHaveCSS('border-top-color','rgb(12, 111, 241)');
  await page.mouse.down();
  await expect(clear).toHaveCSS('background-color','rgb(12, 111, 241)');
  await expect(clear).toHaveCSS('color','rgb(255, 255, 255)');
  await page.mouse.up();
});

test('busy buttons retain width, height and accessible names with size-specific centered SVGs', async ({page}, info) => {
  await mount(page, info, `<div class="af-stack">${views.map((v,i) => `<div class="af-row">${sizes.map((s,j) => `<button id="b${i}${j}" class="${buttonClass(v,s)}"><span>Save changes ${i}${j}</span></button>`).join('')}</div>`).join('')}</div>`);
  for(let i=0;i<4;i++)for(let j=0;j<3;j++) {
    const button = page.locator(`#b${i}${j}`);
    const before = await button.boundingBox();
    await button.evaluate((n:HTMLButtonElement) => {n.setAttribute('aria-busy','true');n.disabled=true;});
    const after = await button.boundingBox();
    expect(after?.width).toBe(before?.width);
    expect(after?.height).toBe([32,40,48][j]);
    await expect(button).toHaveAccessibleName(`Save changes ${i}${j}`);
    const icon = await button.evaluate(n => {
      const css = getComputedStyle(n,'::before');
      return {width:css.width,height:css.height,position:css.position,image:css.backgroundImage,animation:css.animationDuration};
    });
    expect(icon.width).toBe([16,20,24][j]+'px');
    expect(icon.height).toBe(icon.width);
    expect(icon.position).toBe('absolute');
    expect(icon.image).toContain('data:image/svg+xml');
    expect(icon.animation).toBe('0s');
    await expect(button).toHaveCSS('background-color',i===1||i===2?'rgb(255, 255, 255)':'rgb(12, 111, 241)');
  }
});

test('initComponents blocks busy and ARIA-disabled activation and releases its listeners', async ({page}, info) => {
  await mount(page, info, `<button class="af-btn" aria-busy="true" id="busy"><span>Save</span></button><a class="af-btn" href="#changed" aria-disabled="true" id="link">Unavailable link</a>`,true);
  await page.evaluate(() => {
    (window as any).activations=[];
    for(const n of document.querySelectorAll('.af-btn'))n.addEventListener('click',()=> (window as any).activations.push(n.id));
  });
  await page.locator('#busy span').click();
  await page.locator('#link').focus();await page.keyboard.press('Enter');
  expect(await page.evaluate(() => (window as any).activations)).toEqual([]);
  expect(await page.locator('#link').evaluate(n=>n.dispatchEvent(new MouseEvent('auxclick',{bubbles:true,cancelable:true,button:1})))).toBe(false);
  await page.evaluate(() => {(window as any).cleanup();(window as any).cleanup();(window as any).cleanup=(window as any).Alabuga.initComponents(document.querySelector('main'));});
  await page.locator('#busy').click();
  expect(await page.evaluate(() => (window as any).activations)).toEqual([]);
  await page.evaluate(() => {(window as any).cleanup();document.querySelector('#busy')!.removeAttribute('aria-busy');});
  await page.locator('#busy').click();
  expect(await page.evaluate(() => (window as any).activations)).toEqual(['busy']);
});

const choiceForm = `<form id="choices"><label class="af-check"><input class="af-checkbox" type="checkbox" id="consent" name="consent" value="yes" required> Accept terms</label>
  <label class="af-check"><input class="af-checkbox" type="checkbox" id="mixed"> Mixed selection</label>
  <fieldset><legend>Format</legend><label class="af-check"><input class="af-radio" id="page" type="radio" name="format" value="page" checked> Page</label><label class="af-check"><input class="af-radio" id="slides" type="radio" name="format" value="slides"> Slides</label></fieldset>
  <fieldset disabled><legend>Unavailable</legend><label class="af-check"><input class="af-checkbox" type="checkbox" name="ignored" checked> Disabled checked</label><label class="af-check"><input class="af-radio" type="radio" name="ignored-radio" checked> Disabled radio</label></fieldset>
  <button class="af-btn" type="reset">Reset</button></form>`;

test('CSS-only checkbox/radio retain label clicks, validation, FormData, keyboard and reset', async ({page}, info) => {
  await mount(page, info,choiceForm);
  expect(await page.locator('script').count()).toBe(0);
  expect(await page.locator('#choices').evaluate((f:HTMLFormElement)=>f.checkValidity())).toBe(false);
  await page.getByText('Accept terms',{exact:true}).click();
  await expect(page.locator('#consent')).toBeChecked();
  await page.locator('#consent').focus();await page.keyboard.press('Space');
  await expect(page.locator('#consent')).not.toBeChecked();
  await page.keyboard.press('Space');
  await page.locator('#page').focus();await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slides')).toBeChecked();
  await expect(page.locator('#slides')).toBeFocused();
  expect(await page.locator('#choices').evaluate((f:HTMLFormElement)=>({valid:f.checkValidity(),data:Object.fromEntries(new FormData(f))}))).toEqual({valid:true,data:{consent:'yes',format:'slides'}});
  await expect(page.getByRole('checkbox',{name:'Disabled checked'})).toBeDisabled();
  await expect(page.getByRole('checkbox',{name:'Disabled checked'})).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await page.locator('#mixed').evaluate((n:HTMLInputElement)=>n.indeterminate=true);
  expect(await page.locator('#mixed').evaluate(n=>getComputedStyle(n,'::before').maskImage)).toBe('none');
  await expect(page.locator('#mixed')).toHaveCSS('background-color','rgb(12, 111, 241)');
  await page.getByText('Mixed selection',{exact:true}).click();
  expect(await page.locator('#mixed').evaluate((n:HTMLInputElement)=>n.indeterminate)).toBe(false);
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.locator('#consent')).not.toBeChecked();
  await expect(page.locator('#page')).toBeChecked();
  await page.evaluate(axe.source);
  expect(await page.evaluate(async()=> (await (window as any).axe.run()).violations.map((v:any)=>v.id))).toEqual([]);
});

test('forced colors restore native checkbox/radio and preserve keyboard selection', async ({page,browserName}, info) => {
  test.skip(browserName==='webkit','WebKit does not emulate Windows forced colors');
  await mount(page, info,choiceForm);
  await page.emulateMedia({forcedColors:'active'});
  await expect(page.locator('#consent')).toHaveCSS('appearance','auto');
  await expect(page.locator('#page')).toHaveCSS('appearance','auto');
  await page.locator('#consent').focus();await page.keyboard.press('Space');
  await expect(page.locator('#consent')).toBeChecked();
  await expect(page.locator('#consent')).toHaveCSS('background-image','none');
  expect(await page.locator('#consent').evaluate(n=>getComputedStyle(n,'::before').display)).toBe('none');
});

test('fields use the single Figma focus border and retain a system focus indicator in forced colors',async({page,browserName},info)=>{
  await mount(page,info,`<div class="af-stack" style="width:360px">
    <label class="af-field">Email<input class="af-input" id="email" value="name@company.ru"></label>
    <label class="af-field">Notes<textarea class="af-textarea" id="notes">Comment</textarea></label>
    <label class="af-field">Native<select class="af-select" id="native" data-af-select-native><option>Native</option></select></label>
    <label class="af-field">Select<select class="af-select" id="enhanced"><option>Сотрудничество</option></select></label>
    <label class="af-field">Wrapped<div class="af-input-wrap"><input class="af-input" id="wrapped" value="Text"></div></label>
  </div>`,true);
  await page.keyboard.press('Tab');
  for(const selector of ['#email','#notes','#native','.af-select__control','#wrapped']){
    const control=page.locator(selector);await control.focus();
    await expect(control).toBeFocused();
    await expect(control).toHaveCSS('outline-style','none');
    const border=selector==='#wrapped'?control.locator('..'):control;
    await expect(border).toHaveCSS('border-top-color','rgb(12, 111, 241)');
    await expect(border).toHaveCSS('border-top-width','1px');
    await expect(border).toHaveCSS('box-shadow','none');
  }
  if(browserName!=='webkit'){
    await page.emulateMedia({forcedColors:'active'});await page.locator('#email').focus();
    await expect(page.locator('#email')).toHaveCSS('outline-style','solid');
    await expect(page.locator('#email')).toHaveCSS('outline-width','2px');
  }
});

test('radio inner and outer circles stay centered at fractional sizes and pixel density',async({browser},info)=>{
  const context=await browser.newContext({viewport:{width:900,height:650},deviceScaleFactor:1.25});
  const page=await context.newPage();
  try{
    await mount(page,info,`<div id="zoom" style="padding:13.5px 17.5px"><div class="af-stack">${sizes.map((s,i)=>`<label class="af-check"><input class="af-radio${s?' af-radio--'+s:''}" type="radio" name="format${i}" checked> Format ${i}</label>`).join('')}</div></div>`);
    for(const zoom of [0.8,1,1.25,1.5]){
      await page.locator('#zoom').evaluate((n,z)=>n.style.zoom=String(z),zoom);
      for(const radio of await page.locator('.af-radio').all()){
        const shot=await radio.screenshot();
        const centers=await page.evaluate(async(base64)=>{
          const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
          const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
          const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
          const {data,width,height}=ctx.getImageData(0,0,canvas.width,canvas.height);
          const pixels=new Set<number>();
          for(let i=0;i<width*height;i++)if(data[i*4+2]>150&&data[i*4]<60&&data[i*4+1]<150)pixels.add(i);
          const parts:Array<{area:number,x:number,y:number}>=[];
          while(pixels.size){
            const start=pixels.values().next().value!;pixels.delete(start);const queue=[start];
            let minX=width,maxX=0,minY=height,maxY=0;
            for(let i=0;i<queue.length;i++){
              const n=queue[i],x=n%width,y=Math.floor(n/width);
              minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
              for(const next of [x>0?n-1:-1,x<width-1?n+1:-1,y>0?n-width:-1,y<height-1?n+width:-1])if(pixels.delete(next))queue.push(next);
            }
            parts.push({area:queue.length,x:(minX+maxX)/2,y:(minY+maxY)/2});
          }
          return parts.sort((a,b)=>b.area-a.area).slice(0,2);
        },shot.toString('base64'));
        expect(centers).toHaveLength(2);
        expect(Math.abs(centers[0].x-centers[1].x),`horizontal center at zoom ${zoom}`).toBeLessThanOrEqual(1);
        expect(Math.abs(centers[0].y-centers[1].y),`vertical center at zoom ${zoom}`).toBeLessThanOrEqual(1);
      }
    }
  }finally{await context.close();}
});

test('composition CTAs retain inverse appearance and card buttons retain standard states/sizes', async ({page}) => {
  await page.goto('/demos/showcase.html');
  await page.emulateMedia({reducedMotion:'reduce'});
  const report = await page.evaluate(() => {
    const c=(window as any).demoController,d=c.getDocument();
    const section=d.pages.find((p:any)=>p.widgets.some((w:any)=>w.type==='button'));
    const widget=section.widgets.find((w:any)=>w.type==='button');
    section.appearance.theme='contrast';widget.surface='plain';
    c.update(d);
    const trigger=()=>document.querySelector<HTMLElement>(`[data-action-id="${widget.id}"]`)!;
    const plain={inverse:trigger().classList.contains('af-btn--inverse'),height:trigger().getBoundingClientRect().height,color:getComputedStyle(trigger()).color};
    trigger().setAttribute('aria-busy','true');trigger().setAttribute('aria-disabled','true');
    const busy=getComputedStyle(trigger()).color;
    widget.surface='card';widget.variant='secondary';c.update(d);
    const card={inverse:trigger().classList.contains('af-btn--inverse'),height:trigger().getBoundingClientRect().height,color:getComputedStyle(trigger()).color};
    trigger().setAttribute('aria-pressed','true');const selected=getComputedStyle(trigger()).backgroundColor;
    return {plain,busy,card,selected};
  });
  expect(report).toEqual({plain:{inverse:true,height:40,color:'rgb(0, 13, 60)'},busy:'rgba(0, 0, 0, 0)',card:{inverse:false,height:40,color:'rgb(9, 86, 187)'},selected:'rgb(222, 238, 253)'});
});

test('control S/M/L geometry and reviewed native input appearances', async ({page,browserName}, info) => {
  const markup=sizes.map((size,i)=>`<section class="af-stack" style="gap:8px"><h2 class="af-title">${['S','M','L'][i]}</h2>${['checkbox','radio'].map(type=>`<div class="af-row">${['Default','Selected','Disabled','Disabled selected'].map((state,j)=>`<label class="af-check"><input id="${type}${i}${j}" class="af-${type}${size?' af-'+type+'--'+size:''}" type="${type}" name="${type}${i}${j}"${j%2?' checked':''}${j>1?' disabled':''}> ${state}</label>`).join('')}</div>`).join('')}</section>`).join('');
  await mount(page,info,`<div class="af-stack" id="matrix" style="width:780px;padding:24px;background:white">${markup}</div>`);
  for(let i=0;i<3;i++)for(const type of ['checkbox','radio']) {
    await expect(page.locator(`#${type}${i}0`)).toHaveCSS('width',[16,20,24][i]+'px');
    await expect(page.locator(`#${type}${i}0`)).toHaveCSS('height',[16,20,24][i]+'px');
    await expect(page.locator(`#${type}${i}0`).locator('..')).toHaveCSS('font-size',[12,14,16][i]+'px');
    await expect(page.locator(`#${type}${i}0`).locator('..')).toHaveCSS('gap',i===0?'6px':'8px');
  }
  if(browserName==='chromium')await expect(page.locator('#matrix')).toHaveScreenshot('checkbox-radio-sizes.png');
});
