// Select whole source sentences; never cut a fact or silently shorten a request.
const groups=[['хран','сохран','indexeddb'],['экспорт','html'],['мобиль','экран','адапт'],['изображ','картин','иллюстр'],['редакт','измен','содерж'],['автоном','интернет','локаль'],['стиль','фирмен','композ']];
function words(text:string){const values=(text.toLowerCase().match(/[\p{L}\d]+/gu)??[]).filter(w=>w.length>=4&&!['создай','сделай','покажи','секция','секции','слайд','слайдов','alabuga','framework','конструктор'].includes(w));const out=new Set(values.map(w=>w.slice(0,5)));for(const group of groups)if(values.some(w=>group.some(stem=>w.startsWith(stem))))group.forEach(w=>out.add(w.slice(0,5)));return out}
export function relevantFacts(source:string,topic:string){
 const facts=source.split(/(?:\r?\n)+|(?<=[.!?])\s+(?=[А-ЯA-Z])/u).map(s=>s.trim()).filter(Boolean),query=words(topic);
 const ranked=facts.map((text,index)=>({text,index,score:[...words(text)].filter(w=>query.has(w)).length})).filter(f=>f.score>0||/^!/.test(f.text)).sort((a,b)=>b.score-a.score||a.index-b.index);
 return (ranked.length?ranked.sort((a,b)=>a.index-b.index).map(f=>f.text):facts.slice(0,2)).join('\n');
}
