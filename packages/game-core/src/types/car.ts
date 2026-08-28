/**
 * Structured vehicle definition.
 *
 * Every value the simulator needs comes from here.  There must never be a
 * branch in the simulator keyed on a car's id or name (PROJECT_SPEC 6.2) --
 * adding a car means adding one of these objects and nothing else.
 *
 * Units are SI throughout so the physics never has to convert mid-calculation.
 * Imperial values (feet, mph) exist only at the presentation boundary.
 */

export type DrivetrainType = 'FWD' | 'RWD' | 'AWD';

/** One point on an engine's wide-open-throttle torque curve. */
export interface TorquePoint {
  /** Crankshaft speed, revolutions per minute. */
  readonly rpm: number;
  /** Flywheel torque at that speed, newton-metres. */
  readonly torqueNm: number;
}

/**
 * Wide-open-throttle torque curve, ordered by ascending rpm.
 *
 * The simulator interpolates linearly between points and clamps outside the
 * defined range, so a curve needs enough points to capture its shape but not
 * one point per hundred rpm.
 */
export type TorqueCurve = readonly TorquePoint[];

/** How a compressor behaves: exhaust-driven lag, or belt-driven from idle. */
export type InductionType = 'turbo' | 'supercharger';

/**
 * Forced induction fitted to an engine.
 *
 * Absent on a naturally aspirated car, which is what keeps the boost gauge
 * honest: it reads zero because there is nothing making pressure, not because
 * the needle is pinned there.
 */
export interface ForcedInductionSpec {
  readonly type: InductionType;
  /** Peak gauge pressure at wide-open throttle, bar. */
  readonly peakBoostBar: number;
  /** Where a turbo starts making useful pressure. Ignored by a supercharger. */
  readonly spoolRpm: number;
}

export interface EngineSpec {
  /** Human-readable engine code, e.g. "B16A2". Display only. */
  readonly code: string;
  readonly curve: TorqueCurve;
  /** Lowest speed the engine will hold without stalling. */
  readonly idleRpm: number;
  /** Fuel cut. Torque is withdrawn above this. */
  readonly redlineRpm: number;
  /**
   * Rotational inertia of the engine and everything rigidly attached to it,
   * kg*m^2.  Governs how fast the engine picks up revs against no load, which
   * is what makes a launch off the clutch feel heavy or snappy.
   */
  readonly inertiaKgM2: number;
  /** Absent on a naturally aspirated engine. */
  readonly forcedInduction?: ForcedInductionSpec;
}

export interface NitrousSpec {
  /** Additional engine power while armed at wide-open throttle. */
  readonly powerKw: number;
  /** Usable spray time in one bottle. */
  readonly capacitySeconds: number;
}

export interface GearboxSpec {
  /**
   * Torque the clutch can hold before it slips, Nm.
   *
   * Absent means the assumed default in config. A build that adds power without
   * adding clutch cannot put it down: the clutch simply never locks, and the
   * car is slower than it was standard.
   */
  readonly clutchCapacityNm?: number;
  /**
   * Forward gear ratios, first gear first.  Length defines the gear count --
   * the simulator never assumes five or six speeds.
   */
  readonly gearRatios: readonly number[];
  /**
   * Reverse ratio, as a positive number.  The simulator negates it; storing it
   * positive keeps car data readable against a manufacturer's spec sheet.
   */
  readonly reverseRatio: number;
  readonly finalDrive: number;
  /**
   * Fraction of flywheel torque that reaches the driven wheels, 0..1.
   * Absorbs gear mesh, bearing and differential losses.
   */
  readonly driveEfficiency: number;
}

export interface TyreSpec {
  /** Loaded radius, metres. */
  readonly radiusM: number;
  /**
   * Peak coefficient of friction, reached at `peakSlipRatio`.  Street tyres
   * sit near 0.9; drag radials and slicks go well above 1.0.
   */
  readonly peakGrip: number;
  /** Slip ratio at which grip peaks. Typically 0.10 - 0.15. */
  readonly peakSlipRatio: number;
  /**
   * Fraction of peak grip still available once the tyre is spinning freely,
   * 0..1.  The gap between peak and this value is what makes wheelspin cost
   * time rather than being free.
   */
  readonly slidingGripFraction: number;
  /** Combined rotational inertia of the driven wheels, kg*m^2. */
  readonly inertiaKgM2: number;
}

export interface ChassisSpec {
  /** Kerb mass including driver, kilograms. */
  readonly massKg: number;
  /** Distance between axle centres, metres. */
  readonly wheelbaseM: number;
  /** Centre-of-gravity height above ground, metres. Drives weight transfer. */
  readonly cgHeightM: number;
  /**
   * Fraction of static mass carried by the front axle, 0..1.
   * A front-heavy FWD car has more grip at rest but loses it under power.
   */
  readonly frontWeightBias: number;
  /** Drag coefficient. */
  readonly dragCoefficient: number;
  /** Frontal area, square metres. */
  readonly frontalAreaM2: number;
  /** Rolling resistance coefficient. */
  readonly rollingResistance: number;
}

export interface Car {
  readonly id: string;
  readonly displayName: string;
  readonly manufacturer: string;
  readonly year: number;
  /** Showroom price in game dollars. Unused until Stage 7. */
  readonly price: number;
  /** Clean-room career gate for endgame vehicles; absent for normal showroom cars. */
  readonly unlockWins?: number;
  /** Marks purpose-built competition vehicles in presentation and progression. */
  readonly special?: boolean;
  readonly drivetrain: DrivetrainType;
  readonly engine: EngineSpec;
  readonly gearbox: GearboxSpec;
  readonly tyres: TyreSpec;
  readonly chassis: ChassisSpec;
  readonly nitrous?: NitrousSpec;
}
