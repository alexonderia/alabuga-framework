import type {AFDocument,Section,SlideTypography} from './schema.js';
export const slideTypeDefaults:SlideTypography={heading:80,body:36,cardTitle:40,caption:28,table:32,metric:120};
export function styleElements(shell:HTMLElement,page:Section,kind:AFDocument['kind']){
 if(page.layoutVariant)shell.dataset.layoutVariant=page.layoutVariant;
 for(const w of page.widgets){
  const box=shell.querySelector<HTMLElement>(`[data-widget-id="${w.id}"]`);if(!box)continue;
  if(w.style){
   box.dataset.elementStyle='';if(w.style.padding)box.dataset.elementPadding='';if(w.style.color&&w.style.color!=='inherit')box.dataset.elementColor='';
   if(w.style.size)box.dataset.textSize=w.style.size;
   if(w.style.color&&w.style.color!=='inherit')box.style.setProperty('--af-element-color',{ink:'#000d3c',blue:'#0c6ff1',white:'#ffffff',muted:'#526375'}[w.style.color]);
   if(w.style.padding)box.style.setProperty('--af-element-padding',{none:'0px',compact:'12px',normal:'24px',spacious:'40px'}[w.style.padding]);
  }
  if(kind==='presentation'&&w.typography){box.classList.add('af-slide-type');for(const [key,value]of Object.entries(w.typography))box.style.setProperty('--af-fit-'+key,value+'px')}
 }
}
