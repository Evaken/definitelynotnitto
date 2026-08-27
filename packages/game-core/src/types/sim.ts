/**
 * Simulation state, inputs and results.
 *
 * The simulator is a pure fixed-step function over these structures.  Nothing
 * here knows what a canvas, a React component or a network request is.
 */

import type { Car } from './car.js';
import type { Tune } from './tune.js';

/** Fixed simulation rate. 1 kHz matches drag timing's 1ms resolution. */
export const SIM_HZ = 1000;
export const SIM_DT = 1 / SIM_HZ;

/**
 * What the player is holding down at a given instant.
 *
 * These are held states, not events.  The stepper derives presses by comparing
 * against the previous tick, which keeps a recorded timeline sufficient to
 * reproduce a pass exactly.
 */
export interface RaceInput {
  /** Revs the engine on the line; drives the car once launched. */
  readonly throttle: boolean;
  /** Drops the clutch when staged, then upshifts for the rest of the pass. */
  readonly launchShift: boolean;
  readonly shiftDown: boolean;
}

export const NEUTRAL_INPUT: RaceInput = {
  throttle: false,
  launchShift: false,
  shiftDown: false,
};

export type RacePhase =
  /** Rolling up to the beams; neither is broken. */
  | 'approach'
  /** Pre-stage beam broken. */
  | 'prestaged'
  /** Stage beam broken, tree not yet armed. */
  | 'staged'
  /** Tree is counting down. */
  | 'tree'
  /** Clutch dropped, still inside the stage beam -- clock has not started. */
  | 'launched'
  /** Stage beam cleared, ET clock running. */
  | 'running'
  /** Past the quarter-mile mark. */
  | 'finished';

/**
 * When the tree will fire, decided the moment it arms.
 *
 * Lives here rather than in `sim/tree.ts` so the state type does not have to
 * import from the simulator, which would make the module graph circular.
 */
export interface TreeSchedule {
  /** Tick the first amber lights. */
  readonly amberTick: number;
  /** Tick the green lights. */
  readonly greenTick: number;
}

/** Which lamps on the tree are lit right now. */
export interface TreeLights {
  readonly prestage: boolean;
  readonly stage: boolean;
  /** Three amber bulbs, top to bottom. */
  readonly ambers: readonly [boolean, boolean, boolean];
  readonly green: boolean;
  readonly red: boolean;
}

/**
 * Complete mutable state of one quarter-mile pass.
 *
 * Mutated in place by `stepPass` -- allocating a new object 15,000 times per
 * pass would be wasteful, and the stepper being the sole writer keeps this
 * safe.  Treat it as read-only everywhere else.
 */
export interface PassState {
  readonly car: Car;
  readonly tune: Tune;

  /** Ticks elapsed since the pass began. Multiply by SIM_DT for seconds. */
  tick: number;

  phase: RacePhase;

  // --- Longitudinal state -------------------------------------------------
  /** Front-tyre leading edge, metres relative to the stage beam. */
  positionM: number;
  /** Vehicle speed, m/s. */
  speedMs: number;
  /** Longitudinal acceleration from the previous step, m/s^2. */
  accelMs2: number;

  // --- Rotating state -----------------------------------------------------
  /** Crankshaft speed, rad/s. */
  engineOmega: number;
  /** Driven-wheel speed, rad/s. */
  wheelOmega: number;
  /** Zero-based index into the gear ratio list. */
  gearIndex: number;
  /** Ticks left in the current shift; zero means no shift in progress. */
  shiftTicksRemaining: number;
  /** Gear to select when the current shift completes. */
  pendingGearIndex: number;
  /** Clutch travel, 0 = fully open, 1 = locked. */
  clutchEngagement: number;
  /** True once the clutch has stopped slipping and the driveline is rigid. */
  clutchLocked: boolean;
  /** True while the limiter is cutting fuel. */
  limiterActive: boolean;

  // --- Derived, exposed for telemetry -------------------------------------
  /** Flywheel torque produced this step, Nm. */
  engineTorqueNm: number;
  /** Torque at the driven wheels this step, Nm. */
  wheelTorqueNm: number;
  /** Longitudinal slip ratio of the driven tyres. */
  slipRatio: number;
  /** Peak longitudinal force the driven tyres could deliver right now, N. */
  gripLimitN: number;
  /** Force actually being delivered, N. */
  tractiveForceN: number;
  /** True when slip has pushed the tyres past their grip peak. */
  wheelspin: boolean;

  // --- Tree and timing ----------------------------------------------------
  lights: TreeLights;
  /** When the ambers and green fire, or null while the tree is unarmed. */
  treeSchedule: TreeSchedule | null;
  /** Tick the player dropped the clutch, or null. */
  launchTick: number | null;
  /**
   * Exact tick the car cleared the stage beam and the clock started, or null.
   * Fractional: the crossing is interpolated within the step it happened in, so
   * timing does not quantise to the 1ms step and two close passes stay
   * distinguishable.
   */
  clockStartTick: number | null;
  /** Position the car was sitting at when the clutch dropped, metres. */
  stagedPositionM: number | null;
  /** True if the stage beam was cleared before the green. */
  foul: boolean;
  /** Elapsed seconds at each distance mark, keyed by mark name. */
  splits: Partial<Record<SplitName, number>>;
  /** Set once the car crosses the finish or the pass times out. */
  incomplete: boolean;

  // --- Bookkeeping --------------------------------------------------------
  /** Previous tick's input, so the stepper can spot presses without events. */
  prevInput: RaceInput;
  /** Consecutive ticks the car has been staged and stationary. */
  settleTicks: number;

  /** Seeded PRNG state, so a pass is reproducible from its seed alone. */
  rngState: number;
  readonly seed: number;
}

export type SplitName =
  | 'sixtyFoot'
  | 'threeThirty'
  | 'eighthTrapEntry'
  | 'eighthMile'
  | 'thousandFoot'
  | 'quarterTrapEntry'
  | 'quarterMile';

/**
 * The timing slip handed to the player at the end of a pass.
 *
 * All times are seconds from the clock start, all speeds are mph, matching how
 * a real slip reads.  This is the only place imperial units appear in the
 * simulation -- everything upstream is SI.
 */
export interface TimingSlip {
  readonly reactionTime: number;
  readonly sixtyFoot: number;
  readonly threeThirty: number;
  readonly eighthMileEt: number;
  readonly eighthMileMph: number;
  readonly thousandFoot: number;
  readonly quarterMileEt: number;
  readonly quarterMileMph: number;
  readonly foul: boolean;
  /** True if the car never crossed the finish line, e.g. it stalled. */
  readonly incomplete: boolean;
}

/**
 * A recorded pass: everything needed to reproduce it bit for bit.
 *
 * Stage 1 uses this to prove the simulator is deterministic.  Stage 10 uses it
 * as the authoritative record of an asynchronous challenge run, so the server
 * can re-simulate a submitted pass instead of trusting a claimed ET.
 */
export interface InputTimeline {
  readonly seed: number;
  /** Input changes only, ordered by tick. The gaps are the previous value. */
  readonly changes: readonly InputChange[];
  /** Total ticks the pass ran for. */
  readonly durationTicks: number;
}

export interface InputChange {
  readonly tick: number;
  readonly input: RaceInput;
}
