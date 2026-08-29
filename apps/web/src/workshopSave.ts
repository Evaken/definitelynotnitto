import { createEmptyGarageState, getCar, migrateAppearance, partList, stockTune, validateTune, type GarageState, type OwnedCarState, type Tune } from '@nitto/game-core';

const STORAGE_KEY='nitto1320.workshop.v3',LEGACY_STORAGE_KEY='nitto1320.workshop.v2';

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
    const appearance=migrateAppearance(candidate.appearance),selectedVehicleId=typeof candidate.selectedVehicleId==='string'?candidate.selectedVehicleId:'legacy-selected';
    const ownedCars:OwnedCarState[]=[];const seen=new Set([selectedVehicleId]);
    if(Array.isArray(candidate.ownedCars))for(const raw of candidate.ownedCars){if(!raw||typeof raw!=='object')continue;const item=raw as Partial<OwnedCarState>;const carId=item.build?.carId;if(typeof carId!=='string')continue;let otherCar;try{otherCar=getCar(carId);}catch{continue;}let vehicleId=typeof item.vehicleId==='string'&&item.vehicleId?item.vehicleId:`legacy-${ownedCars.length+2}`;while(seen.has(vehicleId))vehicleId=`${vehicleId}-copy`;const otherOwned=Array.isArray(item.ownedPartIds)?[...new Set(item.ownedPartIds.filter((id):id is string=>typeof id==='string'&&known.has(id)))]:[];const otherSet=new Set(otherOwned);const otherFitted=Array.isArray(item.build?.fittedPartIds)?[...new Set(item.build.fittedPartIds.filter((id):id is string=>typeof id==='string'&&otherSet.has(id)))]:[];const otherTune=item.tune&&validateTune(otherCar,item.tune)===null?item.tune:stockTune(otherCar);ownedCars.push({vehicleId,build:{carId,fittedPartIds:otherFitted},ownedPartIds:otherOwned,tune:otherTune,condition:typeof item.condition==='number'?Math.max(0,Math.min(100,item.condition)):100,appearance:migrateAppearance(item.appearance)});seen.add(vehicleId);}
    const hasSelectedCar=candidate.hasSelectedCar!==false;return{cash:Math.round(candidate.cash),hasSelectedCar,selectedVehicleId:hasSelectedCar?selectedVehicleId:null,nextVehicleSequence:typeof candidate.nextVehicleSequence==='number'&&candidate.nextVehicleSequence>ownedCars.length?Math.floor(candidate.nextVehicleSequence):ownedCars.length+2,ownedPartIds:owned,build:{carId:candidate.build.carId,fittedPartIds:fitted},tune,condition,appearance,ownedCars,record,transactions};
  }catch{return null;}
}

export function loadWorkshopState():GarageState{
  try{return parseWorkshopSave(window.localStorage.getItem(STORAGE_KEY))??parseWorkshopSave(window.localStorage.getItem(LEGACY_STORAGE_KEY))??createEmptyGarageState();}
  catch{return createEmptyGarageState();}
}

export function saveWorkshopState(state:GarageState):void{
  try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{/* Storage can be unavailable in privacy modes. */}
}
