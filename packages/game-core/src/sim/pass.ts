import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';
import type { PassState, RaceInput, SplitName } from '../types/sim.js';
import { NEUTRAL_GEAR, NEUTRAL_INPUT, SIM_DT, SIM_HZ } from '../types/sim.js';
import { DRIVELINE, STAGING, TRACK_MARKS } from '../config/historical.js';
import { netEngineTorque } from './engine.js';
import { gearRange, lockedDrivelineInertia, totalRatio } from './drivetrain.js';
import {
  aeroDrag,
  gripLimit,
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
 * There is no separate staging mode.  The car obeys the same physics from the
 * moment it appears to the moment it crosses the finish line -- it is simply in
 * neutral to begin with, and nothing moves until the driver selects a gear and
 * opens the throttle.  Staging is therefore a driving problem: roll in, and stop
 * inside the window on momentum or on the brakes.
 *
 * Nothing in here is aware of rendering, and nothing outside here decides how
 * the car behaves.
 */

const msToTicks = (ms: number): number => Math.round((ms / 1000) * SIM_HZ);

/** A pass is abandoned after this long, so a stalled car cannot hang the loop. */
export const MAX_PASS_TICKS = 300 * SIM_HZ;

/** Below these, a car on the brakes is simply held still. */
const BRAKE_HOLD_SPEED_MS = 0.15;
const BRAKE_HOLD_OMEGA = 0.5;

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

/** Where the staging window begins, metres. The stage line itself is at zero. */
export function stagingZoneStart(): number {
  return -STAGING.stagingZoneLengthM.value;
}

export function createPassState(car: Car, tune: Tune, seed: number): PassState {
  return {
    car,
    tune,
    tick: 0,
    phase: 'approach',

    positionM: STAGING.startLineOffsetM.value,
    speedMs: 0,
    accelMs2: 0,

    engineOmega: rpmToRadPerSec(car.engine.idleRpm),
    wheelOmega: 0,
    gear: NEUTRAL_GEAR,
    shiftTicksRemaining: 0,
    pendingGear: NEUTRAL_GEAR,
    clutchEngagement: 0,
    clutchLocked: false,
    limiterActive: false,

    engineTorqueNm: 0,
    wheelTorqueNm: 0,
    slipRatio: 0,
    gripLimitN: 0,
    tractiveForceN: 0,
    wheelspin: false,
    wheelsLocked: false,

    lights: { prestage: false, stage: false, ambers: [false, false, false], green: false, red: false },
    treeSchedule: null,
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
 * Mutates `state` in place: a pass runs to tens of thousands of ticks and
 * allocating a fresh state object for each would be pure waste.  The stepper is
 * the only writer, so nothing else needs to reason about the mutation.
 */
export function stepPass(state: PassState, input: RaceInput): void {
  if (state.phase === 'finished') return;

  advanceShift(state, input);
  driveOneTick(state, input);
  updateStaging(state);
  updateTiming(state);

  state.prevInput = input;
  state.tick++;

  if (state.tick >= MAX_PASS_TICKS && !isPassComplete(state)) {
    state.incomplete = true;
    state.phase = 'finished';
  }
}

// ---------------------------------------------------------------------------
// Gear selection
// ---------------------------------------------------------------------------

/**
 * Steps any shift in progress and starts a new one when asked.
 *
 * Shifting alone does nothing to the car's motion -- it only changes what the
 * throttle will be connected to.
 */
function advanceShift(state: PassState, input: RaceInput): void {
  if (state.shiftTicksRemaining > 0) {
    state.shiftTicksRemaining--;
    if (state.shiftTicksRemaining === 0) {
      state.gear = state.pendingGear;
      state.clutchLocked = false;
    }
    return;
  }

  const pressedUp = input.shiftUp && !state.prevInput.shiftUp;
  const pressedDown = input.shiftDown && !state.prevInput.shiftDown;
  if (pressedUp === pressedDown) return;

  const { lowest, highest } = gearRange(state.car, state.tune);
  const target = clamp(state.gear + (pressedUp ? 1 : -1), lowest, highest);
  if (target === state.gear) return;

  state.shiftTicksRemaining = msToTicks(DRIVELINE.shiftTimeMs.value);
  state.pendingGear = target;
  state.clutchEngagement = 0;
  state.clutchLocked = false;
}

// ---------------------------------------------------------------------------
// Physics
// ---------------------------------------------------------------------------

function driveOneTick(state: PassState, input: RaceInput): void {
  const { car, tune } = state;
  const radius = car.tyres.radiusM;

  const shifting = state.shiftTicksRemaining > 0;
  const inGear = state.gear !== NEUTRAL_GEAR && !shifting;
  const throttle = shifting ? 0 : clamp(input.throttle, 0, 1);

  // --- Engine ------------------------------------------------------------
  const engineResult = netEngineTorque(
    car.engine,
    radPerSecToRpm(state.engineOmega),
    throttle,
    state.limiterActive,
  );
  state.limiterActive = engineResult.limiterActive;
  state.engineTorqueNm = engineResult.torqueNm;

  // --- Clutch ------------------------------------------------------------
  // There is no clutch pedal, so the clutch follows the throttle: easing the
  // slider in feeds the car gently, slamming it drops the clutch hard, and
  // closing it altogether opens the clutch so the car rolls free. That last
  // part is what makes staging on momentum possible -- leave any drive
  // connected at idle and the car creeps forward like an automatic and can
  // never be coasted to a stop.
  //
  // Once the car is properly rolling the clutch stays clamped regardless, so
  // lifting mid-run gives engine braking rather than a coast.
  const rolling = Math.abs(state.speedMs) > DRIVELINE.clutchLockSpeedMs.value;
  const engagementTarget = inGear
    ? rolling
      ? 1
      : clamp(throttle * DRIVELINE.clutchThrottleGain.value, 0, 1)
    : 0;

  const engagementStep = SIM_DT / (DRIVELINE.clutchEngageMs.value / 1000);
  state.clutchEngagement =
    engagementTarget > state.clutchEngagement
      ? Math.min(engagementTarget, state.clutchEngagement + engagementStep)
      : Math.max(engagementTarget, state.clutchEngagement - engagementStep);

  const capacity = state.clutchEngagement * DRIVELINE.clutchCapacityNm.value;
  const ratio = inGear ? totalRatio(car, tune, state.gear) : 0;

  // --- Tyre --------------------------------------------------------------
  // Resolved before the clutch solution below, which needs to know what the
  // contact patch is doing this step.
  const slip = slipRatio(state.wheelOmega, radius, state.speedMs);
  const force = tractiveForce(car, slip, state.accelMs2);

  state.slipRatio = slip;
  state.tractiveForceN = force;
  state.gripLimitN = gripLimit(car, state.accelMs2);
  state.wheelspin = slip > car.tyres.peakSlipRatio;
  state.wheelsLocked = slip < -car.tyres.peakSlipRatio;

  // --- Driveline ---------------------------------------------------------
  let wheelDriveTorque: number;
  let wheelInertia: number;

  if (ratio === 0) {
    // Neutral, or mid-shift: the engine spins against its own inertia alone and
    // the wheels are free.
    state.engineOmega = Math.max(
      rpmToRadPerSec(car.engine.idleRpm),
      state.engineOmega + (engineResult.torqueNm / car.engine.inertiaKgM2) * SIM_DT,
    );
    state.clutchLocked = false;
    wheelDriveTorque = 0;
    wheelInertia = car.tyres.inertiaKgM2;
  } else if (state.clutchLocked) {
    // Rigid driveline: the engine is carried by the wheels.
    state.engineOmega = state.wheelOmega * ratio;
    wheelDriveTorque = engineResult.torqueNm * ratio * car.gearbox.driveEfficiency;
    wheelInertia = lockedDrivelineInertia(car, tune, state.gear);
  } else {
    const efficiency = car.gearbox.driveEfficiency;
    const engineInertia = car.engine.inertiaKgM2;
    const wheelSideInertia = car.tyres.inertiaKgM2;
    const drivelineOmega = state.wheelOmega * ratio;

    // Torque that would bring engine and driveline to exactly the same speed by
    // the end of this step. Solving for it rather than applying full capacity
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
    if (state.clutchEngagement >= 1 && Math.abs(equalisingTorque) <= capacity) {
      state.clutchLocked = true;
    }
  }

  state.wheelTorqueNm = wheelDriveTorque;

  // --- Brakes ------------------------------------------------------------
  // Applied at the wheel rather than straight to the car, so standing on them
  // drives slip negative and loses grip the same way spinning the tyres does.
  //
  // Solved the same way the clutch is: work out the torque that would bring the
  // wheel exactly to a stop this step, and clamp it to what the brake can
  // manage. Simply applying full capacity against the wheel's direction does
  // not survive a 1ms step -- the brake is strong enough to reverse the wheel
  // within a single tick, so it flips sign every tick, the tyre force averages
  // out to nothing, and the car sails through the staging window as though it
  // had no brakes at all. This formulation also gives the static hold for free:
  // with the wheel already stopped it returns exactly the torque needed to keep
  // it there.
  let brakeTorque = 0;
  if (input.brake) {
    const brakeCapacity = DRIVELINE.brakeTorqueNm.value;
    const stoppingTorque =
      -(wheelInertia * state.wheelOmega) / SIM_DT - wheelDriveTorque + force * radius;
    brakeTorque = clamp(stoppingTorque, -brakeCapacity, brakeCapacity);
  }

  // --- Integrate ---------------------------------------------------------
  const wheelAlpha = (wheelDriveTorque + brakeTorque - force * radius) / wheelInertia;
  state.wheelOmega += wheelAlpha * SIM_DT;

  const previousSpeed = state.speedMs;
  let speed = previousSpeed + (force / car.chassis.massKg) * SIM_DT;

  // Losses are applied as a decrement that cannot carry the car through zero,
  // so a stationary car is not slowly dragged backwards by its own drag.
  const lossN = aeroDrag(car, Math.abs(speed)) + rollingResistance(car, speed);
  const lossDelta = (lossN / car.chassis.massKg) * SIM_DT;
  if (speed > 0) speed = Math.max(0, speed - lossDelta);
  else if (speed < 0) speed = Math.min(0, speed + lossDelta);

  state.speedMs = speed;
  state.accelMs2 = (speed - previousSpeed) / SIM_DT;
  state.positionM += speed * SIM_DT;

  // Standing on the brakes at walking pace simply holds the car, rather than
  // letting it jitter around zero as the brake torque flips sign each tick.
  if (
    input.brake &&
    Math.abs(state.speedMs) < BRAKE_HOLD_SPEED_MS &&
    Math.abs(state.wheelOmega) < BRAKE_HOLD_OMEGA
  ) {
    state.speedMs = 0;
    state.wheelOmega = 0;
    state.accelMs2 = 0;
  }
}

// ---------------------------------------------------------------------------
// Staging
// ---------------------------------------------------------------------------

/**
 * Watches for the car settling inside the staging window.
 *
 * The driver has to stop with the nose between the pre-stage and stage lines and
 * hold it there.  Rolling through the stage line does not stage the car -- it
 * starts the clock, which before the green is a red light -- so overshooting
 * means selecting reverse and backing up.
 */
function updateStaging(state: PassState): void {
  if (state.phase === 'running' || state.phase === 'finished') return;

  const zoneStart = stagingZoneStart();
  const inZone = state.positionM >= zoneStart && state.positionM <= 0;
  const stopped = Math.abs(state.speedMs) < STAGING.stoppedSpeedMs.value;

  if (state.phase === 'tree') {
    // Backing out of the window abandons the run-up; the tree is re-armed once
    // the car is settled again.
    if (state.positionM < zoneStart) {
      state.treeSchedule = null;
      state.stagedPositionM = null;
      state.settleTicks = 0;
      state.phase = 'approach';
    }
    updateLights(state, inZone);
    return;
  }

  if (inZone && stopped) {
    state.phase = 'staged';
    state.settleTicks++;

    if (state.settleTicks >= msToTicks(STAGING.settleMs.value)) {
      const result = scheduleTree(state.tick, state.rngState);
      state.treeSchedule = result.schedule;
      state.rngState = result.rngState;
      state.stagedPositionM = state.positionM;
      state.phase = 'tree';
    }
  } else {
    state.phase = 'approach';
    state.settleTicks = 0;
  }

  updateLights(state, inZone);
}

function updateLights(state: PassState, inZone: boolean): void {
  const prestage = state.positionM >= stagingZoneStart();
  const staged = inZone && (state.phase === 'staged' || state.phase === 'tree');
  state.lights = treeLightsAt(state.tick, state.treeSchedule, prestage, staged, state.foul);
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

/**
 * Starts the clock at the stage line and records split times.
 *
 * Crossings are interpolated inside the step they occur in, so a 1ms step does
 * not quantise the results -- two passes a thousandth apart stay distinct.
 */
function updateTiming(state: PassState): void {
  const travelled = state.speedMs * SIM_DT;
  const previousPosition = state.positionM - travelled;

  if (state.clockStartTick === null) {
    if (state.positionM >= 0 && travelled > 0) {
      state.clockStartTick = state.tick + crossingFraction(previousPosition, travelled, 0);
      state.phase = 'running';

      const green = state.treeSchedule?.greenTick;
      // Crossing the line before the green -- or before the tree ran at all --
      // is a red light.
      state.foul = green === undefined || state.clockStartTick < green;
      state.lights = { ...state.lights, red: state.foul };
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
// Telemetry helpers
// ---------------------------------------------------------------------------

/** Engine speed in rpm. Convenience for the HUD and the debug panel. */
export function engineRpm(state: PassState): number {
  return radPerSecToRpm(state.engineOmega);
}

/** Ratio currently selected, for the debug panel. */
export function currentRatio(state: PassState): number {
  return totalRatio(state.car, state.tune, state.gear);
}
