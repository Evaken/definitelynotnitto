import type {Appearance,DecalPlacement} from '@nitto/game-core';
import {CIVIC_ASSET_PACK,civicAssetUrl,type CivicViewId,type Point,type Quad,type WheelSlot} from './civicPack.js';

const imageCache=new Map<string,HTMLImageElement>();
const loadCache=new Map<string,Promise<HTMLImageElement>>();
const frameCache=new Map<string,HTMLCanvasElement>();

function image(url:string):HTMLImageElement{
  const found=imageCache.get(url);if(found)return found;
  const created=new Image();created.decoding='async';created.src=url;imageCache.set(url,created);return created;
}

function load(url:string):Promise<HTMLImageElement>{
  const found=loadCache.get(url);if(found)return found;
  const target=image(url);const promise=target.complete&&target.naturalWidth?Promise.resolve(target):new Promise<HTMLImageElement>((resolve,reject)=>{target.addEventListener('load',()=>resolve(target),{once:true});target.addEventListener('error',()=>reject(new Error(`Unable to load car layer: ${url}`)),{once:true});});
  loadCache.set(url,promise);return promise;
}

export function preloadCivicPack(view:CivicViewId):Promise<readonly HTMLImageElement[]>{
  const manifest=CIVIC_ASSET_PACK.views[view];return Promise.all([load(civicAssetUrl(manifest.bodyAsset)),load(civicAssetUrl(manifest.paintMaskAsset)),...(manifest.wheelAsset?[load(civicAssetUrl(manifest.wheelAsset))]:[])]);
}

export async function renderCivicToCanvas(canvas:HTMLCanvasElement,view:CivicViewId,appearance:Appearance):Promise<void>{
  await preloadCivicPack(view);drawCivic(canvas,view,appearance);
}

/** Synchronous frame access for the requestAnimationFrame race renderer. */
export function civicFrame(view:CivicViewId,appearance:Appearance):HTMLCanvasElement|null{
  if(typeof document==='undefined'||typeof Image==='undefined')return null;
  const manifest=CIVIC_ASSET_PACK.views[view],body=image(civicAssetUrl(manifest.bodyAsset)),mask=image(civicAssetUrl(manifest.paintMaskAsset));
  if(!body.complete||!body.naturalWidth||!mask.complete||!mask.naturalWidth){void preloadCivicPack(view);return null;}
  const key=`${CIVIC_ASSET_PACK.assetVersion}:${view}:${JSON.stringify(appearance)}`;const found=frameCache.get(key);if(found)return found;
  const canvas=document.createElement('canvas');drawCivic(canvas,view,appearance);frameCache.set(key,canvas);
  if(frameCache.size>24)frameCache.delete(frameCache.keys().next().value as string);
  return canvas;
}

function drawCivic(canvas:HTMLCanvasElement,view:CivicViewId,appearance:Appearance):void{
  const manifest=CIVIC_ASSET_PACK.views[view],body=image(civicAssetUrl(manifest.bodyAsset)),mask=image(civicAssetUrl(manifest.paintMaskAsset));
  canvas.width=manifest.width;canvas.height=manifest.height;const ctx=canvas.getContext('2d');if(!ctx)return;
  const bodyOffset=view==='garage'?-appearance.rideHeight*.18:0;
  ctx.clearRect(0,0,canvas.width,canvas.height);if(view==='race-rear')drawShadow(ctx,view);
  drawSpoiler(ctx,view,appearance,bodyOffset,true);
  ctx.drawImage(body,0,bodyOffset,manifest.width,manifest.height);
  drawPaint(ctx,body,mask,view,appearance,bodyOffset);
  if(view==='garage'&&manifest.wheelAsset&&appearance.components.wheels!=='wheel-stock')for(const slot of manifest.wheels)drawWheel(ctx,slot,appearance.components.wheels,image(civicAssetUrl(manifest.wheelAsset)));
  drawHood(ctx,view,appearance,bodyOffset);
  drawGraphics(ctx,mask,view,appearance,bodyOffset);
  drawPanelComponents(ctx,view,appearance,bodyOffset);
  drawDecals(ctx,view,appearance,bodyOffset);
  drawSpoiler(ctx,view,appearance,bodyOffset,false);
}

function layerCanvas(width:number,height:number):[HTMLCanvasElement,CanvasRenderingContext2D]{
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D is required for the car compositor.');return[canvas,ctx];
}

