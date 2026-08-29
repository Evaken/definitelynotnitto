import { describe, expect, it } from 'vitest';
import { buyCar, buyPart, createEmptyGarageState, createGarageState, fitPart, ownedCarIds, partList, previewPurchaseAndFit, purchaseAndFitPart, removePart, resolveBuild, selectCar } from './garage.js';
import { CARS } from './data/cars/index.js';
import { stockTune } from './types/tune.js';
import { drive, goodDrivePlan } from './testing/drive.js';
import { barToPsi, boostBar } from './sim/boost.js';
import { createPassState } from './sim/pass.js';

function succeed<T extends { ok:boolean }>(result:T):Extract<T,{ok:true}>{expect(result.ok).toBe(true);return result as Extract<T,{ok:true}>;}
describe('Stage 3 garage',()=>{
  it('starts the test account empty with one million dollars',()=>{const state=createEmptyGarageState();expect(state.hasSelectedCar).toBe(false);expect(state.cash).toBe(1_000_000);expect(ownedCarIds(state)).toEqual([]);expect(buyPart(state,'panel-filter')).toMatchObject({ok:false});});
  it('stores the complete normal roster as independent owned cars',()=>{let state=createEmptyGarageState();const normal=[...CARS.values()].filter(car=>!car.special);for(const car of normal)state=succeed(buyCar(state,car.id)).state;expect(normal.length).toBeGreaterThanOrEqual(10);expect(ownedCarIds(state)).toHaveLength(normal.length);expect(new Set(ownedCarIds(state)).size).toBe(normal.length);expect(state.hasSelectedCar).toBe(true);const last=normal.at(-1)!;state=succeed(selectCar(state,last.id)).state;expect(state.build.carId).toBe(last.id);expect(state.ownedCars).toHaveLength(normal.length-1);});
  it('contains 25-40 unique universal upgrade parts',()=>{const parts=partList();expect(parts.length).toBeGreaterThanOrEqual(25);expect(parts.length).toBeLessThanOrEqual(40);expect(new Set(parts.map(p=>p.id)).size).toBe(parts.length);expect(parts.every(p=>p.compatibleCarIds.length===0)).toBe(true);});
  it('charges for, fits, and removes a part',()=>{let state=createGarageState();state=succeed(buyPart(state,'panel-filter')).state;expect(state.cash).toBe(9820);state=succeed(fitPart(state,'panel-filter')).state;expect(state.build.fittedPartIds).toContain('panel-filter');state=succeed(removePart(state,'panel-filter')).state;expect(state.build.fittedPartIds).not.toContain('panel-filter');});
  it('enforces ownership, requirements, and exclusions',()=>{
    let state=createGarageState('civic-si',20_000);
    // Not owned.
    expect(fitPart(state,'cold-air-intake').ok).toBe(false);
    state=succeed(buyPart(state,'cold-air-intake')).state;
    // Owned, but the panel filter has to come first.
    expect(fitPart(state,'cold-air-intake').ok).toBe(false);
    state=succeed(buyPart(state,'panel-filter')).state;
    state=succeed(fitPart(state,'panel-filter')).state;
    // A car has one intake path. The panel filter is a cheap insert in the
    // stock airbox and a cold-air replaces the airbox outright, so they are
    // alternatives rather than a stack -- fitPart refuses, and the Speedshop's
    // purchaseAndFitPart offers the swap instead.
    state=succeed(buyPart(state,'short-ram-intake')).state;
    expect(fitPart(state,'short-ram-intake').ok).toBe(false);
    expect(fitPart(state,'cold-air-intake').ok).toBe(false);
    expect(succeed(purchaseAndFitPart(state,'cold-air-intake')).state.build.fittedPartIds)
      .toEqual(['cold-air-intake']);
  });
  it('protects fitted prerequisites',()=>{
    // Exhaust parts genuinely stack -- a cat-back and a muffler are different
    // components -- so removing the one underneath is refused.
    let state=createGarageState();
    for(const id of ['sports-muffler','cat-back']){state=succeed(buyPart(state,id)).state;state=succeed(fitPart(state,id)).state;}
    expect(removePart(state,'sports-muffler')).toMatchObject({ok:false});
  });
  it('resolves effects without mutating the stock car',()=>{let state=createGarageState('civic-si',20_000);for(const id of ['rear-seat-delete','panel-filter']){state=succeed(buyPart(state,id)).state;state=succeed(fitPart(state,id)).state;}const modified=resolveBuild(state.build),stock=resolveBuild(createGarageState().build);expect(modified.chassis.massKg).toBe(stock.chassis.massKg-18);expect(modified.engine.curve[3]!.torqueNm).toBeGreaterThan(stock.engine.curve[3]!.torqueNm);});
  it('makes a modified Civic quicker under identical inputs',()=>{const stock=resolveBuild(createGarageState().build);const modified=resolveBuild({carId:'civic-si',fittedPartIds:['panel-filter','sports-muffler','ecu-reflash','rear-seat-delete','street-tyres']});const a=drive(stock,stockTune(stock),goodDrivePlan(7)).slip;const b=drive(modified,stockTune(modified),goodDrivePlan(7)).slip;expect(a.quarterMileEt).not.toBeNull();expect(b.quarterMileEt).not.toBeNull();expect(b.quarterMileEt!).toBeLessThan(a.quarterMileEt!);});
  it('previews and completes a purchase and installation atomically',()=>{const state=createGarageState();const preview=previewPurchaseAndFit(state,'panel-filter');expect(preview).toMatchObject({ok:true,plan:{price:180,replacedPartIds:[]}});const installed=succeed(purchaseAndFitPart(state,'panel-filter')).state;expect(installed.cash).toBe(9820);expect(installed.ownedPartIds).toContain('panel-filter');expect(installed.build.fittedPartIds).toContain('panel-filter');expect(state.cash).toBe(10_000);expect(state.build.fittedPartIds).toEqual([]);});
  it('replaces conflicting hardware and its dependants in one transition',()=>{let state=createGarageState('civic-si',30_000);for(const id of ['supercharger-bracket','sports-clutch','street-supercharger','race-clutch','race-supercharger'])state=succeed(purchaseAndFitPart(state,id)).state;const preview=previewPurchaseAndFit(state,'turbo-manifold');expect(preview).toMatchObject({ok:true,plan:{replacedPartIds:expect.arrayContaining(['supercharger-bracket','street-supercharger','race-supercharger'])}});const replaced=succeed(purchaseAndFitPart(state,'turbo-manifold')).state;expect(replaced.build.fittedPartIds).toContain('turbo-manifold');expect(replaced.build.fittedPartIds).not.toContain('supercharger-bracket');expect(replaced.build.fittedPartIds).not.toContain('street-supercharger');expect(replaced.build.fittedPartIds).not.toContain('race-supercharger');});
  it('does not charge or alter the build when purchase-and-fit validation fails',()=>{const state=createGarageState('civic-si',100);expect(purchaseAndFitPart(state,'panel-filter')).toEqual({ok:false,reason:'Not enough cash.'});expect(state).toEqual(createGarageState('civic-si',100));});
});

