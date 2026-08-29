import { createEmptyGarageState, getCar, partList, stockAppearance, stockTune, validateTune, type Appearance, type GarageState, type OwnedCarState, type Tune } from '@nitto/game-core';

const STORAGE_KEY='nitto1320.workshop.v2';

export function parseWorkshopSave(raw:string|null):GarageState|null{
  if(!raw)return null;
  try{
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=='object')return null;
    const candidate=value as Partial<GarageState>;
    if(typeof candidate.cash!=='number'||!Number.isFinite(candidate.cash)||candidate.cash<0)return null;
    if(!candidate.build||typeof candidate.build.carId!=='string'||!Array.isArray(candidate.build.fittedPartIds)||!Array.isArray(candidate.ownedPartIds))return null;
    const known=new Set(partList().map(part=>part.id));
    const owned=[...new Set(candidate.ownedPartIds.filter((id):id is string=>typeof id==='string'&&known.has(id)))];
    const ownedSet=new Set(owned);
    const fitted=[...new Set(candidate.build.fittedPartIds.filter((id):id is string=>typeof id==='string'&&ownedSet.has(id)))];
    let car;try{car=getCar(candidate.build.carId);}catch{return null;}
    const rawTune=(candidate as {tune?:unknown}).tune;
    const proposed=rawTune&&typeof rawTune==='object'&&Array.isArray((rawTune as Tune).gearRatios)&&typeof (rawTune as Tune).finalDrive==='number'?{gearRatios:[...(rawTune as Tune).gearRatios],finalDrive:(rawTune as Tune).finalDrive}:stockTune(car);
    const tune=validateTune(car,proposed)===null?proposed:stockTune(car);
    const condition=typeof candidate.condition==='number'&&Number.isFinite(candidate.condition)?Math.max(0,Math.min(100,candidate.condition)):100;
    const rawRecord=(candidate as Partial<GarageState>).record;const record=rawRecord&&Number.isFinite(rawRecord.wins)&&Number.isFinite(rawRecord.losses)&&Number.isFinite(rawRecord.races)?{wins:Math.max(0,Math.floor(rawRecord.wins)),losses:Math.max(0,Math.floor(rawRecord.losses)),races:Math.max(0,Math.floor(rawRecord.races))}:{wins:0,losses:0,races:0};
    const transactions=Array.isArray(candidate.transactions)?candidate.transactions.filter(item=>item&&typeof item.id==='string'&&typeof item.description==='string'&&typeof item.amount==='number').slice(-50):[];
    const appearance=parseAppearance(candidate.appearance);
    const ownedCars:OwnedCarState[]=[];const seen=new Set([candidate.build.carId]);
    if(Array.isArray(candidate.ownedCars))for(const raw of candidate.ownedCars){if(!raw||typeof raw!=='object')continue;const item=raw as Partial<OwnedCarState>;const carId=item.build?.carId;if(typeof carId!=='string'||seen.has(carId))continue;let otherCar;try{otherCar=getCar(carId);}catch{continue;}const otherOwned=Array.isArray(item.ownedPartIds)?[...new Set(item.ownedPartIds.filter((id):id is string=>typeof id==='string'&&known.has(id)))]:[];const otherSet=new Set(otherOwned);const otherFitted=Array.isArray(item.build?.fittedPartIds)?[...new Set(item.build.fittedPartIds.filter((id):id is string=>typeof id==='string'&&otherSet.has(id)))]:[];const otherTune=item.tune&&validateTune(otherCar,item.tune)===null?item.tune:stockTune(otherCar);ownedCars.push({build:{carId,fittedPartIds:otherFitted},ownedPartIds:otherOwned,tune:otherTune,condition:typeof item.condition==='number'?Math.max(0,Math.min(100,item.condition)):100,appearance:parseAppearance(item.appearance)});seen.add(carId);}
    return{cash:Math.round(candidate.cash),hasSelectedCar:candidate.hasSelectedCar!==false,ownedPartIds:owned,build:{carId:candidate.build.carId,fittedPartIds:fitted},tune,condition,appearance,ownedCars,record,transactions};
  }catch{return null;}
}

function parseAppearance(value:unknown):Appearance{const stock=stockAppearance();if(!value||typeof value!=='object')return stock;const item=value as Partial<Appearance>;return{hue:number(item.hue,stock.hue,0,360),saturation:number(item.saturation,stock.saturation,0,100),brightness:number(item.brightness,stock.brightness,35,115),graphicsHue:number(item.graphicsHue,stock.graphicsHue,0,360),wheelStyle:Math.round(number(item.wheelStyle,stock.wheelStyle,0,3)),rideHeight:number(item.rideHeight,stock.rideHeight,-35,25)};}
function number(value:unknown,fallback:number,min:number,max:number):number{return typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;}

export function loadWorkshopState():GarageState{
  try{return parseWorkshopSave(window.localStorage.getItem(STORAGE_KEY))??createEmptyGarageState();}
  catch{return createEmptyGarageState();}
}

export function saveWorkshopState(state:GarageState):void{
  try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{/* Storage can be unavailable in privacy modes. */}
}
