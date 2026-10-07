/** Read and decode the actual response. HTTP 200 alone also accepts SPA fallbacks. */
export async function checkMaterial(src:string,cancellation:AbortSignal){
 const signal=AbortSignal.any([cancellation,AbortSignal.timeout(8000)]);
 let url:string|undefined,image:HTMLImageElement|undefined;
 try{
  const response=await fetch(src,{signal,cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  if(!response.headers.get('content-type')?.toLowerCase().startsWith('image/'))throw new Error('Ресурс не является изображением');
  const blob=await response.blob();signal.throwIfAborted();
  url=URL.createObjectURL(blob);image=new Image();image.src=url;
  await new Promise<void>((resolve,reject)=>{
   const finish=(error?:unknown)=>{signal.removeEventListener('abort',onAbort);error?reject(error):resolve()};
   const onAbort=()=>finish(signal.reason);
   signal.addEventListener('abort',onAbort,{once:true});
   if(signal.aborted){onAbort();return}
   image!.decode().then(()=>finish(),()=>finish(new Error('Не удалось декодировать изображение')));
  });
  if(!image.naturalWidth||!image.naturalHeight)throw new Error('Изображение имеет пустые размеры');
  return {src,available:true};
 }catch(error){cancellation.throwIfAborted();return {src,available:false,error:signal.aborted?'Материал не загрузился за 8 секунд':String(error)}}
 finally{if(image)image.src='';if(url)URL.revokeObjectURL(url)}
}
