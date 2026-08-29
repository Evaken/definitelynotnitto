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
  const manifest=CIVIC_ASSET_PACK.views[view];return Promise.all([load(civicAssetUrl(manifest.bodyAsset)),load(civicAssetUrl(manifest.paintMaskAsset))]);
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
  ctx.clearRect(0,0,canvas.width,canvas.height);drawShadow(ctx,view);
  if(view==='garage')for(const slot of manifest.wheels)drawWheel(ctx,slot,appearance.components.wheels);
  drawSpoiler(ctx,view,appearance,bodyOffset,true);
  ctx.drawImage(body,0,bodyOffset,manifest.width,manifest.height);
  drawPaint(ctx,body,mask,manifest.baseHue,appearance,bodyOffset);
  drawGraphics(ctx,mask,view,appearance,bodyOffset);
  drawPanelComponents(ctx,view,appearance,bodyOffset);
  drawDecals(ctx,view,appearance,bodyOffset);
  drawSpoiler(ctx,view,appearance,bodyOffset,false);
}

function layerCanvas(width:number,height:number):[HTMLCanvasElement,CanvasRenderingContext2D]{
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D is required for the car compositor.');return[canvas,ctx];
}

function drawPaint(ctx:CanvasRenderingContext2D,body:HTMLImageElement,mask:HTMLImageElement,baseHue:number,appearance:Appearance,offset:number):void{
  const [layer,paint]=layerCanvas(ctx.canvas.width,ctx.canvas.height);
  void baseHue;paint.filter=`brightness(${Math.max(.72,appearance.brightness/52)}) contrast(.92)`;paint.drawImage(body,0,offset,ctx.canvas.width,ctx.canvas.height);paint.filter='none';paint.globalCompositeOperation='color';paint.fillStyle=`hsl(${appearance.hue} ${appearance.saturation}% ${Math.max(27,Math.min(74,appearance.brightness*.61))}%)`;paint.fillRect(0,0,paint.canvas.width,paint.canvas.height);paint.globalCompositeOperation='destination-in';paint.drawImage(mask,0,offset,ctx.canvas.width,ctx.canvas.height);paint.globalCompositeOperation='source-over';ctx.drawImage(layer,0,0);
  const [finish,finishCtx]=layerCanvas(ctx.canvas.width,ctx.canvas.height);
  if(appearance.finishId==='matte'){finishCtx.fillStyle='rgba(88,102,110,.2)';finishCtx.fillRect(0,0,finish.width,finish.height);}
  else {const shine=finishCtx.createLinearGradient(0,0,finish.width,finish.height);shine.addColorStop(0,'rgba(255,255,255,.26)');shine.addColorStop(.36,'rgba(255,255,255,0)');shine.addColorStop(.68,appearance.finishId==='metallic'?'rgba(100,210,255,.1)':'rgba(255,255,255,.04)');shine.addColorStop(1,'rgba(255,255,255,0)');finishCtx.fillStyle=shine;finishCtx.fillRect(0,0,finish.width,finish.height);}
  finishCtx.globalCompositeOperation='destination-in';finishCtx.drawImage(mask,0,offset,finish.width,finish.height);ctx.drawImage(finish,0,0);
}

function drawGraphics(ctx:CanvasRenderingContext2D,mask:HTMLImageElement,view:CivicViewId,appearance:Appearance,offset:number):void{
  if(appearance.graphicsId==='none')return;const [layer,graphics]=layerCanvas(ctx.canvas.width,ctx.canvas.height);graphics.fillStyle=`hsl(${appearance.graphicsHue} 90% 55%)`;
  if(view==='garage'){
    const hood:Quad=[[.22,.57],[.46,.43],[.5,.46],[.29,.63]],roof:Quad=[[.52,.22],[.72,.2],[.76,.23],[.55,.27]];
    if(appearance.graphicsId==='centre-stripe'){fillQuad(graphics,hood,offset);fillQuad(graphics,roof,offset);}
    else if(appearance.graphicsId==='twin-stripe'){fillSplitQuad(graphics,hood,offset);fillSplitQuad(graphics,roof,offset);}
    else fillQuad(graphics,[[.59,.5],[.92,.43],[.93,.48],[.61,.57]],offset);
  }else{
    if(appearance.graphicsId==='centre-stripe')fillQuad(graphics,[[.46,.33],[.54,.33],[.55,.72],[.45,.72]],offset);
    else if(appearance.graphicsId==='twin-stripe'){fillQuad(graphics,[[.43,.33],[.48,.33],[.48,.72],[.42,.72]],offset);fillQuad(graphics,[[.52,.33],[.57,.33],[.58,.72],[.52,.72]],offset);}
    else fillQuad(graphics,[[.25,.49],[.75,.44],[.75,.51],[.25,.57]],offset);
  }
  graphics.globalCompositeOperation='destination-in';graphics.drawImage(mask,0,offset,graphics.canvas.width,graphics.canvas.height);ctx.save();ctx.globalAlpha=.82;ctx.drawImage(layer,0,0);ctx.restore();
}

