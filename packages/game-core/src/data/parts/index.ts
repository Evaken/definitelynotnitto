import type { Part, PartCategory, PartEffects } from '../../types/part.js';
import { CARS } from '../cars/index.js';

/**
 * Cars a belt-driven blower will physically go on: the ones that did not leave
 * the factory with a compressor already on the engine.
 *
 * Derived from the roster rather than typed out, so adding a car cannot leave a
 * stale list behind. This is the only genuine fitment restriction in the parts
 * catalogue -- exhausts, intakes, tyres and internals are generic, and an empty
 * `compatibleCarIds` means "fits anything", which is what the rest of them are.
 *
 * Note that this is NOT what stops a part bought for one car appearing on
 * another: parts are owned per vehicle, so buying an exhaust for the Mustang
 * leaves the Viper owning nothing and it has to be bought again. Fitment is a
 * separate question from ownership.
 */
const NATURALLY_ASPIRATED: readonly string[] = [...CARS.values()]
  .filter((car) => car.engine.forcedInduction === undefined)
  .map((car) => car.id);

const note='Assumed progression value; historical calibration is Stage 15.';const p=(id:string,displayName:string,category:PartCategory,price:number,effects:PartEffects,requires:readonly string[]=[],exclusionGroups:readonly string[]=[],compatibleCarIds:readonly string[]=[]):Part=>({id,displayName,category,price,compatibleCarIds,requires,exclusionGroups,effects,calibrationNote:note});
const catalog:readonly Part[]=[
p('panel-filter','High-Flow Panel Filter','intake',180,{torqueMultiplier:1.008},[],['intake-path']),p('cold-air-intake','Cold-Air Intake','intake',520,{torqueMultiplier:1.022},['panel-filter'],['intake-path']),p('short-ram-intake','Short-Ram Intake','intake',390,{torqueMultiplier:1.016},[],['intake-path']),
p('sports-muffler','Sports Muffler','exhaust',360,{torqueMultiplier:1.012}),p('cat-back','Cat-Back Exhaust','exhaust',780,{torqueMultiplier:1.025},['sports-muffler']),p('race-header','4-2-1 Race Header','exhaust',950,{torqueMultiplier:1.032},['cat-back']),
p('ecu-reflash','ECU Reflash','ecu',650,{torqueMultiplier:1.018},[],['engine-management']),p('standalone-ecu','Standalone ECU','ecu',1750,{torqueMultiplier:1.045},['ecu-reflash'],['engine-management']),p('performance-cams','Performance Camshafts','engine',1450,{torqueMultiplier:1.05},['race-header']),p('high-compression-pistons','High-Compression Pistons','engine',2200,{torqueMultiplier:1.065},['performance-cams']),p('ported-head','Ported Cylinder Head','engine',2600,{torqueMultiplier:1.075},['performance-cams']),
p('light-flywheel','Lightweight Flywheel','clutch',680,{drivelineEfficiencyDelta:.006}),p('sports-clutch','Sports Clutch','clutch',900,{drivelineEfficiencyDelta:.008,clutchHoldsTorqueRatio:1.08},[],['clutch']),p('race-clutch','Race Clutch','clutch',1650,{drivelineEfficiencyDelta:.015,clutchHoldsTorqueRatio:1.35},['sports-clutch']),p('short-shifter','Short Shifter','transmission',420,{drivelineEfficiencyDelta:.004}),p('lsd','Limited-Slip Differential','transmission',1800,{tyreGripMultiplier:1.04}),
p('street-tyres','Performance Street Tyres','tyres',600,{tyreGripMultiplier:1.15,tyreSlidingGripFraction:.9},[],['tyres']),p('drag-radials','Drag Radials','tyres',1350,{tyreGripMultiplier:1.45,tyreSlidingGripFraction:.93},['street-tyres'],['tyres']),p('sport-springs','Sport Springs','suspension',550,{tyreGripMultiplier:1.018}),p('adjustable-dampers','Adjustable Dampers','suspension',1150,{tyreGripMultiplier:1.035},['sport-springs']),
p('rear-seat-delete','Rear Seat Delete','weight-reduction',250,{massDeltaKg:-18}),p('lightweight-battery','Lightweight Battery','weight-reduction',480,{massDeltaKg:-10}),p('stage-one-lightening','Stage 1 Weight Reduction','weight-reduction',1100,{massDeltaKg:-42},['rear-seat-delete']),
// Forced induction declares pressure, not a torque bonus: the torque is derived
// from the boost so the gauge and the stopwatch cannot disagree. A turbo makes
// nothing until the exhaust can spin it; a blower is on from idle and climbs
// with engine speed. Both figures are assumed -- Stage 15 owns calibration.
p('turbo-manifold','Turbo Manifold','turbo-accessory',900,{},[],['induction-hardware']),p('intercooler','Front-Mount Intercooler','turbo-accessory',1250,{torqueMultiplier:1.025},['turbo-manifold']),p('street-turbo','Street Turbo Kit','turbo',3800,{peakBoostBar:.6,inductionType:'turbo',spoolRpm:3200},['turbo-manifold','intercooler','sports-clutch'],['forced-induction']),p('race-turbo','Race Spec Turbo Upgrade Kit','turbo',6200,{peakBoostBar:.5,inductionType:'turbo',spoolRpm:4300},['street-turbo','race-clutch'],['forced-induction-upgrade']),
p('supercharger-bracket','Supercharger Bracket Kit','supercharger',850,{},[],['induction-hardware'],NATURALLY_ASPIRATED),p('street-supercharger','Street Supercharger','supercharger',4200,{peakBoostBar:.48,inductionType:'supercharger',spoolRpm:0},['supercharger-bracket','sports-clutch'],['forced-induction'],NATURALLY_ASPIRATED),p('race-supercharger','Race Supercharger','supercharger',6500,{peakBoostBar:.34,inductionType:'supercharger',spoolRpm:0},['street-supercharger','race-clutch'],['forced-induction-upgrade'],NATURALLY_ASPIRATED),
p('street-nitrous','Street Nitrous System','nitrous',1800,{nitrousPowerKw:30,nitrousCapacitySeconds:9},[],['nitrous-system']),p('race-nitrous','Race Nitrous System','nitrous',3600,{nitrousPowerKw:55,nitrousCapacitySeconds:7},['street-nitrous'],['nitrous-system'])];
export const PARTS:ReadonlyMap<string,Part>=new Map(catalog.map(part=>[part.id,part]));
export function getPart(id:string):Part{const part=PARTS.get(id);if(!part)throw new Error(`Unknown part id: ${id}`);return part;}