function drawPaint(ctx:CanvasRenderingContext2D,body:HTMLImageElement,mask:HTMLImageElement,view:CivicViewId,appearance:Appearance,offset:number):void{
  const [layer,paint]=layerCanvas(ctx.canvas.width,ctx.canvas.height),[coverage,coverageCtx]=layerCanvas(ctx.canvas.width,ctx.canvas.height);
  coverageCtx.drawImage(mask,0,offset,coverage.width,coverage.height);
  if(view==='race-rear')extendRacePaintCoverage(coverageCtx,body);
  paint.drawImage(body,0,offset,ctx.canvas.width,ctx.canvas.height);
  const source=paint.getImageData(0,0,paint.canvas.width,paint.canvas.height),coveragePixels=coverageCtx.getImageData(0,0,coverage.width,coverage.height),output=paint.createImageData(paint.canvas.width,paint.canvas.height),histogram=new Uint32Array(256);
  let paintedPixelCount=0;
  for(let index=0;index<source.data.length;index+=4){
    if(source.data[index+3]!<8||coveragePixels.data[index+3]!<8)continue;
    const luminance=paintLuminance(source.data[index]!,source.data[index+1]!,source.data[index+2]!);histogram[luminance]=(histogram[luminance]??0)+1;paintedPixelCount++;
  }
  const cumulative=new Uint32Array(256);let running=0;for(let index=0;index<histogram.length;index++){running+=histogram[index]!;cumulative[index]=running;}
  for(let index=0;index<source.data.length;index+=4){
    const sourceAlpha=source.data[index+3]!,maskAlpha=coveragePixels.data[index+3]!;if(sourceAlpha<8||maskAlpha<8)continue;
    const luminance=paintLuminance(source.data[index]!,source.data[index+1]!,source.data[index+2]!),rank=paintedPixelCount?((cumulative[luminance]!-histogram[luminance]!*0.5)/paintedPixelCount):.5,[red,green,blue]=canonicalPaintRgb(appearance.hue,appearance.saturation,rank);
    output.data[index]=red;output.data[index+1]=green;output.data[index+2]=blue;output.data[index+3]=Math.round(sourceAlpha*maskAlpha/255);
  }
  paint.clearRect(0,0,paint.canvas.width,paint.canvas.height);paint.putImageData(output,0,0);ctx.drawImage(layer,0,0);
}

function paintLuminance(red:number,green:number,blue:number):number{return Math.max(0,Math.min(255,Math.round(red*.2126+green*.7152+blue*.0722)));}

/** A source-independent 11-level paint ramp shared by every Civic view. */
export function canonicalPaintRgb(hue:number,saturation:number,brightnessRank:number):readonly[number,number,number]{
  const rank=Math.max(0,Math.min(1,brightnessRank)),lightness=Math.round((18+rank*60)/6)*6,sat=Math.max(0,Math.min(100,saturation))*(1-Math.max(0,lightness-60)/110),h=((hue%360)+360)%360/360,s=sat/100,l=lightness/100;
  if(s===0){const grey=Math.round(l*255);return[grey,grey,grey];}
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,toChannel=(offset:number)=>{let t=h+offset;if(t<0)t+=1;if(t>1)t-=1;const value=t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p;return Math.round(value*255);};
  return[toChannel(1/3),toChannel(0),toChannel(-1/3)];
}

/**
 * The recovered rear sprite was authored as neutral panels with yellow trim,
 * but its old mask covered only the neutral panels. Add only the yellow body
 * pixels that belong to the roof, mirrors, panel edges and bumper. The amber
 * lamp centres deliberately remain outside this extension.
 */
function extendRacePaintCoverage(coverage:CanvasRenderingContext2D,body:HTMLImageElement):void{
  const [source,sourceCtx]=layerCanvas(coverage.canvas.width,coverage.canvas.height);sourceCtx.drawImage(body,0,0,source.width,source.height);
  const sourcePixels=sourceCtx.getImageData(0,0,source.width,source.height),maskPixels=coverage.getImageData(0,0,coverage.canvas.width,coverage.canvas.height),width=source.width;
  for(let index=0;index<sourcePixels.data.length;index+=4){
    const pixel=index/4,x=pixel%width,y=Math.floor(pixel/width),red=sourcePixels.data[index]!,green=sourcePixels.data[index+1]!,blue=sourcePixels.data[index+2]!,alpha=sourcePixels.data[index+3]!;
    if(!isRaceBodyColourPixel(red,green,blue,alpha,x,y))continue;
    maskPixels.data[index]=255;maskPixels.data[index+1]=255;maskPixels.data[index+2]=255;maskPixels.data[index+3]=255;
  }
  coverage.putImageData(maskPixels,0,0);
}

