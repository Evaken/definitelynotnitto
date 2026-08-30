export type GarageBrowseDirection=-1|0|1;

export const GARAGE_GLIDE_MS=920;
export const GARAGE_EDGE_DWELL_MS=160;
export const GARAGE_EDGE_REPEAT_MS=1200;

export function garageBrowseDirection(pointerX:number,width:number):GarageBrowseDirection{
  if(width<=0)return 0;const position=pointerX/width;return position<.2?-1:position>.8?1:0;
}

export function nextGarageIndex(current:number,length:number,direction:-1|1):number{
  if(length<=0)return 0;return Math.max(0,Math.min(length-1,current+direction));
}

/** Continuous sinusoidal travel: responsive at departure, soft at the bay stop. */
export function garageGlideProgress(progress:number):number{
  const safe=Math.max(0,Math.min(1,progress));return(1-Math.cos(Math.PI*safe))/2;
}
