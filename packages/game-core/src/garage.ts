import type { Car } from './types/car.js';
import type { Build, Part } from './types/part.js';
import { getCar } from './data/cars/index.js';
import { getPart, PARTS } from './data/parts/index.js';
export interface GarageState { readonly cash:number; readonly build:Build; readonly ownedPartIds:readonly string[]; }
export type GarageResult={readonly ok:true;readonly state:GarageState}|{readonly ok:false;readonly reason:string};
export function createGarageState(carId='civic-si',cash=10_000):GarageState{return{cash,build:{carId,fittedPartIds:[]},ownedPartIds:[]};}
export function canFit(build:Build,part:Part):string|null{
  if(part.compatibleCarIds.length&&!part.compatibleCarIds.includes(build.carId))return'Not compatible with this car.';
  if(build.fittedPartIds.includes(part.id))return'Already installed.';
  const missing=part.requires.filter(id=>!build.fittedPartIds.includes(id));
  if(missing.length)return`Requires ${missing.map(id=>getPart(id).displayName).join(', ')}.`;
  const conflict=build.fittedPartIds.map(getPart).find(f=>f.exclusionGroups.some(g=>part.exclusionGroups.includes(g)));
  return conflict?`Conflicts with ${conflict.displayName}.`:null;
}
export function buyPart(state:GarageState,id:string):GarageResult{const part=getPart(id);if(state.ownedPartIds.includes(id))return{ok:false,reason:'Already owned.'};if(part.compatibleCarIds.length&&!part.compatibleCarIds.includes(state.build.carId))return{ok:false,reason:'Not compatible with this car.'};if(state.cash<part.price)return{ok:false,reason:'Not enough cash.'};return{ok:true,state:{...state,cash:state.cash-part.price,ownedPartIds:[...state.ownedPartIds,id]}};}
export function fitPart(state:GarageState,id:string):GarageResult{if(!state.ownedPartIds.includes(id))return{ok:false,reason:'Buy this part first.'};const reason=canFit(state.build,getPart(id));if(reason)return{ok:false,reason};return{ok:true,state:{...state,build:{...state.build,fittedPartIds:[...state.build.fittedPartIds,id]}}};}
export function removePart(state:GarageState,id:string):GarageResult{if(!state.build.fittedPartIds.includes(id))return{ok:false,reason:'Not installed.'};const dependent=state.build.fittedPartIds.map(getPart).find(p=>p.requires.includes(id));if(dependent)return{ok:false,reason:`${dependent.displayName} requires this part.`};return{ok:true,state:{...state,build:{...state.build,fittedPartIds:state.build.fittedPartIds.filter(x=>x!==id)}}};}
export function resolveBuild(build:Build):Car{const base=getCar(build.carId);let tm=1,kg=0,grip=1,eff=0;for(const id of build.fittedPartIds){const e=getPart(id).effects;tm*=e.torqueMultiplier??1;kg+=e.massDeltaKg??0;grip*=e.tyreGripMultiplier??1;eff+=e.drivelineEfficiencyDelta??0;}return{...base,engine:{...base.engine,curve:base.engine.curve.map(q=>({...q,torqueNm:q.torqueNm*tm}))},chassis:{...base.chassis,massKg:Math.max(500,base.chassis.massKg+kg)},tyres:{...base.tyres,peakGrip:base.tyres.peakGrip*grip},gearbox:{...base.gearbox,driveEfficiency:Math.min(.98,base.gearbox.driveEfficiency+eff)}};}
export function partList():readonly Part[]{return[...PARTS.values()];}
