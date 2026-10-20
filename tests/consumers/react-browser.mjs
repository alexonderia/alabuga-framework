import React,{StrictMode,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AlabugaDocument} from './react-document.mjs';
window.lifecycle={mount:0,destroy:0,update:0};
const initial={schemaVersion:3,kind:'page',title:'React',pages:[{id:'p',title:'',grid:{columns:12,rowHeight:64,gap:16},widgets:[{id:'t',type:'text',title:'',position:{col:1,row:1,width:6,height:4},content:[{type:'paragraph',text:'Original',dropCap:false}]}]}]};
function Application(){const [doc,setDocument]=useState(initial),[visible,setVisible]=useState(true);return React.createElement(React.Fragment,null,React.createElement('button',{id:'update',onClick:()=>setDocument({...doc,pages:[{...doc.pages[0],widgets:[{...doc.pages[0].widgets[0],content:[{type:'paragraph',text:'Updated',dropCap:false}]}]}]})},'Update'),React.createElement('button',{id:'unmount',onClick:()=>setVisible(false)},'Unmount'),visible&&React.createElement(AlabugaDocument,{document:doc,onLifecycle:event=>window.lifecycle[event]++}))}
createRoot(document.getElementById('root')).render(React.createElement(StrictMode,null,React.createElement(Application)));
