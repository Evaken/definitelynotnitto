import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan } from '../testing/drive.js';
import { createPassState, engineRpm, isPassComplete, stepPass } from './pass.js';
import { SIM_HZ } from '../types/sim.js';
import type { RaceInput } from '../types/sim.js';
import { STAGING, TRACK_MARKS } from '../config/historical.js';

const tune = stockTune(CIVIC_SI);
const HELD: RaceInput = { throttle: true, launchShift: false, shiftDown: false };
const IDLE: RaceInput = { throttle: false, launchShift: false, shiftDown: false };

describe('staging', () => {
  it('starts behind both beams with neither lit', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    expect(state.lights.prestage).toBe(false);
    expect(state.lights.stage).toBe(false);
    expect(state.positionM).toBeLessThan(-STAGING.beamSpacingM.value);
  });

  it('breaks the pre-stage beam before the stage beam', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    const order: string[] = [];

    for (let i = 0; i < 8 * SIM_HZ && state.phase !== 'staged'; i++) {
      stepPass(state, HELD);
      if (state.lights.prestage && !order.includes('prestage')) order.push('prestage');
      if (state.lights.stage && !order.includes('stage')) order.push('stage');
    }

    expect(order).toEqual(['prestage', 'stage']);
    expect(state.phase).toBe('staged');
  });

  it('holds the car on the line so the throttle only builds revs', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    while (state.phase !== 'staged' && state.tick < 8 * SIM_HZ) stepPass(state, HELD);

    // The car still has creep speed when it breaks the beam, so it rolls the
    // last few centimetres to a stop -- that coast is what sets staging depth.
    while (state.speedMs > 0.001 && state.tick < 10 * SIM_HZ) stepPass(state, HELD);

    const settledAt = state.positionM;
    for (let i = 0; i < SIM_HZ; i++) stepPass(state, HELD);

    // From there it stays put however hard the driver leans on the throttle...
    expect(state.positionM).toBeCloseTo(settledAt, 5);
    // ...and the throttle goes into building revs instead.
    expect(engineRpm(state)).toBeGreaterThan(CIVIC_SI.engine.idleRpm + 1000);
  });

  it('settles within the stage beam rather than rolling through it', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    while (state.phase !== 'staged' && state.tick < 8 * SIM_HZ) stepPass(state, HELD);
    while (state.speedMs > 0.001 && state.tick < 10 * SIM_HZ) stepPass(state, HELD);

    expect(state.positionM).toBeGreaterThanOrEqual(0);
    expect(state.positionM).toBeLessThan(STAGING.beamBlockLengthM.value);
    expect(state.lights.stage).toBe(true);
  });

  it('does not let the engine run away while creeping in', () => {
    // A free-revving engine during staging would reach the limiter and leave
    // the driver no way to choose a launch rpm before the green.
    const state = createPassState(CIVIC_SI, tune, 1);
    let peak = 0;

    while (state.phase !== 'staged' && state.tick < 8 * SIM_HZ) {
      stepPass(state, HELD);
      peak = Math.max(peak, engineRpm(state));
    }

    expect(peak).toBeLessThan(CIVIC_SI.engine.idleRpm + STAGING.creepRpmRange.value + 200);
  });

  it('arms the tree only once the car has settled', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    while (state.phase !== 'staged' && state.tick < 8 * SIM_HZ) stepPass(state, HELD);

    expect(state.treeSchedule).toBeNull();
    for (let i = 0; i < 3 * SIM_HZ; i++) stepPass(state, IDLE);
    expect(state.treeSchedule).not.toBeNull();
  });
});

describe('the limiter', () => {
  it('stops the engine passing redline on the line', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    while (state.phase !== 'staged' && state.tick < 8 * SIM_HZ) stepPass(state, HELD);

    let peak = 0;
    for (let i = 0; i < 5 * SIM_HZ; i++) {
      stepPass(state, HELD);
      peak = Math.max(peak, engineRpm(state));
    }

    expect(peak).toBeGreaterThan(CIVIC_SI.engine.redlineRpm - 400);
    expect(peak).toBeLessThan(CIVIC_SI.engine.redlineRpm + 100);
  });
});

