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
 const manifest=JSON.parse(await readFile('assets/brand/manifest.json','utf8'));
 const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const gallery='<div class="docs-brand-gallery">'+manifest.assets.filter((a:any)=>['background','logo'].includes(a.category)&&a.thumbnail).map((a:any)=>`<figure><img loading="lazy" style="max-width:240px;max-height:160px" src="${escape(a.thumbnail.replace(/^\.\.\//,'/'))}" alt="${escape(a.name)}"><figcaption>${escape(a.name)}</figcaption></figure>`).join('')+'</div>';
 for(const lang of ['ru','en']){
  const other=lang==='ru'?'en':'ru',sources=await Promise.all(topics.map(async id=>({id,text:await readFile(`docs/content/${lang}/${id}.md`,'utf8')})));
  await mkdir(`${output}/${lang}`,{recursive:true});
  for(const source of sources){const {id}=source,text=source.text.replaceAll('{{CONSTRUCTOR_URL}}',constructorOrigin).replace(/\]\(([a-z-]+)\.md\)/g,']($1.html)');const title=text.split('\n')[0].replace(/^# /,'');const nav=sources.map(s=>`<a ${s.id===id?'aria-current="page"':''} href="${s.id}.html">${s.text.split('\n')[0].replace(/^# /,'')}</a>`).join('');
   const html=`<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Alabuga Framework</title><style>body{margin:0;color:#000d3c;background:#f4f7fb;font:17px/1.65 system-ui}header{padding:20px 32px;background:#000d3c;color:white;display:flex;gap:24px;flex-wrap:wrap}header a{color:white}.layout{display:grid;grid-template-columns:250px minmax(0,900px);max-width:1200px;margin:auto}nav{padding:24px}nav a{display:block;padding:8px;color:#0956bb}nav a[aria-current]{background:#e0eaff;border-radius:8px;font-weight:bold}main{padding:32px;background:white;min-width:0}h1{font-size:36px;line-height:1.2}h2{margin-top:36px}a{color:#0956bb}pre{background:#edf3ff;padding:16px;overflow:auto}code{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;display:block;overflow:auto}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}img{max-width:100%}@media(max-width:800px){.layout{display:block}nav{display:flex;overflow:auto;gap:12px}nav a{min-width:140px}main{padding:20px}header{padding:20px}}</style><header><strong>Alabuga Framework · ${packageVersion}</strong><a href="${constructorOrigin}/demo/">Demo</a><a href="${constructorOrigin}/builder/">Editor</a><a href="../${other}/${id}.html" lang="${other}">${other==='en'?'English':'Русский'}</a></header><div class="layout"><nav aria-label="${lang==='ru'?'Документация':'Documentation'}">${nav}</nav><main>${await marked.parse(text)}</main></div></html>`;
   await writeFile(`${output}/${lang}/${id}.html`,id==='reference'?html.replace('</main>',docsExample(lang)+'</main>'):id==='brand'?html.replace('</main>',gallery+'</main>'):html);
  }
 }
 await writeFile(`${output}/index.html`,'<!doctype html><html lang="ru"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=ru/start.html"><a href="ru/start.html">Русский</a> · <a href="en/start.html">English</a></html>');
 console.log(`Framework documentation: ${topics.length} topics × RU/EN`);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-docs.ts'))await buildDocs();
