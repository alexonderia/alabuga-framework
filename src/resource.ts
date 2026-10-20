/** Options are per operation so independent mounts can use different asset hosts. */
export interface ResourceOptions {assetsBaseUrl?:string}
const packageBase=new URL('../assets/', import.meta.url).href;
const builtin=/^(?:\.\.\/|\.\/|\/)?assets\/(brand\/[A-Za-z0-9._/-]+|brand-landscape\.svg)$/;
export function isBuiltinAsset(src:string):boolean{return builtin.test(src)}
export function resolveAssetUrl(src:string,options:ResourceOptions={}):string{
 const match=builtin.exec(src);if(!match)return src;
 if(match[1].split('/').some(part=>part==='.'||part==='..'))throw new Error('Unsafe built-in asset path');
 const configured=options.assetsBaseUrl;
 const base=configured?new URL(configured,typeof document==='undefined'?packageBase:document.baseURI).href:packageBase;
 return new URL(match[1],base.endsWith('/')?base:base+'/').href;
}
