/**
 * Part definitions.
 *
 * Stage 1 does not implement the parts shop.  These types exist because the
 * simulation entry point takes a build (car + fitted parts + tune) rather than
 * a bare car, and changing that signature later would touch every call site.
 * The registry in `data/parts` is intentionally empty until Stage 3.
 */

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
