/**
 * Per-vehicle tuning settings.
 *
 * Stage 1 has no tuning UI; every pass runs the car's stock tune.  The type
 * exists now so the simulator's signature is already correct when Stage 4
 * makes gearing editable.
 */

import type { Car } from './car.js';
import { TUNING } from '../config/historical.js';

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

/** Validate a player tune without silently repairing it. */
export function validateTune(car: Car, tune: Tune): string | null {
  if (tune.gearRatios.length !== car.gearbox.gearRatios.length) return `This gearbox requires ${car.gearbox.gearRatios.length} forward gears.`;
  if (!Number.isFinite(tune.finalDrive) || tune.finalDrive < TUNING.finalDriveMin.value || tune.finalDrive > TUNING.finalDriveMax.value) return `Final drive must be between ${TUNING.finalDriveMin.value.toFixed(2)} and ${TUNING.finalDriveMax.value.toFixed(2)}.`;
  for (let index = 0; index < tune.gearRatios.length; index++) {
    const ratio = tune.gearRatios[index]!;
    if (!Number.isFinite(ratio) || ratio < TUNING.gearRatioMin.value || ratio > TUNING.gearRatioMax.value) return `Gear ${index + 1} must be between ${TUNING.gearRatioMin.value.toFixed(2)} and ${TUNING.gearRatioMax.value.toFixed(2)}.`;
    if (index > 0 && ratio >= tune.gearRatios[index - 1]!) return `Gear ${index + 1} must be taller than gear ${index}.`;
  }
  return null;
}
