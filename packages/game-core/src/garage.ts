import type { Car } from './types/car.js';
import type { Build, Part } from './types/part.js';
import { getCar } from './data/cars/index.js';
import { getPart, PARTS } from './data/parts/index.js';
import { chargeTorqueMultiplier } from './sim/boost.js';
import type { InductionType, NitrousSpec } from './types/car.js';
import { stockTune, validateTune, type Tune } from './types/tune.js';
import { DAMAGE } from './config/historical.js';
export interface Transaction { readonly id:string; readonly kind:'cpu-prize'|'repair'|'part'|'car'; readonly amount:number; readonly description:string; }
export interface PlayerRecord { readonly wins:number; readonly losses:number; readonly races:number; }
export interface Appearance {readonly hue:number;readonly saturation:number;readonly brightness:number;readonly graphicsHue:number;readonly wheelStyle:number;readonly rideHeight:number;}
export interface OwnedCarState {readonly build:Build;readonly ownedPartIds:readonly string[];readonly tune:Tune;readonly condition:number;readonly appearance:Appearance;}
export interface GarageState { readonly cash:number; readonly build:Build; readonly ownedPartIds:readonly string[]; readonly tune:Tune; readonly condition:number; readonly appearance:Appearance; readonly ownedCars:readonly OwnedCarState[]; readonly record:PlayerRecord; readonly transactions:readonly Transaction[]; }
export type GarageResult={readonly ok:true;readonly state:GarageState}|{readonly ok:false;readonly reason:string};
export interface PurchaseInstallPlan { readonly part:Part; readonly price:number; readonly replacedPartIds:readonly string[]; }
export type PurchaseInstallPreview={readonly ok:true;readonly plan:PurchaseInstallPlan}|{readonly ok:false;readonly reason:string};
export const stockAppearance=():Appearance=>({hue:48,saturation:78,brightness:88,graphicsHue:195,wheelStyle:0,rideHeight:0});
const stockOwnedCar=(carId:string):OwnedCarState=>({build:{carId,fittedPartIds:[]},ownedPartIds:[],tune:stockTune(getCar(carId)),condition:100,appearance:stockAppearance()});
export function createGarageState(carId='civic-si',cash=10_000):GarageState{return{cash,...stockOwnedCar(carId),ownedCars:[],record:{wins:0,losses:0,races:0},transactions:[]};}
const transaction=(state:GarageState,kind:Transaction['kind'],amount:number,description:string):readonly Transaction[]=>[...state.transactions,{id:`${state.record.races}-${state.transactions.length}-${kind}`,kind,amount,description}].slice(-50);
export function applyTune(state:GarageState,tune:Tune):GarageResult{const reason=validateTune(getCar(state.build.carId),tune);return reason?{ok:false,reason}:{ok:true,state:{...state,tune:{gearRatios:[...tune.gearRatios],finalDrive:tune.finalDrive}}};}
export function repairCost(state:GarageState):number{return Math.ceil(Math.max(0,100-state.condition)*DAMAGE.repairDollarsPerPoint.value);}
export function repairCar(state:GarageState):GarageResult{const cost=repairCost(state);if(cost===0)return{ok:false,reason:'No repairs required.'};if(state.cash<cost)return{ok:false,reason:'Not enough cash for repairs.'};return{ok:true,state:{...state,cash:state.cash-cost,condition:100,transactions:transaction(state,'repair',-cost,'Vehicle repairs')}};}
export function applyPassStress(state:GarageState,stress:number):GarageState{return{...state,condition:Math.max(0,state.condition-Math.max(0,stress))};}
export function applyAppearance(state:GarageState,appearance:Appearance):GarageResult{const values=[appearance.hue,appearance.saturation,appearance.brightness,appearance.graphicsHue,appearance.wheelStyle,appearance.rideHeight];if(values.some(value=>!Number.isFinite(value)))return{ok:false,reason:'Invalid appearance settings.'};return{ok:true,state:{...state,appearance:{hue:Math.max(0,Math.min(360,appearance.hue)),saturation:Math.max(0,Math.min(100,appearance.saturation)),brightness:Math.max(35,Math.min(115,appearance.brightness)),graphicsHue:Math.max(0,Math.min(360,appearance.graphicsHue)),wheelStyle:Math.max(0,Math.min(3,Math.round(appearance.wheelStyle))),rideHeight:Math.max(-35,Math.min(25,appearance.rideHeight))}}};}
export function ownedCarIds(state:GarageState):readonly string[]{return[state.build.carId,...state.ownedCars.map(car=>car.build.carId)];}
export function buyCar(state:GarageState,carId:string):GarageResult{const car=getCar(carId);if(ownedCarIds(state).includes(carId))return{ok:false,reason:'Car already owned.'};if(state.cash<car.price)return{ok:false,reason:'Not enough cash.'};return{ok:true,state:{...state,cash:state.cash-car.price,ownedCars:[...state.ownedCars,stockOwnedCar(carId)],transactions:transaction(state,'car',-car.price,`${car.manufacturer} ${car.displayName}`)}};}
export function selectCar(state:GarageState,carId:string):GarageResult{if(carId===state.build.carId)return{ok:false,reason:'Car already selected.'};const selected=state.ownedCars.find(car=>car.build.carId===carId);if(!selected)return{ok:false,reason:'Car not owned.'};const current:OwnedCarState={build:state.build,ownedPartIds:state.ownedPartIds,tune:state.tune,condition:state.condition,appearance:state.appearance};return{ok:true,state:{...state,...selected,ownedCars:[...state.ownedCars.filter(car=>car.build.carId!==carId),current]}};}
export type CpuDifficulty='easy'|'medium'|'hard';
export const CPU_PRIZES:Readonly<Record<CpuDifficulty,number>>={easy:450,medium:900,hard:1800};
export function settleCpuRace(state:GarageState,difficulty:CpuDifficulty,won:boolean):GarageState{const prize=won?CPU_PRIZES[difficulty]:0;const label=difficulty[0]!.toUpperCase()+difficulty.slice(1);return{...state,cash:state.cash+prize,record:{wins:state.record.wins+(won?1:0),losses:state.record.losses+(won?0:1),races:state.record.races+1},transactions:prize?transaction(state,'cpu-prize',prize,`${label} CPU race win`):state.transactions};}
export function canFit(build:Build,part:Part):string|null{
  if(part.compatibleCarIds.length&&!part.compatibleCarIds.includes(build.carId))return'Not compatible with this car.';
  if(build.fittedPartIds.includes(part.id))return'Already installed.';
  const missing=part.requires.filter(id=>!build.fittedPartIds.includes(id));
  if(missing.length)return`Requires ${missing.map(id=>getPart(id).displayName).join(', ')}.`;
  const conflict=build.fittedPartIds.map(getPart).find(f=>f.exclusionGroups.some(g=>part.exclusionGroups.includes(g)));
  return conflict?`Conflicts with ${conflict.displayName}.`:null;
}
export function buyPart(state:GarageState,id:string):GarageResult{const part=getPart(id);if(state.ownedPartIds.includes(id))return{ok:false,reason:'Already owned.'};if(part.compatibleCarIds.length&&!part.compatibleCarIds.includes(state.build.carId))return{ok:false,reason:'Not compatible with this car.'};if(state.cash<part.price)return{ok:false,reason:'Not enough cash.'};return{ok:true,state:{...state,cash:state.cash-part.price,ownedPartIds:[...state.ownedPartIds,id],transactions:transaction(state,'part',-part.price,part.displayName)}};}
export function fitPart(state:GarageState,id:string):GarageResult{if(!state.ownedPartIds.includes(id))return{ok:false,reason:'Buy this part first.'};const reason=canFit(state.build,getPart(id));if(reason)return{ok:false,reason};return{ok:true,state:{...state,build:{...state.build,fittedPartIds:[...state.build.fittedPartIds,id]}}};}
export function removePart(state:GarageState,id:string):GarageResult{if(!state.build.fittedPartIds.includes(id))return{ok:false,reason:'Not installed.'};const dependent=state.build.fittedPartIds.map(getPart).find(p=>p.requires.includes(id));if(dependent)return{ok:false,reason:`${dependent.displayName} requires this part.`};return{ok:true,state:{...state,build:{...state.build,fittedPartIds:state.build.fittedPartIds.filter(x=>x!==id)}}};}

