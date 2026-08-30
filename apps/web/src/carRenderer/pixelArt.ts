interface PixelBuffer {
  readonly canvas:HTMLCanvasElement;
  readonly ctx:CanvasRenderingContext2D;
}

const buffers=new WeakMap<HTMLCanvasElement,PixelBuffer>();
const BAYER_4X4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5] as const;

function bufferFor(source:HTMLCanvasElement,width:number,height:number):PixelBuffer|null{
  let buffer=buffers.get(source);
  if(!buffer){const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;buffer={canvas,ctx};buffers.set(source,buffer);}
  if(buffer.canvas.width!==width)buffer.canvas.width=width;
  if(buffer.canvas.height!==height)buffer.canvas.height=height;
  return buffer;
}

/**
 * Converts finished artwork into a deliberately limited, sharp pixel-art
 * frame. This runs after component composition, so every possible appearance
 * recipe receives the same visual language without separate raster variants.
 */
export function pixelateRegion(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,pixelSize=3,paletteStep=32):void{
  if(typeof document==='undefined'||width<=0||height<=0)return;
  const transform=ctx.getTransform(),scaleX=Math.abs(transform.a)||1,scaleY=Math.abs(transform.d)||1;
  const sourceX=Math.round(x*scaleX+transform.e),sourceY=Math.round(y*scaleY+transform.f),sourceWidth=Math.max(1,Math.round(width*scaleX)),sourceHeight=Math.max(1,Math.round(height*scaleY));
  const lowWidth=Math.max(1,Math.round(width/pixelSize)),lowHeight=Math.max(1,Math.round(height/pixelSize)),buffer=bufferFor(ctx.canvas,lowWidth,lowHeight);if(!buffer)return;
  const low=buffer.ctx;low.setTransform(1,0,0,1,0,0);low.clearRect(0,0,lowWidth,lowHeight);low.imageSmoothingEnabled=false;low.drawImage(ctx.canvas,sourceX,sourceY,sourceWidth,sourceHeight,0,0,lowWidth,lowHeight);
  const pixels=low.getImageData(0,0,lowWidth,lowHeight),data=pixels.data;
  for(let py=0;py<lowHeight;py++)for(let px=0;px<lowWidth;px++){
    const offset=(py*lowWidth+px)*4;if(data[offset+3]===0)continue;const threshold=(BAYER_4X4[(py&3)*4+(px&3)]!-7.5)*.22;
    data[offset]=quantiseChannel(data[offset]!+threshold,paletteStep);data[offset+1]=quantiseChannel(data[offset+1]!+threshold,paletteStep);data[offset+2]=quantiseChannel(data[offset+2]!+threshold,paletteStep);data[offset+3]=data[offset+3]!<42?0:data[offset+3]!<180?170:255;
  }
  low.putImageData(pixels,0,0);ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.clearRect(sourceX,sourceY,sourceWidth,sourceHeight);ctx.drawImage(buffer.canvas,0,0,lowWidth,lowHeight,sourceX,sourceY,sourceWidth,sourceHeight);ctx.restore();
}

export function pixelateCanvas(canvas:HTMLCanvasElement,pixelSize=3,paletteStep=32):void{
  const ctx=canvas.getContext('2d');if(ctx)pixelateRegion(ctx,0,0,canvas.width,canvas.height,pixelSize,paletteStep);
}

export function quantiseChannel(value:number,step:number):number{
  const safeStep=Math.max(1,step);
  return Math.max(0,Math.min(255,Math.round(value/safeStep)*safeStep));
}
