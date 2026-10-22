import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import axe from 'axe-core';

const field=(id:string,size='',wrapped=true)=>`<div class="af-field" style="width:258px;max-width:100%">
  <label class="af-label" for="${id}">Title ${id}</label>
  ${wrapped?'<div class="af-input-wrap"><span class="af-placeholder-icon" aria-hidden="true"></span>':''}
  <input class="af-input${size?' af-input--'+size:''}" id="${id}" name="${id}" placeholder="Сотрудничество · Другое · gypq" aria-describedby="${id}-help">
  ${wrapped?'<span class="af-input-hint" aria-hidden="true"></span></div>':''}
  <p class="af-help" id="${id}-help">Helper text</p>
</div>`;

async function mount(page:Page,info:TestInfo,markup:string,initialize=false){
  const file=info.outputPath('standalone-fields.html');
  const css=pathToFileURL(resolve('dist/alabuga.css')).href,js=pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  await writeFile(file,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fields</title><link rel="stylesheet" href="${css}"></head><body style="margin:24px"><main class="af" id="fixture"><h1 class="af-sr-only">Fields</h1>${markup}</main>${initialize?`<script src="${js}"></script><script>window.init=()=>window.cleanup=Alabuga.initComponents(document.querySelector('main'));init();</script>`:''}</body></html>`);
  await page.route(/^https?:\/\//,route=>route.abort());
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}

test('native and wrapped Input S/M/L keep source dimensions, typography and icon slots',async({page},info)=>{
  await mount(page,info,`<div class="af-stack">${['sm','','lg'].map((s,i)=>`<div class="af-row">${field('wrapped'+i,s)}${field('plain'+i,s,false)}</div>`).join('')}</div>`);
  for(let i=0;i<3;i++){
    const input=page.locator('#wrapped'+i),wrap=input.locator('..'),group=wrap.locator('..'),plain=page.locator('#plain'+i);
    for(const control of [wrap,plain]){
      await expect(control).toHaveCSS('height',[32,40,48][i]+'px');
      await expect(control).toHaveCSS('border-radius',[6,8,8][i]+'px');
    }
    await expect(input).toHaveCSS('height',[30,38,46][i]+'px');
    await expect(input).toHaveCSS('font-size',[12,14,16][i]+'px');
    // Gecko reports its native minimum for a single-line input; WebKit may return float noise.
    const line=await input.evaluate(n=>parseFloat(getComputedStyle(n).lineHeight)),expected=[16.2,19.6,21.6][i];
    expect(line).toBeGreaterThanOrEqual(expected-0.02);expect(line).toBeLessThan(expected+2);
    await expect(wrap).toHaveCSS('gap',[8,10,12][i]+'px');
    await expect(group.locator('.af-label')).toHaveCSS('font-size',[10,12,14][i]+'px');
    await expect(group.locator('.af-help')).toHaveCSS('font-size',[8,10,12][i]+'px');
    for(const icon of ['.af-placeholder-icon','.af-input-hint']){
      await expect(wrap.locator(icon)).toHaveCSS('width',[16,20,24][i]+'px');
      await expect(wrap.locator(icon)).toHaveCSS('height',[16,20,24][i]+'px');
    }
    expect(await wrap.locator('.af-input-hint').evaluate(n=>getComputedStyle(n).maskImage)).toContain('data:image/svg+xml');
  }
});

test('wrapper state follows focus, success, error, readonly and disabled fieldsets without JS',async({page},info)=>{
  await mount(page,info,`<form><fieldset id="fieldset"><legend>Details</legend>${field('title')}</fieldset></form>`);
  const input=page.locator('#title'),wrap=input.locator('..');
  await wrap.hover();await expect(wrap).toHaveCSS('border-top-color','rgb(173, 181, 189)');
  await input.focus();await expect(wrap).toHaveCSS('border-top-color','rgb(12, 111, 241)');
  await expect(input).toHaveCSS('outline-style','none');
  await input.evaluate(n=>n.classList.add('af-input--success'));
  await wrap.hover();await expect(wrap).toHaveCSS('border-top-color','rgb(62, 172, 100)');
  await expect(wrap.locator('.af-input-hint')).toHaveCSS('background-color','rgb(62, 172, 100)');
  await input.evaluate(n=>n.setAttribute('aria-invalid','true'));
  await expect(wrap).toHaveCSS('border-top-color','rgb(230, 38, 38)');
  await expect(wrap.locator('.af-input-hint')).toHaveCSS('background-color','rgb(230, 38, 38)');
  await page.locator('#fieldset').evaluate((n:HTMLFieldSetElement)=>n.disabled=true);
  await expect(input).toBeDisabled();
  await expect(wrap).toHaveCSS('border-top-color','rgb(222, 226, 230)');
  await expect(wrap).toHaveCSS('background-color','rgb(241, 243, 245)');
  await expect(wrap.locator('.af-input-hint')).toHaveCSS('background-color','rgb(222, 226, 230)');
  await expect(wrap.locator('..').locator('.af-label')).toHaveCSS('color','rgb(173, 181, 189)');
  await expect(wrap.locator('..').locator('.af-help')).toHaveCSS('color','rgb(222, 226, 230)');
  await page.locator('#fieldset').evaluate((n:HTMLFieldSetElement)=>n.disabled=false);
  await input.evaluate((n:HTMLInputElement)=>{n.classList.remove('af-input--success');n.removeAttribute('aria-invalid');n.readOnly=true;n.value='AF-2026';});
  await page.mouse.move(800,500);await input.evaluate(n=>n.blur());
  await expect(wrap).toHaveCSS('background-color','rgb(241, 243, 245)');
  await expect(input).not.toBeEditable();
  expect(await page.locator('form').evaluate((f:HTMLFormElement)=>new FormData(f).get('title'))).toBe('AF-2026');
});

const switchForm=`<form><label class="af-check"><input class="af-switch" id="notifications" type="checkbox" role="switch" name="notifications" value="yes" required> Notifications</label>
  <label class="af-check"><input class="af-switch" id="autosave" type="checkbox" role="switch" name="autosave" value="yes" checked> Autosave</label>
  <fieldset disabled><legend>Unavailable</legend><label class="af-check"><input class="af-switch" type="checkbox" role="switch" name="ignored"> Disabled OFF</label><label class="af-check"><input class="af-switch" id="disabled-on" type="checkbox" role="switch" name="ignored-on" checked> Disabled ON</label></fieldset>
  <button class="af-btn" type="reset">Reset</button></form>`;

test('CSS-only Switch preserves native values, keyboard, hover, disabled states and reset',async({page},info)=>{
  await mount(page,info,switchForm);
  const off=page.getByRole('switch',{name:'Notifications',exact:true}),on=page.getByRole('switch',{name:'Autosave',exact:true});
  expect(await page.locator('script').count()).toBe(0);
  await expect(off).toHaveCSS('width','44px');await expect(off).toHaveCSS('height','24px');
  expect(await off.evaluate(n=>{const p=getComputedStyle(n,'::before');return[p.width,p.height,p.left,p.top]})).toEqual(['20px','20px','2px','2px']);
  await off.locator('..').hover();await expect(off).toHaveCSS('background-color','rgb(173, 181, 189)');
  await on.locator('..').hover();await expect(on).toHaveCSS('background-color','rgb(11, 99, 219)');
  expect(await page.locator('form').evaluate((f:HTMLFormElement)=>f.checkValidity())).toBe(false);
  await off.locator('..').click();await expect(off).toBeChecked();
  await off.focus();await page.keyboard.press('Space');await expect(off).not.toBeChecked();
  await page.keyboard.press('Space');
  expect(await page.locator('form').evaluate((f:HTMLFormElement)=>({valid:f.checkValidity(),data:Object.fromEntries(new FormData(f))}))).toEqual({valid:true,data:{notifications:'yes',autosave:'yes'}});
  const disabled=page.locator('#disabled-on');await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveCSS('background-color','rgb(241, 243, 245)');
  expect(await disabled.evaluate(n=>{const p=getComputedStyle(n,'::before');return[p.backgroundColor,p.transform]})).toEqual(['rgb(222, 226, 230)','matrix(1, 0, 0, 1, 20, 0)']);
  await expect(disabled).toHaveCSS('opacity','1');
  await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(off).not.toBeChecked();await expect(on).toBeChecked();
});

const counterForm=`<form data-af-validate><div class="af-field" style="width:278px"><label class="af-label" for="comment">Comment</label><textarea class="af-textarea" id="comment" name="comment" maxlength="10" required aria-describedby="comment-help count">Hi</textarea><div class="af-field__meta"><p class="af-help" id="comment-help">Up to ten characters</p><span class="af-field__counter" id="count" data-af-counter-for="comment"></span></div><p class="af-error" id="comment-error" data-af-error-for="comment" hidden></p></div><button class="af-btn" type="submit">Validate</button><button class="af-btn" type="reset">Reset</button></form>`;

test('Textarea counter follows native maxlength, UTF-16, reset, programmatic events and cleanup',async({page},info)=>{
  await mount(page,info,counterForm,true);const input=page.locator('#comment'),count=page.locator('#count');
  await expect(count).toHaveText('2/10');
  await input.fill('🙂');await expect(count).toHaveText('2/10');
  await input.fill('');await input.pressSequentially('abcdefghijk');await expect(input).toHaveValue('abcdefghij');await expect(count).toHaveText('10/10');
  await input.evaluate((n:HTMLTextAreaElement)=>{n.value='Data';n.dispatchEvent(new Event('input',{bubbles:true}));});await expect(count).toHaveText('4/10');
  await input.evaluate((n:HTMLTextAreaElement)=>n.maxLength=12);await expect(count).toHaveText('4/12');
  await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(input).toHaveValue('Hi');await expect(count).toHaveText('2/12');
  await input.fill('Next');
  await page.locator('form').evaluate(f=>f.addEventListener('reset',e=>e.preventDefault(),{once:true}));
  await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(input).toHaveValue('Next');await expect(count).toHaveText('4/12');
  await page.evaluate(()=>{(window as any).originalField=document.querySelector('#comment');(window as any).cleanup();(window as any).cleanup();});
  await input.fill('Stop');await input.evaluate((n:HTMLTextAreaElement)=>n.maxLength=15);await expect(count).toHaveText('4/12');
  await page.evaluate(()=>(window as any).init());await expect(count).toHaveText('4/15');
  expect(await input.evaluate(n=>n===(window as any).originalField)).toBe(true);
  await input.evaluate(n=>n.removeAttribute('maxlength'));await expect(count).toHaveText('4');
});

test('Textarea geometry, validation and no-JS fallback preserve native form behavior',async({page},info)=>{
  await mount(page,info,counterForm,true);const input=page.locator('#comment');
  await expect(input).toHaveCSS('height','128px');await expect(input).toHaveCSS('font-size','16px');await expect(input).toHaveCSS('line-height','21.6px');await expect(input).toHaveCSS('padding','12px');
  await input.evaluate(n=>(n as HTMLElement).style.height='200px');await expect(input).toHaveCSS('height','200px');
  await input.fill('');await page.getByRole('button',{name:'Validate',exact:true}).click();
  await expect(input).toBeFocused();await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toHaveCSS('border-top-color','rgb(230, 38, 38)');
  await expect(page.locator('#comment-error')).toBeVisible();
  await input.fill('Valid');await expect(input).toHaveAttribute('aria-invalid','false');
  await mount(page,info,counterForm,false);await input.fill('1234567890');await input.pressSequentially('x');await expect(input).toHaveValue('1234567890');
  await expect(page.locator('#count')).toBeEmpty();
  expect(await page.locator('form').evaluate((f:HTMLFormElement)=>Object.fromEntries(new FormData(f)))).toEqual({comment:'1234567890'});
});

test('Switch high contrast uses system colors and keeps a visible keyboard focus',async({page,browserName},info)=>{
  test.skip(browserName==='webkit','WebKit does not emulate forced colors');
  await mount(page,info,switchForm);await page.emulateMedia({forcedColors:'active'});
  const control=page.locator('#notifications');await control.focus();
  await expect(control).toHaveCSS('outline-style','solid');await expect(control).toHaveCSS('outline-width','2px');
  await page.keyboard.press('Space');await expect(control).toBeChecked();
  expect(await control.evaluate(n=>getComputedStyle(n).backgroundColor)).not.toBe(await page.locator('#disabled-on').evaluate(n=>getComputedStyle(n).backgroundColor));
});

test('field and switch examples remain accessible with reviewed source geometry',async({page,browserName},info)=>{
  await mount(page,info,`<div id="matrix" class="af-stack" style="width:850px;padding:24px;background:white"><div class="af-row">${field('small','sm')}${field('medium')}${field('large','lg')}</div>${switchForm}${counterForm}</div>`,true);
  await page.mouse.move(0,0);await page.evaluate(axe.source);
  expect(await page.evaluate(async()=> (await (window as any).axe.run()).violations.map((v:any)=>({id:v.id,targets:v.nodes.map((n:any)=>n.target)})))).toEqual([]);
  if(browserName==='chromium')await expect(page.locator('#matrix')).toHaveScreenshot('fields-switch.png');
});
