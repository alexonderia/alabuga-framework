import {test,expect} from '@playwright/test';
import axe from 'axe-core';

for(const lang of ['ru','en'])test(`generated ${lang} guides use the framework on desktop and mobile`,async({page},info)=>{
  await page.goto(`/docs/${lang}/start.html`);
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('font-family', /Alabuga Sans/);
  expect(await page.evaluate(()=>document.fonts.load('16px "Alabuga Sans"').then(fonts=>fonts.length))).toBeGreaterThan(0);
  await expect(page.locator('.sidebar [aria-current=page]')).toHaveAttribute('href','start.html');
  await expect(page.locator('.sidebar .nav-section')).toHaveCount(3);
  await expect(page.locator('.sidebar [aria-current=page]')).toHaveCSS('color','rgb(255, 255, 255)');
  await page.locator('.toc a').first().click();
  await expect(page).toHaveURL(/#section-1$/);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:info.outputPath(`guide-${lang}-desktop.png`)});
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('.header-nav .af-btn')).toBeInViewport();
  }
  await page.evaluate(axe.source);
  expect(await page.evaluate(async()=>(await (window as any).axe.run()).violations.map((v:any)=>({id:v.id,targets:v.nodes.map((n:any)=>n.target)})))).toEqual([]);
  await page.screenshot({path:info.outputPath(`guide-${lang}-mobile.png`),fullPage:true});
  await page.locator('.sidebar a[href="reference.html"]').click();
  await expect(page.locator('.sidebar [aria-current=page]')).toHaveAttribute('href','reference.html');
  await expect(page.locator('.sidebar a[href="start.html"]')).toHaveClass(/af-btn--clear/);
  await expect(page.locator('#live-example .af-calendar')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const other=lang==='ru'?'en':'ru';
  await page.locator(`.header-nav [lang=${other}]`).click();
  await expect(page.locator('html')).toHaveAttribute('lang',other);
});

test('live documentation shell fits narrow screens and keeps search accessible',async({page},info)=>{
  await page.goto('/');
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('#navigation .nav-group')).toHaveText(['Подключение библиотеки','Цвета, шрифты и сетка','Компоненты интерфейса','Страницы и презентации','Alabuga Constructor','CSS, API и изменения']);
  await expect(page.locator('#navigation [aria-current=page]')).toHaveCSS('color','rgb(255, 255, 255)');
  await page.screenshot({path:info.outputPath('reference-desktop.png')});
  for(const width of [768,390,320]){
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('.hero-link')).toBeVisible();
  }
  await page.screenshot({path:info.outputPath('reference-mobile.png')});
  await page.keyboard.press('/');
  await expect(page.locator('#search')).toBeFocused();
  await page.locator('#search').fill('af-btn');
  await page.locator('.search-result').first().click();
  await expect(page.locator('.page-title')).toHaveText('Кнопки');
  await expect(page.locator('#navigation [aria-current=page]')).toHaveAttribute('data-page','buttons');
  await expect(page.locator('#navigation [data-page=start]')).toHaveClass(/af-btn--clear/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const route of ['/#grid','/demos/panel.html'])test(`panel content fits without nested scrollbars: ${route}`,async({page},info)=>{
  await page.goto(route);
  const panel=page.locator('.panel-demo');
  await expect(panel.locator('.af-widget')).toHaveCount(6);
  await page.evaluate(()=>document.fonts.ready);
  const overflow=()=>panel.locator('.af-widget,.af-widget__content,.af-table-scroll').evaluateAll(nodes=>nodes.filter(n=>n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2).map(n=>({widget:n.closest<HTMLElement>('[data-widget-id]')?.dataset.widgetId,part:n.className,width:n.clientWidth,scrollWidth:n.scrollWidth,height:n.clientHeight,scrollHeight:n.scrollHeight})));
  for(const width of [1440,1100,900,768,390,320]){
    await page.setViewportSize({width,height:1000});
    expect(await overflow(),`${route} at ${width}px`).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width===1440||width===390)await panel.screenshot({path:info.outputPath(`panel-${width}.png`)});
  }
  await panel.locator('[data-widget-id=comment] .af-prose p').evaluate(n=>n.textContent='Обсудим материалы команды и согласуем следующую итерацию. '.repeat(12));
  expect(await overflow(),'longer comment grows without scrolling').toEqual([]);
  const boxes=await panel.locator('.af-widget').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];
    expect(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1,'widgets must not overlap').toBe(false);
  }
});
