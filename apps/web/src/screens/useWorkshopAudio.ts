import { useCallback,useState } from 'react';

export type WorkshopSound='click'|'select'|'purchase'|'install'|'engine';
let sharedContext:AudioContext|null=null;

function context():AudioContext{
  sharedContext??=new AudioContext();
  return sharedContext;
}

function ping(ctx:AudioContext,frequency:number,start:number,duration:number,type:OscillatorType='sine',volume=.035):void{
  const oscillator=ctx.createOscillator();const gain=ctx.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
  gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain).connect(ctx.destination);oscillator.start(start);oscillator.stop(start+duration);
}

function emit(sound:WorkshopSound):void{
  const ctx=context();const now=ctx.currentTime+.005;
  if(ctx.state==='suspended')void ctx.resume();
  if(sound==='click')ping(ctx,820,now,.045,'square',.018);
  if(sound==='select'){ping(ctx,260,now,.06,'sawtooth',.022);ping(ctx,520,now+.035,.08,'square',.018);}
  if(sound==='purchase'){[392,523,659,784].forEach((frequency,index)=>ping(ctx,frequency,now+index*.055,.16,'triangle',.04));}
  if(sound==='install'){[180,240,320].forEach((frequency,index)=>ping(ctx,frequency,now+index*.045,.09,'square',.026));}
  if(sound==='engine'){
    const oscillator=ctx.createOscillator();const gain=ctx.createGain();
    oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(72,now);oscillator.frequency.exponentialRampToValueAtTime(190,now+.65);oscillator.frequency.exponentialRampToValueAtTime(82,now+1.05);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.045,now+.08);gain.gain.exponentialRampToValueAtTime(.0001,now+1.08);
    oscillator.connect(gain).connect(ctx.destination);oscillator.start(now);oscillator.stop(now+1.1);
  }
}

export function useWorkshopAudio(){
  const [enabled,setEnabled]=useState(()=>{try{return window.localStorage.getItem('nitto1320.workshop.sound')!=='off';}catch{return true;}});
  const play=useCallback((sound:WorkshopSound)=>{if(enabled)emit(sound);},[enabled]);
  const toggle=useCallback(()=>setEnabled(current=>{const next=!current;try{window.localStorage.setItem('nitto1320.workshop.sound',next?'on':'off');}catch{}return next;}),[]);
  return{enabled,play,toggle};
}
