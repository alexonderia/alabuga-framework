import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import axe from 'axe-core';
import {examples} from '../docs/app/examples';

async function mount(page:Page,info:TestInfo,html:string,css='alabuga.css'){
 const file=info.outputPath('icons.html');
 await writeFile(file,`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Icons</title><link rel="stylesheet" href="${pathToFileURL(resolve('dist',css)).href}"><body style="margin:16px"><main class="af"><h1 class="af-sr-only">Иконки</h1>${html}</main></body></html>`);
 await page.route(/^https?:\/\//,route=>route.abort());await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}

test('archived named icons render in all sizes offline with preserved source colors',async({page},info)=>{
 await mount(page,info,examples.icons[0].html);
 const icons=page.locator('.af-icon');await expect(icons).toHaveCount(33);
 for(let i=0;i<33;i++){
  const icon=icons.nth(i),size=[16,20,24][i%3];await expect(icon).toHaveCSS('width',size+'px');await expect(icon).toHaveCSS('height',size+'px');
  const source=await icon.evaluate(n=>{const s=getComputedStyle(n);return {mask:s.maskImage,image:s.backgroundImage,animation:s.animationName}});
  expect(i<27?source.mask:source.image).toContain('data:image/svg+xml');if(i>=27)expect(source.animation).toBe('none');
  const png=await icon.screenshot();
  const paint=await page.evaluate(async({png,white})=>{
   const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const context=canvas.getContext('2d')!;context.drawImage(image,0,0);const {data,width,height}=context.getImageData(0,0,canvas.width,canvas.height);
   let count=0,minX=width,minY=height,maxX=-1,maxY=-1;const colors=new Set<string>();
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=(y*width+x)*4,r=data[p],g=data[p+1],b=data[p+2];
    const ink=white?r>130&&g>130&&b>130:r<240||g<240||b<240;
    if(ink){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);colors.add([r,g,b].join(','));}
   }
   return {count,centerX:(minX+maxX+1-width)/2,centerY:(minY+maxY+1-height)/2,colors:[...colors]};
  },{png:png.toString('base64'),white:i>=30});
  expect(paint.count,'visible glyph '+i).toBeGreaterThan(4);
  expect(Math.abs(paint.centerX),'horizontal center '+i).toBeLessThanOrEqual(1);
  expect(Math.abs(paint.centerY),'vertical center '+i).toBeLessThanOrEqual(1);
  if(i>=27)expect(paint.colors.length,'original loader is not a flat mask').toBeGreaterThan(2);
 }
});

test('legacy wrapper and standalone versus modular CSS keep their contracts',async({page},info)=>{
 const html='<span id="legacy" class="af-icon"><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22%3E%3Ccircle cx=%228%22 cy=%228%22 r=%226%22/%3E%3C/svg%3E" alt="Custom"></span><span id="named" class="af-icon af-icon--info" role="img" aria-label="Информация"></span>';
 for(const css of ['alabuga.css','styles.css']){
  await mount(page,info,html,css);await expect(page.locator('#legacy')).toHaveCSS('width','24px');await expect(page.locator('#legacy img')).toHaveCSS('width','16px');
  await expect(page.locator('#named')).toHaveCSS('width','20px');await expect(page.getByRole('img',{name:'Информация',exact:true})).toBeVisible();
  await page.locator('#named').evaluate(n=>(n as HTMLElement).style.color='rgb(32, 64, 96)');await expect(page.locator('#named')).toHaveCSS('background-color','rgb(32, 64, 96)');
 }
});

test('buttons own named icon sizes, center slots and preserve busy accessible names',async({page},info)=>{
 await mount(page,info,`<div class="af-composition"><div class="af-row">${['sm','md','lg'].map(size=>`<button class="af-btn af-btn--icon af-btn--${size}" aria-label="Сведения ${size}"><span class="af-btn__icon af-icon af-icon--info af-icon--lg" aria-hidden="true"></span></button>`).join('')}<button class="af-btn af-btn--icon af-btn--round af-btn--secondary af-btn--lg" aria-label="Вперёд"><span class="af-btn__icon af-icon af-icon--next" aria-hidden="true"></span></button></div></div>`);
 const buttons=page.getByRole('button');
 for(let i=0;i<4;i++){
  const button=buttons.nth(i),icon=button.locator('.af-icon'),size=[16,20,24,20][i];await expect(icon).toHaveCSS('width',size+'px');
  const b=(await button.boundingBox())!,g=(await icon.boundingBox())!;expect(g.x+g.width/2).toBeCloseTo(b.x+b.width/2,2);expect(g.y+g.height/2).toBeCloseTo(b.y+b.height/2,2);
  await button.evaluate(n=>n.setAttribute('aria-busy','true'));await expect(icon).toHaveCSS('opacity','0');await expect(button).toHaveAccessibleName(i===3?'Вперёд':`Сведения ${['sm','md','lg'][i]}`);
  expect(await button.evaluate(n=>getComputedStyle(n,'::before').backgroundImage)).toContain('data:image/svg+xml');
 }
});

test('icon examples have accessible text and remain visible with system colors',async({page,browserName},info)=>{
 await page.setViewportSize({width:320,height:1000});await mount(page,info,examples.icons.map(e=>e.html).join(''));
 await page.evaluate(axe.source);expect(await page.evaluate(async()=>((await (window as any).axe.run()).violations).map((v:any)=>v.id))).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
 await expect(page.getByRole('status')).toContainText('Подготовка документа');
 if(browserName!=='webkit'){
  await page.emulateMedia({forcedColors:'active'});
  const icon=page.locator('.af-icon--success').first();expect(await icon.evaluate(n=>getComputedStyle(n).maskImage)).toContain('data:image/svg+xml');
  await expect(icon).toHaveCSS('forced-color-adjust','none');expect(await icon.evaluate(n=>getComputedStyle(n).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
 }
});
