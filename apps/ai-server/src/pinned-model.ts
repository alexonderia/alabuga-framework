import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,stat,open,rename} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import manifest from '../../../config/pinned-model-manifest.json';
import lock from '../../../config/model-lock.json';
type Layer={digest:string;size:number};
type Manifest={config:Layer;layers:Layer[]};
async function hash(file:string){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex')}

/** Restore the exact pinned manifest and content-addressed blobs, never a mutable registry tag. */
export async function preparePinnedModel(directory:string,registry:string,progress:(message:string)=>Promise<void>,source:Manifest=manifest,expected=lock.digest){
 const text=JSON.stringify(source);
 if(createHash('sha256').update(text).digest('hex')!==expected)throw new Error('Pinned manifest digest mismatch');
 const root=resolve(directory),target=resolve(root,'manifests/registry.ollama.ai/library/qwen3.5/2b');
 if(!target.startsWith(root+sep))throw new Error('Unsafe model path');
 let existing:string|undefined;try{existing=await readFile(target,'utf8')}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}
 if(existing&&createHash('sha256').update(existing).digest('hex')!==expected)throw new Error('Existing model digest mismatch; model was not replaced');
 await mkdir(resolve(root,'blobs'),{recursive:true});
 const layers=[source.config,...source.layers];
 for(const [index,layer] of layers.entries()){
  if(!/^sha256:[a-f0-9]{64}$/.test(layer.digest)||!Number.isSafeInteger(layer.size)||layer.size<0)throw new Error('Invalid pinned layer');
  const digest=layer.digest.slice(7),file=resolve(root,'blobs','sha256-'+digest),partial=file+'.partial';
  let found=false;try{await stat(file);found=true}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}
  if(found){if((await stat(file)).size!==layer.size||await hash(file)!==digest)throw new Error('Cached layer digest mismatch: '+digest);continue}
  let offset=0;try{offset=(await stat(partial)).size}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}
  if(offset>layer.size)throw new Error('Partial layer exceeds expected size');
  if(offset<layer.size){
   await progress(`Загрузка файла / Downloading file ${index+1}/${layers.length}: ${Math.round(offset/layer.size*100)}%`);
   const response=await fetch(registry+'/blobs/'+layer.digest,{headers:offset?{Range:`bytes=${offset}-`}:{},signal:AbortSignal.timeout(3600000)});
   if(!response.ok||!response.body)throw new Error(`Pinned layer download failed: HTTP ${response.status}`);
   if(response.status===206&&!response.headers.get('content-range')?.startsWith(`bytes ${offset}-`))throw new Error('Invalid resume range');
   if(response.status!==206)offset=0;
   const handle=await open(partial,offset?'a':'w');let updated=0;
   try{for await(const value of response.body as unknown as AsyncIterable<Uint8Array>){offset+=value.length;if(offset>layer.size)throw new Error('Downloaded layer exceeds expected size');await handle.writeFile(value);if(Date.now()-updated>1000){updated=Date.now();await progress(`Загрузка файла / Downloading file ${index+1}/${layers.length}: ${Math.round(offset/layer.size*100)}%`)}}}finally{await handle.close()}
  }
  if((await stat(partial)).size!==layer.size||await hash(partial)!==digest)throw new Error('Downloaded layer digest mismatch: '+digest);
  await rename(partial,file);
 }
 await mkdir(dirname(target),{recursive:true});await writeManifest(target,text);
}
async function writeManifest(target:string,text:string){const handle=await open(target+'.tmp','w');try{await handle.writeFile(text);await handle.sync()}finally{await handle.close()}await rename(target+'.tmp',target)}
