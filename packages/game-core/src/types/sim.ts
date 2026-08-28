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
 * What the player is doing at a given instant.
 *
 * These are held states, not events.  The stepper derives presses by comparing
 * against the previous tick, which keeps a recorded timeline sufficient to
 * reproduce a pass exactly.
 */
export interface RaceInput {
  /**
   * Throttle opening, 0 to 1, from the slider beside the strip.
   *
   * Quantised to hundredths at the input boundary.  A dragged slider would
   * otherwise emit a different float every frame, which bloats a recorded
   * timeline and invites floating-point drift between a live pass and its
   * replay.
   */
  readonly throttle: number;
  readonly brake: boolean;
  /** Selects the next gear up the list: R, N, 1, 2, 3 ... */
  readonly shiftUp: boolean;
  /** Selects the next gear down the same list. */
  readonly shiftDown: boolean;
  /** Hold to spray a fitted nitrous kit. Optional keeps old replays valid. */
  readonly nitrous?: boolean;
}

export const NEUTRAL_INPUT: RaceInput = {
  throttle: 0,
  brake: false,
  shiftUp: false,
  shiftDown: false,
};

/**
 * Gear selection.
 *
 * Reverse is -1 and neutral is 0, so a forward gear's number is simply its
 * number -- first gear is 1.  The car starts in neutral and does not move until
 * the driver selects a gear and opens the throttle.
 */
export const REVERSE_GEAR = -1;
export const NEUTRAL_GEAR = 0;

export type RacePhase =
  /** Free to roll. Not yet stopped inside the staging window. */
  | 'approach'
  /** Stopped with the nose inside the staging window; tree not yet armed. */
  | 'staged'
  /** Tree is counting down. */
  | 'tree'
  /** Stage line crossed, ET clock running. */
  | 'running'
  /**
   * Past the quarter-mile mark. The timing slip is final; the throttle is shut
   * and the car is coasting down the shut-down area under its own losses, as it
   * would on a real strip.
   */
  | 'shutdown'
  /** Come to rest after the run, or given up on without completing one. */
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
  /** Nose of the car, metres relative to the stage line. Negative is behind. */
  positionM: number;
  /** Vehicle speed, m/s. Negative when reversing. */
  speedMs: number;
  /** Longitudinal acceleration from the previous step, m/s^2. */
  accelMs2: number;

  // --- Rotating state -----------------------------------------------------
  /** Crankshaft speed, rad/s. */
  engineOmega: number;
  /** Driven-wheel speed, rad/s. Negative when reversing. */
  wheelOmega: number;
  /** Selected gear: -1 reverse, 0 neutral, 1..n forward. */
  gear: number;
  /** Ticks left in the current shift; zero means no shift in progress. */
  shiftTicksRemaining: number;
  /** Gear to select when the current shift completes. */
  pendingGear: number;
  /** Clutch travel, 0 = fully open, 1 = locked. */
  clutchEngagement: number;
  /** True once the clutch has stopped slipping and the driveline is rigid. */
  clutchLocked: boolean;
  /** True while the limiter is cutting fuel. */
  limiterActive: boolean;
  /**
   * Manifold gauge pressure this tick, bar. Zero on a naturally aspirated car
   * because nothing is making any -- not because the gauge is stubbed out.
   */
  boostBar: number;
  nitrousActive: boolean;
  nitrousRemainingSeconds: number;
  /** Deterministic stress score accumulated during this pass. */
  mechanicalStress: number;

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
  /** True when the driven tyres are spinning faster than the car is moving. */
  wheelspin: boolean;
  /** True when the brakes have dragged the tyres past their grip peak. */
  wheelsLocked: boolean;

  // --- Tree and timing ----------------------------------------------------
  lights: TreeLights;
  /** When the ambers and green fire, or null while the tree is unarmed. */
  treeSchedule: TreeSchedule | null;
  /**
   * Exact tick the car crossed the stage line and the clock started, or null.
   * Fractional: the crossing is interpolated within the step it happened in, so
   * timing does not quantise to the 1ms step and two close passes stay
   * distinguishable.
   */
  clockStartTick: number | null;
  /**
   * Where the nose was sitting when the tree armed, metres.
   *
   * Somewhere between minus the staging zone length and zero. Nearer zero is a
   * deeper stage: less ground to cover before the clock starts, so a quicker
   * light, but less run-up to build speed in, so a slower elapsed time.
   */
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