export function isRaceBodyColourPixel(red:number,green:number,blue:number,alpha:number,x:number,y:number):boolean{
  const isYellowPaint=alpha>80&&red>125&&green>65&&blue<120&&red>green*1.05&&green>blue*1.25;
  if(!isYellowPaint)return false;
  return y<198||y>320||(x>=186&&x<=201)||(x>=564&&x<=580);
}

function drawGraphics(ctx:CanvasRenderingContext2D,mask:HTMLImageElement,view:CivicViewId,appearance:Appearance,offset:number):void{
  if(appearance.graphicsId==='none')return;const [layer,graphics]=layerCanvas(ctx.canvas.width,ctx.canvas.height);graphics.fillStyle=`hsl(${appearance.graphicsHue} 90% 55%)`;
  if(view==='garage'){
    const hood:Quad=[[.405,.387],[.458,.389],[.368,.556],[.309,.547]],roof:Quad=[[.586,.165],[.63,.163],[.695,.181],[.648,.185]];
    if(appearance.graphicsId==='centre-stripe'){fillQuad(graphics,hood,offset);fillQuad(graphics,roof,offset);}
    else if(appearance.graphicsId==='twin-stripe'){fillSplitQuad(graphics,hood,offset);fillSplitQuad(graphics,roof,offset);}
    else fillQuad(graphics,[[.622,.49],[.91,.446],[.918,.492],[.617,.552]],offset);
  }else{
    if(appearance.graphicsId==='centre-stripe')fillQuad(graphics,[[.46,.33],[.54,.33],[.55,.72],[.45,.72]],offset);
    else if(appearance.graphicsId==='twin-stripe'){fillQuad(graphics,[[.43,.33],[.48,.33],[.48,.72],[.42,.72]],offset);fillQuad(graphics,[[.52,.33],[.57,.33],[.58,.72],[.52,.72]],offset);}
    else fillQuad(graphics,[[.25,.49],[.75,.44],[.75,.51],[.25,.57]],offset);
  }
  if(view!=='garage'){graphics.globalCompositeOperation='destination-in';graphics.drawImage(mask,0,offset,graphics.canvas.width,graphics.canvas.height);}
  ctx.save();ctx.globalAlpha=.82;ctx.drawImage(layer,0,0);ctx.restore();
}

function drawShadow(ctx:CanvasRenderingContext2D,view:CivicViewId):void{
  ctx.save();ctx.fillStyle='rgba(0,0,0,.55)';ctx.filter='blur(8px)';ctx.beginPath();if(view==='garage')ctx.ellipse(410,421,350,23,-.025,0,Math.PI*2);else ctx.ellipse(384,430,245,22,0,0,Math.PI*2);ctx.fill();ctx.restore();
}

function drawWheel(ctx:CanvasRenderingContext2D,slot:WheelSlot,id:string,rim:HTMLImageElement):void{
  const x=slot.x*ctx.canvas.width,y=slot.y*ctx.canvas.height,r=slot.radius*ctx.canvas.height;ctx.save();ctx.translate(x,y);ctx.rotate(slot.rotation);ctx.scale(slot.squash,1);
  ctx.filter=id==='wheel-drag'?'grayscale(.75) brightness(1.22)':id==='wheel-five-spoke'?'brightness(1.08)':'none';const diameter=r*1.56;ctx.drawImage(rim,-diameter*.5,-diameter*.5,diameter,diameter);ctx.restore();
}