function drawShadow(ctx:CanvasRenderingContext2D,view:CivicViewId):void{
  ctx.save();ctx.fillStyle='rgba(0,0,0,.55)';ctx.filter='blur(8px)';ctx.beginPath();if(view==='garage')ctx.ellipse(410,421,350,23,-.025,0,Math.PI*2);else ctx.ellipse(384,430,245,22,0,0,Math.PI*2);ctx.fill();ctx.restore();
}

function drawWheel(ctx:CanvasRenderingContext2D,slot:WheelSlot,id:string):void{
  const x=slot.x*ctx.canvas.width,y=slot.y*ctx.canvas.height,r=slot.radius*ctx.canvas.height;ctx.save();ctx.translate(x,y);ctx.rotate(slot.rotation);ctx.scale(slot.squash,1);
  const tyre=ctx.createRadialGradient(-r*.22,-r*.2,r*.1,0,0,r);tyre.addColorStop(0,'#41464b');tyre.addColorStop(.55,'#171a1d');tyre.addColorStop(1,'#050607');ctx.fillStyle=tyre;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#090b0d';ctx.beginPath();ctx.arc(0,0,r*.73,0,Math.PI*2);ctx.fill();const rim=ctx.createRadialGradient(-r*.16,-r*.2,0,0,0,r*.68);rim.addColorStop(0,'#f1f4f5');rim.addColorStop(.45,id==='wheel-drag'?'#aeb5bb':'#727a80');rim.addColorStop(1,'#25292d');ctx.fillStyle=rim;ctx.beginPath();ctx.arc(0,0,r*.66,0,Math.PI*2);ctx.fill();
  const spokes=id==='wheel-mesh'?12:id==='wheel-drag'?8:5;ctx.strokeStyle=id==='wheel-drag'?'#d7dbde':'#d2d8dc';ctx.shadowColor='#111';ctx.shadowBlur=2;ctx.lineWidth=Math.max(2,r*(id==='wheel-mesh'?.055:.1));for(let index=0;index<spokes;index++){const angle=index/spokes*Math.PI*2+(id==='wheel-five-spoke'?.18:0);ctx.beginPath();ctx.moveTo(Math.cos(angle)*r*.16,Math.sin(angle)*r*.16);ctx.lineTo(Math.cos(angle)*r*.6,Math.sin(angle)*r*.6);ctx.stroke();if(id==='wheel-mesh'){ctx.beginPath();ctx.moveTo(Math.cos(angle+.18)*r*.16,Math.sin(angle+.18)*r*.16);ctx.lineTo(Math.cos(angle+.36)*r*.6,Math.sin(angle+.36)*r*.6);ctx.stroke();}}
  ctx.fillStyle='#151719';ctx.beginPath();ctx.arc(0,0,r*.13,0,Math.PI*2);ctx.fill();ctx.restore();
}

function drawSpoiler(ctx:CanvasRenderingContext2D,view:CivicViewId,appearance:Appearance,offset:number,behind:boolean):void{
  const id=appearance.components.spoiler;if(id==='spoiler-none')return;ctx.save();ctx.translate(0,offset);ctx.lineJoin='round';ctx.strokeStyle='#071015';ctx.fillStyle=`hsl(${appearance.hue} ${Math.max(25,appearance.saturation)}% ${Math.max(18,appearance.brightness*.42)}%)`;
  if(view==='garage'){
    if(behind){ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(665,120);ctx.lineTo(742,107);ctx.stroke();if(id==='spoiler-gt'){ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(679,117);ctx.lineTo(680,91);ctx.moveTo(728,109);ctx.lineTo(733,82);ctx.stroke();}}
    else if(id==='spoiler-gt'){ctx.strokeStyle='#10181d';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(657,92);ctx.lineTo(748,79);ctx.stroke();ctx.strokeStyle='#8ba0aa';ctx.lineWidth=2;ctx.stroke();}
  }else if(!behind){const y=id==='spoiler-gt'?112:150;ctx.fillRect(205,y,358,id==='spoiler-gt'?13:8);if(id==='spoiler-gt'){ctx.fillRect(238,y,11,54);ctx.fillRect(519,y,11,54);}}
  ctx.restore();
}

