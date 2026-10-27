import '@alabuga/framework/standalone.css';
import { renderDocument } from '@alabuga/framework';
import { panelExample } from '@alabuga/framework/examples';
import './style.css';
import './panel.css';
const controller=renderDocument(document.querySelector<HTMLElement>('#document')!,panelExample);
document.querySelector('#resize')!.addEventListener('click',()=>{const doc=controller.getDocument();doc.pages[0].widgets.find(w=>w.id==='comment')!.position.height=3;for(const w of doc.pages[0].widgets){if(w.id==='tasks'||w.id==='people')w.position.row=4;if(w.id==='table'||w.id==='welcome')w.position.row=6}controller.update(doc);document.querySelector('#notice')!.textContent='Комментарий увеличен, остальные блоки сдвинуты ниже'});
document.querySelector('#reset')!.addEventListener('click',()=>{controller.update(panelExample);document.querySelector('#notice')!.textContent='Исходная компоновка'});
