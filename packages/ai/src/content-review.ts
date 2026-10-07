import type {Section} from '@alabuga/framework/schema';
import type {GenerationRequest,OutlineItem} from './contracts';
import {reviewClaims,sectionCopy} from './claims';
export function reviewDraftContent(section:Section,request:GenerationRequest,outline?:OutlineItem,materialNames:string[]=[]){
 const facts=request.prompt+'\n'+request.sources,task=request.scope==='section'?request.prompt:(outline?.title??'')+'. '+(outline?.purpose??'');
 return [...new Set([...reviewClaims(sectionCopy(section),facts),...reviewContent(section,request.audience,materialNames,{task,sources:request.sources})])];
}
export function reviewContent(section:Section,audience='',materialNames:string[]=[],context?:{task:string;sources:string}){
 const problems:string[]=[];
 if(context&&/\bhow\b|как\s|инструкц/i.test(context.task)){
  const taskWords=(context.task.toLowerCase().match(/[а-яё]+/gu)??[]).filter(w=>w.length>4).map(w=>w.slice(0,5));
  const instructions=context.sources.split(/(?<=[.!?])\s+|\n/u).filter(s=>/нажмите|выберите|откройте/i.test(s)&&taskWords.some(w=>s.toLowerCase().includes(w)));
  const controls=instructions.flatMap(s=>[...s.matchAll(/«([^»]+)»/g)].map(m=>m[1]));
  const output=JSON.stringify(section.widgets).toLowerCase();
  const missing=[...new Set(controls)].filter(c=>!output.includes(c.toLowerCase()));
  if(missing.length)problems.push('В инструкции отсутствуют команды из источника: '+missing.map(c=>'«'+c+'»').join(', ')+'. Назовите их в порядке действий.');
 }
 for(const w of section.widgets){
  if(w.type==='table'){
   const rows=w.rows.map(row=>w.columns.map(c=>String(row[c.key]??'').trim().toLocaleLowerCase()).join('\u0000'));
   if(new Set(rows).size!==rows.length)problems.push('В таблице повторяются строки. Сравните разные свойства без повторов.');
  }
  if(w.type==='text'&&w.content.some(b=>'text'in b&&materialNames.some(name=>name.length>10&&b.text.trim()===name)))problems.push('Вместо описания материала напишите текст по заданию.');
  if(w.type==='cards'){
   const normalized=w.items.map(i=>i.title.trim().toLocaleLowerCase());
   if(new Set(normalized).size!==normalized.length||new Set(w.items.map(i=>i.text.trim().toLocaleLowerCase())).size!==w.items.length)problems.push('Пункты повторяются. Каждый аргумент или этап должен иметь отдельный заголовок и смысл.');
  }
  if(w.type==='text')for(const b of w.content)if('text'in b&&audience&&b.text.trim().toLowerCase()===audience.trim().toLowerCase())problems.push('Название аудитории не является содержанием. Раскройте задачу пользователя вместо подписи аудитории.');
 }
 return problems;
}
