import {build} from 'esbuild';
import {readdir,readFile,writeFile,mkdir,rm,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
const pkg=JSON.parse(await readFile('package.json','utf8')),out=resolve('dist');
if(dirname(out)!==process.cwd())throw new Error('Unsafe output directory');
await rm(out,{recursive:true,force:true});await mkdir('dist/esm',{recursive:true});
const entries=(await readdir('src')).filter(n=>n.endsWith('.ts')).map(n=>'src/'+n);
await build({entryPoints:entries,outdir:'dist/esm',format:'esm',target:'es2022',supported:{'import-attributes':true},define:{__AF_VERSION__:JSON.stringify(pkg.version)}});
await build({entryPoints:['src/index.ts'],outfile:'dist/alabuga.iife.js',bundle:true,format:'iife',globalName:'Alabuga',target:'es2022',minify:true,define:{__AF_VERSION__:JSON.stringify(pkg.version)},plugins:[{name:'iife-resource-base',setup(b){b.onLoad({filter:/resource\.ts$/},async args=>({contents:(await readFile(args.path,'utf8')).replace("new URL('../assets/', import.meta.url).href","new URL('assets/', document.currentScript?.getAttribute('src') ? new URL(document.currentScript.getAttribute('src'), document.baseURI) : document.baseURI).href"),loader:'ts'}))}}]});
for(const name of ['styles','compositions','tokens'])await build({entryPoints:[`src/${name}.css`],outfile:`dist/${name}.css`,bundle:true,minify:true,loader:{'.woff2':'dataurl','.svg':'dataurl'}});
await writeFile('dist/alabuga.css',(await readFile('dist/styles.css','utf8'))+'\n'+await readFile('dist/compositions.css','utf8'));
await cp('assets','dist/assets',{recursive:true});await cp('src/fonts','dist/fonts',{recursive:true});
await cp('src/slide-backgrounds.json','dist/esm/slide-backgrounds.json');await cp('design/figma-tokens.json','dist/tokens.json');
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.build.json'],{stdio:'inherit',windowsHide:true});
console.log(`Built ${pkg.name}@${pkg.version}: ESM, IIFE, CSS, declarations and assets`);

await mkdir('dist/standalone',{recursive:true});
for(const name of ['alabuga.css','alabuga.iife.js'])await cp('dist/'+name,'dist/standalone/'+name);
await cp('assets','dist/standalone/assets',{recursive:true});
await writeFile('dist/standalone/select.html',(await readFile('demos/select.html','utf8')).replaceAll('"../dist/','"'));
const {panelExample,presentationExample}=await import('../dist/esm/examples.js');
const {showcase}=await import('../dist/esm/compositions.js');
for(const [name,doc]of [['index',panelExample],['slides',presentationExample()],['landing',showcase('page')],['presentation',showcase('presentation')]]){
 const json=JSON.stringify(doc).replaceAll('../assets/','assets/').replace(/</g,'\\u003c');
 await writeFile(`dist/standalone/${name}.html`,`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${doc.title}</title><link rel="stylesheet" href="alabuga.css"><style>body{margin:${name==='landing'||name==='presentation'?0:24}px}@media print{body{margin:0}}</style><main id="document"></main><script src="alabuga.iife.js"></script><script>window.demoController=Alabuga.renderDocument(document.getElementById('document'),${json});</script></html>`);
}
