import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const pkg=JSON.parse(await readFile('package.json','utf8')),npm=process.env.npm_execpath;
await mkdir('artifacts/package',{recursive:true});
const run=args=>execFileSync(process.execPath,[npm,...args],{encoding:'utf8',windowsHide:true});
const pack=JSON.parse(run(['pack','--ignore-scripts','--json','--pack-destination','artifacts/package']))[0];
const files=new Set(pack.files.map(f=>f.path));
for(const [entry,target]of Object.entries(pkg.exports)){
 if(entry.includes('*'))continue;
 for(const file of typeof target==='string'?[target]:Object.values(target))assert(files.has(file.replace(/^\.\//,'')),`${entry}: missing ${file}`);
}
assert(![...files].some(f=>/^(src|apps|config|infra|artifacts)\/|^dist\/(docs|standalone)\//.test(f)));
assert([...files].some(f=>f.endsWith('.woff2')));assert(files.has('dist/assets/brand/manifest.json'));
const archive='artifacts/package/'+pack.filename,integrity='sha512-'+createHash('sha512').update(await readFile(archive)).digest('base64');
assert.equal(integrity,pack.integrity);
await writeFile('artifacts/package/report.json',JSON.stringify({archive,integrity,files:files.size,passed:true},null,2));
console.log(`${archive}: ${files.size} files; all public exports and integrity verified`);
