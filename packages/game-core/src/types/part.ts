/**
 * Part definitions.
 *
 * Stage 1 does not implement the parts shop.  These types exist because the
 * simulation entry point takes a build (car + fitted parts + tune) rather than
 * a bare car, and changing that signature later would touch every call site.
 * The registry in `data/parts` is intentionally empty until Stage 3.
 */

import type { InductionType } from './car.js';

export type PartCategory =
  | 'intake'
  | 'exhaust'
  | 'ecu'
  | 'engine'
  | 'turbo'
  | 'supercharger'
  | 'turbo-accessory'
  | 'nitrous'
  | 'clutch'
  | 'transmission'
  | 'tyres'
  | 'suspension'
  | 'weight-reduction'
  | 'wheels'
  | 'cosmetic';

/**
 * Two parts sharing an exclusion group cannot be fitted at the same time --
 * a turbo and a supercharger, or two nitrous kits.  Stage 3 enforces this.
 */
export type ExclusionGroup = string;
export interface PartEffects {
  readonly torqueMultiplier?: number;
  /**
   * How much of its peak grip this tyre still makes once it is sliding.
   *
   * Separate from `tyreGripMultiplier`, which raises the peak. A drag radial
   * does both: it grips harder AND holds on to more of that grip past the peak,
   * which is the property that actually decides whether flooring it off the
   * line costs you the race. Raising the peak alone does not help a car that
   * spends the whole sixty foot past it.
   *
   * Set rather than multiplied, and the highest fitted value wins, because a
   * tyre replaces rather than stacks.
   */
  readonly tyreSlidingGripFraction?: number;
  /**
   * Gauge pressure this part adds at wide-open throttle, bar.
   *
   * Forced induction declares this INSTEAD of a torque multiplier: the torque
   * it makes is derived from the pressure, so the gauge and the performance
   * cannot disagree. Both would double-count.
   */
  readonly peakBoostBar?: number;
  readonly inductionType?: InductionType;
  /** Where this compressor comes on song. Turbos only. */
  readonly spoolRpm?: number;
  /**
   * How much of the built engine's peak torque this clutch will hold.
   *
   * Measured against the engine, not as a figure in newton-metres and not as a
   * multiple of the car's standard clutch. Both were tried and neither serves a
   * thirteen-car roster: 560Nm is a large upgrade on a Civic and none at all on
   * an Evo whose standard clutch already holds 517, while a multiple of the
   * standard clutch starves the Civic, whose fallback is a flat default rather
   * than a share of its torque. Against the engine, one number means the same
   * thing on every car -- "this clutch holds what you have built".
   *
   * A clutch replaces rather than stacks, so the strongest fitted one counts,
   * and it is never worse than the clutch the car came with.
   */
  readonly clutchHoldsTorqueRatio?: number;
  readonly massDeltaKg?: number;
  readonly tyreGripMultiplier?: number;
  readonly drivelineEfficiencyDelta?: number;
  readonly nitrousPowerKw?: number;
  readonly nitrousCapacitySeconds?: number;
}

export interface Part {
  readonly id: string;
  readonly displayName: string;
  readonly category: PartCategory;
  readonly price: number;
  /** Car ids this part fits. An empty list means it fits everything. */
  readonly compatibleCarIds: readonly string[];
  /** Part ids that must already be fitted before this one can be. */
  readonly requires: readonly string[];
  readonly exclusionGroups: readonly ExclusionGroup[];
  readonly effects: PartEffects;
  readonly calibrationNote: string;
}

/**
 * A car plus everything the player has done to it.  This -- not `Car` -- is
 * what the simulator consumes, so that fitting a part in Stage 3 needs no
 * change to the simulation API.
 */
export interface Build {
  readonly carId: string;
  readonly fittedPartIds: readonly string[];
}
