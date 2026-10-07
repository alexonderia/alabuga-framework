import { renderDocument } from '@alabuga/framework';
import { panelExample } from '@alabuga/framework/examples';
import './style.css';
const controller=renderDocument(document.querySelector<HTMLElement>('#document')!,panelExample);
document.querySelector('#resize')!.addEventListener('click',()=>{const doc=controller.getDocument();doc.pages[0].widgets.find(w=>w.id==='comment')!.position.width=1;doc.pages[0].widgets.find(w=>w.id==='tasks')!.position.height=2;doc.pages[0].widgets.find(w=>w.id==='table')!.position.row=4;controller.update(doc);document.querySelector('#notice')!.textContent='Комментарий 1×1 · показатель 1×2 · таблица сдвинута ниже'});
document.querySelector('#reset')!.addEventListener('click',()=>{controller.update(panelExample);document.querySelector('#notice')!.textContent='Исходная компоновка'});
