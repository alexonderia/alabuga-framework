import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {inspectCompositionResources,exportCompositionResources} from './composition-resources.mjs';

const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow'}).format(new Date());
const destination=resolve(process.argv[2]||`artifacts/composition-templates-${date}`);
const escape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const server=await createServer({server:{host:'127.0.0.1',port:0,open:false}});
let browser;
try{
 await mkdir(destination,{recursive:true});
 await server.listen();
 const base=`http://127.0.0.1:${server.httpServer.address().port}`;
 browser=await chromium.launch({channel:process.env.AF_BROWSER_CHANNEL||'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1,reducedMotion:'reduce',locale:'ru-RU'});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
 await page.goto(base+'/demos/showcase.html',{waitUntil:'networkidle'});
 const catalogs=await page.evaluate(async()=>{
  const {compositionCatalog}=await import('/src/compositions.ts');
  return {page:compositionCatalog('page'),presentation:compositionCatalog('presentation')};
 });
 const configurations=[
  {directory:'page-desktop',kind:'page',width:1440,height:1100,label:'Сайт — компьютер, 1440 px'},
  {directory:'page-mobile',kind:'page',width:390,height:844,label:'Сайт — телефон, 390 px'},
  {directory:'presentation',kind:'presentation',width:1600,height:1080,label:'Презентация — слайд 1600 × 900'},
 ];
 const entries=[],snapshots=new Map();
 for(const config of configurations){
  await mkdir(resolve(destination,config.directory),{recursive:true});
  await page.setViewportSize({width:config.width,height:config.height});
  for(const [index,[id,title,description]]of catalogs[config.kind].entries()){
   const details=await page.evaluate(async({id,kind,title})=>{
    const {makeComposition}=await import('/src/compositions.ts');
    const {renderDocument}=await import('/src/runtime.ts');
    window.demoController?.destroy();
    const section=makeComposition(id,kind);
    section.id=`template-${id}`;
    section.widgets.forEach((widget,index)=>widget.id=`template-${id}-widget-${index}`);
    window.demoController=renderDocument(document.getElementById('document'),{schemaVersion:3,kind,title:'Шаблон композиции',pages:[section]},{editing:true});
    // Exclude the player's border so the slide is captured at its native 1600 × 900 size.
    if(kind==='presentation')document.querySelector('.af-deck').style.border='0';
    await document.fonts.load('800 56px "Alabuga Heading"');
    await document.fonts.ready;
    await Promise.all([...document.images].map(image=>image.decode()));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const shell=document.querySelector('[data-composition]');
    const textOverflow=[...shell.querySelectorAll('.af-widget__content')].filter(node=>node.scrollHeight>node.clientHeight+2||node.scrollWidth>node.clientWidth+2).map(node=>node.closest('[data-widget-id]').dataset.widgetId);
    if([...document.images].some(image=>!image.complete||!image.naturalWidth))throw new Error('Изображения не загрузились: '+id);
    if(document.documentElement.scrollWidth>innerWidth)throw new Error('Горизонтальная прокрутка: '+id);
    if(!document.fonts.check('800 56px "Alabuga Heading"'))throw new Error('Шрифт заголовков не загрузился');
    return {widgets:shell.querySelectorAll('[data-widget-id]').length,textOverflow};
   },{id,title,kind:config.kind});
   const target=page.locator(config.kind==='presentation'?'.af-slide--active':'.af-page');
   const filename=`${config.directory}/${String(index+1).padStart(2,'0')}-${id}.png`;
   snapshots.set(filename,await inspectCompositionResources(page));
   const png=await target.screenshot({path:resolve(destination,filename),animations:'disabled'});
   const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
   if(config.kind==='presentation'&&(width!==1600||height!==900))throw new Error(`Неверный размер слайда: ${id}: ${width} × ${height}`);
   entries.push({id,title,description,kind:config.kind,view:config.directory,file:filename,width,height,...details,sha256:createHash('sha256').update(png).digest('hex')});
   console.log(`${filename} (${width} × ${height})`);
  }
 }
 if(errors.length)throw new Error([...new Set(errors)].join('\n'));
 const resources=await exportCompositionResources(destination,entries,snapshots);
 const sourceFiles=['src/compositions.ts','src/runtime.ts','src/compositions.css','src/styles.css','src/element-style.ts','dist/alabuga.css'];
 const sources=await Promise.all(sourceFiles.map(async file=>({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')})));
 const {version}=JSON.parse(await readFile('package.json','utf8'));
 const manifest={generatedAt:new Date().toISOString(),date,timeZone:'Europe/Moscow',frameworkVersion:version,browser:await browser.version(),source:'compositionCatalog(kind) → makeComposition(id, kind) → renderDocument(..., {editing:true})',theme:'default',deviceScaleFactor:1,catalogs,configurations,sources,screenshots:entries,resources};
 await writeFile(resolve(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const sections=configurations.map(config=>`<section id="${config.directory}"><h2>${config.label}</h2><div class="grid ${config.kind==='presentation'?'slides':''}">${entries.filter(entry=>entry.view===config.directory).map(entry=>`<figure><a href="${entry.file}"><div class="preview"><img src="${entry.file}" alt="${escape(entry.title)}" loading="eager"></div></a><figcaption><strong>${escape(entry.title)}</strong><span>${escape(entry.description)}</span><small>${entry.id} · ${entry.width} × ${entry.height} px</small><small><a href="templates/${entry.id}/index.html">Изображения и стили →</a></small></figcaption></figure>`).join('')}</div></section>`).join('');
 const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Шаблоны композиций конструктора</title><style>*{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#16243c;font:16px/1.5 system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:36px}h1{font-size:32px;line-height:1.2}h2{margin-top:44px}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:inherit}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0;overflow:hidden;background:white;border:1px solid #d5dfea;border-radius:8px}figure a{display:block;text-decoration:none}.preview{height:230px;display:flex;align-items:center;justify-content:center;background:#e3e9f2;border-bottom:1px solid #d5dfea;padding:8px}.preview img{display:block;max-width:100%;max-height:100%;object-fit:contain}figcaption{padding:16px}figcaption strong,figcaption span,figcaption small{display:block}figcaption span{font-size:14px;margin-top:4px}figcaption small{color:#58677b;margin-top:8px}#page-mobile .grid{grid-template-columns:repeat(5,minmax(0,1fr))}#page-mobile .preview{height:360px}@media(max-width:850px){.grid,#page-mobile .grid{grid-template-columns:repeat(2,minmax(0,1fr))}main{padding:20px}}@media(max-width:500px){.grid,#page-mobile .grid{grid-template-columns:1fr}}</style></head><body><main><h1>Шаблоны композиций конструктора</h1><p>18 композиций · 15 заготовок сайта и 15 заготовок презентации · ${entries.length} PNG · ${date}</p><p>Стандартное содержимое и оформление каталога конструктора. Нажмите на изображение, чтобы открыть оригинал. Пустая композиция намеренно показана без элементов.</p><nav>${configurations.map(config=>`<a href="#${config.directory}">${config.label}</a>`).join('')}</nav>${sections}<p>Это снимки текущей реализации Framework ${escape(version)}. Источники, размеры и SHA-256 перечислены в <a href="manifest.json">manifest.json</a>.</p></main></body></html>`;
 await writeFile(resolve(destination,'index.html'),html);
 await writeFile(resolve(destination,'README.md'),`# Скриншоты шаблонов композиций\n\nДата: ${date} (Europe/Moscow). Framework ${version}.\n\nОткройте [index.html](index.html) в браузере — работает без сети.\n\n- page-desktop/ — все 15 заготовок сайта при ширине 1440 px.\n- page-mobile/ — те же 15 заготовок при ширине 390 px.\n- presentation/ — все 15 заготовок презентации, 1600 × 900 px.\n- overview.png — общий обзор каталога.\n- manifest.json — названия, идентификаторы, источники, размеры и SHA-256.\n\nВсего 18 различных композиций, 45 отдельных PNG. Для сайта недоступны divider, thesis, final; для презентации — header, footer, cta.\n\nИсточник: compositionCatalog и makeComposition из src/compositions.ts, как в каталоге конструктора apps/editor/src/main.ts (drawCatalog / catalogComposition). Используются стандартная тема и исходное содержимое без подбора нового оформления. Снимки сделаны через renderDocument в режиме editing, как предпросмотр каталога: все элементы видны, панели конструктора и управления показом не входят в кадр. Пустая композиция blank сохранена намеренно. Высота секций сайта зависит от содержимого.\n\nЭто снимки реализации, хранящиеся отдельно от эталонов Figma. Наблюдения о переполнении содержимого записаны в manifest.json; они не исправлялись в рамках экспорта.\n\nПовторить из корня проекта:\n\n\`\`\`powershell\nnode scripts/capture-compositions.mjs\n\`\`\`\n\nТребуются установленные зависимости и Google Chrome. Канал браузера можно переопределить через AF_BROWSER_CHANNEL; путь результата — первым аргументом команды.\n`);
 await writeFile(resolve(destination,'README.md'),(await readFile(resolve(destination,'README.md'),'utf8'))+'\nДля каждой композиции в templates/<id>/ выделены исходные изображения, styles.css, вычисленные стили по размерам экрана, документы JSON и автономные HTML-примеры. Общее оглавление — index.html, машинный индекс — resources.json.\n');
 await page.setViewportSize({width:1440,height:1100});
 await page.route('http://composition-gallery.local/**',async route=>{
  const pathname=decodeURIComponent(new URL(route.request().url()).pathname);
  if(pathname==='/')return route.fulfill({contentType:'text/html; charset=utf-8',body:html});
  const entry=entries.find(item=>'/'+item.file===pathname);
  if(entry)return route.fulfill({contentType:'image/png',body:await readFile(resolve(destination,entry.file))});
  return route.fulfill({status:404,body:'Not found'});
 });
 await page.goto('http://composition-gallery.local/');
 await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
 await page.screenshot({path:resolve(destination,'overview.png'),fullPage:true});
 console.log(`Saved ${entries.length} template screenshots and overview: ${relative(process.cwd(),destination)}`);
}finally{
 await browser?.close();
 await server.close();
}
