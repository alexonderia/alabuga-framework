import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import axe from 'axe-core';

const option=(value:string,attrs='')=>`<label class="af-option"><input class="af-option__input" type="radio" name="view" value="${value}" ${attrs}><span class="af-option__label">${value}</span></label>`;
const chip=(id:string,classes='')=>`<span class="af-chip ${classes}" id="${id}"><span class="af-chip__icon" aria-hidden="true"></span><span class="af-chip__text">${id}</span><button class="af-chip__remove" data-af-dismiss aria-label="Remove ${id}"></button></span>`;
const alert=(id:string,classes='')=>`<div class="af-alert ${classes}" id="${id}"><span class="af-alert__icon" aria-hidden="true"></span><span class="af-alert__text">${id}</span><button class="af-alert__close" data-af-dismiss aria-label="Dismiss ${id}"></button></div>`;
async function mount(page:Page,info:TestInfo,markup:string,init=true){
  const file=info.outputPath('secondary.html');
  const css=pathToFileURL(resolve('dist/alabuga.css')).href,js=pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  await writeFile(file,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Components</title><link rel="stylesheet" href="${css}"><body style="margin:16px"><main class="af"><h1 class="af-sr-only">Components</h1>${markup}</main><script src="${js}"></script><script>window.init=()=>window.cleanup=Alabuga.initComponents(document.querySelector('main'));${init?'init();':''}</script></body></html>`);
  await page.route(/^https?:\/\//,route=>route.abort());await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}

test('Option and Multi-switch retain native keyboard, FormData, validation and reset without JS',async({page},info)=>{
  await mount(page,info,`<form><fieldset class="af-multi-switch"><legend class="af-sr-only">View</legend>${option('List','checked')}${option('Grid')}${option('Table','disabled')}</fieldset><label class="af-option"><input class="af-option__input" type="checkbox" name="pdf" value="yes" checked required><span class="af-option__label">PDF</span></label><button type="reset">Reset</button></form>`,false);
  const selected=page.getByRole('radio',{name:'List',exact:true});await selected.focus();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio',{name:'Grid',exact:true})).toBeChecked();await page.keyboard.press('ArrowLeft');await expect(selected).toBeChecked();
  await expect(page.getByRole('radio',{name:'Table',exact:true})).toBeDisabled();
  await page.getByText('PDF',{exact:true}).click();await expect(page.getByRole('checkbox',{name:'PDF',exact:true})).not.toBeChecked();
  expect(await page.locator('form').evaluate((f:HTMLFormElement)=>f.checkValidity())).toBe(false);
  await page.getByText('PDF',{exact:true}).click();await expect(page.getByRole('checkbox',{name:'PDF',exact:true})).toBeChecked();
  expect(await page.locator('form').evaluate((f:HTMLFormElement)=>[...new FormData(f)])).toEqual([['view','List'],['pdf','yes']]);
  await page.getByText('Grid',{exact:true}).click();await page.getByRole('button',{name:'Reset'}).click();await expect(selected).toBeChecked();
  await page.locator('fieldset').evaluate((f:HTMLFieldSetElement)=>f.disabled=true);await expect(selected).toBeDisabled();
  expect(await page.locator('form').evaluate((f:HTMLFormElement)=>[...new FormData(f)])).toEqual([['pdf','yes']]);
});

test('P2 size matrix matches saved outer dimensions and long alerts can grow',async({page},info)=>{
  await mount(page,info,`<div class="af-stack">${[['sm',32,16],['md',40,20],['lg',48,24]].map(([size])=>`<fieldset id="multi-${size}" class="af-multi-switch ${size==='md'?'':'af-multi-switch--'+size}"><legend class="af-sr-only">${size}</legend>${option('List','checked')}${option('Grid')}</fieldset>${chip('chip-'+size,size==='md'?'':'af-chip--'+size)}${alert('alert-'+size,size==='md'?'':'af-alert--'+size)}`).join('')}</div>`);
  for(const [size,height,chipHeight] of [['sm',32,16],['md',40,20],['lg',48,24]] as const){
    await expect(page.locator('#multi-'+size)).toHaveCSS('height',height+'px');
    await expect(page.locator('#alert-'+size)).toHaveCSS('height',height+'px');
    await expect(page.locator('#chip-'+size)).toHaveCSS('height',chipHeight+'px');
  }
  await page.locator('#alert-lg').evaluate(n=>{n.style.width='292px';n.querySelector('.af-alert__text')!.textContent='This user has a notification.'});
  // The source sentence can wrap differently with each browser's font metrics.
  // 48 px is the minimum; wrapped text must remain visible as the alert grows.
  expect((await page.locator('#alert-lg').boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await expect(page.locator('#alert-lg .af-alert__icon')).toHaveCSS('width','20px');
  await expect(page.locator('#alert-lg .af-alert__close')).toHaveCSS('width','24px');
  await expect(page.locator('#alert-lg .af-alert__text')).toHaveCSS('width','200px');
  await page.locator('#alert-lg .af-alert__text').evaluate(n=>n.textContent='Notification.');
  await expect(page.locator('#alert-lg')).toHaveCSS('height','48px');
  for(const [id,minHeight] of [['alert-md',40],['alert-lg',48]] as const){
    const notice=page.locator('#'+id);
    await notice.evaluate(n=>{n.style.width='180px';n.querySelector('.af-alert__text')!.textContent='A very long message must wrap without clipping its text or producing horizontal overflow.'});
    expect((await notice.boundingBox())!.height).toBeGreaterThan(minHeight);
    expect(await notice.evaluate(n=>{
      const box=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n.querySelector('.af-alert__text')!);
      return n.scrollWidth<=n.clientWidth+2&&n.scrollHeight<=n.clientHeight+2&&[...range.getClientRects()].every(r=>r.top>=box.top&&r.bottom<=box.bottom&&r.left>=box.left&&r.right<=box.right);
    }),'wrapped alert text stays inside its growing container').toBe(true);
  }
  for(const node of ['.af-chip__icon','.af-chip__remove','.af-alert__icon','.af-alert__close']){
    const mask=await page.locator(node).first().evaluate((n,selector)=>getComputedStyle(n,selector.includes('remove')||selector.includes('close')?'::before':null).maskImage,node);
    expect(mask).toContain('data:image/svg+xml');
  }
});

test('dismissal delegates to dynamic chips, transfers focus and is reversible',async({page},info)=>{
  await mount(page,info,`<div class="af-row" id="items">${chip('first')}${chip('second')}${chip('third')}</div><div class="af-stack">${alert('notice')}${alert('next-notice')}</div>`);
  await page.getByRole('button',{name:'Remove first',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.locator('#first')).toHaveCount(0);await expect(page.getByRole('button',{name:'Remove second',exact:true})).toBeFocused();
  await page.locator('#items').evaluate((n,html)=>n.insertAdjacentHTML('beforeend',html),chip('dynamic'));
  await page.getByRole('button',{name:'Remove dynamic',exact:true}).click();await expect(page.locator('#dynamic')).toHaveCount(0);
  await page.getByRole('button',{name:'Dismiss notice',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Dismiss next-notice',exact:true})).toBeFocused();
  await page.evaluate(()=>(window as any).cleanup());await page.getByRole('button',{name:'Remove second',exact:true}).click();await expect(page.locator('#second')).toHaveCount(1);
  await page.evaluate(()=>{(window as any).init();(window as any).init()});await page.getByRole('button',{name:'Remove second',exact:true}).click();await expect(page.locator('#third')).toHaveCount(1);
});

test('compact Dialog slots support responsive geometry, labeling, close and focus return',async({page},info)=>{
  await mount(page,info,`<button class="af-btn" data-af-dialog-open="review">Open review</button><dialog class="af-dialog af-dialog--compact" id="review" aria-labelledby="title" aria-describedby="description"><div class="af-dialog__header"><h2 class="af-dialog__title" id="title">Review</h2><button class="af-dialog__close" data-af-dialog-close aria-label="Close review"></button></div><p class="af-dialog__body" id="description">Check the materials before sending.</p><div class="af-dialog__actions"><button class="af-btn" data-af-dialog-close>Confirm</button></div></dialog>`);
  const opener=page.getByRole('button',{name:'Open review',exact:true}),dialog=page.getByRole('dialog',{name:'Review',exact:true});
  await opener.click();await expect(dialog).toBeVisible();await expect(dialog).toHaveCSS('width','350px');await expect(dialog).toHaveCSS('padding','16px');
  await page.evaluate(axe.source);expect(await page.evaluate(async()=>((await (window as any).axe.run()).violations).map((v:any)=>v.id))).toEqual([]);
  await page.keyboard.press('Escape');await expect(opener).toBeFocused();
  await page.setViewportSize({width:320,height:700});await opener.click();await expect(dialog).toHaveCSS('width','288px');
  await page.getByRole('button',{name:'Close review',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
});

test('readable feedback and link variants remain accessible on mobile',async({page},info)=>{
  await page.setViewportSize({width:320,height:900});
  const content=['default','info','success','warning','error'].map(view=>chip('chip-'+view,'af-chip--'+view+' af-chip--accessible')+alert('alert-'+view,'af-alert--'+view+' af-alert--accessible')).join('');
  await mount(page,info,`<div class="af-stack">${content}<nav class="af-breadcrumbs" aria-label="Breadcrumb"><ol><li><a class="af-link af-link--accessible" href="#home">Home</a></li><li><span aria-current="page">Current page with a long title</span></li></ol></nav><a id="active" class="af-link" href="#active" aria-current="page">Current</a><a id="inactive" class="af-link af-link--accessible" href="#inactive" aria-current="false">Other</a></div>`);
  await expect(page.locator('#active')).toHaveCSS('font-weight','400');await expect(page.locator('#active')).not.toHaveCSS('color',await page.locator('#inactive').evaluate(n=>getComputedStyle(n).color));
  await page.evaluate(axe.source);expect(await page.evaluate(async()=>((await (window as any).axe.run()).violations).map((v:any)=>({id:v.id,nodes:v.nodes.map((n:any)=>n.target)})))).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
});

test('source Option states and Multi-switch match the supplied transparent, regular-weight reference',async({page},info)=>{
  await mount(page,info,`<div class="af-row">${option('Option')}${option('Disabled','disabled')}</div><fieldset class="af-multi-switch"><legend class="af-sr-only">View</legend>${option('One')}${option('Two')}</fieldset>`);
  const label=page.locator('.af-option__label').first();
  await expect(label).toHaveCSS('font-weight','400');await expect(label).toHaveCSS('font-size','16px');
  await expect(label).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await label.hover();await expect(label).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  expect(await label.evaluate(n=>getComputedStyle(n).boxShadow)).toContain('rgb(12, 111, 241)');
  await page.mouse.down();await expect(label).toHaveCSS('background-color','rgb(12, 111, 241)');await expect(label).toHaveCSS('color','rgb(255, 255, 255)');await page.mouse.up();
  await expect(page.locator('.af-option__label').nth(1)).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(page.locator('.af-multi-switch')).toHaveCSS('border-top-width','0px');await expect(page.locator('.af-multi-switch')).toHaveCSS('padding','4px');await expect(page.locator('.af-multi-switch')).toHaveCSS('gap','4px');await expect(page.locator('.af-multi-switch')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
});

test('source feedback uses the reference palette and distinct semantic glyphs in all sizes',async({page},info)=>{
  const views=['info','success','warning','error','default'];
  await mount(page,info,`<div class="af-stack">${['lg','md','sm'].map(size=>`<div class="af-stack">${views.map(view=>chip(`c-${size}-${view}`,`af-chip--${size} af-chip--${view}`)+alert(`a-${size}-${view}`,`af-alert--${size} af-alert--${view}`)).join('')}</div>`).join('')}</div>`);
  const colors=['rgb(12, 111, 241)','rgb(62, 172, 100)','rgb(247, 144, 9)','rgb(230, 38, 38)','rgb(73, 80, 87)'];
  for(const size of ['lg','md','sm'])for(const kind of ['c','a']){
    const masks:string[]=[];
    for(let index=0;index<views.length;index++){
      const item=page.locator(`#${kind}-${size}-${views[index]}`);await expect(item).toHaveCSS('color',colors[index]);
      masks.push(await item.locator(kind==='c'?'.af-chip__icon':'.af-alert__icon').evaluate(n=>getComputedStyle(n).maskImage));
    }
    expect(new Set(masks).size).toBe(3);expect(masks[2]).toBe(masks[3]);expect(masks[0]).toBe(masks[4]);
  }
});

