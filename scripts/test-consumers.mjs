import {build} from 'esbuild';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import {mkdtemp,readFile,writeFile,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const report=JSON.parse(await readFile('artifacts/package/report.json','utf8'));
const directory=await mkdtemp(resolve(tmpdir(),'alabuga-consumer-'));
await writeFile(resolve(directory,'package.json'),JSON.stringify({private:true,type:'module'}));
await writeFile(resolve(directory,'.npmrc'),'registry=https://registry.npmjs.org/\n');
const npm=process.env.npm_execpath;
execFileSync(process.execPath,[npm,'install','--ignore-scripts','--no-audit','--no-fund',resolve(report.archive),'react@19.2.0','react-dom@19.2.0'],{cwd:directory,stdio:'inherit',windowsHide:true});
await cp('tests/consumers',directory,{recursive:true});
execFileSync(process.execPath,['verify.mjs'],{cwd:directory,stdio:'inherit',windowsHide:true});
execFileSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--strict','--skipLibCheck','--noEmit','--target','es2022','--module','NodeNext','--moduleResolution','NodeNext','consumer.ts'],{cwd:directory,stdio:'inherit',windowsHide:true});
console.log('Isolated Node, TypeScript and React consumers passed: '+directory);


await build({entryPoints:[resolve(directory,'react-browser.mjs')],outfile:resolve(directory,'react-bundle.js'),bundle:true,format:'esm',define:{'process.env.NODE_ENV':'"development"'}});
const server=createServer(async(req,res)=>{try{if(req.url==='/react-bundle.js'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(resolve(directory,'react-bundle.js')))}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><div id="root"></div><script type="module" src="/react-bundle.js"></script>')}}catch{res.writeHead(500).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({channel:process.env.AF_BROWSER_CHANNEL||undefined});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByText('Original',{exact:true}).waitFor();await page.click('#update');await page.getByText('Updated',{exact:true}).waitFor();await page.click('#unmount');await page.waitForFunction(()=>window.lifecycle.destroy===window.lifecycle.mount&&window.lifecycle.mount>=2);if(errors.length)throw new Error(errors.join('\n'));await writeFile('artifacts/package/consumer.json',JSON.stringify({directory,passed:true,node:true,typescript:true,reactStrictMode:true,integrity:report.integrity},null,2));console.log('React StrictMode mount/update/destroy passed')}finally{await browser?.close();await new Promise(r=>server.close(r))}
