import {useEffect,useRef,type KeyboardEvent,type PointerEvent} from 'react';

export function edgePanVelocity(pointerX:number,width:number,maxSpeed=10):number{
  if(width<=0)return 0;
  const position=Math.max(-1,Math.min(1,(pointerX/width-.5)*2));
  const deadZone=.5;
  if(Math.abs(position)<=deadZone)return 0;
  const strength=(Math.abs(position)-deadZone)/(1-deadZone);
  return Math.sign(position)*Math.pow(strength,1.55)*maxSpeed;
}

/** Old-client-style carousel: pointer position continuously pans the strip. */
export function useEdgePan<T extends HTMLElement>(){
  const ref=useRef<T|null>(null),velocity=useRef(0),frame=useRef<number|null>(null);
  const stop=()=>{velocity.current=0;if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null;}};
  const tick=()=>{const node=ref.current;if(!node||velocity.current===0){frame.current=null;return;}const previous=node.scrollLeft;node.scrollLeft+=velocity.current;if(node.scrollLeft===previous)velocity.current=0;frame.current=velocity.current===0?null:requestAnimationFrame(tick);};
  const onPointerMove=(event:PointerEvent<T>)=>{if(event.pointerType==='touch')return;const interactive=(event.target as HTMLElement).closest('button,select,input,a');if(interactive){stop();return;}const bounds=event.currentTarget.getBoundingClientRect();velocity.current=edgePanVelocity(event.clientX-bounds.left,bounds.width);if(velocity.current!==0&&frame.current===null)frame.current=requestAnimationFrame(tick);if(velocity.current===0)stop();};
  const onKeyDown=(event:KeyboardEvent<T>)=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();ref.current?.scrollBy({left:event.key==='ArrowRight'?280:-280,behavior:'smooth'});};
  useEffect(()=>stop,[]);
  return{ref,onPointerMove,onPointerLeave:stop,onPointerCancel:stop,onBlur:stop,onKeyDown,tabIndex:0};
}
