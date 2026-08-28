import { describe,expect,it } from 'vitest';
import { applyPassStress,createGarageState,repairCar,repairCost,resolveBuild } from '../garage.js';
import { drive,goodDrivePlan } from '../testing/drive.js';
import { stockTune } from '../types/tune.js';

const nitrousCar=()=>resolveBuild({carId:'civic-si',fittedPartIds:['race-nitrous']});

describe('Stage 5 nitrous and mechanical damage',()=>{
  it('makes nitrous materially improve a pass',()=>{const car=nitrousCar();const dry=drive(car,stockTune(car),goodDrivePlan(31));const sprayed=drive(car,stockTune(car),{...goodDrivePlan(31),nitrousFromGear:2});expect(dry.slip.quarterMileEt!-sprayed.slip.quarterMileEt!).toBeGreaterThan(.15);expect(sprayed.state.nitrousRemainingSeconds).toBeLessThan(car.nitrous!.capacitySeconds);});
  it('makes spray timing change the result',()=>{const car=nitrousCar();const first=drive(car,stockTune(car),{...goodDrivePlan(32),nitrousFromGear:1});const third=drive(car,stockTune(car),{...goodDrivePlan(32),nitrousFromGear:3});expect(Math.abs(first.slip.quarterMileEt!-third.slip.quarterMileEt!)).toBeGreaterThan(.03);});
  it('adds more stress under nitrous than the same dry pass',()=>{const car=nitrousCar();const dry=drive(car,stockTune(car),goodDrivePlan(33));const sprayed=drive(car,stockTune(car),{...goodDrivePlan(33),nitrousFromGear:1});expect(sprayed.state.mechanicalStress).toBeGreaterThan(dry.state.mechanicalStress);});
  it('makes a damaged car slower and repairable for cash',()=>{const healthyState=createGarageState('civic-si',10_000);const damagedState=applyPassStress(healthyState,55);const healthy=resolveBuild(healthyState.build,healthyState.condition);const damaged=resolveBuild(damagedState.build,damagedState.condition);const a=drive(healthy,stockTune(healthy),goodDrivePlan(34)).slip;const b=drive(damaged,stockTune(damaged),goodDrivePlan(34)).slip;expect(b.quarterMileEt!).toBeGreaterThan(a.quarterMileEt!);expect(repairCost(damagedState)).toBeGreaterThan(0);const repaired=repairCar(damagedState);expect(repaired.ok).toBe(true);if(repaired.ok){expect(repaired.state.condition).toBe(100);expect(repaired.state.cash).toBeLessThan(damagedState.cash);}});
});
