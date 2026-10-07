import {generateDraft as generate,newDraft} from '@alabuga/ai/generate';
import {fitSlide} from '@alabuga/framework/slide-fit';
export {newDraft};
export const generateDraft:typeof generate=(draft,provider,materials,signal,save,check,only,options={})=>generate(draft,provider,materials,signal,save,check,only,{...options,services:{fitSlide,...options.services}});
