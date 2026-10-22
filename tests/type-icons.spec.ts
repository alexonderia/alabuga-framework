import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import axe from 'axe-core';
import {examples} from '../docs/app/examples';
const listsMarkup=examples.typography.slice(2,6).map(e=>`<h3 class="af-title af-title--md">${e.title}</h3>${e.html}`).join('\n');

async function mount(page:Page,info:TestInfo,html:string,js=false){
  const file=info.outputPath('type-icons.html');
  const css=pathToFileURL(resolve('dist/alabuga.css')).href;
  const script=pathToFileURL(resolve('dist/alabuga.iife.js')).href;
  await writeFile(file,`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Typography and icons</title><link rel="stylesheet" href="${css}"></head><body style="margin:24px"><main class="af" id="fixture"><h1 class="af-sr-only">Компоненты Figma</h1>${html}</main>${js?`<script src="${script}"></script><script>window.cleanup=Alabuga.initComponents(document.querySelector('main'))</script>`:''}</body></html>`);
  await page.route(/^https?:\/\//,route=>route.abort());
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
}

test('icon buttons retain square and round source geometry, slots and loaders offline',async({page},info)=>{
  await mount(page,info,examples.buttons[6].html);
  const buttons=page.locator('.af-btn--icon');await expect(buttons).toHaveCount(24);
  for(let i=0;i<24;i++){
    const button=buttons.nth(i),size=[32,40,48][Math.floor(i/8)];
    const round=i%8>=4,secondary=i%4===1;
    const icon=secondary&&round&&size===48?20:[16,20,24][Math.floor(i/8)];
    const box=await button.boundingBox(),slot=await button.locator('.af-btn__icon').boundingBox();
    expect(box!.width).toBeCloseTo(size,3);expect(box!.height).toBeCloseTo(size,3);
    expect(slot!.width).toBeCloseTo(icon,3);expect(slot!.height).toBeCloseTo(icon,3);
    expect(Math.abs(slot!.x+icon/2-box!.x-size/2)).toBeLessThan(.02);
    expect(Math.abs(slot!.y+icon/2-box!.y-size/2)).toBeLessThan(.02);
    const symbol=button.locator('.af-btn__icon');
    await expect(symbol).toHaveClass(/af-btn__icon--info/);
    expect(await symbol.evaluate(n=>getComputedStyle(n).maskImage)).toContain('data:image/svg+xml');
    await expect(button).toHaveCSS('border-radius',round?'333px':'8px');
    await button.evaluate(b=>b.setAttribute('aria-busy','true'));
    const loader=await button.evaluate(b=>{const s=getComputedStyle(b,'::before');return {w:s.width,h:s.height,bg:s.backgroundImage,animation:s.animationName}});
    expect(loader.w).toBe(icon+'px');expect(loader.h).toBe(icon+'px');expect(loader.bg).toContain('data:image/svg+xml');
    expect(loader.animation).toBe('none');
    await expect(button).toHaveAccessibleName(new RegExp(['S','M','L'][Math.floor(i/8)]+'$'));
    await button.evaluate(b=>b.removeAttribute('aria-busy'));
  }
});

test('icon buttons preserve native keyboard and form behavior and existing cleanup guards',async({page},info)=>{
  const icon='<span class="af-btn__icon af-btn__icon--info" aria-hidden="true"></span>';
  await mount(page,info,`<form id="form"><button class="af-btn af-btn--icon" aria-label="Отправить">${icon}</button><button class="af-btn af-btn--icon" type="button" aria-label="Недоступно" disabled>${icon}</button></form><a class="af-btn af-btn--icon af-btn--round" href="#destination" aria-label="Открыть" aria-busy="true">${icon}</a>`,true);
  await page.evaluate(()=>{
    (window as any).submits=0;(window as any).opens=0;
    document.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();(window as any).submits++});
    document.querySelector('a')!.addEventListener('click',e=>{e.preventDefault();(window as any).opens++});
  });
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Отправить'})).toBeFocused();
  await expect(page.getByRole('button',{name:'Отправить'})).toHaveCSS('outline-style','solid');
  await page.keyboard.press('Space');expect(await page.evaluate(()=>(window as any).submits)).toBe(1);
  await page.keyboard.press('Tab');await page.getByRole('link').focus();await expect(page.getByRole('link')).toBeFocused();
  await page.keyboard.press('Enter');expect(await page.evaluate(()=>(window as any).opens)).toBe(0);
  await page.getByRole('link').evaluate(a=>{a.removeAttribute('aria-busy');a.setAttribute('aria-disabled','true');(a as HTMLElement).click()});
  expect(await page.evaluate(()=>(window as any).opens)).toBe(0);
  await page.evaluate(()=>(window as any).cleanup());
  await page.getByRole('link').evaluate(a=>(a as HTMLElement).click());
  expect(await page.evaluate(()=>(window as any).opens)).toBe(1);
});

