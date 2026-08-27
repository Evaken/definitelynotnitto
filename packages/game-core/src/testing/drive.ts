import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';
import type { InputTimeline, PassState, RaceInput, TimingSlip } from '../types/sim.js';
import { SIM_HZ } from '../types/sim.js';
import { createPassState, engineRpm, isPassComplete, stepPass, MAX_PASS_TICKS } from '../sim/pass.js';
import { gearCount } from '../sim/drivetrain.js';
import { buildTimingSlip } from '../sim/timing.js';
import { TimelineRecorder } from '../sim/replay.js';

/**
 * A scripted driver, for tests only.
 *
 * This is test scaffolding, not gameplay.  CPU opponents are Stage 6 work and
 * PROJECT_SPEC 11.4 forbids building them early -- this exists so physics tests
 * can say "drive it well" or "bog the launch" without hand-assembling fifteen
 * thousand ticks of keyboard state.
 *
 * It closes the loop on simulation state, so it adapts to whatever the physics
 * actually does rather than assuming fixed timings.
 */

export interface DrivePlan {
  readonly seed: number;
  /**
   * Position, in metres relative to the stage beam, at which the driver lifts
   * off while creeping in.  More negative means a shallower stage.
   */
  readonly throttleOffAtM: number;
  /** Engine speed held on the line before the clutch drops. */
  readonly launchRpm: number;
  /**
   * Reaction, in seconds relative to the green.  Zero is a perfect light,
   * positive is late, negative leaves early and draws a red.
   */
  readonly reactionSeconds: number;
  /** Engine speed the driver upshifts at. */
  readonly shiftRpm: number;
}

export interface DriveResult {
  readonly state: PassState;
  readonly slip: TimingSlip;
  readonly timeline: InputTimeline;
}

const PRESS_TICKS = 3;

/** Runs a whole pass under the scripted driver and returns what happened. */
export function drive(car: Car, tune: Tune, plan: DrivePlan): DriveResult {
  const state = createPassState(car, tune, plan.seed);
  const recorder = new TimelineRecorder(plan.seed);

  const topGear = gearCount(car, tune) - 1;
  const reactionTicks = Math.round(plan.reactionSeconds * SIM_HZ);

  let pressUntilTick = -1;
  let launched = false;
  let lifted = false;
  let nudging = false;

  while (!isPassComplete(state) && state.tick < MAX_PASS_TICKS) {
    const rpm = engineRpm(state);
    const staged = state.positionM >= 0;

    // --- Decide the launch/shift key ------------------------------------
    if (!launched && state.treeSchedule !== null) {
      const targetTick = state.treeSchedule.greenTick + reactionTicks;
      if (state.tick >= targetTick) {
        pressUntilTick = state.tick + PRESS_TICKS;
        launched = true;
      }
    } else if (
      launched &&
      state.tick > pressUntilTick &&
      state.shiftTicksRemaining === 0 &&
      state.gearIndex < topGear &&
      rpm >= plan.shiftRpm
    ) {
      pressUntilTick = state.tick + PRESS_TICKS;
    }

    // --- Decide the throttle ---------------------------------------------
    let throttle: boolean;
    if (launched) {
      throttle = true;
    } else if (staged) {
      // Hold the target launch rpm with the car on the line.
      throttle = rpm < plan.launchRpm;
    } else if (!lifted) {
      // Rolling in. Lift at the chosen point and let the car coast the rest.
      throttle = true;
      if (state.positionM >= plan.throttleOffAtM) lifted = true;
    } else {
      // Coasting to the beam. Lifting early can leave the car short of it, in
      // which case lean on the throttle again and hold it there until properly
      // staged -- re-deciding this each tick would blip the car forward a
      // millimetre at a time and never finish.
      if (state.speedMs < 0.01) nudging = true;
      throttle = nudging;
    }

    const input: RaceInput = {
      throttle,
      launchShift: state.tick <= pressUntilTick,
      shiftDown: false,
    };

    recorder.record(state.tick, input);
    stepPass(state, input);
  }

  return { state, slip: buildTimingSlip(state), timeline: recorder.build() };
}

/** A competent pass in a stock Civic: shallow stage, sensible revs, clean shifts. */
export function goodDrivePlan(seed = 1): DrivePlan {
  return {
    seed,
    throttleOffAtM: -0.04,
    launchRpm: 3800,
    reactionSeconds: 0,
    shiftRpm: 6500,
  };
}
