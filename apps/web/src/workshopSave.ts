import { createGarageState, getCar, partList, stockTune, validateTune, type GarageState, type Tune } from '@nitto/game-core';

const STORAGE_KEY='nitto1320.workshop.v1';

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
    return{cash:Math.round(candidate.cash),ownedPartIds:owned,build:{carId:candidate.build.carId,fittedPartIds:fitted},tune,condition};
  }catch{return null;}
}

export function loadWorkshopState():GarageState{
  try{return parseWorkshopSave(window.localStorage.getItem(STORAGE_KEY))??createGarageState();}
  catch{return createGarageState();}
}

export function saveWorkshopState(state:GarageState):void{
  try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{/* Storage can be unavailable in privacy modes. */}
}
