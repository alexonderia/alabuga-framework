import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {marked} from 'marked';
import {docsExample} from './docs-example';
export const topics=['start','author','architecture','development','reference','operations','data','quality'];
export async function buildDocs(output='dist/docs/docs'){
 await mkdir(`${output}/assets`,{recursive:true});
 for(const name of ['alabuga.css','alabuga.iife.js'])await cp('packages/framework/dist/'+name,`${output}/assets/${name}`);
 for(const lang of ['ru','en']){
  const other=lang==='ru'?'en':'ru',sources=await Promise.all(topics.map(async id=>({id,text:await readFile(`apps/docs/content/${lang}/${id}.md`,'utf8')})));
  await mkdir(`${output}/${lang}`,{recursive:true});
  for(const source of sources){const {id}=source,text=source.text.replaceAll('../../../../index.html','../../index.html').replace(/\]\(([a-z-]+)\.md\)/g,']($1.html)');const title=text.split('\n')[0].replace(/^# /,'');const nav=sources.map(s=>`<a ${s.id===id?'aria-current="page"':''} href="${s.id}.html">${s.text.split('\n')[0].replace(/^# /,'')}</a>`).join('');
   const html=`<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Alabuga Framework</title><style>body{margin:0;color:#000d3c;background:#f4f7fb;font:17px/1.65 system-ui}header{padding:20px 32px;background:#000d3c;color:white;display:flex;gap:24px;flex-wrap:wrap}header a{color:white}.layout{display:grid;grid-template-columns:250px minmax(0,900px);max-width:1200px;margin:auto}nav{padding:24px}nav a{display:block;padding:8px;color:#0956bb}nav a[aria-current]{background:#e0eaff;border-radius:8px;font-weight:bold}main{padding:32px;background:white;min-width:0}h1{font-size:36px;line-height:1.2}h2{margin-top:36px}a{color:#0956bb}pre{background:#edf3ff;padding:16px;overflow:auto}code{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;display:block;overflow:auto}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}img{max-width:100%}@media(max-width:800px){.layout{display:block}nav{display:flex;overflow:auto;gap:12px}nav a{min-width:140px}main{padding:20px}header{padding:20px}}</style><header><strong>Alabuga Framework · 0.6.0</strong><a href="/demo/">Demo</a><a href="/builder/">Editor</a><a href="../${other}/${id}.html" lang="${other}">${other==='en'?'English':'Русский'}</a></header><div class="layout"><nav aria-label="${lang==='ru'?'Документация':'Documentation'}">${nav}</nav><main>${await marked.parse(text)}</main></div></html>`;
   await writeFile(`${output}/${lang}/${id}.html`,id==='reference'?html.replace('</main>',docsExample(lang)+'</main>'):html);
  }
 }
 await writeFile(`${output}/index.html`,'<!doctype html><html lang="ru"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=ru/start.html"><a href="ru/start.html">Русский</a> · <a href="en/start.html">English</a></html>');
 console.log('Documentation: 8 topics × RU/EN');
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-docs.ts'))await buildDocs();
