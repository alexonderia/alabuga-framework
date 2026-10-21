import {resolve,dirname} from 'node:path';
import {readdir,readFile,access} from 'node:fs/promises';
for(const lang of ['ru','en']){
 const topics=(await readdir(`docs/content/${lang}`)).filter(f=>f.endsWith('.md')).sort();
 const other=(await readdir(`docs/content/${lang==='ru'?'en':'ru'}`)).filter(f=>f.endsWith('.md')).sort();
 if(JSON.stringify(topics)!==JSON.stringify(other))throw new Error('Documentation translation mismatch');
 for(const topic of topics){const file=`dist/docs/docs/${lang}/${topic.replace('.md','.html')}`;await access(file);const html=await readFile(file,'utf8');if(/\{\{[A-Z_]+\}\}/.test(html))throw new Error('Unresolved documentation URL: '+file);for(const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){const link=match[1];if(/^https?:|mailto:|data:/.test(link))continue;await access(link.startsWith('/')?resolve('dist/docs','.'+link):resolve(dirname(file),link))}
 if(!html.includes(`../${lang==='ru'?'en':'ru'}/`))throw new Error('Missing language switch: '+file)}
}
console.log('Independent Framework RU/EN documentation verified');