function drawSpoiler(ctx:CanvasRenderingContext2D,view:CivicViewId,appearance:Appearance,offset:number,behind:boolean):void{
  const id=appearance.components.spoiler;if(id==='spoiler-none')return;ctx.save();ctx.translate(0,offset);ctx.lineJoin='round';ctx.strokeStyle='#071015';ctx.fillStyle=`hsl(${appearance.hue} ${Math.max(25,appearance.saturation)}% ${Math.max(18,appearance.brightness*.42)}%)`;
  if(view==='garage'){
    if(!behind&&id==='spoiler-lip'){polygon(ctx,[[646,91],[688,96],[684,103],[641,97]]);ctx.fill();ctx.strokeStyle='rgba(210,232,238,.55)';ctx.lineWidth=1;ctx.stroke();}
    if(!behind&&id==='spoiler-gt'){
      ctx.strokeStyle='#172329';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(659,119);ctx.lineTo(657,101);ctx.moveTo(704,126);ctx.lineTo(700,105);ctx.stroke();
      ctx.fillStyle='#172329';polygon(ctx,[[617,88],[724,96],[720,106],[618,98]]);ctx.fill();ctx.strokeStyle='#91a6ae';ctx.lineWidth=1;ctx.stroke();
    }
  }else if(!behind){const y=id==='spoiler-gt'?112:146;ctx.fillRect(id==='spoiler-gt'?205:276,y,id==='spoiler-gt'?358:216,id==='spoiler-gt'?13:7);if(id==='spoiler-gt'){ctx.fillRect(238,y,11,54);ctx.fillRect(519,y,11,54);}}
  ctx.restore();
}

function drawHood(ctx:CanvasRenderingContext2D,view:CivicViewId,appearance:Appearance,offset:number):void{
  if(view!=='garage'||appearance.components.hood==='hood-stock')return;const hood=surfacePolygon(CIVIC_ASSET_PACK.views.garage.surfaces.hood,ctx.canvas.width,ctx.canvas.height);ctx.save();ctx.translate(0,offset);polygon(ctx,hood);ctx.clip();
  if(appearance.components.hood==='hood-carbon'){
    ctx.fillStyle='#10171b';ctx.fillRect(70,180,420,125);ctx.strokeStyle='#46565d';ctx.lineWidth=1;for(let x=40;x<560;x+=9){ctx.beginPath();ctx.moveTo(x,174);ctx.lineTo(x-140,320);ctx.stroke();}
  }else{
    const light=Math.max(18,appearance.brightness*.37),paint=ctx.createLinearGradient(105,285,455,192);paint.addColorStop(0,`hsl(${appearance.hue} ${appearance.saturation}% ${light*.7}%)`);paint.addColorStop(.5,`hsl(${appearance.hue} ${appearance.saturation}% ${light}%)`);paint.addColorStop(1,`hsl(${appearance.hue} ${appearance.saturation}% ${light*.76}%)`);ctx.fillStyle=paint;ctx.fillRect(70,180,420,125);
    const sheen=ctx.createLinearGradient(150,280,420,200);sheen.addColorStop(0,'rgba(255,255,255,0)');sheen.addColorStop(.58,appearance.finishId==='matte'?'rgba(180,200,205,.08)':'rgba(255,255,255,.25)');sheen.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sheen;ctx.fillRect(70,180,420,125);
    if(appearance.components.hood==='hood-vented'){ctx.fillStyle='rgba(3,10,13,.86)';polygon(ctx,[[247,249],[333,226],[371,230],[287,257]]);ctx.fill();ctx.strokeStyle='#52636a';ctx.lineWidth=2;for(let y=0;y<4;y++){ctx.beginPath();ctx.moveTo(266+y*7,246-y*2);ctx.lineTo(345+y*5,228+y);ctx.stroke();}}
  }
  ctx.restore();ctx.save();ctx.translate(0,offset);ctx.strokeStyle='rgba(205,230,238,.42)';ctx.lineWidth=1.2;polygon(ctx,hood);ctx.stroke();ctx.restore();
}