function drawPanelComponents(ctx:CanvasRenderingContext2D,view:CivicViewId,appearance:Appearance,offset:number):void{
  ctx.save();ctx.translate(0,offset);
  if(view==='garage'){
    const hood:CivicPolygon=[[92,272],[220,207],[484,218],[359,316]];
    if(appearance.components.hood!=='hood-stock'){clipPolygon(ctx,hood);if(appearance.components.hood==='hood-carbon'){ctx.fillStyle='#121a1e';ctx.fillRect(50,175,450,180);ctx.strokeStyle='#42515a';ctx.lineWidth=1;for(let x=30;x<520;x+=10){ctx.beginPath();ctx.moveTo(x,175);ctx.lineTo(x-160,355);ctx.stroke();}}else{ctx.fillStyle='rgba(20,35,42,.22)';ctx.fillRect(50,175,450,180);ctx.fillStyle='#081014';ctx.beginPath();ctx.ellipse(290,251,58,9,-.2,0,Math.PI*2);ctx.fill();}ctx.restore();}
    if(appearance.components.roof==='roof-sunroof'){ctx.fillStyle='rgba(4,11,17,.78)';polygon(ctx,[[392,98],[535,94],[590,114],[430,121]]);ctx.fill();ctx.strokeStyle='#8aa3ae';ctx.stroke();}
    if(appearance.components.headlights==='lights-smoked'){ctx.fillStyle='rgba(4,8,10,.56)';polygon(ctx,[[47,255],[90,242],[97,315],[49,307]]);ctx.fill();polygon(ctx,[[220,287],[350,289],[357,340],[216,327]]);ctx.fill();}
  }else{
    if(appearance.components.exhaustTip!=='exhaust-stock'){ctx.strokeStyle=appearance.components.exhaustTip==='exhaust-titanium'?'#6f83e7':'#e5ecef';ctx.lineWidth=7;ctx.beginPath();ctx.arc(493,381,17,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();
}

type CivicPolygon=readonly Point[];
function drawDecals(ctx:CanvasRenderingContext2D,view:CivicViewId,appearance:Appearance,offset:number):void{
  const surfaces=CIVIC_ASSET_PACK.views[view].surfaces;for(const decal of appearance.decals){const quad=surfaces[decal.surface];if(!quad||quad.every(point=>point[0]===0&&point[1]===0))continue;const point=quadPoint(quad,decal.x,decal.y),glyph=decal.decalId==='decal-star'?'★':decal.decalId==='decal-bolt'?'ϟ':'1320';ctx.save();ctx.translate(point[0]*ctx.canvas.width,point[1]*ctx.canvas.height+offset);ctx.rotate(decal.rotation*Math.PI/180);ctx.scale(decal.scale,decal.scale);ctx.fillStyle=`hsl(${decal.colorHue} 90% 62%)`;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=3;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${view==='garage'?42:30}px Impact,Arial Narrow,sans-serif`;ctx.strokeText(glyph,0,0);ctx.fillText(glyph,0,0);ctx.restore();}
}

export function quadPoint(quad:Quad,x:number,y:number):Point{
  const top:[number,number]=[mix(quad[0][0],quad[1][0],x),mix(quad[0][1],quad[1][1],x)],bottom:[number,number]=[mix(quad[3][0],quad[2][0],x),mix(quad[3][1],quad[2][1],x)];return[mix(top[0],bottom[0],y),mix(top[1],bottom[1],y)];
}
function mix(a:number,b:number,t:number):number{return a+(b-a)*t;}
function fillQuad(ctx:CanvasRenderingContext2D,quad:Quad,offset:number):void{polygon(ctx,quad.map(([x,y])=>[x*ctx.canvas.width,y*ctx.canvas.height+offset] as const));ctx.fill();}
function fillSplitQuad(ctx:CanvasRenderingContext2D,quad:Quad,offset:number):void{fillQuad(ctx,[quadPoint(quad,0,.0),quadPoint(quad,.36,0),quadPoint(quad,.36,1),quadPoint(quad,0,1)],offset);fillQuad(ctx,[quadPoint(quad,.64,0),quadPoint(quad,1,0),quadPoint(quad,1,1),quadPoint(quad,.64,1)],offset);}
function polygon(ctx:CanvasRenderingContext2D,points:CivicPolygon):void{ctx.beginPath();points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
function clipPolygon(ctx:CanvasRenderingContext2D,points:CivicPolygon):void{ctx.save();polygon(ctx,points);ctx.clip();}
