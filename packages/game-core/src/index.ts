/**
 * @nitto/game-core — all gameplay logic for Nitto 1320 Challenge.
 *
 * This package is pure TypeScript with no UI, DOM or network dependencies
 * (PROJECT_SPEC 6.1).  The web client consumes it; from Stage 10 the server
 * will consume the same code to re-simulate submitted races, which is only
 * possible because nothing in here assumes a browser.
 */

// Types
export type {
  Car,
  ChassisSpec,
  DrivetrainType,
  EngineSpec,
  GearboxSpec,
  TorqueCurve,
  TorquePoint,
  TyreSpec,
} from './types/car.js';
export type { Build, ExclusionGroup, Part, PartCategory } from './types/part.js';
export type { Tune } from './types/tune.js';
export { stockTune } from './types/tune.js';
export type {
  InputChange,
  InputTimeline,
  PassState,
  RaceInput,
  RacePhase,
  SplitName,
  TimingSlip,
  TreeLights,
  TreeSchedule,
} from './types/sim.js';
export { NEUTRAL_GEAR, NEUTRAL_INPUT, REVERSE_GEAR, SIM_DT, SIM_HZ } from './types/sim.js';

// Configuration
export type { Confidence, TreeType, Uncertain } from './config/historical.js';
export {
  CONTROLS_CONFIDENCE,
  DEFAULT_BINDINGS,
  DRIVELINE,
  ENVIRONMENT,
  STAGING,
  THROTTLE_RELEASE_MS,
  TRACK_MARKS,
  TRAP_LENGTH_M,
  TREE,
} from './config/historical.js';

// Data
export { CARS, CIVIC_SI, getCar } from './data/cars/index.js';
export { PARTS, getPart } from './data/parts/index.js';

// Simulation
export {
  createPassState,
  currentRatio,
  engineRpm,
  isPassComplete,
  isRunComplete,
  stagingZoneStart,
  stepPass,
  MAX_PASS_TICKS,
} from './sim/pass.js';
export { buildTimingSlip } from './sim/timing.js';
export type { BestRuns } from './sim/records.js';
export { bestRuns, lastRunWasBestEt, noRuns } from './sim/records.js';
export { quantiseThrottle, springThrottleClosed } from './sim/throttle.js';
export { optimalShiftRpm, shouldShiftUp } from './sim/shift.js';
export { TimelineRecorder, inputAtTick, replayPass } from './sim/replay.js';
export { reactionTime, scheduleTree, treeLightsAt } from './sim/tree.js';
export { kwToHp, peakTorque, powerKwAtRpm, torqueAtRpm } from './sim/engine.js';
export {
  forwardGearCount,
  gearLabel,
  gearRange,
  gearRatio,
  finalDrive,
  totalRatio,
} from './sim/drivetrain.js';
export {
  aeroDrag,
  drivenAxleLoad,
  gripCoefficient,
  gripLimit,
  isWheelspinning,
  rollingResistance,
  slipRatio,
  tractiveForce,
} from './sim/tyre.js';
export { clamp, metresToFeet, msToMph, radPerSecToRpm, round, rpmToRadPerSec } from './sim/units.js';