/**
 * Describe the complete effect of buying and installing a component before any
 * state changes. The Speedshop uses this for the original-style confirmation
 * dialog, especially when a new component replaces conflicting hardware.
 */
export function previewPurchaseAndFit(state:GarageState,id:string):PurchaseInstallPreview{
  const part=getPart(id);
  if(state.build.fittedPartIds.includes(id))return{ok:false,reason:'Already installed.'};
  if(part.compatibleCarIds.length&&!part.compatibleCarIds.includes(state.build.carId))return{ok:false,reason:'Not compatible with this car.'};
  const missing=part.requires.filter(requirement=>!state.build.fittedPartIds.includes(requirement));
  if(missing.length)return{ok:false,reason:`Requires ${missing.map(requirement=>getPart(requirement).displayName).join(', ')}.`};
  const price=state.ownedPartIds.includes(id)?0:part.price;
  if(state.cash<price)return{ok:false,reason:'Not enough cash.'};

  const replaced=new Set(state.build.fittedPartIds.filter(fittedId=>
    getPart(fittedId).exclusionGroups.some(group=>part.exclusionGroups.includes(group))));
  let changed=true;
  while(changed){
    changed=false;
    for(const fittedId of state.build.fittedPartIds){
      if(!replaced.has(fittedId)&&getPart(fittedId).requires.some(requirement=>replaced.has(requirement))){
        replaced.add(fittedId);changed=true;
      }
    }
  }
  return{ok:true,plan:{part,price,replacedPartIds:[...replaced]}};
}

