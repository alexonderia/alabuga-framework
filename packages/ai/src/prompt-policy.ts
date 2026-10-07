import {sourceFacts} from './planning';
/** Add evidence IDs only when card guidance refers to them; preserve the normal text prompt. */
export function contentPrompt(prompt:string,sources:string,evidenceIds=false){
 const task=prompt.match(/^ЗАДАНИЕ: [^\n]+/m)?.[0]??'';
 const requirements=prompt.match(/\nТРЕБОВАНИЯ К ПОДАЧЕ:[\s\S]*$/)?.[0]??'';
 const context=prompt.replace(/(?:АУДИТОРИЯ|ЧИТАТЕЛЬ \(не включай название аудитории в текст\)):[^\n]*\n/g,'')
  .replace(/ФАКТЫ ДЛЯ ЭТОЙ СЕКЦИИ:\n[\s\S]*$/,'ИСХОДНЫЕ ФАКТЫ (выбери относящиеся к заданию):\n'+(evidenceIds?sourceFacts(sources).map(f=>f.id+': '+f.text).join('\n'):sources))
  .replace(/^ЗАДАНИЕ: [^\n]+\n?/m,'');
 return context+'\n\n'+task+'\nОтвет должен раскрывать именно это задание. Не пересказывай все факты подряд.'+requirements;
}