function drawPanelComponents(ctx:CanvasRenderingContext2D,view:CivicViewId,appearance:Appearance,offset:number):void{
  ctx.save();ctx.translate(0,offset);
  if(view==='garage'){
    const headlights:CivicPolygon[]=[[[49,252],[84,240],[99,250],[101,287],[74,300],[50,289]],[[227,269],[278,260],[332,266],[350,283],[341,310],[296,320],[244,309]]];
    if(appearance.components.roof==='roof-sunroof'){ctx.fillStyle='rgba(4,11,17,.72)';polygon(ctx,[[411,84],[566,82],[616,92],[450,98]]);ctx.fill();ctx.strokeStyle='rgba(143,170,181,.7)';ctx.lineWidth=1;ctx.stroke();}
    if(appearance.components.headlights==='lights-smoked'){
      ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle='rgba(14,16,18,.42)';for(const light of headlights){polygon(ctx,light);ctx.fill();}ctx.restore();
      ctx.strokeStyle='rgba(180,195,201,.3)';ctx.lineWidth=1;for(const light of headlights){polygon(ctx,light);ctx.stroke();}
    }
  }else{
    if(appearance.components.exhaustTip!=='exhaust-stock'){ctx.strokeStyle=appearance.components.exhaustTip==='exhaust-titanium'?'#6f83e7':'#e5ecef';ctx.lineWidth=7;ctx.beginPath();ctx.arc(493,381,17,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();
}

type CivicPolygon=readonly Point[];
function drawDecals(ctx:CanvasRenderingContext2D,view:CivicViewId,appearance:Appearance,offset:number):void{
  const surfaces=CIVIC_ASSET_PACK.views[view].surfaces;for(const decal of appearance.decals){const quad=surfaces[decal.surface];if(!quad||quad.every(point=>point[0]===0&&point[1]===0))continue;const point=quadPoint(quad,decal.x,decal.y),angle=Math.atan2(quad[1][1]-quad[0][1],quad[1][0]-quad[0][0]),clip=surfacePolygon(quad,ctx.canvas.width,ctx.canvas.height),scale=.55+Math.min(.7,decal.scale)*1.05;ctx.save();ctx.translate(0,offset);polygon(ctx,clip);ctx.clip();ctx.translate(point[0]*ctx.canvas.width,point[1]*ctx.canvas.height);ctx.rotate(angle+decal.rotation*Math.PI/180);ctx.scale(scale,scale);drawPixelDecal(ctx,decal.decalId,decal.colorHue,view);ctx.restore();}
}

function drawPixelDecal(ctx:CanvasRenderingContext2D,id:string,hue:number,view:CivicViewId):void{
  const colour=`hsl(${hue} 88% 58%)`,size=view==='garage'?1:.74;ctx.scale(size,size);ctx.lineJoin='miter';ctx.strokeStyle='rgba(0,0,0,.88)';ctx.fillStyle=colour;ctx.lineWidth=3;
  if(id==='decal-1320'){
    ctx.fillStyle='rgba(238,241,232,.9)';ctx.strokeRect(-29,-13,58,26);ctx.fillRect(-29,-13,58,26);ctx.fillStyle='#10171b';ctx.font='900 19px Arial Narrow,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('1320',0,1);return;
  }
  ctx.beginPath();
  if(id==='decal-bolt'){polygon(ctx,[[-5,-18],[10,-18],[3,-3],[14,-3],[-8,20],[-2,5],[-13,5]]);}
  else {ctx.fillStyle='rgba(238,241,232,.92)';ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=colour;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:14,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
  ctx.stroke();ctx.fill();
}

export function quadPoint(quad:Quad,x:number,y:number):Point{
  const top:[number,number]=[mix(quad[0][0],quad[1][0],x),mix(quad[0][1],quad[1][1],x)],bottom:[number,number]=[mix(quad[3][0],quad[2][0],x),mix(quad[3][1],quad[2][1],x)];return[mix(top[0],bottom[0],y),mix(top[1],bottom[1],y)];
}
function mix(a:number,b:number,t:number):number{return a+(b-a)*t;}
function surfacePolygon(quad:Quad,width:number,height:number):CivicPolygon{return quad.map(([x,y])=>[x*width,y*height] as const);}
function fillQuad(ctx:CanvasRenderingContext2D,quad:Quad,offset:number):void{polygon(ctx,quad.map(([x,y])=>[x*ctx.canvas.width,y*ctx.canvas.height+offset] as const));ctx.fill();}
function fillSplitQuad(ctx:CanvasRenderingContext2D,quad:Quad,offset:number):void{fillQuad(ctx,[quadPoint(quad,0,.0),quadPoint(quad,.36,0),quadPoint(quad,.36,1),quadPoint(quad,0,1)],offset);fillQuad(ctx,[quadPoint(quad,.64,0),quadPoint(quad,1,0),quadPoint(quad,1,1),quadPoint(quad,.64,1)],offset);}
function polygon(ctx:CanvasRenderingContext2D,points:CivicPolygon):void{ctx.beginPath();points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
