import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const port=Number(process.env.AF_CHECK_PORT||4386),base=process.env.AF_CHECK_URL||`http://127.0.0.1:${port}`,env={...process.env,AF_AI_PORT:String(port),AF_DEMO_URL:base};
const server=process.env.AF_CHECK_URL?null:spawn(process.execPath,['apps/ai-server/dist/ai-server.js'],{env,windowsHide:true,stdio:'inherit'});
const out=process.env.AF_DEMO_REHEARSAL_DIR||'artifacts/demo/rehearsal';await mkdir(out,{recursive:true});
let samples='',gpuError='';
const monitor=spawn('nvidia-smi',['--query-gpu=timestamp,memory.total,memory.used','--format=csv,noheader,nounits','-lms','250'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
monitor.stdout.on('data',b=>samples+=String(b));monitor.on('error',e=>gpuError=String(e));monitor.stderr.on('data',b=>gpuError+=String(b));
try{
 let ready=false;
 for(let i=0;i<60;i++){if(server&&server.exitCode!==null)throw new Error('Acceptance API stopped');try{ready=(await fetch(env.AF_DEMO_URL+'/api/ai/health')).ok}catch{}if(ready)break;await new Promise(r=>setTimeout(r,250))}
 if(!ready)throw new Error('Acceptance API did not start');
 const child=spawn(process.execPath,['--import','tsx','scripts/demo-rehearsal.ts'],{env,windowsHide:true,stdio:'inherit'});
 const code=await new Promise<number|null>((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});if(code!==0)throw new Error('Real model acceptance failed');
}finally{
 server?.kill();monitor.kill();await writeFile(out+'/gpu-samples.csv',samples);
 const rows=samples.trim().split('\n').map(line=>line.split(',').map(s=>s.trim())).filter(row=>row.length===3&&Number.isFinite(Number(row[2])));
 await writeFile(out+'/gpu-summary.json',JSON.stringify({base,samples:rows.length,peakUsedMiB:rows.length?Math.max(...rows.map(r=>Number(r[2]))):null,totalMiB:rows.length?Number(rows[0][1]):null,error:gpuError||undefined},null,2));
}
