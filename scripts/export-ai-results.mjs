import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const directory=resolve(process.argv[2]||'artifacts/demo/improvements-current');
const browser=await chromium.launch();
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4175/demo/');
 for(const [index,name] of [[19,'website'],[20,'presentation']]){
  const result=JSON.parse(await readFile(resolve(directory,`case-${index}.json`),'utf8'));
  if(result.draft.status.stage!=='ready')throw new Error(`Case ${index} is not technically ready; no export created.`);
  const exported=await page.evaluate(async doc=>{const {exportHTML}=await import('/apps/editor/src/export.ts'),{portableProject}=await import('/apps/editor/src/storage.ts');return {html:await exportHTML(doc),project:await portableProject(doc)}},result.document);
  await writeFile(resolve(directory,name+'.html'),exported.html);await writeFile(resolve(directory,name+'.project.json'),JSON.stringify(exported.project,null,2));
  const offline=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await offline.route(/^https?:\/\//,r=>r.abort());await offline.goto(pathToFileURL(resolve(directory,name+'.html')).href);await offline.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
  await offline.screenshot({path:resolve(directory,name+'-export.png'),fullPage:name==='website'});
  if(name==='presentation')await offline.pdf({path:resolve(directory,name+'.pdf'),printBackground:true,preferCSSPageSize:true});
  await offline.close();console.log('Exported real, unedited AI result:',name);
 }
}finally{await browser.close()}
