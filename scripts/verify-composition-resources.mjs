import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow'}).format(new Date());
const root=resolve(process.argv[2]||`artifacts/composition-templates-${date}`);
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const browser=await chromium.launch({channel:process.env.AF_BROWSER_CHANNEL||'chrome'});
const results=[],errors=[];
try{
 const context=await browser.newContext({deviceScaleFactor:1,reducedMotion:'reduce',locale:'ru-RU',offline:true});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('requestfailed',request=>errors.push(request.url()+': '+request.failure()?.errorText));
 for(const entry of manifest.screenshots){
  const preview=resolve(root,'templates',entry.id,`preview-${entry.view}.html`);
  const config=manifest.configurations.find(config=>config.directory===entry.view);
  await page.setViewportSize({width:config.width,height:config.height});
  await page.goto(pathToFileURL(preview).href);
  await page.evaluate(async()=>{
   await document.fonts.ready;
   await Promise.all([...document.images].map(image=>image.decode()));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
  const png=await page.locator('[data-composition]').screenshot({animations:'disabled'});
  const expected=JSON.parse(await readFile(resolve(root,'templates',entry.id,`styles-${entry.view}.json`),'utf8'));
  const styleDifferences=await page.evaluate(expected=>{
   const shell=document.querySelector('[data-composition]'),nodes=[shell,...shell.querySelectorAll('*')],differences=[];
   if(nodes.length!==expected.length)differences.push({property:'element-count',expected:expected.length,actual:nodes.length});
   for(const [index,element]of expected.entries()){
    if(!nodes[index])continue;
    const style=getComputedStyle(nodes[index]);
    for(const [property,value]of Object.entries(element.properties))if(style.getPropertyValue(property)!==value)differences.push({index,property,expected:value,actual:style.getPropertyValue(property)});
    for(const [pseudo,values]of Object.entries(element.pseudos)){
     const pseudoStyle=getComputedStyle(nodes[index],pseudo);
     for(const [property,value]of Object.entries(values))if(pseudoStyle.getPropertyValue(property)!==value)differences.push({index,pseudo,property,expected:value,actual:pseudoStyle.getPropertyValue(property)});
    }
   }
   return differences;
  },expected.elements);
  results.push({file:entry.file,exactMatch:hash(png)===entry.sha256,width:png.readUInt32BE(16),height:png.readUInt32BE(20),stylesMatch:styleDifferences.length===0,styleDifferences});
 }
 for(const template of manifest.resources){
  const directory=resolve(root,template.folder);
  const record=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
  if(hash(await readFile(resolve(directory,record.css.file)))!==record.css.sha256)errors.push(`CSS checksum: ${template.id}`);
  for(const image of record.images)if(hash(await readFile(resolve(directory,image.file)))!==image.sha256)errors.push(`Image checksum: ${template.id}/${image.file}`);
  await page.goto(pathToFileURL(resolve(directory,'index.html')).href);
  const links=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(node=>node.href));
  for(const link of links)await readFile(new URL(link));
 }
 await page.goto(pathToFileURL(resolve(root,'index.html')).href);
 const links=await page.locator('a[href^="templates/"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
 const report={generatedAt:new Date().toISOString(),offline:true,checked:results.length,exactMatches:results.filter(result=>result.exactMatch).length,styleMatches:results.filter(result=>result.stylesMatch).length,templates:manifest.resources.length,resourceLinks:links.length,uniqueResourceLinks:new Set(links).size,errors,results};
 await writeFile(resolve(root,'resource-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,results:results.filter(result=>!result.exactMatch)},null,2));
 if(errors.length||report.styleMatches!==report.checked||report.uniqueResourceLinks!==manifest.resources.length)process.exitCode=1;
}finally{
 await browser.close();
}
