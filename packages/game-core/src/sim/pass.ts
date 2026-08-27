import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';
import type { PassState, RaceInput, SplitName } from '../types/sim.js';
import { SIM_DT, SIM_HZ, NEUTRAL_INPUT } from '../types/sim.js';
import { DRIVELINE, STAGING, TRACK_MARKS } from '../config/historical.js';
import { netEngineTorque } from './engine.js';
import {
  finalDrive,
  gearCount,
  gearRatio,
  lockedDrivelineInertia,
  totalRatio,
} from './drivetrain.js';
import {
  aeroDrag,
  gripLimit,
  isWheelspinning,
  rollingResistance,
  slipRatio,
  tractiveForce,
} from './tyre.js';
import { scheduleTree, treeLightsAt } from './tree.js';
import { clamp, radPerSecToRpm, rpmToRadPerSec } from './units.js';

/**
 * The quarter-mile pass.
 *
 * `stepPass` is the single source of truth for what happens on track.  It is a
 * fixed-step, deterministic function of state and input: the same car, tune,
 * seed and input sequence always produce the same timing slip, which is what
 * makes regression testing possible now and asynchronous multiplayer
 * verifiable later (PROJECT_SPEC 6.3).
 *
 * Nothing in here is aware of rendering, and nothing outside here decides how
 * the car behaves.
 */

const msToTicks = (ms: number): number => Math.round((ms / 1000) * SIM_HZ);

/** A pass is abandoned after this long, so a stalled car cannot hang the loop. */
export const MAX_PASS_TICKS = 90 * SIM_HZ;

/** Deceleration applied on the line when the driver is off the throttle. */
const HOLD_DECEL_MS2 = 8;

/** Distance marks in the order the car meets them. */
const ORDERED_MARKS: readonly (readonly [SplitName, number])[] = [
  ['sixtyFoot', TRACK_MARKS.sixtyFoot],
  ['threeThirty', TRACK_MARKS.threeThirty],
  ['eighthTrapEntry', TRACK_MARKS.eighthTrapEntry],
  ['eighthMile', TRACK_MARKS.eighthMile],
  ['thousandFoot', TRACK_MARKS.thousandFoot],
  ['quarterTrapEntry', TRACK_MARKS.quarterTrapEntry],
  ['quarterMile', TRACK_MARKS.quarterMile],
];

export function createPassState(car: Car, tune: Tune, seed: number): PassState {
  const idleOmega = rpmToRadPerSec(car.engine.idleRpm);

  return {
    car,
    tune,
    tick: 0,
    phase: 'approach',

    positionM: STAGING.startLineOffsetM.value,
    speedMs: 0,
    accelMs2: 0,

    engineOmega: idleOmega,
    wheelOmega: 0,
    gearIndex: 0,
    shiftTicksRemaining: 0,
    pendingGearIndex: 0,
    clutchEngagement: 0,
    clutchLocked: false,
    limiterActive: false,

    engineTorqueNm: 0,
    wheelTorqueNm: 0,
    slipRatio: 0,
    gripLimitN: 0,
    tractiveForceN: 0,
    wheelspin: false,

    lights: { prestage: false, stage: false, ambers: [false, false, false], green: false, red: false },
    treeSchedule: null,
    launchTick: null,
    clockStartTick: null,
    stagedPositionM: null,
    foul: false,
    splits: {},
    incomplete: false,

    prevInput: NEUTRAL_INPUT,
    settleTicks: 0,

    rngState: seed | 0,
    seed,
  };
}

/** True once the pass is over and further steps would do nothing. */
export function isPassComplete(state: PassState): boolean {
  return state.phase === 'finished';
}

/**
 * Advances the pass by exactly one simulation tick.
 *
 * Mutates `state` in place: a pass runs to roughly 15,000 ticks and allocating
 * a fresh state object for each would be pure waste.  The stepper is the only
 * writer, so nothing else needs to reason about the mutation.
 */
export function stepPass(state: PassState, input: RaceInput): void {
  if (state.phase === 'finished') return;

  const pressedLaunchShift = input.launchShift && !state.prevInput.launchShift;
  const pressedShiftDown = input.shiftDown && !state.prevInput.shiftDown;

  const isPreLaunch =
    state.phase === 'approach' || state.phase === 'prestaged' || state.phase === 'staged' || state.phase === 'tree';

  if (isPreLaunch) {
    handleStagingPhase(state, input, pressedLaunchShift);
  } else {
    handleRunningPhase(state, input, pressedLaunchShift, pressedShiftDown);
  }

  updateBeamsAndLights(state);

  state.prevInput = input;
  state.tick++;

  // `isPassComplete` rather than a direct comparison: the helpers above may
  // have finished the pass, but TypeScript keeps the narrowing from the guard
  // at the top of this function and would call the comparison unreachable.
  if (state.tick >= MAX_PASS_TICKS && !isPassComplete(state)) {
    state.incomplete = true;
    state.phase = 'finished';
  }
}

