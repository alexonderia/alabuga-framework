import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
async function available(){try{return (await fetch('http://127.0.0.1:11434/api/version',{signal:AbortSignal.timeout(1500)})).ok}catch{return false}}
if(!await available()){
 const exe=resolve('.local/ollama/ollama.exe');
 if(!existsSync(exe)){console.error('Ollama не найдена. Сначала выполните npm run ai:setup.');process.exit(1)}
 const child=spawn(exe,['serve'],{windowsHide:true,stdio:'ignore',env:{...process.env,OLLAMA_HOST:'127.0.0.1:11434',OLLAMA_MODELS:resolve('.local/models'),OLLAMA_NUM_PARALLEL:'1',OLLAMA_MAX_LOADED_MODELS:'1',OLLAMA_NO_CLOUD:'1',OLLAMA_VULKAN:'1',OLLAMA_CONTEXT_LENGTH:process.env.AF_AI_CONTEXT||'4096'}});
 process.on('exit',()=>child.kill());process.on('SIGINT',()=>process.exit());
 for(let i=0;i<20&&!await available();i++)await new Promise(r=>setTimeout(r,500));
 if(!await available())throw new Error('Ollama не запустилась. Проверьте .local/ollama и доступность порта 11434.');
}
const servicePort=Number(process.env.AF_AI_PORT||4176),entry=process.argv.includes('--demo')?'/demo/':'/builder/';
let running=false;
try{const response=await fetch(`http://127.0.0.1:${servicePort}/api/ai/status`,{signal:AbortSignal.timeout(5000)});running=response.ok&&(await response.json()).model==='qwen3.5:2b'}catch{}
if(!running)await import('../apps/ai-server/src/ai-server');
console.log(`${running?'Локальный сервис уже работает. ':''}Откройте http://127.0.0.1:${servicePort}${entry}`);
