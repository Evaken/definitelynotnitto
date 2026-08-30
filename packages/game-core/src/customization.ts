export const CUSTOMIZATION_SCHEMA_VERSION=1 as const;
export type PaintFinishId='gloss'|'metallic'|'matte';
export type GraphicsId='none'|'centre-stripe'|'twin-stripe'|'side-sweep';
export type DecalSurface='hood'|'left-door'|'right-door'|'roof'|'rear-quarter';
export type VisualSlot='wheels'|'spoiler'|'exhaustTip'|'hood'|'roof'|'headlights';

export interface DecalPlacement {
  readonly instanceId:string;
  readonly decalId:string;
  readonly surface:DecalSurface;
  readonly x:number;
  readonly y:number;
  readonly scale:number;
  readonly rotation:number;
  readonly colorHue:number;
}

export interface VisualComponents {
  readonly wheels:string;
  readonly spoiler:string;
  readonly exhaustTip:string;
  readonly hood:string;
  readonly roof:string;
  readonly headlights:string;
}

export interface Appearance {
  readonly schemaVersion:typeof CUSTOMIZATION_SCHEMA_VERSION;
  readonly hue:number;
  readonly saturation:number;
  readonly brightness:number;
  readonly finishId:PaintFinishId;
  readonly graphicsId:GraphicsId;
  readonly graphicsHue:number;
  /** Transitional numeric wheel index retained for the existing paint UI. */
  readonly wheelStyle:number;
  readonly rideHeight:number;
  readonly components:VisualComponents;
  readonly decals:readonly DecalPlacement[];
}

export interface CustomizationItem {readonly id:string;readonly label:string;readonly slot:VisualSlot;readonly compatibleCarIds:readonly string[];}
export interface DecalItem {readonly id:string;readonly label:string;readonly glyph:string;}

export const WHEEL_IDS=['wheel-stock','wheel-five-spoke','wheel-mesh','wheel-drag'] as const;
export const CUSTOMIZATION_CATALOG:readonly CustomizationItem[]=[
  ...WHEEL_IDS.map((id,index)=>({id,label:['Factory','Five Spoke','Mesh','Drag'][index]!,slot:'wheels' as const,compatibleCarIds:[]})),
  {id:'spoiler-none',label:'No Spoiler',slot:'spoiler',compatibleCarIds:[]},{id:'spoiler-lip',label:'Street Lip',slot:'spoiler',compatibleCarIds:[]},{id:'spoiler-gt',label:'GT Wing',slot:'spoiler',compatibleCarIds:[]},
  {id:'exhaust-stock',label:'Factory Tip',slot:'exhaustTip',compatibleCarIds:[]},{id:'exhaust-chrome',label:'Chrome Tip',slot:'exhaustTip',compatibleCarIds:[]},{id:'exhaust-titanium',label:'Burnt Titanium',slot:'exhaustTip',compatibleCarIds:[]},
  {id:'hood-stock',label:'Factory Hood',slot:'hood',compatibleCarIds:[]},{id:'hood-vented',label:'Vented Hood',slot:'hood',compatibleCarIds:[]},{id:'hood-carbon',label:'Carbon Hood',slot:'hood',compatibleCarIds:[]},
  {id:'roof-stock',label:'Factory Roof',slot:'roof',compatibleCarIds:[]},{id:'roof-sunroof',label:'Sunroof',slot:'roof',compatibleCarIds:[]},
  {id:'lights-stock',label:'Factory Lights',slot:'headlights',compatibleCarIds:[]},{id:'lights-smoked',label:'Smoked Lights',slot:'headlights',compatibleCarIds:[]},
];
export const DECAL_CATALOG:readonly DecalItem[]=[{id:'decal-1320',label:'1320 Number',glyph:'1320'},{id:'decal-bolt',label:'Lightning Bolt',glyph:'ϟ'},{id:'decal-star',label:'Race Star',glyph:'★'}];

export function stockAppearance():Appearance{return{schemaVersion:1,hue:48,saturation:78,brightness:88,finishId:'metallic',graphicsId:'none',graphicsHue:195,wheelStyle:0,rideHeight:0,components:{wheels:'wheel-stock',spoiler:'spoiler-none',exhaustTip:'exhaust-stock',hood:'hood-stock',roof:'roof-stock',headlights:'lights-stock'},decals:[]};}

