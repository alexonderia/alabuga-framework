import type {Material} from './contracts';
export function imageChoices(id:string,task:string,materials:Material[]){
 const logo=id==='brand-cover'||/логотип/i.test(task),choices=materials.filter(m=>logo?m.category==='logo':m.category!=='logo');
 return choices.length?choices:materials;
}
/** Classify the requested presentation form, not words inside its topic list. */
export function sourceFacts(source:string){return source.split(/(?:\r?\n)+|(?<=[\p{L}\p{N}»][.!?])\s+(?=[А-ЯA-Z])/u).map(text=>text.trim()).filter(Boolean).map((text,index)=>({id:'F'+(index+1),text}));}
export function requestedComposition(prompt:string){
 const form=prompt.split(/[:«]/,1)[0];
 if(/три возможности|преимуществ|аргумент/i.test(form))return 'features';
 if(/таблиц/i.test(form))return 'table';
 if(/сравн/i.test(form))return 'comparison';
 if(/разделител/i.test(form))return 'divider';
 if(/этап/i.test(form))return 'steps';
 if(/показател|метрик/i.test(form))return 'metrics';
 if(/иллюстрац|текст.*изображ/i.test(form))return 'split';
 if(/шапк/i.test(form))return 'header';
 if(/подвал/i.test(form))return 'footer';
 if(/тезис/i.test(form))return 'thesis';
 if(/финальн/i.test(form))return 'hero';
 if(/текстов|объясни/i.test(form))return 'text';
 return undefined;
}