test('painted information icons and loaders stay centered at fractional zoom and pixel density',async({browser,browserName},info)=>{
  test.setTimeout(60000);
  for(const dpr of [1,1.25,2]){
    const context=await browser.newContext({deviceScaleFactor:dpr});
    try{
      const page=await context.newPage();
      await mount(page,info,`<div id="zoom" style="padding:13.5px 17.5px"><div class="af-row">${['sm','','lg'].map(s=>`<button class="af-btn af-btn--icon af-btn--round${s?' af-btn--'+s:''}" aria-label="Подробнее"><span class="af-btn__icon af-btn__icon--info" aria-hidden="true"></span></button>`).join('')}</div></div>`);
      await page.locator('body').evaluate(n=>n.style.margin='23.5px');
      for(const zoom of [.8,1,1.1,1.25,1.5]){
        await page.locator('#zoom').evaluate((n,z)=>(n as HTMLElement).style.zoom=String(z),zoom);
        for(const busy of [false,true]){
          await page.locator('button').evaluateAll((nodes,busy)=>nodes.forEach(n=>busy?n.setAttribute('aria-busy','true'):n.removeAttribute('aria-busy')),busy);
          for(const button of await page.locator('button').all()){
            const shot=await button.screenshot();
            const delta=await page.evaluate(async({base64,busy})=>{
              const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
              const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
              const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
              const {data,width,height}=ctx.getImageData(0,0,canvas.width,canvas.height);
              let minX=width,minY=height,maxX=-1,maxY=-1,iconMinX=width,iconMinY=height,iconMaxX=-1,iconMaxY=-1;
              for(let y=0;y<height;y++)for(let x=0;x<width;x++){
                const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
                if(r<134&&g<184&&b>180){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
                // Both the gray ring and white arc map to alpha=1 against the blue background.
                const opaque=busy?((r-12)*33-(b-241)*41)/7445>.5:(r-12)/243>.5;
                if(opaque&&x>width*.19&&x<width*.81&&y>height*.19&&y<height*.81){iconMinX=Math.min(iconMinX,x);iconMinY=Math.min(iconMinY,y);iconMaxX=Math.max(iconMaxX,x);iconMaxY=Math.max(iconMaxY,y)}
              }
              return {x:(iconMinX+iconMaxX-minX-maxX)/2,y:(iconMinY+iconMaxY-minY-maxY)/2,present:iconMaxX>iconMinX};
            },{base64:shot.toString('base64'),busy});
            const tolerance=browserName==='chromium'&&zoom>=1?.5:1;
            if(!delta.present||Math.abs(delta.x)>tolerance||Math.abs(delta.y)>tolerance)await writeFile(info.outputPath(`center-${dpr}-${zoom}-${busy}-${await button.getAttribute('class')}.png`),shot);
            expect(delta.present,`icon present dpr=${dpr} zoom=${zoom} busy=${busy}`).toBe(true);
            expect(Math.abs(delta.x),`x dpr=${dpr} zoom=${zoom} busy=${busy}`).toBeLessThanOrEqual(tolerance);
            expect(Math.abs(delta.y),`y dpr=${dpr} zoom=${zoom} busy=${busy}`).toBeLessThanOrEqual(tolerance);
          }
        }
      }
    }finally{await context.close()}
  }
});

test('component type scale matches source fonts and preserves explicit mobile and field contexts',async({page},info)=>{
  await mount(page,info,`<div id="type" style="font-weight:800;letter-spacing:2px">${examples.typography[0].html}${examples.typography[1].html}</div><div class="af-document--page"><p class="af-display" id="mobile-display">Мобильный заголовок</p></div><div class="af-field"><label class="af-label af-label--lg" for="input">Подпись поля</label><input class="af-input" id="input"></div>`);
  const expected=[[44,44,800],[32,32,800],[28,33.6,700],[24,28.8,700],[22,26.4,500],[16,24,400],[16,21.6,400],[14,19.6,400],[12,16.2,400],[10,13.5,400],[8,10.8,400],[16,20.8,500],[14,18.2,500],[12,15.6,500],[10,13,500]];
  const styles=await page.locator('#type .af-stack>*').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return [parseFloat(s.fontSize),parseFloat(s.lineHeight),Number(s.fontWeight),s.letterSpacing,s.fontFamily]}));
  expect(styles).toHaveLength(expected.length);
  styles.forEach((s,i)=>{expect(s[0]).toBe(expected[i][0]);expect(s[1]).toBeCloseTo(expected[i][1],3);expect(s[2]).toBe(expected[i][2]);expect(['normal','0px']).toContain(s[3]);expect(s[4]).toContain(i<4?'Alabuga Heading':'Alabuga Sans')});
  await expect(page.locator('.af-field .af-label')).toHaveCSS('font-size','12px');
  await page.setViewportSize({width:390,height:900});
  await expect(page.locator('#type .af-display')).toHaveCSS('font-size','44px');
  await expect(page.locator('#mobile-display')).toHaveCSS('font-size','36px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});

test('branded lists align left with original assets, native ordered numbering and nested semantics',async({page},info)=>{
  await mount(page,info,`<div style="text-align:center">${listsMarkup}</div><ol class="af-list" start="3" id="numbered"><li>Обсудить проект</li><li value="7">Отправить протокол</li></ol><ul class="af-list" role="list" id="nested"><li>Родитель<ol class="af-list" start="4"><li>Вложенный шаг</li></ol></li></ul><span class="af-bullet af-bullet--outline" id="outline" aria-hidden="true"></span>`);
  const lists=page.locator('ul.af-list');
  for(const list of await lists.all()){
    await expect(list).toHaveCSS('text-align','left');
    const data=await list.locator(':scope>li').first().evaluate(li=>{const s=getComputedStyle(li),p=getComputedStyle(li,'::before');return {pad:parseFloat(s.paddingLeft),w:p.width,h:p.height,bg:p.backgroundImage}});
    expect(data.pad).toBe(45);expect(data.w).toBe('33px');expect(data.h).toBe('33px');
    if(await list.evaluate(n=>n.classList.contains('af-list--outline'))){
      expect(data.bg).toBe('none');
      const outline=await list.locator(':scope>li').first().evaluate(li=>{const s=getComputedStyle(li,'::after');return {w:parseFloat(s.width),border:parseFloat(s.borderWidth),transform:s.transform}});
      expect(outline.w).toBeCloseTo(23.334524,1);expect(outline.border).toBeGreaterThan(2);expect(outline.transform).toContain('matrix');
    }else expect(data.bg).toContain('data:image/svg+xml');
  }
  expect(new Set(await page.locator('ul.af-list:not(#nested)>li:first-child').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n,'::before').backgroundImage))).size).toBe(3);
  await expect(page.locator('#numbered')).toHaveAttribute('start','3');
  await expect(page.locator('#numbered>li').nth(1)).toHaveAttribute('value','7');
  const ordered=page.locator('ol.af-list').last().locator('li');
  await expect(ordered).toHaveCSS('display','list-item');
  expect(await ordered.evaluate(n=>getComputedStyle(n,'::before').content)).toBe('none');
  const tree=await page.locator('#nested').ariaSnapshot();expect(tree).toContain('listitem');expect(tree).toContain('Вложенный шаг');
  const shot=await page.locator('#outline').screenshot();
  const pixels=await page.evaluate(async(base64)=>{
    const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
    const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
    const {data,width,height}=ctx.getImageData(0,0,canvas.width,canvas.height);
    let left=0,right=0,top=0,bottom=0,center=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4;if(data[i]<80&&data[i+1]<160&&data[i+2]>180){
        if(x<width/4)left++;if(x>3*width/4)right++;if(y<height/4)top++;if(y>3*height/4)bottom++;
        if(Math.abs(x-width/2)<4&&Math.abs(y-height/2)<4)center++;
      }
    }return {left,right,top,bottom,center};
  },shot.toString('base64'));
  for(const side of ['left','right','top','bottom'] as const)expect(pixels[side],side+' edge is complete').toBeGreaterThan(10);
  expect(pixels.center).toBe(0);
  await page.setViewportSize({width:390,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});

