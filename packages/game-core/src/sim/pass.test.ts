import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan } from '../testing/drive.js';
import {
  createPassState,
  engineRpm,
  isPassComplete,
  isRunComplete,
  stagingZoneStart,
  stepPass,
  MAX_PASS_TICKS,
} from './pass.js';
import { gearLabel } from './drivetrain.js';
import { buildTimingSlip } from './timing.js';
import { NEUTRAL_GEAR, REVERSE_GEAR, SIM_HZ } from '../types/sim.js';
import type { PassState, RaceInput } from '../types/sim.js';
import { STAGING, TRACK_MARKS } from '../config/historical.js';

const tune = stockTune(CIVIC_SI);

const input = (
  throttle: number,
  brake = false,
  shiftUp = false,
  shiftDown = false,
): RaceInput => ({ throttle, brake, shiftUp, shiftDown });

const IDLE = input(0);
const FLAT = input(1);

/** Presses a gear key cleanly and lets the change complete. */
function shift(state: PassState, direction: 'up' | 'down'): void {
  for (let i = 0; i < 3; i++) stepPass(state, input(0, false, direction === 'up', direction === 'down'));
  for (let i = 0; i < 250; i++) stepPass(state, IDLE);
}

describe('gear selection', () => {
  it('starts in neutral', () => {
    expect(createPassState(CIVIC_SI, tune, 1).gear).toBe(NEUTRAL_GEAR);
  });

  it('goes nowhere in neutral however hard the throttle is opened', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    const start = state.positionM;
    for (let i = 0; i < 5 * SIM_HZ; i++) stepPass(state, FLAT);

    expect(state.positionM).toBe(start);
    expect(state.speedMs).toBe(0);
    // The engine revs freely against nothing, which is what makes it possible
    // to have revs up before dropping into gear.
    expect(engineRpm(state)).toBeGreaterThan(CIVIC_SI.engine.idleRpm + 3000);
  });

  it('steps R - N - 1 - 2 - 3 and back down again', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    const up: string[] = [];
    for (let i = 0; i < 3; i++) {
      shift(state, 'up');
      up.push(gearLabel(state.gear));
    }
    expect(up).toEqual(['1', '2', '3']);

    const down: string[] = [];
    for (let i = 0; i < 5; i++) {
      shift(state, 'down');
      down.push(gearLabel(state.gear));
    }
    expect(down).toEqual(['2', '1', 'N', 'R', 'R']);
  });

  it('stops at the top gear', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    for (let i = 0; i < 10; i++) shift(state, 'up');
    expect(state.gear).toBe(CIVIC_SI.gearbox.gearRatios.length);
  });

  it('takes time to change gear', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    for (let i = 0; i < 3; i++) stepPass(state, input(0, false, true));
    expect(state.shiftTicksRemaining).toBeGreaterThan(0);
    expect(state.gear).toBe(NEUTRAL_GEAR);
  });
});

describe('reverse', () => {
  it('backs the car up, which is how a driver recovers from rolling through', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'down');
    expect(state.gear).toBe(REVERSE_GEAR);

    const start = state.positionM;
    for (let i = 0; i < 2 * SIM_HZ; i++) stepPass(state, input(0.3));

    expect(state.positionM).toBeLessThan(start - 0.5);
    expect(state.speedMs).toBeLessThan(0);
  });
});

