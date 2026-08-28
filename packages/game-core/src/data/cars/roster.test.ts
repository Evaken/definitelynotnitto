import { describe,expect,it } from 'vitest';
import { applyAppearance,buyCar,createGarageState,ownedCarIds,selectCar } from '../../garage.js';
import { drive,goodDrivePlan } from '../../testing/drive.js';
import { stockTune } from '../../types/tune.js';
import { CARS,getCar } from './index.js';

describe('Stages 7 and 8 vehicle garage',()=>{
  it('contains the ten-car normal roster with complete structured data',()=>{expect(CARS.size).toBe(10);for(const car of CARS.values()){expect(car.engine.curve.length).toBeGreaterThanOrEqual(5);expect(car.gearbox.gearRatios.length).toBeGreaterThanOrEqual(5);expect(car.price).toBeGreaterThan(0);expect(car.chassis.massKg).toBeGreaterThan(900);}});
  it('gives the first four cars measurably distinct passes',()=>{const ids=['civic-si','rsx-type-s','evo-vii','supra-tt'];const ets=ids.map((id,index)=>{const car=getCar(id);return drive(car,stockTune(car),{...goodDrivePlan(70+index),shiftRpm:car.engine.redlineRpm-100,neutralRevRpm:Math.min(5200,car.engine.redlineRpm-800)}).slip.quarterMileEt;});expect(new Set(ets.map(et=>et.toFixed(2))).size).toBe(4);});
  it('buys and switches cars without losing the previous vehicle state',()=>{let state=createGarageState('civic-si',100_000);const bought=buyCar(state,'rsx-type-s');expect(bought.ok).toBe(true);if(!bought.ok)return;state=bought.state;expect(ownedCarIds(state)).toEqual(['civic-si','rsx-type-s']);const selected=selectCar(state,'rsx-type-s');expect(selected.ok).toBe(true);if(!selected.ok)return;expect(selected.state.build.carId).toBe('rsx-type-s');expect(selected.state.ownedCars.some(car=>car.build.carId==='civic-si')).toBe(true);});
  it('stores layered appearance independently of performance',()=>{const state=createGarageState();const appearance={...state.appearance,hue:220,wheelStyle:3,rideHeight:-25};const changed=applyAppearance(state,appearance);expect(changed.ok).toBe(true);if(changed.ok){expect(changed.state.appearance).toEqual(appearance);expect(changed.state.build).toEqual(state.build);expect(changed.state.cash).toBe(state.cash);}});
});