test('renderer keeps list li hooks and adds Safari semantics without changing document data',async({page})=>{
  await page.goto('/demos/panel.html');
  const report=await page.evaluate(async()=>{
    const {renderDocument}=await import('/src/index.ts' as string);
    const host=document.createElement('div');document.body.append(host);
    const c=renderDocument(host,{schemaVersion:1,kind:'page',title:'Lists',pages:[{id:'page',title:'',grid:{columns:4,rowHeight:64,gap:16},widgets:[{id:'text',type:'text',position:{col:1,row:1,width:4,height:4},content:[{type:'list',ordered:false,items:['Первый','Второй']},{type:'list',ordered:true,items:['Шаг']}]}]}]},{editing:true});
    const before=JSON.stringify(c.getDocument());
    const ul=host.querySelector('ul')!,ol=host.querySelector('ol')!;
    const report={role:ul.getAttribute('role'),children:[...ul.children].map(n=>n.tagName),ordered:ol.tagName,text:[...ul.children].map(n=>n.textContent),stable:before===JSON.stringify(c.getDocument())};
    c.destroy();host.remove();return report;
  });
  expect(report).toEqual({role:'list',children:['LI','LI'],ordered:'OL',text:['Первый','Второй'],stable:true});
});

test('new component matrix is accessible and matches the reviewed offline visual reference',async({page,browserName},info)=>{
  await mount(page,info,`<div id="matrix" style="max-width:1100px;padding:24px;background:white"><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px"><section aria-label="Кнопки">${examples.buttons[6].html}${examples.buttons[7].html}</section><section aria-label="Текст">${examples.typography[0].html}${examples.typography[1].html}</section></div><section aria-label="Списки">${listsMarkup}</section></div>`);
  await page.evaluate(axe.source);
  const results=await page.evaluate(async()=>await (window as any).axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
  expect(results.violations.map((v:any)=>v.id)).toEqual([]);
  if(browserName==='chromium')await expect(page.locator('#matrix')).toHaveScreenshot('type-icons.png');
});

test('branded markers remain visible with system colors',async({page,browserName},info)=>{
  test.skip(browserName==='webkit','WebKit does not emulate forced colors');
  await mount(page,info,listsMarkup+examples.buttons[6].html);
  await page.emulateMedia({forcedColors:'active'});
  const marker=await page.locator('ul.af-list li').first().evaluate(li=>{const s=getComputedStyle(li,'::before');return {bg:s.backgroundColor,mask:s.maskImage,adjust:s.forcedColorAdjust}});
  expect(marker.bg).not.toBe('rgba(0, 0, 0, 0)');expect(marker.mask).toContain('data:image/svg+xml');expect(marker.adjust).toBe('none');
  const symbol=await page.locator('.af-btn__icon--info').first().evaluate(n=>{const s=getComputedStyle(n);return {bg:s.backgroundColor,mask:s.maskImage,adjust:s.forcedColorAdjust}});
  expect(symbol.bg).not.toBe('rgba(0, 0, 0, 0)');expect(symbol.mask).toContain('data:image/svg+xml');expect(symbol.adjust).toBe('none');
});
