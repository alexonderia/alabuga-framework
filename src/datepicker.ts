import {renderCalendar} from './widgets.js';

const enhanced=new WeakMap<HTMLInputElement,()=>void>();
let nextId=0;
let closeCurrent:(()=>void)|undefined;
const validISO=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&value>='0001-01-01'&&!Number.isNaN(+new Date(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const display=(value:string)=>value?value.split('-').reverse().join('.'):'';
function parse(text:string){
  const value=text.trim();
  if(validISO(value))return value;
  const parts=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)??/^(\d{2})(\d{2})(\d{4})$/.exec(value);
  const iso=parts?`${parts[3]}-${parts[2]}-${parts[1]}`:'';
  return validISO(iso)?iso:null;
}

/** Internal enhancement. The original date input retains form state and constraints. */
export function initDatePickers(root:HTMLElement):()=>void{
  const inputs=[...root.querySelectorAll<HTMLInputElement>('input.af-datepicker[type="date"]')];
  if(root.matches('input.af-datepicker[type="date"]'))inputs.unshift(root as HTMLInputElement);
  const cleanups=inputs.filter(input=>!input.hasAttribute('data-af-date-native')&&!enhanced.has(input)).map(enhance);
  return()=>cleanups.forEach(cleanup=>cleanup());
}

function enhance(input:HTMLInputElement):()=>void{
  const doc=input.ownerDocument,win=doc.defaultView!,abort=new AbortController(),{signal}=abort;
  const oldTabIndex=input.getAttribute('tabindex'),oldAriaHidden=input.getAttribute('aria-hidden'),hadFocus=doc.activeElement===input;
  const labels:Array<{label:HTMLLabelElement;id:string}>=[],boundLabels=new Set<HTMLLabelElement>();
  const wrapper=doc.createElement('span');wrapper.className='af-input-wrap af-datepicker-box';
  const toggle=doc.createElement('button');toggle.type='button';toggle.className='af-datepicker__toggle';toggle.tabIndex=-1;
  toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-expanded','false');
  const proxy=doc.createElement('input');proxy.type='text';proxy.className='af-input af-datepicker__input';proxy.dataset.afDatepickerProxy='';
  proxy.inputMode='numeric';proxy.spellcheck=false;proxy.maxLength=10;
  proxy.setAttribute('role','combobox');proxy.setAttribute('aria-haspopup','dialog');proxy.setAttribute('aria-expanded','false');proxy.setAttribute('aria-autocomplete','none');
  const hint=doc.createElement('span');hint.className='af-input-hint af-datepicker__hint';hint.setAttribute('aria-hidden','true');
  const popup=doc.createElement('dialog');popup.className='af af-datepicker-popup';popup.hidden=true;
  let prefix:string;
  do{prefix=`af-datepicker-${++nextId}`}while(doc.getElementById(prefix+'-input')||doc.getElementById(prefix+'-calendar'));
  proxy.id=prefix+'-input';popup.id=prefix+'-calendar';
  proxy.setAttribute('aria-controls',popup.id);toggle.setAttribute('aria-controls',popup.id);
  const formatHelp=doc.createElement('span');formatHelp.className='af-sr-only';formatHelp.id=prefix+'-format';formatHelp.textContent='Дата в формате ДД.ММ.ГГГГ. Стрелка вниз открывает календарь.';
  input.before(wrapper);wrapper.append(input,toggle,proxy,hint,formatHelp,popup);
  input.classList.add('af-datepicker--enhanced');input.tabIndex=-1;input.setAttribute('aria-hidden','true');
  let disposed=false,opened=false,invalidShown=false,ownError:string|null=null,errorKind:'parse'|'constraint'|null=null,dispatching=false,lastValue=input.value;
  proxy.value=display(input.value);
  const disabled=()=>input.matches(':disabled'),readOnly=()=>input.readOnly;
  const bounds=()=>({min:validISO(input.min)?input.min:'0001-01-01',max:validISO(input.max)?input.max:'9999-12-31'});
  function clearError(){if(ownError&&input.validationMessage===ownError)input.setCustomValidity('');ownError=null;errorKind=null}
  function parseError(){
    if(!input.validity.customError||input.validationMessage===ownError){ownError='Введите существующую дату в формате ДД.ММ.ГГГГ.';errorKind='parse';input.setCustomValidity(ownError)}
  }
  function validate(){
    if(errorKind==='parse')return;
    if(errorKind==='constraint')clearError();
    let message='';const {min,max}=bounds();
    if(input.value&&!validISO(input.value))message='Введите дату с годом от 0001 до 9999.';
    else if(input.type!=='date'&&input.value&&(input.value<min||input.value>max))message=`Введите дату с ${display(min)} по ${display(max)}.`;
    if(message&&!input.validity.customError){ownError=message;errorKind='constraint';input.setCustomValidity(message)}
  }
  function close(restore=false){
    if(!opened)return;
    opened=false;
    if(popup.open)popup.close();popup.hidden=true;popup.replaceChildren();
    proxy.setAttribute('aria-expanded','false');toggle.setAttribute('aria-expanded','false');delete wrapper.dataset.open;
    if(closeCurrent===close)closeCurrent=undefined;
    if(restore&&!disposed&&!disabled())proxy.focus();
  }
  function position(){
    if(!opened)return;
    const rect=wrapper.getBoundingClientRect(),viewport=win.visualViewport;
    const x=viewport?.offsetLeft??0,y=viewport?.offsetTop??0,width=viewport?.width??doc.documentElement.clientWidth,height=viewport?.height??win.innerHeight;
    if(!input.isConnected||!rect.width||rect.bottom<y||rect.top>y+height){close();return}
    const edge=8,gap=4,natural=popup.scrollHeight;
    const below=Math.max(0,y+height-rect.bottom-gap-edge),above=Math.max(0,rect.top-y-gap-edge);
    const upwards=below<Math.min(natural,160)&&above>below;
    const available=upwards?above:below;
    popup.style.maxHeight=Math.max(0,Math.min(height-edge*2,available))+'px';
    popup.style.left=Math.max(x+edge,Math.min(rect.left,x+width-edge-popup.offsetWidth))+'px';
    popup.style.top=(upwards?Math.max(y+edge,rect.top-gap-popup.offsetHeight):rect.bottom+gap)+'px';
  }
  function sync(force=false){
    if(disposed)return;
    if(input.getAttribute('type')?.toLowerCase()!=='date'||!input.classList.contains('af-datepicker')||input.hasAttribute('data-af-date-native')){destroy();return}
    if(force||input.value!==lastValue){clearError();proxy.value=display(input.value);lastValue=input.value}
    validate();
    proxy.disabled=disabled();proxy.readOnly=readOnly();proxy.placeholder=input.getAttribute('placeholder')||'ДД.ММ.ГГГГ';proxy.autocomplete=input.autocomplete;
    proxy.setAttribute('aria-readonly',String(readOnly()));
    proxy.tabIndex=oldTabIndex===null?0:Number(oldTabIndex);
    toggle.disabled=disabled()||readOnly()||bounds().min>bounds().max;
    const small=input.classList.contains('af-input--sm');
    proxy.classList.toggle('af-input--sm',small);
    proxy.classList.toggle('af-input--lg',!small&&input.classList.contains('af-input--lg'));
    proxy.classList.toggle('af-input--success',input.classList.contains('af-input--success'));
    proxy.setAttribute('aria-required',String(input.required));
    for(const attr of ['aria-label','aria-labelledby','aria-errormessage','title']){
      const value=input.getAttribute(attr);if(value!==null)proxy.setAttribute(attr,value);else proxy.removeAttribute(attr);
    }
    const described=[input.getAttribute('aria-describedby'),formatHelp.id].filter(Boolean).join(' ');proxy.setAttribute('aria-describedby',described);
    const invalid=input.getAttribute('aria-invalid')==='true'||invalidShown&&!input.validity.valid;
    if(invalid)proxy.setAttribute('aria-invalid','true');else if(input.hasAttribute('aria-invalid'))proxy.setAttribute('aria-invalid',input.getAttribute('aria-invalid')!);else proxy.removeAttribute('aria-invalid');
    if(!input.hasAttribute('aria-label')&&!input.hasAttribute('aria-labelledby')){
      const ids=[...(input.labels??[])].map(label=>{
        if(!boundLabels.has(label)){
          boundLabels.add(label);
          label.addEventListener('click',event=>{if(!wrapper.contains(event.target as Node)){event.preventDefault();proxy.focus()}},{signal});
        }
        if(!label.id){label.id=prefix+'-label-'+labels.length;labels.push({label,id:label.id})}
        return label.id;
      });
      if(ids.length)proxy.setAttribute('aria-labelledby',ids.join(' '));
    }
    const name=proxy.getAttribute('aria-label')||[...(input.labels??[])].map(label=>label.textContent?.trim()).join(' ')||'Дата';
    toggle.setAttribute('aria-label','Открыть календарь: '+name);popup.setAttribute('aria-label','Выбор даты: '+name);
    for(const prop of ['width','min-width','max-width'])wrapper.style.setProperty(prop,input.style.getPropertyValue(prop));
    wrapper.hidden=input.hidden||win.getComputedStyle(input).display==='none';
    if(opened&&(disabled()||readOnly()||wrapper.hidden))close();
  }
  function emit(type:'input'|'change'){
    if(disposed)return;
    dispatching=true;try{input.dispatchEvent(new Event(type,{bubbles:true}))}finally{dispatching=false}
    if(!disposed)sync();
  }
  function open(){
    if(disposed||disabled()||readOnly())return;
    sync();const {min,max}=bounds();if(disposed||min>max)return;
    closeCurrent?.();
    const now=new Date(),today=`${String(now.getFullYear()).padStart(4,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const selected=validISO(input.value)&&input.value>=min&&input.value<=max?input.value:null;
    const anchor=selected??(today<min?min:today>max?max:today);
    popup.replaceChildren(renderCalendar(anchor,value=>{
      if(disposed)return;clearError();input.value=value;lastValue=value;proxy.value=display(value);invalidShown=false;
      if(input.getAttribute('aria-invalid')==='true'&&input.validity.valid)input.removeAttribute('aria-invalid');
      sync();close(true);emit('input');emit('change');
    },{confirm:true,value:selected,min,max,onCancel:()=>close(true)}));
    popup.hidden=false;popup.showModal();opened=true;closeCurrent=close;
    proxy.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');wrapper.dataset.open='';
    position();popup.querySelector<HTMLButtonElement>('.af-calendar__day[tabindex="0"]')?.focus();
  }
  toggle.addEventListener('click',()=>opened?close(true):open(),{signal});
  proxy.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();open()}
  },{signal});
  proxy.addEventListener('input',event=>{
    event.stopPropagation();clearError();const text=proxy.value.trim(),value=parse(text);
    input.value=value??'';lastValue=input.value;
    if(text&&!value)parseError();if(text.length>=8)invalidShown=true;
    emit('input');sync();
  },{signal});
  proxy.addEventListener('change',event=>{event.stopPropagation();invalidShown=true;emit('change');if(!ownError)sync(true)},{signal});
  proxy.addEventListener('blur',()=>{if(proxy.value||input.required)invalidShown=true;sync(!ownError)},{signal});
  const fromNative=()=>{if(!dispatching)close();sync(!dispatching)};
  input.addEventListener('input',fromNative,{signal});input.addEventListener('change',fromNative,{signal});
  input.addEventListener('focus',()=>{sync();proxy.focus()},{signal});
  input.addEventListener('invalid',event=>{event.preventDefault();invalidShown=true;close();sync();proxy.focus()},{signal});
  input.form?.addEventListener('reset',event=>setTimeout(()=>{if(disposed||event.defaultPrevented)return;clearError();invalidShown=false;close();sync(true)},0),{signal});
  popup.addEventListener('cancel',event=>{event.preventDefault();close(true)},{signal});
  popup.addEventListener('close',()=>{if(opened)close(true)},{signal});
  popup.addEventListener('click',event=>{
    if(event.target!==popup)return;const r=popup.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close(true);
  },{signal});
  popup.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...popup.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(control=>control.tabIndex>=0);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first?.focus()}
  },{signal});
  doc.addEventListener('scroll',event=>{if(!popup.contains(event.target as Node))position()},{capture:true,passive:true,signal});
  win.addEventListener('resize',position,{signal});win.visualViewport?.addEventListener('resize',position,{signal});win.visualViewport?.addEventListener('scroll',position,{signal});
  const resize=new ResizeObserver(position);resize.observe(wrapper);resize.observe(popup);
  const observer=new MutationObserver(records=>{
    const reset=records.some(record=>record.target!==input||['min','max','value','type','disabled','readonly','data-af-date-native'].includes(record.attributeName??''));
    sync();if(opened){if(reset)close(true);else position()}
  });
  observer.observe(input,{attributes:true});
  for(let parent=input.parentElement;parent;parent=parent.parentElement){if(parent instanceof HTMLFieldSetElement)observer.observe(parent,{attributes:true,attributeFilter:['disabled']})}
  function destroy(){
    if(disposed)return;const focused=doc.activeElement===proxy||popup.contains(doc.activeElement);
    close();disposed=true;abort.abort();observer.disconnect();resize.disconnect();clearError();
    input.classList.remove('af-datepicker--enhanced');
    if(oldTabIndex===null)input.removeAttribute('tabindex');else input.setAttribute('tabindex',oldTabIndex);
    if(oldAriaHidden===null)input.removeAttribute('aria-hidden');else input.setAttribute('aria-hidden',oldAriaHidden);
    labels.forEach(({label,id})=>{if(label.id===id)label.removeAttribute('id')});
    if(input.parentElement===wrapper){if(wrapper.parentNode)wrapper.replaceWith(input);else wrapper.removeChild(input)}else wrapper.remove();
    if(enhanced.get(input)===destroy)enhanced.delete(input);if(focused)input.focus();
  }
  enhanced.set(input,destroy);sync();if(hadFocus)proxy.focus();return destroy;
}