describe('forced induction reaches the car and the gauge',()=>{
  const build=(ids:readonly string[])=>{let state=createGarageState('civic-si',100_000);for(const id of ids)state=succeed(purchaseAndFitPart(state,id)).state;return state;};
  const TURBO=['turbo-manifold','intercooler','sports-clutch','street-turbo'];
  const BLOWER=['supercharger-bracket','sports-clutch','street-supercharger'];

  it('gives a stock car no compressor at all',()=>{
    const car=resolveBuild(createGarageState().build);
    expect(car.engine.forcedInduction).toBeUndefined();
  });

  it('describes the system it fitted, not just more torque',()=>{
    expect(resolveBuild(build(TURBO).build).engine.forcedInduction).toMatchObject({type:'turbo'});
    expect(resolveBuild(build(BLOWER).build).engine.forcedInduction).toMatchObject({type:'supercharger'});
  });

  it('stacks a second compressor and spools later for it',()=>{
    const single=resolveBuild(build(TURBO).build).engine.forcedInduction!;
    const stacked=resolveBuild(build([...TURBO,'race-clutch','race-turbo']).build).engine.forcedInduction!;
    expect(stacked.peakBoostBar).toBeGreaterThan(single.peakBoostBar);
    // A bigger compressor on top of a smaller one comes on later, not sooner.
    expect(stacked.spoolRpm).toBeGreaterThan(single.spoolRpm);
  });

  it('lifts the top of the curve far more than the bottom',()=>{
    // A flat multiplier could not do this, and it is what makes the turbo car
    // drive differently rather than simply harder.
    const stock=resolveBuild(createGarageState().build).engine.curve;
    const turbo=resolveBuild(build(TURBO).build).engine.curve;
    const gain=(i:number)=>turbo[i]!.torqueNm/stock[i]!.torqueNm;
    expect(gain(1)).toBeLessThan(1.05);
    expect(gain(turbo.length-1)).toBeGreaterThan(gain(1)*1.3);
  });

  it('puts pressure on the gauge while the throttle is open',()=>{
    const car=resolveBuild(build(TURBO).build);
    const state=createPassState(car,stockTune(car),1);
    const wot=boostBar(car.engine.forcedInduction,6000,car.engine.redlineRpm,1);
    expect(wot).toBeGreaterThan(0);
    expect(barToPsi(wot)).toBeGreaterThan(5);
    // ...and none at all before anything has happened.
    expect(state.boostBar).toBe(0);
  });

  it('makes the blower quicker off the line and the turbo faster through the traps',()=>{
    // The reason both exist. Same money, different shape of power.
    const turbo=resolveBuild(build([...TURBO,'race-clutch','race-turbo']).build);
    const blower=resolveBuild(build([...BLOWER,'race-clutch','race-supercharger']).build);
    const plan=goodDrivePlan(7);
    const t=drive(turbo,stockTune(turbo),plan).slip;
    const b=drive(blower,stockTune(blower),plan).slip;
    expect(b.sixtyFoot).toBeLessThan(t.sixtyFoot);
    expect(t.quarterMileMph).toBeGreaterThan(b.quarterMileMph);
  });
});
