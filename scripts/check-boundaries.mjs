import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]))).flat()}
for(const file of await walk('src'))if(/\.(ts|css)$/.test(file)){
 const text=await readFile(file,'utf8');if(/@alabuga\/(editor|ai)|apps\/editor|indexedDB|localStorage|packages\/framework/.test(text))throw new Error('Forbidden Framework dependency: '+file);
 for(const m of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))if(!resolve(file,'..',m[1]).startsWith(resolve('src')))throw new Error('Source escapes library: '+file);
}
console.log('Framework dependency boundaries passed');
