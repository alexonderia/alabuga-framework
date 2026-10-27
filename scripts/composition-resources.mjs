import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function inspectCompositionResources(page){
 return page.evaluate(()=>{
  const shell=document.querySelector('[data-composition]');
  const root=shell.closest('.af-document');
  const nodes=[...new Set([document.documentElement,document.body,root,...root.querySelectorAll('.af-deck,.af-deck__stage'),shell,...shell.querySelectorAll('*')])];
  const rules=[];
  const declarationsOf=style=>{
   // Iterating CSSStyleDeclaration expands var()-based shorthands into empty
   // longhands. Parse its serialized text to retain those declarations intact.
   const result=[];let start=0,depth=0,quote='',escaped=false;
   const text=style.cssText+';';
   for(let index=0;index<text.length;index++){
    const char=text[index];
    if(escaped){escaped=false;continue}
    if(char==='\\'){escaped=true;continue}
    if(quote){if(char===quote)quote='';continue}
    if(char==='"'||char==="'"){quote=char;continue}
    if(char==='('||char==='[')depth++;
    if(char===')'||char===']')depth--;
    if(char===';'&&!depth){
     const part=text.slice(start,index).trim(),colon=part.indexOf(':');start=index+1;
     if(colon<0)continue;
     const name=part.slice(0,colon).trim(),raw=part.slice(colon+1).trim(),priority=/\s*!important\s*$/i.test(raw)?'important':'';
     result.push({name,value:raw.replace(/\s*!important\s*$/i,'').trim(),priority});
    }
   }
   return result;
  };
  const selectorMatches=selector=>{
   // Pseudo-elements are recorded with their originating element.
   const normalized=selector.replace(/::(before|after|first-letter|first-line|marker|selection)\b/g,'');
   try{return nodes.some(node=>node.matches(normalized))}catch{return false}
  };
  const visit=(list,sheet,path=[],conditions=[])=>{
   [...list].forEach((rule,index)=>{
    const key=[sheet,...path,index];
    if(rule instanceof CSSStyleRule){
     if(selectorMatches(rule.selectorText))rules.push({key,selector:rule.selectorText,conditions,declarations:declarationsOf(rule.style)});
    }else if(rule.cssRules){
     const header=rule.cssText.slice(0,rule.cssText.indexOf('{')).trim();
     visit(rule.cssRules,sheet,[...path,index],[...conditions,header]);
    }
   });
  };
  [...document.styleSheets].forEach((sheet,index)=>visit(sheet.cssRules,index));
  const properties=['display','position','width','height','min-width','max-width','min-height','max-height','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','color','background-color','background-image','font-family','font-size','font-weight','line-height','letter-spacing','text-align','white-space','grid-template-columns','grid-template-rows','grid-column','grid-row','gap','order','align-items','justify-content','border-top','border-right','border-bottom','border-left','border-radius','object-fit','object-position','aspect-ratio','opacity','overflow','overflow-wrap','transform','content'];
  const computed=nodes.filter(node=>node===shell||shell.contains(node)).map((node,index)=>{
   const style=getComputedStyle(node),pseudos={};
   for(const pseudo of ['::before','::after']){
    const value=getComputedStyle(node,pseudo);
    if(!['none','normal'].includes(value.content))pseudos[pseudo]=Object.fromEntries(properties.map(property=>[property,value.getPropertyValue(property)]));
   }
   return {index,tag:node.tagName.toLowerCase(),classes:[...node.classList],inline:node.getAttribute('style')||'',text:node.children.length?'':node.textContent,properties:Object.fromEntries(properties.map(property=>[property,style.getPropertyValue(property)])),pseudos};
  });
  const images=[...shell.querySelectorAll('img')].map(image=>({url:image.currentSrc||image.src,alt:image.alt,role:image.classList.contains('af-section-background')?'background':'content',width:image.naturalWidth,height:image.naturalHeight,classes:[...image.classList]}));
  const clone=root.cloneNode(true);
  clone.querySelectorAll('.af-deck__controls,.af-document--presentation>p,dialog,h1.af-sr-only').forEach(node=>node.remove());
  return {rules,computed,images,markup:clone.outerHTML,document:window.demoController.getDocument(),rootVariables:Object.fromEntries([...getComputedStyle(shell)].filter(name=>name.startsWith('--af-')).map(name=>[name,getComputedStyle(shell).getPropertyValue(name).trim()]))};
 });
}

