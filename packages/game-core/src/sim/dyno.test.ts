import { describe,expect,it } from 'vitest';
import { applyTune,createGarageState,purchaseAndFitPart,resolveBuild,type GarageResult,type GarageState } from '../garage.js';
import { stockTune,validateTune } from '../types/tune.js';
import { drive,goodDrivePlan } from '../testing/drive.js';
import { kwToHp,powerKwAtRpm,torqueAtRpm } from './engine.js';
import { runDyno } from './dyno.js';

function succeed(result:GarageResult):{state:GarageState}{if(!result.ok)throw new Error(result.reason);return result;}

describe('Stage 4 tuning and dyno',()=>{
  // The gearset has to be fitted first now: a production gearbox has the ratios
  // it has, and the Tuning screen is shut until one is changed for another.
  it('saves a valid tune without mutating the input state',()=>{const state=succeed(purchaseAndFitPart(createGarageState(),'close-ratio-gearset')).state;const tune={gearRatios:[3.1,2,1.4,1,.7],finalDrive:3.9};const result=applyTune(state,tune);expect(result).toMatchObject({ok:true,state:{tune}});expect(state.tune).toEqual(stockTune(resolveBuild(state.build)));});
  it('refuses to change the gearing until a gearset is fitted',()=>{const state=createGarageState();const attempt=applyTune(state,{gearRatios:[3.1,2,1.4,1,.7],finalDrive:3.9});expect(attempt.ok).toBe(false);if(!attempt.ok)expect(attempt.reason).toMatch(/gearset/i);
    // Putting it back to standard is always allowed, so removing the gearset
    // cannot strand a car on ratios it is no longer entitled to.
    expect(applyTune(state,stockTune(resolveBuild(state.build))).ok).toBe(true);});
  it('rejects the wrong gear count, crossed ratios and impossible values',()=>{const car=resolveBuild(createGarageState().build);expect(validateTune(car,{gearRatios:[3,2],finalDrive:4})).toMatch(/requires/);expect(validateTune(car,{gearRatios:[3,2,2.1,1,.7],finalDrive:4})).toMatch(/taller/);expect(validateTune(car,{gearRatios:[3,2,1.4,1,.7],finalDrive:20})).toMatch(/Final drive/);});
  it('makes ratios materially change quarter-mile performance',()=>{const car=resolveBuild(createGarageState().build);const stock=drive(car,stockTune(car),goodDrivePlan(7)).slip;const tall=drive(car,{...stockTune(car),finalDrive:2.2},goodDrivePlan(7)).slip;expect(tall.quarterMileEt!-stock.quarterMileEt!).toBeGreaterThan(1);});
  it('allows a poor tune to make a more powerful car slower than stock',()=>{const stock=resolveBuild(createGarageState().build);const modified=resolveBuild({carId:'civic-si',fittedPartIds:['panel-filter','sports-muffler','ecu-reflash','rear-seat-delete','street-tyres']});const stockPass=drive(stock,stockTune(stock),goodDrivePlan(7)).slip;const badTune={gearRatios:[4.5,3.5,2.5,1.5,.55],finalDrive:5.5};const modifiedPass=drive(modified,badTune,goodDrivePlan(7)).slip;expect(modifiedPass.quarterMileEt!).toBeGreaterThan(stockPass.quarterMileEt!);});
  it('samples the same resolved curve used by the simulator',()=>{const car=resolveBuild(createGarageState().build);const result=runDyno(car,500);for(const point of result.points){expect(point.torqueNm).toBeCloseTo(torqueAtRpm(car.engine.curve,point.rpm),10);expect(point.horsepower).toBeCloseTo(kwToHp(powerKwAtRpm(car.engine.curve,point.rpm)),10);}expect(result.points.at(-1)?.rpm).toBe(car.engine.redlineRpm);});
  it('responds to fitted performance parts',()=>{const stock=runDyno(resolveBuild(createGarageState().build));const modified=runDyno(resolveBuild({carId:'civic-si',fittedPartIds:['panel-filter','sports-muffler','ecu-reflash']}));expect(modified.peakHorsepower).toBeGreaterThan(stock.peakHorsepower);expect(modified.peakTorqueNm).toBeGreaterThan(stock.peakTorqueNm);});
});