// ---------------------------------------------------------------------------
// Staging
// ---------------------------------------------------------------------------

/**
 * Behaviour before the clutch drops.
 *
 * The car creeps on a slipping clutch until the stage beam is broken, then it
 * is held on the line -- throttle from that point builds launch rpm rather than
 * pushing the car deeper.  Staging depth is therefore chosen by how far the car
 * was allowed to roll before it broke the beam, which is the trade-off a real
 * driver makes: roll in deep for a shorter rollout and a quicker light, or stop
 * shallow and use the extra rollout to build speed before the clock starts.
 */
function handleStagingPhase(state: PassState, input: RaceInput, pressedLaunch: boolean): void {
  const { car } = state;
  const throttle = input.throttle ? 1 : 0;
  const staged = state.positionM >= 0;

  const currentRpm = radPerSecToRpm(state.engineOmega);
  const engineResult = netEngineTorque(car.engine, currentRpm, throttle, state.limiterActive);
  state.limiterActive = engineResult.limiterActive;
  state.engineTorqueNm = engineResult.torqueNm;

  const idleOmega = rpmToRadPerSec(car.engine.idleRpm);

  if (staged) {
    // On the line with the car held: the engine is free of the driveline and
    // revs against its own inertia. This is where launch rpm gets chosen.
    state.engineOmega = Math.max(
      idleOmega,
      state.engineOmega + (engineResult.torqueNm / car.engine.inertiaKgM2) * SIM_DT,
    );
  } else {
    // Rolling up to the beams, the clutch is slipping and absorbing whatever
    // the engine makes, so it sits just off idle however hard the driver leans
    // on the throttle. Letting it free-rev here would pin it against the
    // limiter during staging and leave no way to set a launch rpm afterwards.
    const creepTarget = rpmToRadPerSec(
      car.engine.idleRpm + throttle * STAGING.creepRpmRange.value,
    );
    const rate = 6 * SIM_DT;
    state.engineOmega += (creepTarget - state.engineOmega) * Math.min(1, rate);
  }

  if (staged) {
    // Held on the line. Bleed off any residual creep speed.
    state.speedMs = Math.max(0, state.speedMs - HOLD_DECEL_MS2 * SIM_DT);
  } else if (throttle > 0 && state.speedMs < STAGING.creepMaxSpeedMs.value) {
    const netForce = STAGING.creepForceN.value - rollingResistance(car, state.speedMs);
    state.speedMs = Math.min(
      STAGING.creepMaxSpeedMs.value,
      state.speedMs + (netForce / car.chassis.massKg) * SIM_DT,
    );
  } else {
    state.speedMs = Math.max(0, state.speedMs - HOLD_DECEL_MS2 * SIM_DT);
  }

  state.positionM += state.speedMs * SIM_DT;
  state.wheelOmega = state.speedMs / car.tyres.radiusM;
  state.accelMs2 = 0;
  state.wheelTorqueNm = 0;
  state.slipRatio = 0;
  state.tractiveForceN = 0;
  state.wheelspin = false;
  state.gripLimitN = gripLimit(car, 0);

  // Arm the tree once the car has settled on the line.
  if (staged && state.speedMs <= 0.001) {
    state.settleTicks++;
    if (state.treeSchedule === null && state.settleTicks >= msToTicks(STAGING.settleMs.value)) {
      const result = scheduleTree(state.tick, state.rngState);
      state.treeSchedule = result.schedule;
      state.rngState = result.rngState;
      state.phase = 'tree';
    }
  } else {
    state.settleTicks = 0;
  }

  if (pressedLaunch && staged) {
    launch(state);
  }
}

