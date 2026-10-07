import { initComponents } from '@alabuga/framework';
import { formMarkup } from '../apps/docs/src/examples';
import './style.css';
document.querySelector('#form')!.innerHTML=formMarkup;
initComponents();
document.querySelector('form')!.addEventListener('af:submit',()=>{document.querySelector<HTMLElement>('#form-success')!.hidden=false});
