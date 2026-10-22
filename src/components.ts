import {initSelects} from './select.js';
import {initDatePickers} from './datepicker.js';

const active = new WeakMap<HTMLElement, () => void>();
/** Enhance trusted library markup. Call the returned cleanup before removing it. */
export function initComponents(root: HTMLElement = document.body): () => void {
  active.get(root)?.();
  const disposeSelects=initSelects(root);
  const disposeDatePickers=initDatePickers(root);
  const abort=new AbortController();const previous=new Map<HTMLDialogElement,HTMLElement>();
  // Counters are opt-in; inputs retain native value and maxlength semantics.
  root.querySelectorAll<HTMLElement>('[data-af-counter-for]').forEach(counter=>{
    const field=root.ownerDocument.getElementById(counter.dataset.afCounterFor??'');
    if(!(field instanceof HTMLTextAreaElement||field instanceof HTMLInputElement)||!root.contains(field))return;
    const update=()=>{const length=field.value.length;const text=field.maxLength>=0?`${length}/${field.maxLength}`:String(length);if(counter.textContent!==text)counter.textContent=text};
    update();
    field.addEventListener('input',update,{signal:abort.signal});
    field.addEventListener('change',update,{signal:abort.signal});
    field.form?.addEventListener('reset',event=>setTimeout(()=>{if(!abort.signal.aborted&&!event.defaultPrevented)update()},0),{signal:abort.signal});
    const observer=new MutationObserver(update);observer.observe(field,{attributes:true,attributeFilter:['maxlength']});
    abort.signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
  });
  // ARIA describes state; prevent activation of links and busy buttons as well.
  const preventUnavailable=(event:Event)=>{
    const target=event.target instanceof Element?event.target.closest('.af-btn'):null;
    if(target&&root.contains(target)&&(target.getAttribute('aria-disabled')==='true'||target.getAttribute('aria-busy')==='true')){
      event.preventDefault();event.stopImmediatePropagation();
    }
  };
  root.addEventListener('click',preventUnavailable,{capture:true,signal:abort.signal});
  root.addEventListener('auxclick',preventUnavailable,{capture:true,signal:abort.signal});
  const dialogs=Array.from(root.querySelectorAll<HTMLDialogElement>('dialog.af-dialog'));
  root.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLElement>('[data-af-dialog-open],[data-af-dialog-close],[data-af-dismiss]');
    if(!target||!root.contains(target))return;
    if(target.hasAttribute('data-af-dialog-open')){
      const dialog=dialogs.find(d=>d.id===target.dataset.afDialogOpen);
      if(dialog&&!dialog.open){previous.set(dialog,target);dialog.showModal()}
    }else if(target.hasAttribute('data-af-dialog-close'))target.closest('dialog')?.close();
    else {
      const item=target.closest<HTMLElement>('.af-alert,.af-chip');
      if(!item)return;
      const focused=item.contains(item.ownerDocument.activeElement);
      const buttons=[...(item.parentElement?.querySelectorAll<HTMLElement>('[data-af-dismiss]:not(:disabled)')??[])];
      const index=buttons.findIndex(button=>button===target||button.contains(target));
      const next=buttons.slice(index+1).find(button=>!item.contains(button))??buttons.slice(0,index).reverse().find(button=>!item.contains(button));
      item.remove();if(focused&&next?.isConnected)next.focus();
    }
  },{signal:abort.signal});
  dialogs.forEach(d=>d.addEventListener('close',()=>{previous.get(d)?.focus();previous.delete(d)},{signal:abort.signal}));
  const forms=Array.from(root.querySelectorAll<HTMLFormElement>('form[data-af-validate]'));
  if(root.matches('form[data-af-validate]'))forms.unshift(root as HTMLFormElement);
  const originalNoValidate=new Map(forms.map(f=>[f,f.noValidate]));
  forms.forEach(form=>{
    form.noValidate=true;
    const controls=()=>Array.from(form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input:not([data-af-datepicker-proxy]),textarea,select')).filter(field=>field.willValidate);
    const showError=(field:HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement)=>{
      const invalid=!field.validity.valid;field.setAttribute('aria-invalid',String(invalid));
      const message=Array.from(form.querySelectorAll<HTMLElement>('[data-af-error-for]')).find(n=>n.dataset.afErrorFor===field.id);
      if(message){message.textContent=invalid?field.validationMessage:'';message.hidden=!invalid}
    };
    form.addEventListener('submit',e=>{e.preventDefault();controls().forEach(showError);const invalid=controls().find(f=>!f.validity.valid);if(invalid)invalid.focus();else form.dispatchEvent(new CustomEvent('af:submit',{bubbles:true,detail:new FormData(form)}))},{signal:abort.signal});
    form.addEventListener('input',e=>{const f=e.target;if(f instanceof HTMLInputElement||f instanceof HTMLTextAreaElement||f instanceof HTMLSelectElement)showError(f)},{signal:abort.signal});
    form.addEventListener('change',e=>{const f=e.target;if(f instanceof HTMLInputElement||f instanceof HTMLTextAreaElement||f instanceof HTMLSelectElement)showError(f)},{signal:abort.signal});
    form.addEventListener('reset',event=>setTimeout(()=>{if(abort.signal.aborted||event.defaultPrevented)return;controls().forEach(field=>{field.removeAttribute('aria-invalid');const message=Array.from(form.querySelectorAll<HTMLElement>('[data-af-error-for]')).find(n=>n.dataset.afErrorFor===field.id);if(message){message.textContent='';message.hidden=true}})},0),{signal:abort.signal});
  });
  let disposed=false;
  const cleanup=()=>{if(disposed)return;disposed=true;abort.abort();disposeSelects();disposeDatePickers();dialogs.forEach(d=>{if(d.open)d.close()});forms.forEach(f=>f.noValidate=originalNoValidate.get(f)!);if(active.get(root)===cleanup)active.delete(root)};
  active.set(root,cleanup);return cleanup;
}
