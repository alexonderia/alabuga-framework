import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

// Local integrity check only. This script never contacts Figma or downloads assets.
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(resolve(root,'design/figma/manifest.json'),'utf8'));
const errors=[];
const files=new Map();
for(const record of manifest.files){
  const absolute=resolve(root,record.path),within=relative(root,absolute);
  if(isAbsolute(record.path)||within.startsWith('..')||isAbsolute(within)){
    errors.push(`Path outside project: ${record.path}`);continue;
  }
  if(files.has(record.path)){errors.push(`Duplicate file: ${record.path}`);continue;}
  files.set(record.path,record);
  try{
    const data=await readFile(absolute);
    if(data.length!==record.bytes)errors.push(`Size changed: ${record.path}`);
    if(createHash('sha256').update(data).digest('hex')!==record.sha256)errors.push(`SHA-256 changed: ${record.path}`);
    if(/\.(?:json|txt|svg)$/.test(record.path)&&/https?:\/\/(?:www\.)?figma\.com\/api\/mcp\/asset\//i.test(data.toString('utf8'))){
      errors.push(`Temporary Figma asset URL: ${record.path}`);
    }
  }catch(error){errors.push(`Cannot read ${record.path}: ${error.message}`);}
}
const inventory=JSON.parse(await readFile(resolve(root,manifest.inventory),'utf8'));
const families=new Map(manifest.coverage.map(family=>[family.nodeId,family]));
if(families.size!==manifest.coverage.length||families.size!==inventory.length)errors.push('Coverage must list each family exactly once');
for(const item of inventory){
  const family=families.get(item.id);
  if(!family||family.name!==item.name||family.variants!==item.count)errors.push(`Inventory mismatch: ${item.name}`);
}
for(const family of manifest.coverage){
  for(const path of [family.metadata,...family.data,...family.screenshots,...family.rules]){
    if(!files.has(path))errors.push(`Unregistered source for ${family.name}: ${path}`);
  }
  if(!family.gaps.length&&family.status!=='complete')errors.push(`Missing gap description: ${family.name}`);
}
// Derived local catalogues must keep their original asset provenance and inventory links.
const iconCatalogue=manifest.coverage.find(f=>f.nodeId==='275:227')?.data.find(p=>p==='design/icon-catalog.json');
if(iconCatalogue){
  const catalogue=JSON.parse(await readFile(resolve(root,iconCatalogue),'utf8'));
  for(const icon of catalogue.icons)for(const asset of icon.assets){
    const original=files.get(asset.file);
    if(!original||original.sha256!==asset.sha256)errors.push(`Icon source is not the archived original: ${icon.name} ${asset.size}`);
    if(asset.scaled!==(asset.rootWidth!==asset.slot||asset.rootHeight!==asset.slot))errors.push(`Icon scaling declaration mismatch: ${icon.name} ${asset.size}`);
  }
  if(catalogue.figmaVariants.length!==inventory.find(f=>f.id==='275:227').count)errors.push('Icon variant inventory is incomplete');
}
if(manifest.relatedSources.componentStatus){
  const status=JSON.parse(await readFile(resolve(root,manifest.relatedSources.componentStatus),'utf8'));
  const css=await readFile(resolve(root,'src/styles.css'),'utf8');
  if(status.families.length!==inventory.length||new Set(status.families.map(f=>f.nodeId)).size!==inventory.length)errors.push('Implementation index must cover all families exactly once');
  for(const family of status.families){
    const source=inventory.find(f=>f.id===family.nodeId);
    if(!source||source.name!==family.name||source.count!==family.variants)errors.push(`Implementation inventory mismatch: ${family.name}`);
    for(const name of family.classes)if(!css.includes('.'+name))errors.push(`Unknown implementation CSS class: ${name}`);
    for(const path of [...family.sourceData,...family.sourceRules])if(!files.has(path))errors.push(`Unregistered implementation source: ${path}`);
  }
}
if(errors.length)throw new Error(errors.join('\n'));
console.log(`Local design archive verified: ${files.size} files, ${families.size} families; coverage ${manifest.collection.status}. No network requests.`);
