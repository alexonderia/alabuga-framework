import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OllamaProvider} from '@alabuga/ai/provider';
import {reviewClaims} from '@alabuga/ai/claims';

test('status keeps a deadline when the caller supplies a cancellation signal',async()=>{
 const originalFetch=globalThis.fetch,originalTimeout=AbortSignal.timeout;
 const controller=new AbortController();let deadline:number|undefined;
 try{
  AbortSignal.timeout=(milliseconds:number)=>{deadline=milliseconds;return originalTimeout(10)};
  globalThis.fetch=async(_url,options)=>new Promise<Response>((_resolve,reject)=>{
   const signal=options!.signal!;
   if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  });
  const watchdog=setTimeout(()=>controller.abort(new Error('test watchdog')),100);
  try{await assert.rejects(new OllamaProvider().status(controller.signal),e=>e instanceof Error&&e.name==='TimeoutError');}
  finally{clearTimeout(watchdog)}
  assert.equal(deadline,8000);
 }finally{globalThis.fetch=originalFetch;AbortSignal.timeout=originalTimeout}
});

test('quantity evidence must match a whole number and the same unit',()=>{
 assert.ok(reviewClaims('Доступно 5 слайдов.','Доступно 5 секций и 15 слайдов.').some(w=>w.includes('число и единица')));
 assert.ok(reviewClaims('Доступно 5 слайдов.','Размер 5 px; длительность 1,5 слайда.').some(w=>w.includes('число и единица')));
 assert.deepEqual(reviewClaims('Доступно 15 слайдов.','Доступно 5 секций и 15 слайдов.'),[]);
});

test('caller cancellation is preserved rather than reported as a timeout',async()=>{
 const originalFetch=globalThis.fetch,controller=new AbortController(),reason=new Error('cancelled by author');
 controller.abort(reason);
 try{
  globalThis.fetch=async(_url,options)=>{options!.signal!.throwIfAborted();throw new Error('unexpected request')};
  await assert.rejects(new OllamaProvider().status(controller.signal),e=>e===reason);
 }finally{globalThis.fetch=originalFetch}
});

test('identical quantities are recognized across letter case and decimal notation',()=>{
 assert.deepEqual(reviewClaims('ДОСТУПНО 5 СЛАЙДОВ.','Доступно 5 слайдов.'),[]);
 assert.ok(reviewClaims('ДОСТУПНО 5 СЛАЙДОВ.','Доступно 5 секций.').some(w=>w.includes('число и единица')));
 assert.deepEqual(reviewClaims('Показатель 1.5.','Показатель 1,5.'),[]);
});
