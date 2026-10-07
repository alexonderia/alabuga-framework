import {MODEL,type AIProvider} from './contracts';
export class OllamaProvider implements AIProvider{
 readonly contentOnly=true;
 async status(signal?:AbortSignal){
  const deadline=AbortSignal.timeout(8000);
  try{const response=await localFetch('/api/ai/status',{signal:signal?AbortSignal.any([signal,deadline]):deadline});if(!response.ok)throw new Error(await error(response));return await response.json()}
  catch(e){if(deadline.aborted&&!signal?.aborted)throw new DOMException('Локальный сервис не ответил за 8 секунд. Повторите проверку подключения.','TimeoutError');throw e}
 }
 async generate(system:string,prompt:string,format:Record<string,unknown>,signal:AbortSignal){
  const response=await localFetch('/api/ai/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system,prompt,format}),signal:AbortSignal.any([signal,AbortSignal.timeout(125000)])});
  if(!response.ok)throw new Error(await error(response));return (await response.json()).data;
 }
}
async function localFetch(url:string,options:RequestInit){try{return await fetch(url,options)}catch(e){if(options.signal?.aborted)throw e;throw new Error('Локальный сервис недоступен. Запустите npm run ai.')}}
async function error(r:Response){try{return (await r.json()).error||'Ошибка локального сервиса'}catch{return 'Локальный ИИ недоступен. Запустите npm run ai.'}}
export {MODEL};
