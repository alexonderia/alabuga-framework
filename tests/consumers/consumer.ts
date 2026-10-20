import {validateDocument,renderDocument,type AFDocument,type DocumentController} from '@alabuga/framework';
import {fitSlide,type FitSlideOptions} from '@alabuga/framework/slide-fit';
import {exportHTML,type ExportOptions} from '@alabuga/framework/export';
const input:unknown={};const result=validateDocument(input);
if(result.success){const document:AFDocument=result.data;const options:FitSlideOptions={assetsBaseUrl:'https://example.org/assets/'};void fitSlide(document.pages[0],options);const controller:DocumentController=renderDocument(globalThis.document.createElement('div'),document,options);controller.destroy();const output:ExportOptions={runtime:{css:'',script:''},assetsBaseUrl:options.assetsBaseUrl};void exportHTML(document,output)}