/**
 * Current production boundary: a factory car with body-colour choice only.
 *
 * The richer schema remains versioned so a future art pipeline can re-enable
 * individual categories without another ownership migration. Until then no
 * old recipe is allowed to leak a guessed visual component into another view.
 */
export function factoryPaintAppearance(value?:Partial<Appearance>):Appearance{
  const stock=stockAppearance();
  return{...stock,hue:clamp(typeof value?.hue==='number'&&Number.isFinite(value.hue)?value.hue:stock.hue,0,360)};
}
export function catalogForSlot(slot:VisualSlot,carId:string):readonly CustomizationItem[]{return CUSTOMIZATION_CATALOG.filter(item=>item.slot===slot&&(!item.compatibleCarIds.length||item.compatibleCarIds.includes(carId)));}

/** Strict normalization used by authoritative state transitions. */
export function validateAppearance(value:Appearance,carId:string):{ok:true;appearance:Appearance}|{ok:false;reason:string}{
  const numbers=[value.hue,value.saturation,value.brightness,value.graphicsHue,value.wheelStyle,value.rideHeight];
  if(numbers.some(number=>!Number.isFinite(number)))return{ok:false,reason:'Invalid appearance settings.'};
  if(!['gloss','metallic','matte'].includes(value.finishId)||!['none','centre-stripe','twin-stripe','side-sweep'].includes(value.graphicsId))return{ok:false,reason:'Unknown paint finish or graphic.'};
  const components=value.components;if(!components)return{ok:false,reason:'Visual component recipe required.'};
  for(const slot of ['wheels','spoiler','exhaustTip','hood','roof','headlights'] as const){const item=CUSTOMIZATION_CATALOG.find(candidate=>candidate.id===components[slot]&&candidate.slot===slot);if(!item||item.compatibleCarIds.length&&!item.compatibleCarIds.includes(carId))return{ok:false,reason:`Invalid ${slot} selection.`};}
  if(!Array.isArray(value.decals)||value.decals.length>24)return{ok:false,reason:'A vehicle may have at most 24 decals.'};
  const ids=new Set<string>();for(const decal of value.decals){if(ids.has(decal.instanceId)||!DECAL_CATALOG.some(item=>item.id===decal.decalId)||!['hood','left-door','right-door','roof','rear-quarter'].includes(decal.surface)||![decal.x,decal.y,decal.scale,decal.rotation,decal.colorHue].every(Number.isFinite)||decal.x<0||decal.x>1||decal.y<0||decal.y>1||decal.scale<.1||decal.scale>1||decal.rotation< -180||decal.rotation>180||decal.colorHue<0||decal.colorHue>360)return{ok:false,reason:'Invalid decal placement.'};ids.add(decal.instanceId);}
  const wheelStyle=WHEEL_IDS.indexOf(components.wheels as typeof WHEEL_IDS[number]);
  return{ok:true,appearance:{...value,schemaVersion:1,hue:clamp(value.hue,0,360),saturation:clamp(value.saturation,0,100),brightness:clamp(value.brightness,35,115),graphicsHue:clamp(value.graphicsHue,0,360),wheelStyle:wheelStyle<0?0:wheelStyle,rideHeight:clamp(value.rideHeight,-35,25),components:{...components},decals:value.decals.map(decal=>({...decal}))}};
}

/** Forgiving migration for old saves that only contained six appearance fields. */
export function migrateAppearance(value:unknown):Appearance{
  const stock=stockAppearance();if(!value||typeof value!=='object')return stock;const item=value as Partial<Appearance>;
  const wheelStyle=Math.round(number(item.wheelStyle,stock.wheelStyle,0,3));const components={...stock.components,...(item.components&&typeof item.components==='object'?item.components:{})};components.wheels=WHEEL_IDS[wheelStyle]??stock.components.wheels;
  const candidate:Appearance={...stock,...item,schemaVersion:1,hue:number(item.hue,stock.hue,0,360),saturation:number(item.saturation,stock.saturation,0,100),brightness:number(item.brightness,stock.brightness,35,115),graphicsHue:number(item.graphicsHue,stock.graphicsHue,0,360),wheelStyle,rideHeight:number(item.rideHeight,stock.rideHeight,-35,25),components,decals:Array.isArray(item.decals)?item.decals:[]};
  const validated=validateAppearance(candidate,'civic-si');
  return validated.ok?factoryPaintAppearance(validated.appearance):stock;
}
function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function number(value:unknown,fallback:number,min:number,max:number):number{return typeof value==='number'&&Number.isFinite(value)?clamp(value,min,max):fallback;}
