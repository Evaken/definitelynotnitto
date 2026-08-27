import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';
import type { InputTimeline, PassState, RaceInput, TimingSlip } from '../types/sim.js';
import { NEUTRAL_GEAR, SIM_HZ } from '../types/sim.js';
import {
  createPassState,
  engineRpm,
  isPassComplete,
  stagingZoneStart,
  stepPass,
  MAX_PASS_TICKS,
} from '../sim/pass.js';
import { forwardGearCount } from '../sim/drivetrain.js';
import { buildTimingSlip } from '../sim/timing.js';
import { TimelineRecorder } from '../sim/replay.js';
import { DRIVELINE } from '../config/historical.js';

const msToTicks = (ms: number): number => Math.round((ms / 1000) * SIM_HZ);

/**
 * A scripted driver, for tests only.
 *
 * This is test scaffolding, not gameplay.  CPU opponents are Stage 6 work and
 * PROJECT_SPEC 11.4 forbids building them early -- this exists so physics tests
 * can say "drive it well" or "bog the launch" without hand-assembling tens of
 * thousands of ticks of input.
 *
 * It closes the loop on simulation state, so it adapts to whatever the physics
 * actually does rather than assuming fixed timings.
 */

export interface DrivePlan {
  readonly seed: number;
  /**
   * Where in the staging window to stop, metres from the stage line.
   * Negative. Nearer zero is a deeper stage.
   */
  readonly stageAtM: number;
  /**
   * Throttle held while rolling up to the window, 0..1. Gentle, or the car
   * arrives far too fast to stop in time.
   */
  readonly creepThrottle: number;
  /** Throttle the driver opens to on the launch, 0..1. */
  readonly launchThrottle: number;
  /**
   * If set, the driver waits on the line in neutral holding this engine speed,
   * then selects first as the tree drops.
   *
   * This is the real drag-strip launch, and with no clutch pedal it is the only
   * way to have revs already up when the drive connects. Leave it undefined to
   * sit in gear and simply open the throttle at the green.
   */
  readonly neutralRevRpm?: number;
  /**
   * Reaction, in seconds relative to the green.  Zero opens the throttle the
   * instant it lights; negative leaves early and draws a red.
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
/**
 * Deceleration assumed when judging where to start braking.
 *
 * Deliberately pessimistic against what the brakes actually manage: the
 * throttle decision lags a tick behind the speed it reads, and a driver who
 * cuts it fine rolls through the stage line.
 */
const APPROACH_DECEL_MS2 = 4;
/** Extra room left on top of the computed stopping distance, metres. */
const APPROACH_MARGIN_M = 0.03;
/** The driver keeps the roll-in below this, m/s. */
const APPROACH_SPEED_MS = 0.7;
/** ...and below this over the last few centimetres. */
const CRAWL_SPEED_MS = 0.16;
/** How far the revs are allowed to fall before the throttle goes back on. */
const REV_HOLD_DEADBAND_RPM = 400;
/** Quantised the same way the slider is, so replays match exactly. */
const quantise = (throttle: number): number => Math.round(clamp01(throttle) * 100) / 100;
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Runs a whole pass under the scripted driver and returns what happened. */
export function drive(car: Car, tune: Tune, plan: DrivePlan): DriveResult {
  const state = createPassState(car, tune, plan.seed);
  const recorder = new TimelineRecorder(plan.seed);

  const topGear = forwardGearCount(car, tune);
  const reactionTicks = Math.round(plan.reactionSeconds * SIM_HZ);
  const zoneStart = stagingZoneStart();

  const shiftTicks = msToTicks(DRIVELINE.shiftTimeMs.value);

  let shiftUpUntil = -1;
  let shiftDownUntil = -1;
  let launched = false;
  /** Set once the driver has selected first gear to roll in. */
  let engaged = false;
  /** Hysteresis on the neutral rev hold. */
  let holdingRevs = true;
  /** Hysteresis on the roll-in blips. */
  let creeping = true;

  while (!isPassComplete(state) && state.tick < MAX_PASS_TICKS) {
    const rpm = engineRpm(state);
    const settled = state.phase === 'staged' || state.phase === 'tree';
    let throttle = 0;
    let brake = false;

    // The moment the drive should be connected. Waiting in neutral means the
    // gear change has to be started early enough to have completed by then.
    const green = state.treeSchedule?.greenTick;
    const launchTick = green === undefined ? Infinity : green + reactionTicks;

    if (!engaged) {
      // Select first gear before anything can move.
      if (state.gear === NEUTRAL_GEAR) {
        shiftUpUntil = state.tick + PRESS_TICKS;
      } else if (state.gear >= 1 && state.shiftTicksRemaining === 0) {
        engaged = true;
      }
    } else if (!launched && state.tick >= launchTick) {
      launched = true;
      throttle = plan.launchThrottle;
    } else if (!launched && settled && plan.neutralRevRpm !== undefined) {
      const timeToSelect = state.tick >= launchTick - shiftTicks;

      if (!timeToSelect && state.gear > NEUTRAL_GEAR) {
        // Drop out of gear so the engine can be revved against nothing.
        brake = true;
        if (state.shiftTicksRemaining === 0) shiftDownUntil = state.tick + PRESS_TICKS;
      } else if (!timeToSelect) {
        // Hold the target revs on the brakes while the tree counts down. The
        // deadband matters: without it the driver chops the throttle on and off
        // every millisecond, which is nothing like a hand on a slider and turns
        // a recorded pass into thousands of pointless input changes.
        if (rpm < plan.neutralRevRpm - REV_HOLD_DEADBAND_RPM) holdingRevs = true;
        else if (rpm >= plan.neutralRevRpm) holdingRevs = false;

        brake = true;
        throttle = holdingRevs ? 1 : 0;
      } else {
        // Select first, revs still up, so the drive lands on the green.
        throttle = 1;
        if (state.gear === NEUTRAL_GEAR && state.shiftTicksRemaining === 0) {
          shiftUpUntil = state.tick + PRESS_TICKS;
        }
      }
    } else if (!launched && settled) {
      // Sit on the brakes so a stray nudge cannot roll the car out of the
      // window while the tree counts down.
      brake = true;
    } else if (!launched) {
      // Rolling in. Brake once the car is close enough that its stopping
      // distance would carry it past the mark -- creeping up and hoping is how
      // the driver ends up rolling through the stage line.
      // Ease off as the mark gets closer. Rolling in at a constant speed and
      // braking late is how the car ends up past the stage line -- the last
      // few centimetres have to be taken at a crawl.
      const remaining = plan.stageAtM - state.positionM;
      const approachSpeed = Math.min(APPROACH_SPEED_MS, Math.max(CRAWL_SPEED_MS, remaining * 0.6));
      const stoppingDistance =
        (state.speedMs * state.speedMs) / (2 * APPROACH_DECEL_MS2) + APPROACH_MARGIN_M;

      if (state.speedMs > 0 && state.positionM + stoppingDistance >= plan.stageAtM) {
        brake = true;
        creeping = false;
      } else {
        // Blipped rather than balanced on a knife edge. Deciding this afresh
        // every millisecond would chop the throttle thousands of times on the
        // way to the line, which no hand on a slider would ever do.
        if (state.speedMs < approachSpeed * 0.6) creeping = true;
        else if (state.speedMs > approachSpeed) creeping = false;
        throttle = creeping ? plan.creepThrottle : 0;
      }
    } else {
      throttle = plan.launchThrottle;
      if (
        state.tick > shiftUpUntil &&
        state.shiftTicksRemaining === 0 &&
        state.gear < topGear &&
        rpm >= plan.shiftRpm
      ) {
        shiftUpUntil = state.tick + PRESS_TICKS;
      }
    }

    const input: RaceInput = {
      throttle: quantise(throttle),
      brake,
      shiftUp: state.tick <= shiftUpUntil,
      shiftDown: state.tick <= shiftDownUntil,
    };

    recorder.record(state.tick, input);
    stepPass(state, input);
  }

  return { state, slip: buildTimingSlip(state), timeline: recorder.build() };
}

/**
 * A competent pass in a stock Civic: settled on the line, revs held in neutral,
 * dropped into first on the green, clean shifts.
 */
export function goodDrivePlan(seed = 1): DrivePlan {
  return {
    seed,
    stageAtM: -0.5,
    creepThrottle: 0.14,
    launchThrottle: 1,
    neutralRevRpm: 3500,
    reactionSeconds: 0,
    shiftRpm: 6500,
  };
}
