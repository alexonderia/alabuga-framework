import ts from 'typescript';
import {readdir,readFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const roots=['packages/framework','packages/ai','apps/editor','apps/ai-server','apps/docs'];
const manifests=await Promise.all(roots.map(async root=>({root,...JSON.parse(await readFile(root+'/package.json','utf8'))})));
const allowed:Record<string,string[]>={'packages/framework':[],'packages/ai':['@alabuga/framework'],'apps/editor':['@alabuga/framework','@alabuga/ai'],'apps/docs':['@alabuga/framework'],'apps/ai-server':['@alabuga/ai','@alabuga/framework']};
async function files(dir:string):Promise<string[]>{return(await Promise.all((await readdir(dir,{withFileTypes:true})).filter(e=>e.name!=='dist'&&e.name!=='node_modules').map(e=>e.isDirectory()?files(dir+'/'+e.name):Promise.resolve(/\.(ts|css)$/.test(e.name)?[dir+'/'+e.name]:[])))).flat()}
const errors:string[]=[];
for(const root of roots)for(const file of await files(root)){
 const text=await readFile(file,'utf8');
 const check=(spec:string)=>{
  if(spec.startsWith('.')){const target=relative(process.cwd(),resolve(file,'..',spec)).replaceAll('\\','/');const other=roots.find(r=>target.startsWith(r+'/'));if(other&&other!==root)errors.push(file+': cross-workspace internal import '+spec)}
  if(spec.startsWith('@alabuga/')){
   const [scope,name,...parts]=spec.split('/'),pkg=scope+'/'+name,entry=parts.length?'./'+parts.join('/').split('?')[0]:'.';
   if(!allowed[root].includes(pkg))errors.push(file+': forbidden dependency '+pkg);
   if(!manifests.find(m=>m.root===root)?.dependencies?.[pkg])errors.push(file+': undeclared dependency '+pkg);
   if(!manifests.find(m=>m.name===pkg)?.exports?.[entry])errors.push(file+': entry is not public '+spec);
   if(spec.includes('/src/')||spec.includes('/dist/'))errors.push(file+': internal entry '+spec);
  }
 };
 if(file.endsWith('.css')){for(const m of text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]|url\(['"]?(\.[^)'"\s]+)['"]?\)/g))check(m[1]||m[2]);continue}
 const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
 function walk(node:ts.Node){if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))check(node.moduleSpecifier.text);if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='require')&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))check(node.arguments[0].text);ts.forEachChild(node,walk)}walk(source);
}
if(errors.length)throw new Error(errors.join('\n'));console.log('Workspace boundaries passed');
