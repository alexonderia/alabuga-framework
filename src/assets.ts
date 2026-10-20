import {resolveAssetUrl,isBuiltinAsset,type ResourceOptions} from './resource.js';
export {resolveAssetUrl,isBuiltinAsset} from './resource.js';
export type {ResourceOptions} from './resource.js';
export async function embedLocalImage(src:string,options:ResourceOptions={}):Promise<string>{
  const builtin=isBuiltinAsset(src);src=resolveAssetUrl(src,options);
  if(src.startsWith('data:')||!builtin&&/^https?:/i.test(src))return src;
  if(/\.svg(?:[?#]|$)/i.test(src)){const response=await fetch(new URL(src,location.href));if(!response.ok)throw new Error('Не удалось загрузить SVG: '+src);const xml=new DOMParser().parseFromString(await response.text(),'image/svg+xml');if(xml.querySelector('parsererror'))throw new Error('Некорректный SVG');xml.querySelectorAll('script,foreignObject').forEach(n=>n.remove());for(const node of xml.querySelectorAll('*'))for(const attr of [...node.attributes])if(/^on/i.test(attr.name)||/href$/i.test(attr.name)&&!attr.value.startsWith('#'))node.removeAttribute(attr.name);const text=new XMLSerializer().serializeToString(xml.documentElement);return 'data:image/svg+xml;base64,'+btoa(Array.from(new TextEncoder().encode(text),b=>String.fromCharCode(b)).join(''))}
  const image=new Image();image.src=new URL(src,location.href).href;
  await Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Не удалось загрузить изображение: '+src)),10000))]);
  const canvas=document.createElement('canvas');const ratio=Math.min(1,1600/image.naturalWidth,1600/image.naturalHeight);canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');
}
