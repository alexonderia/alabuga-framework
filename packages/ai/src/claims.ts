import type {Section} from '@alabuga/framework/schema';
export function reviewOutlineClaims(titles:string[],sources:string){return reviewClaims(titles.filter(t=>!/^(раздел|слайд|секция|section|slide)\s+\d+$/i.test(t)).join(' '),sources)}
export function sectionCopy(section:Section){return section.widgets.map(w=>{
 switch(w.type){
  case 'text':return JSON.stringify(w.content);
  case 'cards':return JSON.stringify(w.items);
  case 'table':return JSON.stringify([w.columns.map(c=>c.label),w.rows.map(r=>w.columns.map(c=>r[c.key]))]);
  case 'metric':return w.value+' '+w.note;
  case 'quote':return w.text+' '+w.author;
  case 'button':return w.label;
  default:return '';
 }
}).join(' ')}
export function reviewClaims(generated:string,sources:string){
 const normalize=(n:string)=>n.replace(',','.');
 const warnings:string[]=[],numbers=new Set((sources.match(/\d+(?:[.,]\d+)?(?:[:/]\d+)?%?/g)??[]).map(normalize));
 for(const n of new Set(generated.match(/\d+(?:[.,]\d+)?(?:[:/]\d+)?%?/g)??[]))if(!numbers.has(normalize(n)))warnings.push('Проверьте число «'+n+'»: его нет в исходных сведениях.');
 const quantities=(text:string)=>[...text.matchAll(/(?<![\p{L}\p{N}.,:/])(\d+(?:[.,]\d+)?)\s+(слайд(?:а|ов|ы|у|ом|е|ами|ах|ам)?|секци(?:я|и|й|ю|е|ей|ями|ях|ям)|страниц(?:а|ы|у|е|ей|ами|ах|ам)?)(?!\p{L})/giu)].map(m=>({text:m[0],key:normalize(m[1])+':'+(m[2].toLowerCase().startsWith('слайд')?'slide':m[2].toLowerCase().startsWith('секци')?'section':'page')}));
 const evidence=new Set(quantities(sources).map(q=>q.key));
 for(const q of quantities(generated))if(!evidence.has(q.key))warnings.push('Проверьте утверждение «'+q.text+'»: число и единица не совпадают с исходными сведениями.');
 for(const claim of ['мгновенн','без задержек','отсутствие задержек','гарантирован','без ошибок'])if(generated.toLowerCase().includes(claim)&&!sources.toLowerCase().includes(claim))warnings.push('Проверьте обещание «'+claim+'…»: оно не подтверждено исходными сведениями.');
 return warnings;
}