describe('rolling and stopping', () => {
  it('needs both a gear and throttle before anything moves', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'up');
    const afterShift = state.positionM;

    for (let i = 0; i < SIM_HZ; i++) stepPass(state, IDLE);
    expect(state.positionM).toBe(afterShift);

    for (let i = 0; i < SIM_HZ; i++) stepPass(state, input(0.2));
    expect(state.positionM).toBeGreaterThan(afterShift);
  });

  it('coasts when the throttle is closed rather than creeping at idle', () => {
    // The clutch opens with the throttle below the lock-up speed. Anything else
    // and the car would crawl forward like an automatic, making it impossible
    // to roll to a stop on momentum.
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'up');
    for (let i = 0; i < 700; i++) stepPass(state, input(0.2));

    const releaseSpeed = state.speedMs;
    expect(releaseSpeed).toBeGreaterThan(0.2);

    for (let i = 0; i < SIM_HZ; i++) stepPass(state, IDLE);
    expect(state.speedMs).toBeLessThan(releaseSpeed);
    expect(state.speedMs).toBeGreaterThan(0);
  });

  it('stops on the brakes and stays stopped', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'up');
    for (let i = 0; i < 700; i++) stepPass(state, input(0.25));
    expect(state.speedMs).toBeGreaterThan(0.2);

    for (let i = 0; i < SIM_HZ; i++) stepPass(state, input(0, true));
    expect(state.speedMs).toBe(0);

    // And it does not crawl away again while the brake is held.
    const restingAt = state.positionM;
    for (let i = 0; i < 3 * SIM_HZ; i++) stepPass(state, input(0, true));
    expect(state.positionM).toBe(restingAt);
  });
});

describe('staging', () => {
  it('does not arm the tree until the car is stopped inside the window', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'up');

    // Roll up to the window without stopping.
    let guard = 0;
    while (state.positionM < stagingZoneStart() && guard++ < 40 * SIM_HZ) {
      stepPass(state, input(0.15));
    }
    expect(state.treeSchedule).toBeNull();
    expect(state.phase).toBe('approach');
  });

  it('arms once the car has settled in the window and held there', () => {
    const state = stagedCar();
    expect(state.phase).toBe('tree');
    expect(state.treeSchedule).not.toBeNull();
    expect(state.stagedPositionM).toBeGreaterThanOrEqual(stagingZoneStart());
    expect(state.stagedPositionM).toBeLessThanOrEqual(0);
  });

  it('takes a moment before arming, so a car rolling through does not trigger it', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'up');
    rollTo(state, -0.5);

    // Stopped in the window, but not yet for long enough.
    expect(state.treeSchedule).toBeNull();
    for (let i = 0; i < STAGING.settleMs.value - 50; i++) stepPass(state, input(0, true));
    expect(state.treeSchedule).toBeNull();

    for (let i = 0; i < 200; i++) stepPass(state, input(0, true));
    expect(state.treeSchedule).not.toBeNull();
  });

  it('does not start the clock for a car that rolls straight through', () => {
    // Driving past the line on the way in is a mistake made before the race
    // began, not a foul. Starting the clock there would hand out a red light
    // with no way to undo it.
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'up');

    let guard = 0;
    while (state.positionM < 1.5 && guard++ < 60 * SIM_HZ) stepPass(state, input(0.3));

    expect(state.positionM).toBeGreaterThan(0);
    expect(state.clockStartTick).toBeNull();
    expect(state.foul).toBe(false);
    expect(state.phase).toBe('approach');
  });

  it('lets a car that rolled through reverse back in and stage normally', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    shift(state, 'up');

    let guard = 0;
    while (state.positionM < 1.5 && guard++ < 60 * SIM_HZ) stepPass(state, input(0.3));
    while (Math.abs(state.speedMs) > 0 && guard++ < 70 * SIM_HZ) stepPass(state, input(0, true));

    // Back up into the window: 1 -> N -> R.
    shift(state, 'down');
    shift(state, 'down');
    expect(state.gear).toBe(REVERSE_GEAR);

    while (state.positionM > -0.5 && guard++ < 80 * SIM_HZ) {
      stepPass(state, input(state.speedMs > -0.4 ? 0.16 : 0));
    }
    while (Math.abs(state.speedMs) > 0 && guard++ < 90 * SIM_HZ) stepPass(state, input(0, true));

    expect(state.positionM).toBeGreaterThanOrEqual(stagingZoneStart());
    expect(state.positionM).toBeLessThanOrEqual(0);

    // And the tree arms as though nothing had happened.
    while (state.treeSchedule === null && guard++ < 95 * SIM_HZ) stepPass(state, input(0, true));
    expect(state.treeSchedule).not.toBeNull();
    expect(state.phase).toBe('tree');
    expect(state.foul).toBe(false);
  });

  it('abandons the tree if the car backs out of the window', () => {
    const state = stagedCar();
    shift(state, 'down');
    shift(state, 'down');
    expect(state.gear).toBe(REVERSE_GEAR);

    let guard = 0;
    while (state.positionM > stagingZoneStart() - 0.3 && guard++ < 5 * SIM_HZ) {
      stepPass(state, input(0.3));
    }

    expect(state.treeSchedule).toBeNull();
    expect(state.phase).toBe('approach');
  });
});