/** Buy (if necessary), install, and remove conflicts as one state transition. */
export function purchaseAndFitPart(state:GarageState,id:string):GarageResult{
  const preview=previewPurchaseAndFit(state,id);
  if(!preview.ok)return preview;
  const {part,price,replacedPartIds}=preview.plan;
  const removed=new Set(replacedPartIds);
  return{ok:true,state:{
    ...state,
    cash:state.cash-price,
    ownedPartIds:state.ownedPartIds.includes(id)?state.ownedPartIds:[...state.ownedPartIds,id],
    transactions:price?transaction(state,'part',-price,part.displayName):state.transactions,
    build:{...state.build,fittedPartIds:[...state.build.fittedPartIds.filter(fittedId=>!removed.has(fittedId)),part.id]},
  }};
}
/**
 * Turn a build into the car the simulator actually runs.
 *
 * Forced induction is collected first, then baked into the torque curve point
 * by point. The boosted curve is just a curve, so nothing downstream -- the
 * shift point, the dyno, the simulator -- needs to know a turbo exists.
 */
export function resolveBuild(build:Build,condition=100):Car{
  const base=getCar(build.carId);
  let tm=1,kg=0,grip=1,eff=0;
  let boostBar=0,spoolRpm=0,clutchNm=0;
  let induction:InductionType|null=null;
  let nitrous:NitrousSpec|undefined;

  for(const id of build.fittedPartIds){
    const e=getPart(id).effects;
    tm*=e.torqueMultiplier??1;
    kg+=e.massDeltaKg??0;
    grip*=e.tyreGripMultiplier??1;
    eff+=e.drivelineEfficiencyDelta??0;
    // A clutch replaces rather than stacks: the strongest fitted one holds.
    clutchNm=Math.max(clutchNm,e.clutchCapacityNm??0);
    if(e.peakBoostBar){
      boostBar+=e.peakBoostBar;
      // A bigger compressor stacked on a smaller one spools later, not sooner.
      spoolRpm=Math.max(spoolRpm,e.spoolRpm??0);
      induction=e.inductionType??induction??'turbo';
    }
    if(e.nitrousPowerKw&&e.nitrousCapacitySeconds)nitrous={powerKw:e.nitrousPowerKw,capacitySeconds:e.nitrousCapacitySeconds};
  }

  const forcedInduction=induction?{type:induction,peakBoostBar:boostBar,spoolRpm}:undefined;
  const redline=base.engine.redlineRpm;

  const health=Math.max(0,Math.min(100,condition));const damageMultiplier=1-DAMAGE.maximumPowerLoss.value*(1-health/100);
  return{...base,
    engine:{...base.engine,
      // Spread conditionally: exactOptionalPropertyTypes will not take an
      // explicit undefined for an optional property.
      ...(forcedInduction?{forcedInduction}:{}),
      curve:base.engine.curve.map(point=>({...point,
        torqueNm:point.torqueNm*tm*chargeTorqueMultiplier(forcedInduction,point.rpm,redline)*damageMultiplier})),
    },
    chassis:{...base.chassis,massKg:Math.max(500,base.chassis.massKg+kg)},
    tyres:{...base.tyres,peakGrip:base.tyres.peakGrip*grip},
    gearbox:{...base.gearbox,
      ...(clutchNm?{clutchCapacityNm:clutchNm}:{}),
      driveEfficiency:Math.min(.98,base.gearbox.driveEfficiency+eff)},
    ...(nitrous?{nitrous}:{})};
}
export function partList():readonly Part[]{return[...PARTS.values()];}
