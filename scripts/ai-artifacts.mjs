import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out='artifacts/ai';await mkdir(out,{recursive:true});
const dev=await createServer({server:{host:'127.0.0.1',port:4186,strictPort:true,hmr:false}});await dev.listen();
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});const exports=[];
try{
 for(const [number,name]of [[19,'landing'],[20,'presentation']]){
  const source=JSON.parse(await readFile(`${out}/examples/${name}-reviewed.json`,'utf8'));if(!source.document||source.draft.status.stage!=='ready'){exports.push({name,success:false,reason:'Generation did not pass validation'});continue}
  await page.goto('http://127.0.0.1:4186/builder/');
  const result=await page.evaluate(async doc=>{const {EditorModel}=await import('/apps/editor/src/model.ts');const {checkSection}=await import('/apps/editor/src/ai/quality.ts');const {exportHTML}=await import('/apps/editor/src/export.ts');const {portableProject}=await import('/apps/editor/src/storage.ts');const model=new EditorModel(doc);for(const p of model.document.pages){const issues=await checkSection(p,doc.kind);if(issues.length)throw new Error(issues.join('; '))}return {html:await exportHTML(model.document),project:await portableProject(model.document)}},source.document);
  await writeFile(`${out}/${name}.html`,result.html);await writeFile(`${out}/${name}.project.json`,JSON.stringify(result.project,null,2));
  const offline=await browser.newContext({viewport:{width:1440,height:1000}});await offline.route(/^https?:/,r=>r.abort());const p=await offline.newPage();await p.goto(pathToFileURL(resolve(`${out}/${name}.html`)).href);await p.evaluate(()=>document.fonts.ready);await p.emulateMedia({reducedMotion:'reduce'});
  const images=await p.evaluate(async()=>{await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));return Array.from(document.images).every(i=>i.naturalWidth>0)});
  if(name==='landing')for(const width of [1440,820,390]){await p.setViewportSize({width,height:1000});await p.screenshot({path:`${out}/landing-${width}.png`,fullPage:true})}
  else{await p.pdf({path:`${out}/presentation.pdf`,preferCSSPageSize:true,printBackground:true});await p.screenshot({path:`${out}/presentation-export.png`})}
  exports.push({name,success:images,offline:true,sections:source.document.pages.length,imagesLoaded:images,generated:new Date(source.draft.updated).toISOString(),source:`examples/${name}-reviewed.json`,editorialReview:source.editorialReview});await offline.close();
 }
 await writeFile(`${out}/exports.json`,JSON.stringify(exports,null,2));
}finally{await browser.close();await dev.close()}