describe('the limiter', () => {
  it('stops the engine passing redline in neutral', () => {
    const state = createPassState(CIVIC_SI, tune, 1);
    let peak = 0;
    for (let i = 0; i < 6 * SIM_HZ; i++) {
      stepPass(state, FLAT);
      peak = Math.max(peak, engineRpm(state));
    }
    expect(peak).toBeGreaterThan(CIVIC_SI.engine.redlineRpm - 400);
    expect(peak).toBeLessThan(CIVIC_SI.engine.redlineRpm + 100);
  });
});

describe('a complete pass', () => {
  const result = drive(CIVIC_SI, tune, goodDrivePlan(7));

  it('reaches the finish line', () => {
    expect(isRunComplete(result.state)).toBe(true);
    expect(result.slip.incomplete).toBe(false);
    expect(result.state.positionM).toBeGreaterThanOrEqual(TRACK_MARKS.quarterMile);
  });

  it('crosses the line still travelling, rather than stopping dead on it', () => {
    expect(result.state.phase).toBe('shutdown');
    expect(result.state.speedMs).toBeGreaterThan(20);
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
    expect(result.state.gear).toBeGreaterThan(2);
    expect(result.state.gear).toBeLessThanOrEqual(CIVIC_SI.gearbox.gearRatios.length);
  });

  it('runs a plausible time for a stock Civic Si', () => {
    // Deliberately wide, and staying wide. The Civic's figures are real-world
    // approximations, not values recovered from the original game, so a tight
    // band here would be asserting an invented number as fact and would have to
    // be rewritten every time the car is tuned.
    //
    // What a wide band cannot do is notice a regression, and it twice failed
    // to. That job now belongs to sim/baseline.test.ts, which pins every car in
    // the roster to three decimal places and names whatever moved. This one
    // only catches a change that makes the car wildly fast or wildly slow.
    expect(result.slip.quarterMileEt).toBeGreaterThan(13);
    expect(result.slip.quarterMileEt).toBeLessThan(19);
    expect(result.slip.quarterMileMph).toBeGreaterThan(70);
    expect(result.slip.quarterMileMph).toBeLessThan(105);
    expect(result.slip.sixtyFoot).toBeGreaterThan(1.8);
    expect(result.slip.sixtyFoot).toBeLessThan(3.5);
  });
});

describe('the shut-down area', () => {
  /** Runs a good pass, then coasts on for `ticks` with the slider wide open. */
  function coastPastTheLine(ticks: number): PassState {
    const { state } = drive(CIVIC_SI, tune, goodDrivePlan(7));
    for (let i = 0; i < ticks && !isPassComplete(state); i++) stepPass(state, FLAT);
    return state;
  }

  it('keeps rolling past the finish instead of stopping dead on the line', () => {
    const state = coastPastTheLine(2 * SIM_HZ);
    expect(state.positionM).toBeGreaterThan(TRACK_MARKS.quarterMile + 40);
  });

  it('ignores the throttle once the run is over', () => {
    // The slider is still wide open in this test. Past the line the driver is
    // off it regardless: the car should only ever be slowing down.
    const state = coastPastTheLine(1 * SIM_HZ);
    const speedAfterOneSecond = state.speedMs;
    for (let i = 0; i < 3 * SIM_HZ && !isPassComplete(state); i++) stepPass(state, FLAT);

    expect(state.speedMs).toBeLessThan(speedAfterOneSecond);
    expect(state.engineTorqueNm).toBeLessThanOrEqual(0);
  });

  it('does not change the timing slip that was already earned', () => {
    const { state, slip } = drive(CIVIC_SI, tune, goodDrivePlan(7));
    for (let i = 0; i < 5 * SIM_HZ && !isPassComplete(state); i++) stepPass(state, FLAT);

    expect(buildTimingSlip(state)).toEqual(slip);
  });

  it('comes to rest on its own, without brakes or a distance limit', () => {
    const state = coastPastTheLine(MAX_PASS_TICKS);

    expect(state.phase).toBe('finished');
    expect(state.speedMs).toBe(0);
    expect(state.tick).toBeLessThan(MAX_PASS_TICKS);
  });

  it('lets the driver stop it sooner on the brakes', () => {
    const { state } = drive(CIVIC_SI, tune, goodDrivePlan(7));
    let ticks = 0;
    while (!isPassComplete(state) && ticks++ < MAX_PASS_TICKS) {
      stepPass(state, input(0, true));
    }
    expect(state.speedMs).toBe(0);
    // Far quicker than the free coast, which takes the best part of a minute.
    expect(ticks).toBeLessThan(20 * SIM_HZ);
  });
});

