import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const destination='artifacts/acceptance',base=process.env.ALABUGA_PREVIEW_URL??'http://127.0.0.1:4173';
await mkdir(destination,{recursive:true});
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(base+'/demos/showcase.html');await page.evaluate(()=>document.fonts.ready);
 await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 for(const width of [1440,820,390]){await page.setViewportSize({width,height:1000});await page.screenshot({path:`${destination}/landing-${width}.png`,fullPage:true})}
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/demos/showcase.html?kind=presentation');await page.evaluate(()=>document.fonts.ready);
 await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 const overflow=await page.evaluate(()=>window.demoController.checkOverflow());if(overflow.length)throw new Error(overflow.join('\n'));
 await page.pdf({path:`${destination}/presentation.pdf`,preferCSSPageSize:true,printBackground:true});
 for(let i=0;i<11;i++){await page.evaluate(i=>{const c=window.demoController;c.goToSlide(i);const steps=new Set(c.getDocument().pages[i].widgets.map(w=>w.motion?.step??0).filter(n=>n>0));for(const step of steps)c.next()},i);await page.locator('.af-slide--active').screenshot({path:`${destination}/slide-${String(i+1).padStart(2,'0')}.png`})}
 await page.goto(base+'/builder/');await page.locator('.project-menu summary').click();await page.locator('#demo-deck').click();await page.locator('#canvas .af-slide').nth(10).waitFor({state:'attached'});await page.locator('#slide-settings-open').click();await page.screenshot({path:`${destination}/workspace.png`,fullPage:true});
 await writeFile(`${destination}/visual-review.html`,`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Alabuga Framework 0.6 — визуальная приёмка</title><style>body{font:16px/1.6 system-ui;margin:40px;background:#f3f6fb;color:#000d3c}img{max-width:100%;display:block}.slides{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}figure{margin:0}a{color:#0956bb}</style><h1>Alabuga Framework 0.6</h1><p>Снимки готовой сборки без движения. <a href="presentation.pdf">Презентация PDF</a> · <a href="landing-1440.png">Лендинг: компьютер</a> · <a href="landing-820.png">Планшет</a> · <a href="landing-390.png">Телефон</a></p><h2>Рабочее пространство</h2><img src="workspace.png" alt="Редактор с холстом, миниатюрами и контекстными свойствами"><h2>11 слайдов</h2><div class="slides">${Array.from({length:11},(_,i)=>`<figure><img src="slide-${String(i+1).padStart(2,'0')}.png" alt="Слайд ${i+1}"><figcaption>${i+1}</figcaption></figure>`).join('')}</div><h2>Пользовательская приёмка</h2><p>Проверка с пятью реальными авторами ещё не проведена. Протокол находится в HTML-документации, раздел «Проекты и материалы».</p>`);
 console.log('Visual artifacts:',destination);
}finally{await browser.close()}
