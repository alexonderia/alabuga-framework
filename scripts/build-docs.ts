import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {marked} from 'marked';
import {loadEnv} from 'vite';
import {docsExample} from './docs-example';
const env={...loadEnv('production',process.cwd(),''),...process.env};
const constructorOrigin=new URL(env.CONSTRUCTOR_URL||env.VITE_CONSTRUCTOR_URL||'http://127.0.0.1:4176').origin;
const packageVersion=JSON.parse(await readFile('package.json','utf8')).version;
export const topics=['start','author','brand','architecture','development','reference','operations','data','quality'];
export async function buildDocs(output='dist/docs/docs'){
 await cp('assets','dist/docs/assets',{recursive:true});
 await mkdir(`${output}/assets`,{recursive:true});
 for(const name of ['alabuga.css','alabuga.iife.js'])await cp('dist/'+name,`${output}/assets/${name}`);
 await cp('docs/app/site.css',`${output}/assets/site.css`);
 const manifest=JSON.parse(await readFile('assets/brand/manifest.json','utf8'));
 const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const gallery='<div class="docs-brand-gallery">'+manifest.assets.filter((a:any)=>['background','logo'].includes(a.category)&&a.thumbnail).map((a:any)=>`<figure><img loading="lazy" style="max-width:240px;max-height:160px" src="${escape(a.thumbnail.replace(/^\.\.\//,'/'))}" alt="${escape(a.name)}"><figcaption>${escape(a.name)}</figcaption></figure>`).join('')+'</div>';
 for(const lang of ['ru','en']){
  const ru=lang==='ru';
  const labels=ru?{docs:'Руководства',reference:'Справочник',editor:'Конструктор',toc:'НА ЭТОЙ СТРАНИЦЕ',skip:'К содержимому',footer:'Общие правила. Свобода композиции.'}:{docs:'Guides',reference:'Reference',editor:'Constructor',toc:'ON THIS PAGE',skip:'Skip to content',footer:'Shared rules. Freedom to compose.'};
  const other=lang==='ru'?'en':'ru',sources=await Promise.all(topics.map(async id=>({id,text:await readFile(`docs/content/${lang}/${id}.md`,'utf8')})));
  const menuGroups=[
   {title:ru?'Установка и компоненты':'Setup and components',topics:['start','author','brand']},
   {title:ru?'API и форматы документов':'API and document formats',topics:['reference','data']},
   {title:ru?'Разработка и выпуск':'Development and releases',topics:['architecture','development','quality','operations']},
  ];
  const menuTitles:Record<string,string>=ru?
   {start:'Установка и подключение',author:'Компоненты и композиции',brand:'Фирменные материалы',reference:'API и DOM-контракт',data:'Форматы и экспорт',architecture:'Устройство библиотеки',development:'Локальная разработка',quality:'Проверки и приёмка',operations:'Публикация и эксплуатация'}:
   {start:'Install and connect',author:'Components and compositions',brand:'Brand assets',reference:'API and DOM contract',data:'Formats and export',architecture:'Library architecture',development:'Local development',quality:'Testing and acceptance',operations:'Publishing and operations'};
  await mkdir(`${output}/${lang}`,{recursive:true});
  for(const source of sources){const {id}=source,text=source.text.replaceAll('{{CONSTRUCTOR_URL}}',constructorOrigin).replace(/\]\(([a-z-]+)\.md\)/g,']($1.html)');const title=text.split('\n')[0].replace(/^# /,'').trim();
   const nav=menuGroups.map((group,index)=>`<section class="nav-section" aria-labelledby="nav-group-${index}"><h2 class="af-label af-label--sm nav-group" id="nav-group-${index}">${group.title}</h2><div class="nav-items">${group.topics.map(topic=>`<a class="af-btn${topic===id?'':' af-btn--clear'} nav-link" ${topic===id?'aria-current="page"':''} href="${topic}.html">${menuTitles[topic]}</a>`).join('')}</div></section>`).join('');
   const headings:{id:string,title:string}[]=[];
   const prose=(await marked.parse(text.split('\n').slice(1).join('\n'))).replace(/<pre>/g,'<pre tabindex="0">').replace(/<table>/g,'<table tabindex="0">').replace(/<h2>([\s\S]*?)<\/h2>/g,(_,heading)=>{
    const headingId=`section-${headings.length+1}`;
    headings.push({id:headingId,title:heading});
    return `<h2 class="af-heading af-heading--3" id="${headingId}">${heading}</h2>`;
   });
   const toc=headings.map(h=>`<a class="af-link af-link--accessible" href="#${h.id}">${h.title}</a>`).join('');
   const extra=id==='reference'?docsExample(lang):id==='brand'?gallery:'';
   const html=`<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — Alabuga Framework</title><link rel="stylesheet" href="../assets/alabuga.css"><link rel="stylesheet" href="../assets/site.css"></head>
<body class="af docs docs--guide"><a class="skip-link" href="#content">${labels.skip}</a>
<header class="site-header"><a class="wordmark" href="../../index.html"><span class="brand-mark" aria-hidden="true">A</span><span>alabuga<span class="wordmark-sub">framework</span></span></a><span class="header-label af-label af-label--sm">${labels.docs}</span><nav class="header-nav" aria-label="${ru?'Верхняя навигация':'Main navigation'}"><a class="af-link af-link--accessible" href="../../index.html">${labels.reference}</a><a class="af-btn af-btn--secondary af-btn--sm" href="${constructorOrigin}/builder/">${labels.editor} ↗</a><a class="af-link af-link--accessible" href="../${other}/${id}.html" lang="${other}" hreflang="${other}">${other==='en'?'English':'Русский'}</a><span class="version af-chip af-chip--info af-chip--accessible">v${packageVersion}</span></nav></header>
<aside class="sidebar"><nav id="navigation" aria-label="${ru?'Разделы руководства':'Guide topics'}">${nav}</nav></aside>
<main id="content" class="content" tabindex="-1"><header class="page-header"><p class="af-eyebrow breadcrumb">ALABUGA FRAMEWORK / ${labels.docs}</p><h1 class="af-display page-title">${escape(title)}</h1></header><article class="guide-prose">${prose}</article>${extra}<footer class="page-footer"><span>Alabuga Framework · ${packageVersion}</span><span>${labels.footer}</span></footer></main>
<aside class="toc" aria-label="${ru?'На этой странице':'On this page'}"><span>${labels.toc}</span><nav>${toc}</nav></aside></body></html>`;
   await writeFile(`${output}/${lang}/${id}.html`,html);
  }
 }
 await writeFile(`${output}/index.html`,'<!doctype html><html lang="ru"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=ru/start.html"><a href="ru/start.html">Русский</a> · <a href="en/start.html">English</a></html>');
 console.log(`Framework documentation: ${topics.length} topics × RU/EN`);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-docs.ts'))await buildDocs();
