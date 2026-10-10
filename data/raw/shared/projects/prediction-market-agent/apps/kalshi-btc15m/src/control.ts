import { access } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export class RunControl {
  private root:string;
  private controller=new AbortController();
  constructor(root:string){this.root=root;}
  get signal(){return this.controller.signal;}
  stop(){this.controller.abort(new Error('STOP: execution stopped.'));}
  async check(){
    if(await access(path.join(this.root,'STOP')).then(()=>true).catch(()=>false))this.stop();
    this.signal.throwIfAborted();
  }
  async sleep(milliseconds:number){
    const end=Date.now()+milliseconds;
    do {await this.check();if(Date.now()>=end)return;await delay(Math.min(250,end-Date.now()),undefined,{signal:this.signal});}while(true);
  }
}