export async function exportCompositionResources(destination,entries,snapshots){
 const fonts=['alabuga-regular.woff2','alabuga-medium.woff2','alabuga-heading-bold.woff2','alabuga-heading-extra-bold.woff2'];
 await mkdir(resolve(destination,'shared/fonts'),{recursive:true});
 const fontRecords=[];
 for(const file of fonts){
  await copyFile(resolve('src/fonts',file),resolve(destination,'shared/fonts',file));
  fontRecords.push({source:`src/fonts/${file}`,file:`shared/fonts/${file}`,sha256:sha256(await readFile(resolve('src/fonts',file)))});
 }
 const fontCss=[['Alabuga Sans',400,fonts[0]],['Alabuga Sans',500,fonts[1]],['Alabuga Heading',700,fonts[2]],['Alabuga Heading',800,fonts[3]]].map(([family,weight,file])=>`@font-face{font-family:'${family}';font-weight:${weight};font-display:swap;src:url('../../shared/fonts/${file}') format('woff2')}`).join('\n');
 const brandManifest=JSON.parse(await readFile('assets/brand/manifest.json','utf8'));
 const summaries=[];
 for(const id of [...new Set(entries.map(entry=>entry.id))]){
  const matching=entries.filter(entry=>entry.id===id),folder=resolve(destination,'templates',id);
  await mkdir(resolve(folder,'images'),{recursive:true});
  const views=matching.map(entry=>({entry,snapshot:snapshots.get(entry.file)}));
  const imageRecords=[],imageMap=new Map();
  for(const {entry,snapshot}of views)for(const image of snapshot.images){
   const url=new URL(image.url),source=decodeURIComponent(url.pathname).replace(/^\//,'');
   if(!source.startsWith('assets/')||source.includes('..'))throw new Error('Unexpected image source: '+source);
   let record=imageRecords.find(record=>record.source===source);
   if(!record){
    const file='images/'+basename(source),bytes=await readFile(resolve(source));
    await writeFile(resolve(folder,file),bytes);
    const brand=brandManifest.assets.find(asset=>asset.url?.replace(/^\.\.\//,'')===source);
    record={source,file,name:brand?.name||image.alt,width:image.width,height:image.height,sha256:sha256(bytes),provenance:brand?{source:brand.source,sourceFiles:brand.sourceFiles,slides:brand.slides}:null,uses:[]};
    imageRecords.push(record);
   }
   record.uses.push({view:entry.view,role:image.role,alt:image.alt});
   imageMap.set(image.url,record.file);
  }
  const ruleMap=new Map();
  for(const {snapshot}of views)for(const rule of snapshot.rules)ruleMap.set(rule.key.join('.'),rule);
  const rules=[...ruleMap.values()].sort((a,b)=>{for(let i=0;i<Math.max(a.key.length,b.key.length);i++){const delta=(a.key[i]??-1)-(b.key[i]??-1);if(delta)return delta}return 0});
  // Retain variables actually referenced by matching declarations or inline layout,
  // following var() dependencies through the original cascade.
  const required=new Set(),references=value=>[...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(match=>match[1]);
  for(const rule of rules)for(const declaration of rule.declarations)if(!declaration.name.startsWith('--'))references(declaration.value).forEach(name=>required.add(name));
  for(const {snapshot}of views)references(snapshot.markup).forEach(name=>required.add(name));
  let changed=true;
  while(changed){changed=false;for(const rule of rules)for(const declaration of rule.declarations)if(required.has(declaration.name))for(const name of references(declaration.value))if(!required.has(name)){required.add(name);changed=true}}
  const css=rules.map(rule=>{
   const declarations=rule.declarations.filter(declaration=>!declaration.name.startsWith('--')||required.has(declaration.name));
   if(!declarations.length)return '';
   let text=`${rule.selector} {\n${declarations.map(declaration=>`  ${declaration.name}: ${declaration.value}${declaration.priority?' !'+declaration.priority:''};`).join('\n')}\n}`;
   for(const condition of [...rule.conditions].reverse())text=`${condition} {\n${text}\n}`;
   return text;
  }).filter(Boolean).join('\n\n');
  await writeFile(resolve(folder,'styles.css'),`/* ${id}: matched rules across desktop, mobile and presentation.\n   Original cascade order, @media and @container conditions are preserved.\n   Per-element grid positions and runtime variables remain inline in previews. */\n${fontCss}\n\n${css}\n`);
  const viewRecords=[];
  for(const {entry,snapshot}of views){
   const dataFile=`styles-${entry.view}.json`,previewFile=`preview-${entry.view}.html`,documentFile=`document-${entry.kind}.json`;
   await writeFile(resolve(folder,dataFile),JSON.stringify({view:entry.view,viewport:{width:entry.width},appearance:snapshot.document.pages[0].appearance,grid:snapshot.document.pages[0].grid,widgets:snapshot.document.pages[0].widgets.map(widget=>({id:widget.id,type:widget.type,position:widget.position,surface:widget.surface})),variables:Object.fromEntries([...required].sort().map(name=>[name,snapshot.rootVariables[name]??''])),elements:snapshot.computed},null,2)+'\n');
   await writeFile(resolve(folder,documentFile),JSON.stringify(snapshot.document,null,2)+'\n');
   let markup=snapshot.markup;
   for(const [url,file]of imageMap)markup=markup.replaceAll(url,file);
   const preview=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(entry.title)}</title><link rel="stylesheet" href="styles.css"><style>body{margin:0}#document{width:100%}</style></head><body><main id="document">${markup}</main></body></html>`;
   await writeFile(resolve(folder,previewFile),preview);
   viewRecords.push({view:entry.view,screenshot:'../../'+entry.file,styles:dataFile,preview:previewFile,document:documentFile});
  }
  const cssHash=sha256(await readFile(resolve(folder,'styles.css')));
  const manifest={id,title:matching[0].title,description:matching[0].description,appearance:views[0].snapshot.document.pages[0].appearance,images:imageRecords,css:{file:'styles.css',sha256:cssHash,matchedRules:rules.length,variables:[...required].sort(),sources:['dist/alabuga.css','src/styles.css','src/compositions.css','src/tokens.css']},fonts:fontRecords,views:viewRecords,notes:['CSS содержит правила, соответствующие DOM шаблона, включая перекрываемые правила каскада. Условия @media и @container сохранены; фактические значения для каждого вида записаны отдельно.','Декор orbit и затемнение фона создаются CSS-псевдоэлементами; это не изображения.','HTML — статический снимок шаблона; интерактивные действия требуют JS Framework.']};
  await writeFile(resolve(folder,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await writeFile(resolve(folder,'README.md'),`# ${matching[0].title} (${id})\n\n${matching[0].description}\n\n## Изображения\n\n${imageRecords.length?imageRecords.map(image=>`- [${image.name}](${image.file}) — ${image.width} × ${image.height}; источник: ${image.source}.`).join('\n'):'Отдельных файлов изображений нет.'}\n\nТема: ${manifest.appearance.theme}. Декор: ${manifest.appearance.decoration}; формируется CSS, если включён.\n\n## Стили\n\n- [styles.css](styles.css) — применимые правила CSS с адаптивными условиями и исходным порядком каскада.\n- styles-*.json — вычисленные браузером цвета, шрифты, размеры, отступы, сетка, псевдоэлементы и переменные для каждого вида.\n- document-*.json — исходное содержимое и расположение виджетов.\n- preview-*.html — автономный статический шаблон с локальными изображениями и шрифтами.\n- [manifest.json](manifest.json) — связи файлов, происхождение и SHA-256.\n\n${viewRecords.map(view=>`- ${view.view}: [шаблон](${view.preview}), [скриншот](${view.screenshot}), [стили](${view.styles}).`).join('\n')}\n`);
  const viewHtml=views.map(({entry,snapshot})=>{
   const view=viewRecords.find(view=>view.view===entry.view);
   const examples=snapshot.computed.filter(node=>node.index===0||node.classes.some(name=>['af-title','af-feature__title','af-feature__text','af-metric__value','af-quote__text','af-btn','af-image'].includes(name))||node.tag==='p');
   return `<section><h2>${escape(entry.view)}</h2><p><a href="${view.preview}">Открыть шаблон</a> · <a href="${view.styles}">Вычисленные стили JSON</a> · <a href="${view.document}">Документ JSON</a></p><a href="${view.screenshot}"><img class="screenshot" src="${view.screenshot}" alt="${escape(entry.title)}"></a><div class="table"><table><thead><tr><th>Элемент</th><th>Шрифт</th><th>Цвет / фон</th><th>Отступы</th></tr></thead><tbody>${examples.map(node=>`<tr><td>${escape(node.classes.join(' ')||node.tag)}</td><td>${escape(node.properties['font-family'])}<br>${escape(node.properties['font-size'])} / ${escape(node.properties['line-height'])}, ${escape(node.properties['font-weight'])}</td><td>${escape(node.properties.color)}<br>${escape(node.properties['background-color'])}</td><td>${['top','right','bottom','left'].map(side=>escape(node.properties['padding-'+side])).join(' ')}</td></tr>`).join('')}</tbody></table></div></section>`;
  }).join('');
  await writeFile(resolve(folder,'index.html'),`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(matching[0].title)} — изображения и стили</title><style>body{margin:32px auto;padding:0 24px;max-width:1200px;font:16px/1.5 system-ui;color:#16243c;background:#f3f6fa}a{color:#0956bb}.images{display:flex;flex-wrap:wrap;gap:20px}.asset{background:white;padding:20px;border:1px solid #d5dfea;max-width:380px}.asset img{width:100%;height:180px;object-fit:contain;background:#e3e9f2}.screenshot{max-width:100%;max-height:650px;object-fit:contain;display:block;background:white;border:1px solid #d5dfea}.table{overflow:auto}table{border-collapse:collapse;background:white;margin-top:20px;font-size:14px}td,th{padding:10px;text-align:left;border:1px solid #d5dfea}section{margin-top:40px}code{overflow-wrap:anywhere}</style></head><body><a href="../../index.html">← Все композиции</a><h1>${escape(matching[0].title)}</h1><p>${escape(matching[0].description)} · <code>${id}</code></p><h2>Используемые изображения</h2><div class="images">${imageRecords.length?imageRecords.map(image=>`<div class="asset"><a href="${image.file}"><img src="${image.file}" alt="${escape(image.name)}"><strong>${escape(image.name)}</strong></a><p>${image.width} × ${image.height} px</p><p><code>${escape(image.source)}</code></p><p>${[...new Set(image.uses.map(use=>use.role==='background'?'Фоновое изображение':'Изображение в содержимом'))].join(', ')}</p></div>`).join(''):'<p>Файлы изображений не используются.</p>'}</div><p>Тема: <strong>${escape(manifest.appearance.theme)}</strong>. Декор: <strong>${escape(manifest.appearance.decoration)}</strong>. Декор orbit и затемнение фона формируются CSS-псевдоэлементами.</p><h2>Файлы стилей</h2><p><a href="styles.css">CSS шаблона</a> · <a href="manifest.json">Состав и происхождение файлов</a> · <a href="README.md">Описание</a></p><p>CSS сохраняет каскад, адаптивные условия и зависимости от переменных. Ниже указаны фактические значения из браузера для каждого варианта. HTML-примеры работают без сети; для интерактивных действий нужен JS Framework.</p>${viewHtml}</body></html>`);
  summaries.push({id,title:matching[0].title,folder:`templates/${id}`,images:imageRecords.length,views:viewRecords,cssSha256:cssHash});
 }
 await writeFile(resolve(destination,'resources.json'),JSON.stringify({generatedAt:new Date().toISOString(),templates:summaries,fonts:fontRecords},null,2)+'\n');
 return summaries;
}
