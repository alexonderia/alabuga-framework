import {mkdir,cp,rm,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {panelExample,presentationExample} from '@alabuga/framework/examples';
import {showcase} from '@alabuga/framework/compositions';
import {buildWorkspace} from './build-workspace';
for(const name of ['editor','docs','ai','ai-server'])await buildWorkspace(name);
// Only these fixed build directories may be replaced; never follow a caller-supplied path.
for(const name of ['site','standalone']){const target=resolve('dist',name);if(dirname(target)!==resolve('dist'))throw new Error('Unsafe build directory');await rm(target,{recursive:true,force:true})}
await mkdir('dist/site',{recursive:true});
await cp('dist/editor','dist/site',{recursive:true});await cp('dist/docs','dist/site',{recursive:true});
await mkdir('dist/standalone',{recursive:true});await cp('packages/framework/dist','dist/standalone',{recursive:true});
await cp('public/assets','dist/standalone/assets',{recursive:true});
for(const [name,doc] of [['index',panelExample],['slides',presentationExample()],['landing',showcase('page')],['presentation',showcase('presentation')]] as const){
 const json=JSON.stringify(doc).replaceAll('../assets/','assets/').replace(/</g,'\\u003c');
 await writeFile(`dist/standalone/${name}.html`,`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${doc.title}</title><link rel="stylesheet" href="alabuga.css"><style>body{margin:${name==='landing'||name==='presentation'?0:24}px}@media print{body{margin:0}}</style><main id="document"></main><script src="alabuga.iife.js"></script><script>window.demoController=Alabuga.renderDocument(document.getElementById('document'),${json});</script></html>`);
}
