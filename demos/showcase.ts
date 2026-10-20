import '@alabuga/framework/standalone.css';
import {renderDocument,showcase} from '@alabuga/framework';
const kind=new URLSearchParams(location.search).get('kind')==='presentation'?'presentation':'page';
const doc=showcase(kind);document.title=doc.title;
Object.assign(window,{demoController:renderDocument(document.getElementById('document')!,doc)});
