import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const destination='artifacts/acceptance',base=process.env.ALABUGA_PREVIEW_URL||'http://127.0.0.1:4391';
await mkdir(destination,{recursive:true});
const browser=await chromium.launch({channel:process.env.AF_BROWSER_CHANNEL||undefined});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await page.goto(base+'/demos/showcase.html');await page.evaluate(()=>document.fonts.ready);
 await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 for(const width of [1440,820,390]){await page.setViewportSize({width,height:1000});await page.screenshot({path:`${destination}/landing-${width}.png`,fullPage:true})}
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/demos/showcase.html?kind=presentation');
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
 await expect(page.locator('.af-slide')).toHaveCount(11);
 expect(await page.evaluate(()=>window.demoController.checkOverflow())).toEqual([]);
 await page.pdf({path:`${destination}/presentation.pdf`,preferCSSPageSize:true,printBackground:true});
 for(let i=0;i<11;i++){
  await page.evaluate(i=>{const c=window.demoController;c.goToSlide(i);const steps=new Set(c.getDocument().pages[i].widgets.map(w=>w.motion?.step??0).filter(n=>n>0));for(const step of steps)c.next()},i);
  await page.locator('.af-slide--active').screenshot({path:`${destination}/slide-${String(i+1).padStart(2,'0')}.png`});
 }
 await writeFile(`${destination}/visual-review.html`,`<!doctype html><html lang="ru"><meta charset="utf-8"><title>Framework — визуальная приёмка</title><style>body{font:16px/1.6 system-ui;margin:40px}img{max-width:100%}.slides{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}</style><h1>Framework — готовая сборка</h1><p><a href="presentation.pdf">PDF</a> · <a href="landing-1440.png">Компьютер</a> · <a href="landing-820.png">Планшет</a> · <a href="landing-390.png">Телефон</a></p><div class="slides">${Array.from({length:11},(_,i)=>`<figure><img src="slide-${String(i+1).padStart(2,'0')}.png" alt="Слайд ${i+1}"></figure>`).join('')}</div><p>Редакторские артефакты находятся в Constructor scripts/demo-artifacts.mjs и release-smoke.mjs. Пользовательские испытания не заменяются этими снимками.</p>`);
 const {version}=JSON.parse(await readFile('package.json','utf8'));
 await writeFile(`${destination}/report.json`,JSON.stringify({version,slides:11,viewports:[1440,820,390],overflow:[],generatedAt:new Date().toISOString()},null,2));
 console.log('Framework visual artifacts:',destination);
}finally{await browser.close()}
