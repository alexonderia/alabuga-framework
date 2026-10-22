import {test, expect, type Page, type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import axe from 'axe-core';

const field = (size = '', id = 'topic') => `<div class="af-field" style="width:278px">
  <label class="af-label" for="${id}">Topic ${size || 'M'}</label>
  <select class="af-select${size === 'L' ? ' af-select--lg' : size === 'S' ? ' af-select--sm' : ''}" id="${id}" name="${id}" required aria-describedby="${id}-help ${id}-error">
    <option value="" selected disabled hidden>Choose a topic</option>
    <option value="alpha">Alpha</option><option value="beta" disabled>Beta</option>
    <option value="gamma">Gamma</option><option value="delta">Delta</option>
  </select>
  <p class="af-help" id="${id}-help">Helper text</p>
  <p class="af-error" id="${id}-error" data-af-error-for="${id}" hidden></p>
</div>`;

async function mount(page: Page, info: TestInfo, markup = `<form data-af-validate>${field()}<button type="submit">Submit</button><button type="reset">Reset</button></form>`, initialize = true) {
  const css = pathToFileURL(resolve('dist/alabuga.css')).href;
  const js = pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Select test</title><link rel="stylesheet" href="${css}"></head><body style="margin:24px"><main class="af" id="fixture"><h1 class="af-sr-only">Select test</h1>${markup}</main>${initialize ? `<script src="${js}"></script><script>
    window.original = document.querySelector('select');
    window.originalMarkup = window.original?.outerHTML;
    window.init = () => window.afCleanup = Alabuga.initComponents(document.getElementById('fixture'));
    window.events = []; window.submits = [];
    document.addEventListener('input', e => { if (e.target.tagName === 'SELECT') events.push('input:'+e.target.value); });
    document.addEventListener('change', e => { if (e.target.tagName === 'SELECT') events.push('change:'+e.target.value); });
    document.addEventListener('af:submit', e => submits.push(Object.fromEntries(e.detail)));
    init();
  </script>` : ''}</body></html>`;
  const file = info.outputPath('standalone-select.html');
  await writeFile(file, html);
  await page.route(/^https?:\/\//, route => route.abort());
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
}

test('JS and CSS files enhance the existing select and keep form values and native events', async ({page}, info) => {
  await mount(page, info);
  const combo = page.getByRole('combobox', {name: 'Topic M'});
  await expect(page.getByRole('combobox')).toHaveCount(1);
  await combo.click();
  await expect(combo).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('option', {name: 'Gamma', exact: true}).click();
  await expect(combo).toContainText('Gamma');
  await expect(combo).toBeFocused();
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => ({
    same: (window as any).original === document.querySelector('#topic'),
    value: new FormData(document.querySelector('form')!).get('topic'),
    events: (window as any).events
  }))).toEqual({same: true, value: 'gamma', events: ['input:gamma', 'change:gamma']});
  await page.getByRole('button', {name: 'Submit', exact: true}).click();
  expect(await page.evaluate(() => (window as any).submits)).toEqual([{topic: 'gamma'}]);
});

test('keyboard navigation skips disabled items, cancels on Escape and searches by text', async ({page}, info) => {
  await mount(page, info);
  const combo = page.getByRole('combobox');
  await combo.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(combo).toHaveAttribute('aria-activedescendant', /option-3$/);
  await page.keyboard.press('Escape');
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#topic')).toHaveValue('');
  await page.keyboard.press('Space');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(page.locator('#topic')).toHaveValue('delta');
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(page.locator('#topic')).toHaveValue('alpha');
  await page.keyboard.type('gam');
  await page.keyboard.press('Enter');
  await expect(page.locator('#topic')).toHaveValue('gamma');
  await combo.click();
  await page.keyboard.press('Tab');
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', {name: 'Submit', exact: true})).toBeFocused();
});

test('required validation, label focus, reset and accessibility remain usable', async ({page}, info) => {
  await mount(page, info);
  const combo = page.getByRole('combobox');
  await page.locator('label').click();
  await expect(combo).toBeFocused();
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', {name: 'Submit', exact: true}).click();
  await expect(combo).toBeFocused();
  await expect(combo).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#topic-error')).toBeVisible();
  await combo.click();
  await page.getByRole('option', {name: 'Alpha', exact: true}).click();
  await expect(combo).toHaveAttribute('aria-invalid', 'false');
  await page.getByRole('button', {name: 'Reset', exact: true}).click();
  await expect(combo).toContainText('Choose a topic');
  await expect(combo).not.toHaveAttribute('aria-invalid');
  await expect(page.locator('#topic-error')).toBeHidden();
  await combo.click();
  await page.evaluate(axe.source);
  expect(await page.evaluate(async () => (await (window as any).axe.run()).violations.map((v: any) => ({id:v.id, targets:v.nodes.map((n: any) => n.target)})))).toEqual([]);
});

test('programmatic values, option replacement and optgroups synchronize without emitting user events', async ({page}, info) => {
  await mount(page, info);
  const combo = page.getByRole('combobox');
  await page.locator('#topic').evaluate((n: HTMLSelectElement) => { n.value = 'gamma'; });
  await expect(combo).toContainText('Gamma');
  await page.locator('#topic').evaluate((n: HTMLSelectElement) => { n.selectedIndex = 4; });
  await expect(combo).toContainText('Delta');
  await page.locator('#topic').evaluate((n: HTMLSelectElement) => { n.options[1].selected = true; });
  await expect(combo).toContainText('Alpha');
  expect(await page.evaluate(() => (window as any).events)).toEqual([]);
  await page.locator('#topic').evaluate((n: HTMLSelectElement) => {
    n.innerHTML = '<optgroup label="Unavailable" disabled><option value="x">Excluded</option></optgroup><optgroup label="Available"><option value="z">Zeta</option></optgroup>';
    n.add(new Option('<img src=x onerror=alert(1)>', 'safe'));
    n.value = 'z';
  });
  await expect(combo).toContainText('Zeta');
  await combo.click();
  await expect(page.getByRole('group', {name: 'Unavailable'}).getByRole('option')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('option', {name: '<img src=x onerror=alert(1)>'})).toBeVisible();
  await expect(page.locator('.af-select-list img')).toHaveCount(0);
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(page.locator('#topic')).toHaveValue('z');
});

test('disabled fieldsets, readonly state and native fallback retain their contracts', async ({page}, info) => {
  await mount(page, info, `<form><fieldset disabled>${field()}</fieldset><label>Multiple<select class="af-select" name="multiple" multiple><option>A</option><option>B</option></select></label><label>Native<select class="af-select" data-af-select-native><option>A</option></select></label></form>`);
  const combo = page.getByRole('combobox', {name: 'Topic M'});
  await expect(combo).toBeDisabled();
  await page.locator('fieldset').evaluate(n => { (n as HTMLFieldSetElement).disabled = false; });
  await expect(combo).toBeEnabled();
  await page.locator('#topic').evaluate(n => n.setAttribute('data-af-readonly', ''));
  await expect(combo).toHaveAttribute('aria-readonly', 'true');
  await combo.click();
  await page.keyboard.press('ArrowDown');
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.af-select-box')).toHaveCount(1);
  await expect(page.locator('select[multiple]')).not.toHaveAttribute('aria-hidden');
  await expect(page.locator('[data-af-select-native]')).not.toHaveAttribute('aria-hidden');
});

test('reinitialization and cleanup restore native DOM and property descriptors', async ({page}, info) => {
  await mount(page, info, `<form>${field()}</form>`);
  await page.evaluate(() => { (window as any).init(); (window as any).init(); });
  await expect(page.locator('.af-select-box')).toHaveCount(1);
  await page.getByRole('combobox').click();
  await page.getByRole('option', {name: 'Delta', exact: true}).click();
  expect(await page.evaluate(() => (window as any).events)).toEqual(['input:delta', 'change:delta']);
  await page.evaluate(() => { (window as any).afCleanup(); (window as any).afCleanup(); });
  await expect(page.locator('.af-select-box,.af-select-list')).toHaveCount(0);
  expect(await page.locator('#topic').evaluate((n: HTMLSelectElement) => ({
    same: n === (window as any).original,
    markup: n.outerHTML === (window as any).originalMarkup,
    value: n.value,
    ownValue: Object.hasOwn(n, 'value'),
    ownIndex: Object.hasOwn(n, 'selectedIndex'),
    ownSelected: Object.hasOwn(n.options[1], 'selected'),
    labelId: n.labels![0].id,
    noValidate: n.form!.noValidate
  }))).toEqual({same:true, markup:true, value:'delta', ownValue:false, ownIndex:false, ownSelected:false, labelId:'', noValidate:false});
  await page.evaluate(() => (window as any).init());
  await expect(page.getByRole('combobox')).toContainText('Delta');
});

test('popover escapes clipping, opens upward and stays inside the viewport', async ({page}, info) => {
  await page.setViewportSize({width:390,height:300});
  await mount(page, info, `<section style="position:fixed;left:24px;bottom:8px;width:278px;height:65px;overflow:hidden">${field()}</section>`);
  const combo = page.getByRole('combobox');
  await combo.click();
  const box = await page.getByRole('listbox').boundingBox();
  const trigger = await combo.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(trigger!.y);
  expect(box!.x).toBeGreaterThanOrEqual(8);
  expect(box!.x + box!.width).toBeLessThanOrEqual(382);
  await page.getByRole('option', {name:'Gamma',exact:true}).click();
  await expect(combo).toContainText('Gamma');
  await combo.click();
  await page.setViewportSize({width:320,height:260});
  await expect.poll(async () => {const b = await page.getByRole('listbox').boundingBox();return b!.x+b!.width;}).toBeLessThanOrEqual(312);
});

test('Select inside a modal consumes the first Escape without closing the dialog', async ({page}, info) => {
  await mount(page, info, `<button data-af-dialog-open="modal">Open dialog</button><dialog class="af-dialog" id="modal" aria-label="Example">${field()}<button data-af-dialog-close>Close dialog</button></dialog>`);
  await page.getByRole('button', {name:'Open dialog',exact:true}).click();
  await page.getByRole('combobox').click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', {name:'Open dialog',exact:true})).toBeFocused();
});

test('CSS alone leaves a working native select with size modifiers', async ({page}, info) => {
  await mount(page, info, `<form>${field('S')}</form>`, false);
  await expect(page.locator('.af-select-box')).toHaveCount(0);
  await expect(page.getByRole('combobox')).toHaveCSS('min-height','32px');
  await page.locator('#topic').selectOption('gamma');
  expect(await page.evaluate(() => new FormData(document.querySelector('form')!).get('topic'))).toBe('gamma');
});

test('fallback menu and native form validation work without Popover support', async ({page}, info) => {
  await page.addInitScript(() => Object.defineProperty(HTMLElement.prototype, 'showPopover', {configurable:true,value:undefined}));
  await mount(page, info, `<form style="height:70px;overflow:hidden">${field()}</form>`);
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => form.reportValidity())).toBe(false);
  const combo = page.getByRole('combobox');
  await expect(combo).toBeFocused();
  await expect(combo).toHaveAttribute('aria-invalid','true');
  await combo.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('option',{name:'Gamma',exact:true}).click();
  await expect(page.locator('#topic')).toHaveValue('gamma');
  await expect(combo).not.toHaveAttribute('aria-invalid');
  await page.evaluate(() => (window as any).afCleanup());
  await expect(page.locator('.af-select-list')).toHaveCount(0);
});

test('long lists scroll to the active row and a canceled reset preserves selection', async ({page}, info) => {
  await mount(page, info);
  await page.locator('#topic').evaluate((select: HTMLSelectElement) => {
    select.replaceChildren(...Array.from({length:60},(_,i)=>new Option('Item '+i,String(i))));
    select.value='0';
    select.form!.addEventListener('reset',event=>event.preventDefault());
  });
  const combo = page.getByRole('combobox');
  await combo.click();
  await page.keyboard.press('End');
  const row = await page.getByRole('option',{name:'Item 59',exact:true}).boundingBox();
  const menu = await page.getByRole('listbox').boundingBox();
  expect(row!.y).toBeGreaterThanOrEqual(menu!.y);
  expect(row!.y+row!.height).toBeLessThanOrEqual(menu!.y+menu!.height);
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(combo).toContainText('Item 59');
  await expect(page.locator('#topic')).toHaveValue('59');
});

test('Select keeps full text height and a compact menu gap, including the fallback', async ({page,browserName}, info) => {
  for(const fallback of [false,true]) {
    if(fallback)await page.addInitScript(() => Object.defineProperty(HTMLElement.prototype,'showPopover',{configurable:true,value:undefined}));
    await mount(page,info,`<div class="af-stack">${field('L','large')}${field('','medium')}${field('S','small')}</div>`);
    for(const id of ['large','medium','small']) {
      await page.locator('#'+id).evaluate((n:HTMLSelectElement)=>{
        n.options[1].textContent='Сотрудничество · Другое · gypq';n.value='alpha';
      });
      const combo=page.locator('#'+id).locator('..').getByRole('combobox');
      const value=combo.locator('.af-select__value');
      const text=await value.evaluate(n=>({height:n.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(n).lineHeight)}));
      expect(text.height).toBeGreaterThanOrEqual(text.lineHeight-0.1);
      if(browserName==='chromium'&&!fallback&&id==='medium')await expect(combo).toHaveScreenshot('select-text-descenders.png');
      await combo.click();
      await expect(combo).toHaveAttribute('aria-expanded','true');
      const trigger=await combo.boundingBox(),menu=await page.getByRole('listbox').boundingBox();
      expect(menu!.y-trigger!.y-trigger!.height).toBeCloseTo(2,1);
      await page.keyboard.press('Escape');
      await expect(combo).toBeFocused();
    }
  }
});

test('Select sizes and opened List follow the reviewed Figma geometry', async ({page,browserName}, info) => {
  test.skip(browserName !== 'chromium', 'Visual baseline is captured in Chromium');
  await mount(page, info, `<div class="af-row" style="align-items:flex-start">${field('L','large')}${field('','medium')}${field('S','small')}</div>`);
  for (const [name,height,radius,icon] of [['L',48,8,24],['M',40,8,20],['S',32,6,16]] as const) {
    const combo = page.getByRole('combobox', {name:'Topic '+name});
    await expect(combo).toHaveCSS('height',height+'px');
    await expect(combo).toHaveCSS('border-radius',radius+'px');
    await expect(combo.locator('.af-select__arrow')).toHaveCSS('width',icon+'px');
  }
  await expect(page.locator('main')).toHaveScreenshot('select-sizes.png');
  await page.getByRole('combobox', {name:'Topic M'}).click();
  await expect(page.getByRole('listbox')).toHaveCSS('width','278px');
  await expect(page.getByRole('option', {name:'Alpha',exact:true})).toHaveCSS('height','40px');
  await expect(page).toHaveScreenshot('select-list.png');
});
