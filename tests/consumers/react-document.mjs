import React,{useEffect,useRef} from 'react';
import {renderDocument} from '@alabuga/framework';
/** React owns the host; Framework exclusively owns its children. */
export function AlabugaDocument({document,assetsBaseUrl,onLifecycle=()=>{}}){
 const host=useRef(null),controller=useRef(null);
 useEffect(()=>{controller.current=renderDocument(host.current,document,{assetsBaseUrl});onLifecycle('mount');return()=>{controller.current?.destroy();controller.current=null;onLifecycle('destroy')}},[assetsBaseUrl]);
 useEffect(()=>{controller.current?.update(document);onLifecycle('update')},[document]);
 return React.createElement('div',{ref:host});
}