describe('numerical stability', () => {
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

  it('never produces a NaN or an infinity anywhere in a pass', () => {
    // The slip-ratio model divides by vehicle speed, which is zero at the
    // launch. If the speed floor guarding that ever goes missing, this fails.
    const { state } = drive(CIVIC_SI, tune, goodDrivePlan(3));
    for (const key of watched) {
      expect(Number.isFinite(state[key]), key).toBe(true);
    }
  });

  it('stays finite under a first-gear standing start at full throttle', () => {
    const state = createPassState(CIVIC_SI, tune, 5);
    shift(state, 'up');
    for (let i = 0; i < 20 * SIM_HZ; i++) {
      stepPass(state, FLAT);
      for (const key of watched) {
        expect(Number.isFinite(state[key]), `${key} at tick ${state.tick}`).toBe(true);
      }
    }
  });

  it('keeps slip bounded through a clutch dump at redline', () => {
    const state = createPassState(CIVIC_SI, tune, 5);
    for (let i = 0; i < 4 * SIM_HZ; i++) stepPass(state, FLAT);
    for (let i = 0; i < 3; i++) stepPass(state, input(1, false, true));

    let peakSlip = 0;
    for (let i = 0; i < 10 * SIM_HZ; i++) {
      stepPass(state, FLAT);
      peakSlip = Math.max(peakSlip, Math.abs(state.slipRatio));
    }
    expect(peakSlip).toBeLessThanOrEqual(4);
  });

  it('stays finite when the brakes are locked from speed', () => {
    const state = createPassState(CIVIC_SI, tune, 5);
    shift(state, 'up');
    for (let i = 0; i < 6 * SIM_HZ; i++) stepPass(state, FLAT);

    for (let i = 0; i < 6 * SIM_HZ; i++) {
      stepPass(state, input(0, true));
      for (const key of watched) {
        expect(Number.isFinite(state[key]), `${key} at tick ${state.tick}`).toBe(true);
      }
    }
    expect(state.speedMs).toBe(0);
  });
});

// ---------------------------------------------------------------------------

/** Rolls the car forward and brakes it to a stop near `target`. */
function rollTo(state: PassState, target: number): void {
  let guard = 0;
  while (state.positionM < target - 0.35 && guard++ < 60 * SIM_HZ) {
    stepPass(state, input(state.speedMs < 0.5 ? 0.15 : 0));
  }
  while (Math.abs(state.speedMs) > 0 && guard++ < 70 * SIM_HZ) {
    stepPass(state, input(0, true));
  }
}

/** A car settled in the staging window with the tree armed. */
function stagedCar(): PassState {
  const state = createPassState(CIVIC_SI, tune, 1);
  shift(state, 'up');
  rollTo(state, -0.5);
  let guard = 0;
  while (state.treeSchedule === null && guard++ < 5 * SIM_HZ) stepPass(state, input(0, true));
  return state;
}
