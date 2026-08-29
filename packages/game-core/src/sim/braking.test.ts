import { describe, expect, it } from 'vitest';
import { createEmptyGarageState, partList, purchaseAndFitPart, resolveBuild, buyCar, selectCar, type GarageState } from '../garage.js';
import { createPassState, stepPass } from './pass.js';
import { CARS, getCar } from '../data/cars/index.js';
import { stockTune } from '../types/tune.js';
import { STAGING } from '../config/historical.js';
import type { Car } from '../types/car.js';

/**
 * The brakes have to work on a fully built car, not just a standard one.
 *
 * They did not. A built car on the brakes at walking pace decelerated at
 * 0.13m/s2 and simply could not be stopped, which made the Evo and the Skyline
 * impossible to stage once they were modified. The cause was not the brake: the
 * tyre force swung the wheel by more than road speed inside a single 1ms tick,
 * so slip changed sign every tick, the force alternated with it, and the average
 * came out at nothing. More grip made it worse, so it hit the best built cars
 * hardest.
 *
 * That is the same trap the clutch and the brakes each fell into earlier, and
 * the fix is the same one: solve for the state at the end of the step rather
 * than integrating a force that cannot survive it.
 */

/** Every part that will fit, which is the case that broke. */
function fullyBuilt(carId: string): Car {
  let state: GarageState = {
    ...createEmptyGarageState(50_000_000),
    record: { wins: 999, losses: 0, races: 999 },
  };
  const bought = buyCar(state, carId, 'v1');
  if (!bought.ok) throw new Error(`${carId}: ${bought.reason}`);
  state = bought.state;
  const selected = selectCar(state, 'v1');
  if (selected.ok) state = selected.state;

  // Repeated because a part can unlock the one that supersedes it.
  for (let pass = 0; pass < 6; pass++) {
    for (const part of partList()) {
      if (part.category === 'supercharger') continue;
      const fitted = purchaseAndFitPart(state, part.id);
      if (fitted.ok) state = fitted.state;
    }
  }
  return resolveBuild(state.build, state.condition);
}

/** Rolls the car up to `targetSpeed`, then stands on the brakes. */
function brakeFromCreep(car: Car, targetSpeed: number) {
  const state = createPassState(car, stockTune(car), 7);
  const idle = { shiftUp: false, shiftDown: false, brake: false };

  // R -> N -> 1, letting each selection settle.
  for (let selection = 0; selection < 2; selection++) {
    stepPass(state, { ...idle, throttle: 0, shiftUp: true });
    for (let tick = 0; tick < 60; tick++) stepPass(state, { ...idle, throttle: 0 });
  }

  for (let tick = 0; tick < 30_000 && state.speedMs < targetSpeed; tick++) {
    stepPass(state, { ...idle, throttle: 0.1 });
  }
  const entrySpeed = state.speedMs;
  const from = state.positionM;

  let reversals = 0;
  let ticks = 0;
  let previousSign = 0;
  for (let tick = 0; tick < 20_000; tick++) {
    stepPass(state, { ...idle, throttle: 0, brake: true });
    ticks++;
    // Which way the contact patch is sliding. Alternating every tick is the
    // signature of the instability rather than of anything physical.
    const sign = Math.sign(state.wheelOmega * car.tyres.radiusM - state.speedMs);
    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) reversals++;
    if (sign !== 0) previousSign = sign;
    if (Math.abs(state.speedMs) < STAGING.stoppedSpeedMs.value) {
      return { entrySpeed, distance: state.positionM - from, stopped: true, reversals, ticks };
    }
  }
  return { entrySpeed, distance: state.positionM - from, stopped: false, reversals, ticks };
}

describe('stopping a built car', () => {
  const ids = [...CARS.keys()];

  it('builds every car in the roster', () => {
    // Guards the fixture itself: a car that silently failed to build would be
    // tested as a standard one and would pass everything below for free.
    for (const id of ids) {
      const car = fullyBuilt(id);
      expect(car.tyres.peakGrip, id).toBeGreaterThan(getCar(id).tyres.peakGrip);
    }
  });

  it.each(ids)('%s comes to a complete stop from a creep', (id) => {
    const result = brakeFromCreep(fullyBuilt(id), 1);
    expect(result.stopped, `${id} never stopped`).toBe(true);
  });

  it.each(ids)('%s stops inside the staging window from walking pace', (id) => {
    // A gameplay requirement rather than a physics figure: the driver has to be
    // able to bring the car to rest inside the window, so stopping from a
    // walking-pace creep has to take less than the window is long. This is the
    // assertion that fails if the tyre step goes unstable again.
    const result = brakeFromCreep(fullyBuilt(id), 1);
    expect(result.distance, `${id} took ${result.distance.toFixed(2)}m`).toBeLessThan(
      STAGING.stagingZoneLengthM.value,
    );
  });

  it.each(ids)('%s does not chatter its contact patch while braking', (id) => {
    // A real tyre crosses from sliding to rolling once. Crossing on a large
    // fraction of ticks means the step is oscillating rather than resolving.
    const result = brakeFromCreep(fullyBuilt(id), 1);
    expect(result.reversals / result.ticks, `${id}`).toBeLessThan(0.05);
  });

  it('brakes harder than it coasts', () => {
    // Comparative, so it survives any retune of brake torque or grip.
    const car = fullyBuilt('evo-vii');
    const braked = brakeFromCreep(car, 1);

    const state = createPassState(car, stockTune(car), 7);
    const idle = { shiftUp: false, shiftDown: false, brake: false };
    for (let selection = 0; selection < 2; selection++) {
      stepPass(state, { ...idle, throttle: 0, shiftUp: true });
      for (let tick = 0; tick < 60; tick++) stepPass(state, { ...idle, throttle: 0 });
    }
    for (let tick = 0; tick < 30_000 && state.speedMs < 1; tick++) {
      stepPass(state, { ...idle, throttle: 0.1 });
    }
    const from = state.positionM;
    for (let tick = 0; tick < braked.ticks; tick++) stepPass(state, { ...idle, throttle: 0 });

    expect(braked.distance).toBeLessThan(state.positionM - from);
  });
});
