/**
 * Per-vehicle tuning settings.
 *
 * Stage 1 has no tuning UI; every pass runs the car's stock tune.  The type
 * exists now so the simulator's signature is already correct when Stage 4
 * makes gearing editable.
 */

import type { Car } from './car.js';

export interface Tune {
  /** Overrides `GearboxSpec.gearRatios`. Must have the same length. */
  readonly gearRatios: readonly number[];
  /** Overrides `GearboxSpec.finalDrive`. */
  readonly finalDrive: number;
}

/** The tune a car leaves the showroom with: its own factory gearing. */
export function stockTune(car: Car): Tune {
  return {
    gearRatios: [...car.gearbox.gearRatios],
    finalDrive: car.gearbox.finalDrive,
  };
}
