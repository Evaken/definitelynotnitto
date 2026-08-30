export type GarageBrowseDirection=-1|0|1;

export function garageBrowseDirection(pointerX:number,width:number):GarageBrowseDirection{
  if(width<=0)return 0;const position=pointerX/width;return position<.2?-1:position>.8?1:0;
}

export function nextGarageIndex(current:number,length:number,direction:-1|1):number{
  if(length<=0)return 0;return Math.max(0,Math.min(length-1,current+direction));
}

/** Deliberate ease-in/out: travel remains visible before the bay locks home. */
export function garageGlideProgress(progress:number):number{
  const safe=Math.max(0,Math.min(1,progress));return safe<.5?4*safe*safe*safe:1-Math.pow(-2*safe+2,3)/2;
}
