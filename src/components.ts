const active = new WeakMap<HTMLElement, () => void>();
/** Enhance trusted library markup. Call the returned cleanup before removing it. */
export function initComponents(root: HTMLElement = document.body): () => void {
  active.get(root)?.();
  const abort=new AbortController();const previous=new Map<HTMLDialogElement,HTMLElement>();
  const dialogs=Array.from(root.querySelectorAll<HTMLDialogElement>('dialog.af-dialog'));
  root.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLElement>('[data-af-dialog-open],[data-af-dialog-close],[data-af-dismiss]');
    if(!target||!root.contains(target))return;
    if(target.hasAttribute('data-af-dialog-open')){
      const dialog=dialogs.find(d=>d.id===target.dataset.afDialogOpen);
      if(dialog&&!dialog.open){previous.set(dialog,target);dialog.showModal()}
    }else if(target.hasAttribute('data-af-dialog-close'))target.closest('dialog')?.close();
    else target.closest('.af-alert')?.remove();
  },{signal:abort.signal});
  dialogs.forEach(d=>d.addEventListener('close',()=>{previous.get(d)?.focus();previous.delete(d)},{signal:abort.signal}));
  const forms=Array.from(root.querySelectorAll<HTMLFormElement>('form[data-af-validate]'));
  const originalNoValidate=new Map(forms.map(f=>[f,f.noValidate]));
  forms.forEach(form=>{
    form.noValidate=true;
    const controls=()=>Array.from(form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input,textarea,select'));
    const showError=(field:HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement)=>{
      const invalid=!field.validity.valid;field.setAttribute('aria-invalid',String(invalid));
      const message=Array.from(form.querySelectorAll<HTMLElement>('[data-af-error-for]')).find(n=>n.dataset.afErrorFor===field.id);
      if(message){message.textContent=invalid?field.validationMessage:'';message.hidden=!invalid}
    };
    form.addEventListener('submit',e=>{e.preventDefault();controls().forEach(showError);const invalid=controls().find(f=>!f.validity.valid);if(invalid)invalid.focus();else form.dispatchEvent(new CustomEvent('af:submit',{bubbles:true,detail:new FormData(form)}))},{signal:abort.signal});
    form.addEventListener('input',e=>{const f=e.target;if(f instanceof HTMLInputElement||f instanceof HTMLTextAreaElement||f instanceof HTMLSelectElement)showError(f)},{signal:abort.signal});
  });
  let disposed=false;
  const cleanup=()=>{if(disposed)return;disposed=true;abort.abort();dialogs.forEach(d=>{if(d.open)d.close()});forms.forEach(f=>f.noValidate=originalNoValidate.get(f)!);if(active.get(root)===cleanup)active.delete(root)};
  active.set(root,cleanup);return cleanup;
}
