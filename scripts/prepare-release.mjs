import {readFile,writeFile,mkdir,cp,access,readdir} from 'node:fs/promises';
import {resolve,relative,basename,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {marked} from 'marked';

// Assemble release evidence, preserving a verified publication receipt when present.
// This script never publishes or creates tags.
const root=process.cwd(),pkg=JSON.parse(await readFile('package.json','utf8'));
assert.match(pkg.version,/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/);
const version=pkg.version,folder=`artifacts/release-${version}`,output=resolve(folder);
const inside=path=>{const target=resolve(path),part=relative(root,target);assert.ok(part&&!part.startsWith('..')&&!isAbsolute(part),'Release path outside workspace');return target;};
inside(output);
const lock=JSON.parse(await readFile('package-lock.json','utf8'));assert.equal(lock.version,version);assert.equal(lock.packages[''].version,version);
const pack=JSON.parse(await readFile('artifacts/package/report.json','utf8'));
assert.equal(pack.passed,true);assert.equal(pack.name,pkg.name);assert.equal(pack.version,version);
const archive=await readFile(inside(pack.archive));
assert.equal(pack.integrity,'sha512-'+createHash('sha512').update(archive).digest('base64'));
const consumers=JSON.parse(await readFile('artifacts/package/consumer.json','utf8'));
assert.equal(consumers.passed,true);assert.equal(consumers.integrity,pack.integrity);
for(const name of ['alabuga.css','alabuga.iife.js','esm/index.js']){
  const installed=await readFile(resolve(consumers.directory,'node_modules/@alabuga/framework/dist',name));
  const built=await readFile(resolve('dist',name));
  assert.equal(createHash('sha256').update(installed).digest('hex'),createHash('sha256').update(built).digest('hex'),`Installed archive differs from tested build: ${name}`);
}
let browserReport=process.env.AF_RELEASE_BROWSER_REPORT||`${folder}/browser-final.json`;
try{await access(browserReport);}catch{if(process.env.AF_RELEASE_BROWSER_REPORT)throw Error('Missing selected browser report');browserReport='artifacts/browser-final.json';}
const browsers=JSON.parse(await readFile(browserReport,'utf8'));
assert.equal(browsers.config.metadata.frameworkVersion,version,'Browser report belongs to another version');
assert.equal(browsers.stats.unexpected,0,'Browser failures remain');assert.equal(browsers.stats.flaky,0,'Flaky results require review');
assert.ok(browsers.stats.expected>0,'Empty browser report');
for(const engine of ['chromium','firefox','webkit'])assert.ok(browsers.config.projects.some(p=>p.name===engine),'Missing browser engine');
const executed=[];
function collect(suites){for(const suite of suites){for(const spec of suite.specs??[])for(const test of spec.tests)executed.push({file:basename(spec.file),engine:test.projectName,passed:test.results.some(r=>r.status==='passed')});collect(suite.suites??[]);}}
collect(browsers.suites);
const specFiles=(await readdir('tests')).filter(name=>name.endsWith('.spec.ts'));
for(const engine of ['chromium','firefox','webkit']){
  assert.ok(executed.some(t=>t.engine===engine&&t.passed),'No passing tests for '+engine);
  for(const file of specFiles)assert.ok(executed.some(t=>t.engine===engine&&t.file===file),`Missing test file ${file} in ${engine}`);
}
const npm=process.env.npm_execpath;assert.ok(npm,'Run npm run prepare:release');
const checks=[];
for(const name of ['check:design','check:docs','test']){
  execFileSync(process.execPath,[npm,'run',name],{stdio:'inherit',windowsHide:true});checks.push({command:`npm run ${name}`,passed:true});
}
await mkdir(output,{recursive:true});
const archiveName=basename(pack.archive);await writeFile(resolve(output,archiveName),archive);
await cp('dist/standalone',resolve(output,'standalone'),{recursive:true});
const standaloneCss=await readFile(resolve(output,'standalone/alabuga.css'));
assert.deepEqual(standaloneCss,await readFile('dist/alabuga.css'),'Standalone copy is stale');
const library=await import('../dist/esm/index.js');assert.equal(library.VERSION,version,'Built ESM version differs');
const sourceNotes=await readFile(`docs/releases/${version}.md`,'utf8');await writeFile(resolve(output,'release-notes.md'),sourceNotes);
let visual=null;
try{
  const proof=JSON.parse(await readFile('artifacts/acceptance/report.json','utf8'));
  if(proof.version===version){await cp('artifacts/acceptance',resolve(output,'visual'),{recursive:true});visual={slides:proof.slides,report:'visual/visual-review.html',pdf:'visual/presentation.pdf'};}
}catch{/* Visual artifacts are separate from passing browser evidence. */}
let accessibility=null;
try{const proof=JSON.parse(await readFile(resolve(output,'accessibility/report.json'),'utf8'));if(proof.version===version)accessibility={status:proof.status,scenarios:proof.scenarios.length,report:'accessibility/report.json'};}catch{/* No manual screen-reader pass is inferred from missing snapshots. */}
const nodeVersion=(await readFile('.node-version','utf8')).trim(),npmVersion=pkg.packageManager.split('@').at(-1);
const canonical=pack.toolchain.platform==='linux'&&pack.toolchain.node==='v'+nodeVersion&&pack.toolchain.npm===npmVersion;
let publication=null;
if(await access(resolve(output,'publication.json')).then(()=>true,()=>false)){
  publication=JSON.parse(await readFile(resolve(output,'publication.json'),'utf8'));
  assert.equal(publication.name,pkg.name);assert.equal(publication.version,version);
  assert.equal(publication.integrity,pack.integrity,'Publication receipt belongs to another archive');
  assert.equal(publication.published,true);assert.equal(publication.verification.freshRegistryInstall,true);
  assert.equal(publication.verification.lockfileIntegrity,true);
}
const manualScreenReader=publication?.manualScreenReader??{status:'not-performed',performed:false};
const files=[];
for(const name of [archiveName,'standalone/alabuga.css','standalone/alabuga.iife.js','standalone/select.html','release-notes.md']){
  const data=await readFile(resolve(output,name));files.push({path:name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
const report={version,name:pkg.name,status:publication?.status??'prepared-candidate',published:!!publication,generatedAt:new Date().toISOString(),checks,
  browser:{passed:browsers.stats.expected,skipped:browsers.stats.skipped,failed:0,flaky:0,engines:['chromium','firefox','webkit'],sourcePalette:'Exact documented source-color exceptions are recorded by tests; readable variants are audited without exceptions.'},
  package:{files:pack.files,integrity:pack.integrity,toolchain:pack.toolchain,canonical},
  consumers:{node:consumers.node,typescript:consumers.typescript,reactStrictMode:consumers.reactStrictMode,integrity:consumers.integrity,testedBuildMatchesArchive:true},
  visual,accessibility,files,manualScreenReader:{...manualScreenReader,checklist:'release-notes.md'},
  publication:publication?{ready:true,registryConfigured:true,registry:publication.registry,tag:publication.tag,receipt:'publication.json',pending:[]}: {ready:false,registryConfigured:pkg.publishConfig.registry!=='https://npm.example.org/',pending:['Manual screen-reader acceptance or explicit deferral','Configured registry endpoint and publication authorization',...canonical?[]:['Canonical Linux/Node/npm build']]}};
await writeFile(resolve(output,'acceptance.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(resolve(output,'SHA256SUMS'),files.map(f=>`${f.sha256}  ${f.path}`).join('\n')+'\n');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const publicationText=publication?`Опубликовано в реестре <code>${escape(publication.registry)}</code>; тег <code>${escape(publication.tag)}</code>. Установка из реестра и integrity проверены. <a href="publication.json">Подтверждение публикации</a>.`:'Локальный кандидат подготовлен. Публикация не выполнялась.';
const screenReaderText=manualScreenReader.status==='deferred-by-user'?'Отложена по решению пользователя; проверка не выполнялась. Сценарии сохранены ниже.':'Не выполнена; сценарии перечислены ниже';
const html=`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alabuga Framework ${escape(version)} — приёмка</title><style>body{font:16px/1.55 system-ui;color:#161616;background:#f6f8fb;margin:0}main{max-width:960px;margin:32px auto;padding:32px;background:white;border:1px solid #dce3ec;border-radius:16px}h1{line-height:1.15}a{color:#0956bb}li{margin:8px 0}table{border-collapse:collapse;width:100%;display:block;overflow:auto}th,td{text-align:left;padding:12px;border-bottom:1px solid #dce3ec;vertical-align:top}code{overflow-wrap:anywhere}pre{overflow:auto}details{margin-top:24px}@media(max-width:640px){main{margin:12px;padding:16px}table{font-size:14px}}</style><main><p><a href="../../index.html#changes/release-1-1-0">Справочник</a></p><h1>Alabuga Framework ${escape(version)}</h1><p>${publicationText}</p><h2>Файлы</h2><ul><li><a href="${escape(archiveName)}">npm-пакет ${escape(version)}</a></li><li><a href="standalone/alabuga.iife.js" download>Готовый JavaScript</a> · <a href="standalone/alabuga.css" download>Готовый CSS</a></li><li><a href="standalone/select.html">Автономная форма без сборщика</a></li><li><a href="acceptance.json">Отчёт JSON</a> · <a href="SHA256SUMS">SHA-256</a></li>${visual?'<li><a href="visual/visual-review.html">Снимки страниц и 11 слайдов</a> · <a href="visual/presentation.pdf">PDF</a></li>':''}</ul><h2>Проверки</h2><table><tr><th>Область</th><th>Результат</th></tr><tr><td>Браузеры</td><td>${report.browser.passed} пройдено, ${report.browser.skipped} штатно пропущено; Chromium, Firefox, WebKit</td></tr><tr><td>Пакет</td><td>${pack.files} файлов; exports и integrity проверены</td></tr><tr><td>Потребители</td><td>Node, TypeScript, React StrictMode</td></tr><tr><td>Каноническая сборка</td><td>${canonical?'Linux · '+escape(pack.toolchain.node)+' · npm '+escape(pack.toolchain.npm):'Требует подтверждения закреплённого Linux-окружения'}</td></tr><tr><td>Ручная проверка со скринридером</td><td>${escape(screenReaderText)}</td></tr></table><p>Для исходной палитры Figma документированы ограничения контраста. Варианты --accessible, документы и служебные примеры проверяются без этих исключений.</p><details><summary>Изменения, ограничения и ручная приёмка</summary>${await marked.parse(sourceNotes)}</details><p><a href="release-notes.md">Скачать описание и сценарии приёмки</a></p></main></html>`;
await writeFile(resolve(output,'index.html'),html);
const preview=inside(`dist/docs/releases/${version}`);await mkdir(preview,{recursive:true});
for(const name of [archiveName,'standalone','release-notes.md','acceptance.json','SHA256SUMS','index.html',...publication?['publication.json']:[],...visual?['visual']:[],...accessibility?['accessibility']:[]])await cp(resolve(output,name),resolve(preview,name),{recursive:true});
console.log(`Prepared ${pkg.name}@${version}: ${folder}/index.html; canonical=${canonical}; ${publication?'published to '+publication.registry:'not published'}.`);
