import {test,expect} from '@playwright/test';
test('public DOM, component cleanup, asset base and CSS states',async({page})=>{
 await page.goto('/demos/panel.html');
 const report=await page.evaluate(async()=>{
  const {renderDocument,initComponents}=await import('/src/index.ts' as string);
  const {showcase}=await import('/src/compositions.ts' as string);
  const host=document.createElement('div');document.body.append(host);
  const c=renderDocument(host,showcase('page'),{editing:true,assetsBaseUrl:location.origin+'/assets/'});
  await Promise.all([...host.querySelectorAll('img')].map(i=>i.decode()));
  const hooks=['[data-section-id]','[data-widget-id]','.af-widget__content','.af-prose','.af-feature__title','.af-quote__text'];
  const present=hooks.every(s=>host.querySelector(s));const cleanup=initComponents(host);cleanup();cleanup();c.destroy();
  return {present,empty:host.childElementCount===0};
 });expect(report).toEqual({present:true,empty:true});
});
test('button states match reviewed visual baselines',async({page,browserName})=>{
 test.skip(browserName!=='chromium','Visual reference uses Chromium; behavior is checked in every browser');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 await page.setContent('<link rel="stylesheet" href="/dist/alabuga.css"><main class="af" style="padding:24px;width:500px;background:white"><button class="af-btn">Default</button><button class="af-btn" disabled>Disabled</button><button class="af-btn af-btn--secondary" aria-pressed="true">Selected</button></main>');
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('main')).toHaveScreenshot('button-states.png');
 const primary=page.getByRole('button',{name:'Default',exact:true});
 await primary.hover();await expect(page.locator('main')).toHaveScreenshot('button-hover.png');
 await page.mouse.down();await expect(primary).toHaveCSS('background-color','rgb(10, 91, 205)');await expect(page.locator('main')).toHaveScreenshot('button-pressed.png');await page.mouse.up();
 await page.mouse.move(540,110);await page.keyboard.press('Tab');await primary.focus();await expect(page.locator('main')).toHaveScreenshot('button-focus.png');
});
