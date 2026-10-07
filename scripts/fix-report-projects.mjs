import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const source=JSON.parse(await readFile('artifacts/slide-fit/fixtures.json','utf8'));
const presentation={schemaVersion:3,kind:'presentation',title:'Alabuga — 24 композиции: после автооформления',pages:source.after};
const site=structuredClone(presentation);site.kind='page';site.title='Alabuga — сайт: 24 фирменные композиции';
for(const section of site.pages){section.appearance.layout='flow';delete section.appearance.fitted;delete section.transition;for(const w of section.widgets){delete w.typography;if(w.type==='button'&&w.action.type==='slide')w.action.type='section'}}
const browser=await chromium.launch(),page=await browser.newPage();
try{await page.goto('http://127.0.0.1:4175/builder/');const bundles=await page.evaluate(async docs=>{const {portableProject}=await import('/apps/editor/src/storage.ts');return Promise.all(docs.map(d=>portableProject(d)))},[presentation,site]);
 const out='public/projects/slide-fit-report';await mkdir(out,{recursive:true});
 for(const [i,name]of ['presentation','site'].entries())await writeFile(`${out}/${name}.project.json`,JSON.stringify(bundles[i]));
 await writeFile(out+'/manifest.json',JSON.stringify({source:'artifacts/slide-fit/report.html',dataSource:'artifacts/slide-fit/fixtures.json',origin:'Programmatic slide fitting, not AI generation',projects:[{id:'alabuga-report-presentation-v1',file:'presentation.project.json',sectionCount:24},{id:'alabuga-report-site-v1',file:'site.project.json',sectionCount:24}]},null,2));
 console.log(JSON.stringify(bundles.map(b=>({title:b.document.title,pages:b.document.pages.length,assets:b.assets.length}))));
}finally{await browser.close()}
