import { describe,expect,it } from 'vitest';
import { applyAppearance,buyCar,createGarageState,ownedCarIds,selectCar } from '../../garage.js';
import { drive,goodDrivePlan } from '../../testing/drive.js';
import { stockTune } from '../../types/tune.js';
import { chargeTorqueMultiplier } from '../../sim/boost.js';
import { CARS,getCar } from './index.js';

describe('Stages 7 and 8 vehicle garage',()=>{
  it('contains the ten-car normal roster with complete structured data',()=>{const normal=[...CARS.values()].filter(car=>!car.special);expect(normal).toHaveLength(10);for(const car of normal){expect(car.engine.curve.length).toBeGreaterThanOrEqual(5);expect(car.gearbox.gearRatios.length).toBeGreaterThanOrEqual(5);expect(car.price).toBeGreaterThan(0);expect(car.chassis.massKg).toBeGreaterThan(900);}});
  it('gives the first four cars measurably distinct passes',()=>{const ids=['civic-si','rsx-type-s','evo-vii','supra-tt'];const ets=ids.map((id,index)=>{const car=getCar(id);return drive(car,stockTune(car),{...goodDrivePlan(70+index),shiftRpm:car.engine.redlineRpm-100,neutralRevRpm:Math.min(5200,car.engine.redlineRpm-800)}).slip.quarterMileEt;});expect(new Set(ets.map(et=>et.toFixed(2))).size).toBe(4);});
  it('buys and switches cars without losing the previous vehicle state',()=>{let state=createGarageState('civic-si',100_000);const painted=applyAppearance(state,{...state.appearance,hue:310,wheelStyle:2,components:{...state.appearance.components,wheels:'wheel-mesh'}});expect(painted.ok).toBe(true);if(!painted.ok)return;state=painted.state;const bought=buyCar(state,'rsx-type-s');expect(bought.ok).toBe(true);if(!bought.ok)return;state=bought.state;expect(ownedCarIds(state)).toEqual(['civic-si','rsx-type-s']);const rsx=state.ownedCars.find(car=>car.build.carId==='rsx-type-s')!,selected=selectCar(state,rsx.vehicleId);expect(selected.ok).toBe(true);if(!selected.ok)return;expect(selected.state.build.carId).toBe('rsx-type-s');const civic=selected.state.ownedCars.find(car=>car.build.carId==='civic-si')!,restored=selectCar(selected.state,civic.vehicleId);expect(restored.ok).toBe(true);if(!restored.ok)return;expect(restored.state.appearance).toMatchObject({hue:310,wheelStyle:2});expect(restored.state.ownedCars.some(car=>car.build.carId==='rsx-type-s')).toBe(true);});
  it('stores layered appearance independently of performance',()=>{const state=createGarageState();const appearance={...state.appearance,hue:220,wheelStyle:3,rideHeight:-25,components:{...state.appearance.components,wheels:'wheel-drag'}};const changed=applyAppearance(state,appearance);expect(changed.ok).toBe(true);if(changed.ok){expect(changed.state.appearance).toEqual(appearance);expect(changed.state.build).toEqual(state.build);expect(changed.state.cash).toBe(state.cash);}});
});

describe('factory-turbocharged cars', () => {
  const FACTORY_TURBO = ['evo-vii', 'supra-tt', 'skyline-gtr', 'neon-srt4'];

  it('declare the boost their torque figure already contains', () => {
    for (const id of FACTORY_TURBO) {
      const fi = getCar(id).engine.forcedInduction;
      expect(fi, id).toBeDefined();
      expect(fi!.factoryBoostBar, id).toBeGreaterThan(0);
      // Peak equals factory on a standard car: a kit is what raises it.
      expect(fi!.peakBoostBar, id).toBe(fi!.factoryBoostBar);
    }
  });

  it('are not made stronger by their own boost', () => {
    // The published curve already includes it. Applying it again is the
    // double-count that took a built Evo past what any clutch or tyre could use.
    for (const id of FACTORY_TURBO) {
      const car = getCar(id);
      expect(
        chargeTorqueMultiplier(car.engine.forcedInduction, car.engine.redlineRpm, car.engine.redlineRpm),
        id,
      ).toBe(1);
    }
  });

  it('leaves the naturally aspirated cars without a compressor', () => {
    for (const id of ['rsx-type-s', 'mustang-cobra', 'rx8', 'nsx', 'viper-srt10']) {
      expect(getCar(id).engine.forcedInduction, id).toBeUndefined();
    }
  });
});
