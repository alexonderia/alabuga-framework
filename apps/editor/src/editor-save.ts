import type {AFDocument} from '@alabuga/framework/schema';

export type SaveState='saving'|'saved'|'failed';
export interface SaveServices {
 write:(id:string,document:AFDocument)=>Promise<AFDocument>;
 revision:(id:string,document:AFDocument)=>Promise<unknown>;
 state:(state:SaveState,error?:unknown)=>void;
 changed:(id:string)=>void;
 revisionError:(error:unknown)=>void;
 revisionDelay?:number;
}

/** Serializes writes and keeps completion from an older write out of the current UI. */
export class EditorSaveQueue {
 queue:Promise<void>=Promise.resolve();
 error=false;
 private generation=0;
 private stopped=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private services:SaveServices){}
 save(id:string,document:AFDocument){
  if(this.stopped)return;
  const snapshot=structuredClone(document),generation=++this.generation;
  clearTimeout(this.timer);this.services.state('saving');
  this.queue=this.queue.catch(()=>{}).then(async()=>{
   const stored=await this.services.write(id,snapshot);this.error=false;
   if(this.stopped)return;
   this.services.changed(id);
   if(generation!==this.generation)return;
   this.services.state('saved');
   this.timer=setTimeout(()=>{void this.services.revision(id,stored).catch(e=>{if(!this.stopped)this.services.revisionError(e)})},this.services.revisionDelay??30000);
  }).catch(error=>{
   this.error=true;
   if(!this.stopped&&generation===this.generation)this.services.state('failed',error);
  });
 }
 destroy(){this.stopped=true;clearTimeout(this.timer)}
}
