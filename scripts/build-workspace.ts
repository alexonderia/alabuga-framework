import {build as viteBuild} from 'vite';
import {build as bundle} from 'esbuild';
import {mkdir,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
export async function buildWorkspace(name:string){
 if(name==='framework'){await viteBuild({mode:'library'});execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.build.json'],{stdio:'inherit',windowsHide:true});await mkdir('dist/library',{recursive:true});await cp('packages/framework/dist','dist/library',{recursive:true});return}
 if(name==='ai'){await bundle({entryPoints:['packages/ai/src/index.ts'],outdir:'packages/ai/dist',bundle:true,platform:'neutral',format:'esm',external:['zod']});return}
 if(name==='ai-server'){await bundle({entryPoints:['apps/ai-server/src/ai-server.ts','apps/ai-server/src/bootstrap.ts'],outdir:'apps/ai-server/dist',bundle:true,platform:'node',format:'esm'});return}
 if(name==='editor'||name==='docs'){
  await buildWorkspace('framework');await viteBuild({mode:name==='docs'?'docs':'editor'});
  await cp('public/assets',`dist/${name}/assets`,{recursive:true});
  if(name==='editor')await cp('public/projects','dist/editor/projects',{recursive:true});
  if(name==='docs'){const {buildDocs}=await import('./build-docs');await buildDocs('dist/docs/docs')}
  return;
 }
 throw new Error('Unknown workspace '+name);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-workspace.ts'))await buildWorkspace(process.argv[2]);
