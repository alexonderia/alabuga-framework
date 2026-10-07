import {z} from 'zod';
import type {AFDocument,Section} from '@alabuga/framework/schema';
export const MODEL='qwen3.5:2b';
export const requestSchema=z.object({kind:z.enum(['page','presentation']),scope:z.enum(['section','document']),count:z.number().int().min(1).max(6),prompt:z.string().trim().min(3).max(1800),audience:z.string().max(200),sources:z.string().max(6000)}).strict().superRefine((r,c)=>{if(r.scope==='section'&&r.count!==1||r.kind==='page'&&r.count>5)c.addIssue({code:'custom',message:'Выберите одну секцию, до пяти секций сайта или до шести слайдов.'});});
export type GenerationRequest=z.infer<typeof requestSchema>;
export type Material={id:string;name:string;description:string;src:string;category:string};
export type GenerationProgress={stage:'connection'|'outline'|'section'|'check'|'ready'|'error'|'cancelled';current:number;total:number;message:string};
export type OutlineItem={composition:string;title:string;purpose:string};
export type DraftResult={awaitingOutline?:boolean;id:string;request:GenerationRequest;outline:OutlineItem[];sections:(Section|null)[];errors:Record<number,string>;warnings:string[];title:string;updated:number;projectId:string;anchorId:string;status:GenerationProgress;model:string;materialIds?:string[]};
export interface AIProvider {contentOnly?:boolean;status(signal?:AbortSignal):Promise<{model:string;version:string;digest:string;context:number;loaded?:unknown}>;generate(system:string,prompt:string,format:Record<string,unknown>,signal:AbortSignal):Promise<unknown>}
export const commands={
 createSection:z.object({tool:z.literal('createSection'),composition:z.string(),theme:z.enum(['light','contrast','accent']),motion:z.enum(['none','fade','sequence'])}).strict(),
 setText:z.object({tool:z.literal('setText'),slot:z.number().int(),heading:z.string().max(65),text:z.string().max(280)}).strict(),
 setCards:z.object({tool:z.literal('setCards'),slot:z.number().int(),items:z.array(z.object({title:z.string().max(40),text:z.string().max(160)}).strict()).min(2).max(3)}).strict(),
 setMetric:z.object({tool:z.literal('setMetric'),slot:z.number().int(),value:z.string().max(16),note:z.string().max(65)}).strict(),
 setImage:z.object({tool:z.literal('setImage'),slot:z.number().int(),asset:z.string().max(100),alt:z.string().min(1).max(140)}).strict(),
 setGallery:z.object({tool:z.literal('setGallery'),slot:z.number().int(),items:z.array(z.object({asset:z.string().max(100),alt:z.string().min(1).max(140),caption:z.string().max(80)}).strict()).min(1).max(3)}).strict(),
 setQuote:z.object({tool:z.literal('setQuote'),slot:z.number().int(),text:z.string().max(200),author:z.string().max(80)}).strict(),
 setButton:z.object({tool:z.literal('setButton'),slot:z.number().int(),label:z.string().max(32),href:z.string().max(200)}).strict(),
 setTable:z.object({tool:z.literal('setTable'),slot:z.number().int(),columns:z.array(z.string().max(40)).min(2).max(3),rows:z.array(z.array(z.string().max(100)).min(2).max(3)).min(1).max(4)}).strict(),
};
export const commandSchema=z.discriminatedUnion('tool',[commands.createSection,commands.setText,commands.setCards,commands.setMetric,commands.setImage,commands.setGallery,commands.setQuote,commands.setButton,commands.setTable]);
export type AICommand=z.infer<typeof commandSchema>;
export const batchSchema=z.object({commands:z.array(commandSchema).min(2).max(12)}).strict();
export function draftDocument(d:DraftResult):AFDocument{return {schemaVersion:3,kind:d.request.kind,title:d.title||'Черновик ИИ',pages:d.sections.filter((p):p is Section=>!!p)}}
