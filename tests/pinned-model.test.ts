import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname,basename} from 'node:path';
import {preparePinnedModel} from '../apps/ai-server/src/pinned-model';
import manifest from '../config/pinned-model-manifest.json';
import lock from '../config/model-lock.json';
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
test('vendored manifest reproduces the already accepted model digest',()=>assert.equal(hash(JSON.stringify(manifest)),lock.digest));
test('pinned download resumes, validates every blob, works offline and refuses replacement',async()=>{
 const data=Buffer.from('checked model bytes'),digest=hash(data),source={config:{digest:'sha256:'+digest,size:data.length},layers:[]},expected=hash(JSON.stringify(source));
 let requests=0,range='';const server=createServer((req,res)=>{requests++;range=req.headers.range||'';assert.equal(req.url,'/blobs/sha256:'+digest);const offset=range?Number(range.match(/\d+/)![0]):0;res.writeHead(offset?206:200,offset?{'content-range':`bytes ${offset}-${data.length-1}/${data.length}`}:{ });res.end(data.subarray(offset))});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${(server.address() as {port:number}).port}`,dir=await mkdtemp(resolve(tmpdir(),'alabuga-pin-'));
 try{
  await mkdir(resolve(dir,'blobs'));await writeFile(resolve(dir,'blobs','sha256-'+digest+'.partial'),data.subarray(0,5));
  await preparePinnedModel(dir,url,async()=>{},source,expected);assert.equal(range,'bytes=5-');assert.equal(requests,1);
  await preparePinnedModel(dir,'http://127.0.0.1:1',async()=>{},source,expected);assert.equal(requests,1);
  const target=resolve(dir,'manifests/registry.ollama.ai/library/qwen3.5/2b');assert.equal(await readFile(target,'utf8'),JSON.stringify(source));
  await assert.rejects(preparePinnedModel(dir,url,async()=>{},source,'wrong'),/Pinned manifest digest mismatch/);
  await writeFile(target,'different');await assert.rejects(preparePinnedModel(dir,url,async()=>{},source,expected),/Existing model digest mismatch/);assert.equal(await readFile(target,'utf8'),'different');
  await writeFile(target,JSON.stringify(source));await writeFile(resolve(dir,'blobs','sha256-'+digest),'corrupt');await assert.rejects(preparePinnedModel(dir,url,async()=>{},source,expected),/Cached layer digest mismatch/);
 }finally{await new Promise<void>(r=>server.close(()=>r()));const target=resolve(dir);if(dirname(target)!==resolve(tmpdir())||!basename(target).startsWith('alabuga-pin-'))throw Error('Unsafe cleanup');await rm(target,{recursive:true,force:true})}
});