describe('a complete pass', () => {
  const result = drive(CIVIC_SI, tune, { ...goodDrivePlan(7), launchRpm: 3000 });

  it('reaches the finish line', () => {
    expect(isPassComplete(result.state)).toBe(true);
    expect(result.slip.incomplete).toBe(false);
    expect(result.state.positionM).toBeGreaterThanOrEqual(TRACK_MARKS.quarterMile);
  });

  it('produces splits in the order the car meets them', () => {
    const s = result.slip;
    expect(s.sixtyFoot).toBeGreaterThan(0);
    expect(s.threeThirty).toBeGreaterThan(s.sixtyFoot);
    expect(s.eighthMileEt).toBeGreaterThan(s.threeThirty);
    expect(s.thousandFoot).toBeGreaterThan(s.eighthMileEt);
    expect(s.quarterMileEt).toBeGreaterThan(s.thousandFoot);
  });

  it('is still gaining speed at the traps', () => {
    expect(result.slip.quarterMileMph).toBeGreaterThan(result.slip.eighthMileMph);
  });

  it('gets through the gearbox', () => {
    expect(result.state.gearIndex).toBeGreaterThan(1);
    expect(result.state.gearIndex).toBeLessThan(CIVIC_SI.gearbox.gearRatios.length);
  });

  it('runs a plausible time for a stock Civic Si', () => {
    // Deliberately wide. The Civic's figures are real-world approximations,
    // not values recovered from the original game, and calibrating them is
    // Stage 15's job. This band exists to catch a change that makes the car
    // wildly fast or wildly slow, not to assert a correct ET.
    expect(result.slip.quarterMileEt).toBeGreaterThan(13);
    expect(result.slip.quarterMileEt).toBeLessThan(19);
    expect(result.slip.quarterMileMph).toBeGreaterThan(70);
    expect(result.slip.quarterMileMph).toBeLessThan(105);
    expect(result.slip.sixtyFoot).toBeGreaterThan(1.8);
    expect(result.slip.sixtyFoot).toBeLessThan(3.5);
  });
});

describe('numerical stability', () => {
  it('never produces a NaN or an infinity anywhere in the pass', () => {
    // The slip-ratio model divides by vehicle speed, which is zero at the
    // launch. If the speed floor guarding that ever goes missing, this fails.
    const state = createPassState(CIVIC_SI, tune, 3);
    const watched = [
      'positionM',
      'speedMs',
      'accelMs2',
      'engineOmega',
      'wheelOmega',
      'slipRatio',
      'tractiveForceN',
      'wheelTorqueNm',
    ] as const;

    let launched = false;
    while (!isPassComplete(state) && state.tick < 40 * SIM_HZ) {
      const input: RaceInput =
        state.treeSchedule !== null && !launched
          ? ((launched = true), { throttle: true, launchShift: true, shiftDown: false })
          : { throttle: true, launchShift: false, shiftDown: false };
      stepPass(state, input);

      for (const key of watched) {
        expect(Number.isFinite(state[key]), `${key} at tick ${state.tick}`).toBe(true);
      }
    }
  });

  it('never rolls the car backwards', () => {
    const { state } = drive(CIVIC_SI, tune, goodDrivePlan(11));
    expect(state.speedMs).toBeGreaterThanOrEqual(0);
  });

  it('keeps slip bounded through a redline launch', () => {
    const state = createPassState(CIVIC_SI, tune, 5);
    let launched = false;
    let peakSlip = 0;

    while (!isPassComplete(state) && state.tick < 40 * SIM_HZ) {
      const shouldLaunch = state.treeSchedule !== null && !launched;
      if (shouldLaunch) launched = true;
      stepPass(state, { throttle: true, launchShift: shouldLaunch, shiftDown: false });
      peakSlip = Math.max(peakSlip, Math.abs(state.slipRatio));
    }

    expect(peakSlip).toBeLessThanOrEqual(4);
  });
});
