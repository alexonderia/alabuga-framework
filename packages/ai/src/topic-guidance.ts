import {sourceFacts} from './planning';

/** Prioritize whole facts without discarding any source material. */
export function rankedFacts(sources:string,topic:string){
 const query=topic.toLocaleLowerCase();
 const intent=/фирменн|стил|композ/.test(query)?/фирмен|композ|стил/i
  :/предпросмотр|просмотр|мобиль/.test(query)?/предпросмотр|телефон|планшет/i
  :/экспорт/.test(query)?/экспорт|html/i
  :/редакт/.test(query)?/редакт|холст|размер|отступ/i
  :/^(?:идея|задача|о продукте)(?:\b|[ .,:]|$)/u.test(query)?/—|визуальный конструктор/i:undefined;
 const words=(query.match(/[\p{L}\d]+/gu)??[]).filter(w=>w.length>3&&!/^(создай|сделай|покажи|секци|слайд|страниц|alabuga|framework)/.test(w)).map(w=>w.slice(0,5));
 return sourceFacts(sources).map((fact,index)=>({...fact,index,score:(intent?.test(fact.text)?20:0)+words.filter(w=>fact.text.toLocaleLowerCase().includes(w)).length+words.filter(w=>fact.text.toLocaleLowerCase().startsWith(w)).length*4}))
  .sort((a,b)=>b.score-a.score||a.index-b.index);
}
/** A source reference is an explicit field, never an instruction to copy an ID into prose. */
export function hasSourceCards(format:Record<string,unknown>){
 return Object.values((format as any).properties?.content?.properties??{}).some((field:any)=>Object.values(field.properties?.items?.properties??{}).some((item:any)=>!!item.properties?.sourceId));
}
export function hasSourceContent(format:Record<string,unknown>){return hasSourceCards(format)||Object.values((format as any).properties?.content?.properties??{}).some((field:any)=>!!field.properties?.sourceId)}
export function resolveSourceCards(items:unknown[],specs:Record<string,any>|undefined,sources:string){
 const facts=sourceFacts(sources);
 return items.map((item:any,i)=>{
  const spec=specs?.['item'+i]?.properties;if(!spec?.sourceId)return item;
  if(!item||typeof item!=='object'||Array.isArray(item)||Object.keys(item).some(k=>!['title','sourceId'].includes(k))||item.title!==spec.title.const||!spec.sourceId.enum.includes(item.sourceId))throw new Error('Карточка должна выбрать допустимый исходный факт для своей темы.');
  const fact=facts.find(f=>f.id===item.sourceId);if(!fact)throw new Error('Исходный факт карточки не найден.');
  return {title:item.title,text:fact.text};
 });
}

/** Presentation form only: keep the model's source premise and all author edits. */
export function topicGuidance(topic:string){
 if(/^(процесс|порядок работы|рабочий процесс|этапы)(?:[ .,:]|$)/i.test(topic))return {composition:'steps'};
 if(/^(следующий шаг|финал|призыв)(?:[ .,:]|$)/i.test(topic))return {composition:'hero'};
 return undefined;
}