/** Drops the clutch. The moment this happens is the driver's reaction. */
function launch(state: PassState): void {
  state.phase = 'launched';
  state.launchTick = state.tick;
  state.stagedPositionM = state.positionM;
  state.clutchEngagement = 0;
  state.clutchLocked = false;
  state.gearIndex = 0;
  state.pendingGearIndex = 0;
  state.settleTicks = 0;
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

/**
 * Behaviour from the clutch drop to the finish line.
 *
 * Two rotating bodies are integrated: the engine and the driven wheels.  While
 * the clutch slips they move independently and the clutch passes whatever
 * torque its current capacity allows; once the engine has been dragged down to
 * driveline speed they lock into one rigid body and the engine's inertia is
 * referred through the gearing.  Splitting the two regimes this way keeps the
 * launch stable at 1kHz without needing a stiff spring between them.
 */
function handleRunningPhase(
  state: PassState,
  input: RaceInput,
  pressedShiftUp: boolean,
  pressedShiftDown: boolean,
): void {
  const { car, tune } = state;
  const radius = car.tyres.radiusM;

  advanceShift(state, pressedShiftUp, pressedShiftDown);

  const shifting = state.shiftTicksRemaining > 0;
  // The driver is assumed to lift through a gear change. Holding the throttle
  // flat against the limiter for every shift would be a penalty the player has
  // no realistic way to avoid at these timescales.
  const throttle = shifting ? 0 : input.throttle ? 1 : 0;

  const ratio = totalRatio(car, tune, state.gearIndex);
  const engineRpm = radPerSecToRpm(state.engineOmega);
  const engineResult = netEngineTorque(car.engine, engineRpm, throttle, state.limiterActive);
  state.limiterActive = engineResult.limiterActive;
  state.engineTorqueNm = engineResult.torqueNm;

  // Clutch capacity ramps in after the launch and drops to nothing mid-shift.
  if (!shifting) {
    state.clutchEngagement = Math.min(
      1,
      state.clutchEngagement + SIM_DT / (DRIVELINE.clutchEngageMs.value / 1000),
    );
  }
  const capacity = shifting ? 0 : state.clutchEngagement * DRIVELINE.clutchCapacityNm.value;

  const drivelineOmega = state.wheelOmega * ratio;

  // Tyre force is resolved first: the clutch solution below needs to know what
  // the contact patch is doing this step.
  const slip = slipRatio(state.wheelOmega, radius, state.speedMs);
  const force = tractiveForce(car, slip, state.accelMs2);

  state.slipRatio = slip;
  state.tractiveForceN = force;
  state.gripLimitN = gripLimit(car, state.accelMs2);
  state.wheelspin = isWheelspinning(car.tyres, slip);

  let wheelDriveTorque: number;
  let wheelInertia: number;

  if (state.clutchLocked && !shifting) {
    // Rigid driveline: the engine is carried by the wheels.
    state.engineOmega = drivelineOmega;
    wheelDriveTorque = engineResult.torqueNm * ratio * car.gearbox.driveEfficiency;
    wheelInertia = lockedDrivelineInertia(car, tune, state.gearIndex);
  } else {
    const efficiency = car.gearbox.driveEfficiency;
    const engineInertia = car.engine.inertiaKgM2;
    const wheelSideInertia = car.tyres.inertiaKgM2;

    // Torque that would bring engine and driveline to exactly the same speed by
    // the end of this step.  Solving for it rather than applying full capacity
    // in the slip direction is what keeps the clutch from chattering between
    // +capacity and -capacity once the two sides are close, and it makes the
    // moment of lock-up fall out of the arithmetic instead of needing a
    // tolerance to be guessed at.
    const numerator =
      (state.engineOmega - drivelineOmega) / SIM_DT +
      engineResult.torqueNm / engineInertia +
      (ratio * force * radius) / wheelSideInertia;
    const denominator = 1 / engineInertia + (ratio * ratio * efficiency) / wheelSideInertia;
    const equalisingTorque = numerator / denominator;

    const clutchTorque = clamp(equalisingTorque, -capacity, capacity);

    state.engineOmega = Math.max(
      rpmToRadPerSec(car.engine.idleRpm),
      state.engineOmega + ((engineResult.torqueNm - clutchTorque) / engineInertia) * SIM_DT,
    );

    wheelDriveTorque = clutchTorque * ratio * efficiency;
    wheelInertia = wheelSideInertia;

    // The clutch has stopped slipping exactly when it no longer needs more
    // torque than it has to hold both sides together.
    if (!shifting && state.clutchEngagement >= 1 && Math.abs(equalisingTorque) <= capacity) {
      state.clutchLocked = true;
    }
  }

  state.wheelTorqueNm = wheelDriveTorque;

  // Wheels: driven by the driveline, resisted by the contact patch.
  const wheelAlpha = (wheelDriveTorque - force * radius) / wheelInertia;
  state.wheelOmega = Math.max(0, state.wheelOmega + wheelAlpha * SIM_DT);

  // Vehicle: pushed by the contact patch, resisted by air and rolling losses.
  const resistance = aeroDrag(car, state.speedMs) + rollingResistance(car, state.speedMs);
  const accel = (force - resistance) / car.chassis.massKg;
  state.accelMs2 = accel;

  const previousPosition = state.positionM;
  state.speedMs = Math.max(0, state.speedMs + accel * SIM_DT);
  state.positionM += state.speedMs * SIM_DT;

  recordTiming(state, previousPosition);
}

/** Steps any shift in progress and starts a new one when asked. */
function advanceShift(state: PassState, pressedShiftUp: boolean, pressedShiftDown: boolean): void {
  const { car, tune } = state;

  if (state.shiftTicksRemaining > 0) {
    state.shiftTicksRemaining--;
    if (state.shiftTicksRemaining === 0) {
      state.gearIndex = state.pendingGearIndex;
      // The clutch comes straight back in; the slip logic re-locks it once the
      // engine and the new gear's driveline speed agree.
      state.clutchEngagement = 1;
      state.clutchLocked = false;
    }
    return;
  }

  const topGear = gearCount(car, tune) - 1;
  if (pressedShiftUp && state.gearIndex < topGear) {
    beginShift(state, state.gearIndex + 1);
  } else if (pressedShiftDown && state.gearIndex > 0) {
    beginShift(state, state.gearIndex - 1);
  }
}

function beginShift(state: PassState, targetGearIndex: number): void {
  state.shiftTicksRemaining = msToTicks(DRIVELINE.shiftTimeMs.value);
  state.pendingGearIndex = targetGearIndex;
  state.clutchEngagement = 0;
  state.clutchLocked = false;
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

/**
 * Starts the clock and records split times.
 *
 * Crossings are interpolated inside the step they occur in, so a 1ms step does
 * not quantise the results -- two passes a thousandth apart stay distinct.
 */
function recordTiming(state: PassState, previousPosition: number): void {
  const travelled = state.positionM - previousPosition;

  // The clock starts when the tyre rolls clear of the stage beam, not when the
  // clutch drops. What is left of that rollout depends on how deep the car
  // staged.
  const clearPoint = STAGING.beamBlockLengthM.value;
  if (state.clockStartTick === null) {
    if (state.positionM >= clearPoint) {
      state.clockStartTick = state.tick + crossingFraction(previousPosition, travelled, clearPoint);
      state.phase = 'running';

      const green = state.treeSchedule?.greenTick;
      // Leaving before the green -- or before the tree ran at all -- is a red.
      state.foul = green === undefined || state.clockStartTick < green;
    }
    return;
  }

  for (const [name, distance] of ORDERED_MARKS) {
    if (state.splits[name] !== undefined) continue;
    if (state.positionM < distance) break;

    const exactTick = state.tick + crossingFraction(previousPosition, travelled, distance);
    state.splits[name] = (exactTick - state.clockStartTick) / SIM_HZ;
  }

  if (state.splits.quarterMile !== undefined) {
    state.phase = 'finished';
  }
}

/** Where inside this step the car passed `mark`, as a fraction of the step. */
function crossingFraction(previousPosition: number, travelled: number, mark: number): number {
  if (travelled <= 0) return 0;
  return clamp((mark - previousPosition) / travelled, 0, 1);
}

// ---------------------------------------------------------------------------
// Beams and lights
// ---------------------------------------------------------------------------

function updateBeamsAndLights(state: PassState): void {
  const prestageBeam = -STAGING.beamSpacingM.value;
  const clearPoint = STAGING.beamBlockLengthM.value;

  const prestage = state.positionM >= prestageBeam;
  const stage = state.positionM >= 0 && state.positionM < clearPoint;

  if (state.phase === 'approach' && prestage) state.phase = 'prestaged';
  if (state.phase === 'prestaged' && stage) state.phase = 'staged';

  state.lights = treeLightsAt(state.tick, state.treeSchedule, prestage, stage, state.foul);
}

/** Engine speed in rpm. Convenience for telemetry and the HUD. */
export function engineRpm(state: PassState): number {
  return radPerSecToRpm(state.engineOmega);
}

/** Current gear as a 1-based number, matching how a driver counts them. */
export function displayGear(state: PassState): number {
  return state.gearIndex + 1;
}

/** Ratio currently selected, for the debug panel. */
export function currentRatio(state: PassState): number {
  return gearRatio(state.car, state.tune, state.gearIndex) * finalDrive(state.car, state.tune);
}
