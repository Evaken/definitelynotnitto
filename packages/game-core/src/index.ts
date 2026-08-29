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
  ForcedInductionSpec,
  InductionType,
  ChassisSpec,
  DrivetrainType,
  EngineSpec,
  NitrousSpec,
  GearboxSpec,
  TorqueCurve,
  TorquePoint,
  TyreSpec,
} from './types/car.js';
export type { Build, ExclusionGroup, Part, PartCategory, PartEffects } from './types/part.js';
export type { Tune } from './types/tune.js';
export { stockTune, validateTune } from './types/tune.js';
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
  DAMAGE,
  ENVIRONMENT,
  STAGING,
  THROTTLE_RELEASE_MS,
  TRACK_MARKS,
  TRAP_LENGTH_M,
  TREE,
  TUNING,
} from './config/historical.js';

// Data
export { CARS, CIVIC_SI, CORE_ROSTER, SPECIAL_ROSTER, getCar } from './data/cars/index.js';
export { PARTS, getPart } from './data/parts/index.js';
export type { Appearance, CpuDifficulty, GarageResult, GarageState, OwnedCarState, PlayerRecord, PurchaseInstallPlan, PurchaseInstallPreview, Transaction } from './garage.js';
export { CPU_PRIZES, applyAppearance, applyPassStress, applyTune, buyCar, buyPart, canFit, carUnlockReason, createEmptyGarageState, createGarageState, fitPart, ownedCarIds, partList, previewPurchaseAndFit, purchaseAndFitPart, removePart, repairCar, repairCost, resolveBuild, selectCar, settleCpuRace, stockAppearance } from './garage.js';

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
export { averageQuarterMileEt, bestRuns, lastRunWasBestEt, noRuns } from './sim/records.js';
export { quantiseThrottle, springThrottleClosed } from './sim/throttle.js';
export { optimalShiftRpm, shouldShiftUp } from './sim/shift.js';
export { TimelineRecorder, inputAtTick, replayPass } from './sim/replay.js';
export { reactionTime, scheduleTree, treeLightsAt } from './sim/tree.js';
export { kwToHp, peakTorque, powerKwAtRpm, torqueAtRpm } from './sim/engine.js';
export type { DynoPoint, DynoResult } from './sim/dyno.js';
export { runDyno } from './sim/dyno.js';
export type { CpuOpponent } from './sim/cpu.js';
export { CPU_OPPONENTS, playerBeatCpu, raceTotal, runCpuOpponent } from './sim/cpu.js';
export type { RaceDecision, RaceEntry, RaceMode } from './sim/raceRules.js';
export { adjudicateRace } from './sim/raceRules.js';
export type { DrivePlan, DriveResult } from './testing/drive.js';
export { drive, goodDrivePlan } from './testing/drive.js';
export { ATMOSPHERIC_BAR, barToPsi, boostBar, chargeTorqueMultiplier, wotBoostBar } from './sim/boost.js';
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