test('source Dialog spacing and full-width actions match the supplied composition',async({page},info)=>{
  await mount(page,info,`<button data-af-dialog-open="source">Open</button><dialog id="source" class="af-dialog af-dialog--compact" aria-labelledby="source-title"><div class="af-dialog__header"><h2 id="source-title" class="af-dialog__title">Header</h2><button class="af-dialog__close" data-af-dialog-close aria-label="Close"></button></div><p class="af-dialog__body">Information for user</p><div class="af-dialog__actions"><button class="af-btn af-btn--secondary" data-af-dialog-close>Cancel</button><button class="af-btn" data-af-dialog-close>Confirm</button></div></dialog>`);
  await expect(page.locator('#source')).not.toBeVisible();await page.getByRole('button',{name:'Open',exact:true}).click();
  await expect(page.locator('#source')).toHaveCSS('display','flex');await expect(page.locator('#source')).toHaveCSS('gap','16px');
  await expect(page.locator('.af-dialog__body')).toHaveCSS('margin','0px');
  const widths=await page.locator('.af-dialog__actions > button').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));expect(widths).toEqual([153,153]);
});

test('source links and Breadcrumbs use gray, black and blue states without underlines or text-glyph arrows',async({page},info)=>{
  await mount(page,info,'<a id="link" class="af-link" href="#default">Link</a><a id="current" class="af-link" href="#current" aria-current="page">Link</a><nav class="af-breadcrumbs" aria-label="Path"><ol><li><a class="af-link" href="#home">Link</a></li><li><a class="af-link" href="#middle">Link</a></li><li><span aria-current="page">Link</span></li></ol></nav>');
  await expect(page.locator('#link')).toHaveCSS('color','rgb(134, 142, 150)');await expect(page.locator('#link')).toHaveCSS('text-decoration-line','none');
  await expect(page.locator('#current')).toHaveCSS('color','rgb(22, 22, 22)');await page.locator('#link').hover();await expect(page.locator('#link')).toHaveCSS('color','rgb(12, 111, 241)');
  await expect(page.locator('.af-breadcrumbs [aria-current]')).toHaveCSS('color','rgb(22, 22, 22)');await expect(page.locator('.af-breadcrumbs [aria-current]')).toHaveCSS('font-weight','500');
  const arrow=await page.locator('.af-breadcrumbs li').nth(1).evaluate(n=>({mask:getComputedStyle(n,'::before').maskImage,content:getComputedStyle(n,'::before').content}));expect(arrow.mask).toContain('data:image/svg+xml');expect(arrow.content).toBe('""');
});
