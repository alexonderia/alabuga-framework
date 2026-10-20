import {validateDocument,type AFDocument} from './schema.js';
import type {ResourceOptions} from './resource.js';
import {embedLocalImage} from './assets.js';
export interface ExportOptions extends ResourceOptions {runtime:{css:string;script:string};resolveAsset?:(id:string)=>Promise<string|undefined>}
export async function exportHTML(input:AFDocument,options:ExportOptions){
  const {css:libraryCss,script:libraryScript}=options.runtime;
  const result=validateDocument(input);if(!result.success)throw new Error(result.issues.map(i=>i.message).join('; '));
  const doc=structuredClone(result.data);
  const resolve=async(src:string)=>{if(!src.startsWith('asset:'))return src;if(!options.resolveAsset)throw new Error('Missing asset resolver: '+src);const data=await options.resolveAsset(src.slice(6));if(!data)throw new Error('Missing asset: '+src);return data};
  for(const page of doc.pages){if(page.appearance?.background)page.appearance.background=await resolve(page.appearance.background);for(const w of page.widgets){if(w.type==='image')w.src=await resolve(w.src);if(w.type==='gallery')for(const image of w.items)image.src=await resolve(image.src)}}
  for(const page of doc.pages){if(page.appearance?.background)page.appearance.background=await embedLocalImage(page.appearance.background,options);for(const w of page.widgets){if(w.type==='image')w.src=await embedLocalImage(w.src,options);if(w.type==='gallery')for(const image of w.items)image.src=await embedLocalImage(image.src,options)}}

  const json=JSON.stringify(doc).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const title=doc.title.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${libraryCss.replace(/<\/style/gi,'<\\/style')}body{margin:0;padding:0;background:#fff}main{width:100%;margin:auto}@media print{body{padding:0}}</style></head><body><main id="document"></main><script>${libraryScript.replace(/<\/script/gi,'<\\/script')}</script><script>Alabuga.renderDocument(document.getElementById('document'),${json});</script></body></html>`;
}
