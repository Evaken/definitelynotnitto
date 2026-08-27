import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';

/**
 * Gearing.
 *
 * Ratios come from the tune, falling back to the car's factory gearbox, so
 * Stage 4's gear tuning needs no change here -- it only has to write a
 * different `Tune`.
 */

/** Ratio of the selected gear, or 0 if the index is out of range (neutral). */
export function gearRatio(car: Car, tune: Tune, gearIndex: number): number {
  const ratios = tune.gearRatios.length > 0 ? tune.gearRatios : car.gearbox.gearRatios;
  return ratios[gearIndex] ?? 0;
}

export function gearCount(car: Car, tune: Tune): number {
  return tune.gearRatios.length > 0 ? tune.gearRatios.length : car.gearbox.gearRatios.length;
}

export function finalDrive(car: Car, tune: Tune): number {
  return tune.finalDrive > 0 ? tune.finalDrive : car.gearbox.finalDrive;
}

/** Combined gear x final drive, i.e. engine turns per wheel turn. */
export function totalRatio(car: Car, tune: Tune, gearIndex: number): number {
  return gearRatio(car, tune, gearIndex) * finalDrive(car, tune);
}

/** Crank speed implied by a wheel speed in the given gear, rad/s. */
export function engineOmegaForWheel(
  car: Car,
  tune: Tune,
  gearIndex: number,
  wheelOmega: number,
): number {
  return wheelOmega * totalRatio(car, tune, gearIndex);
}

/**
 * Rotational inertia seen at the driven wheels with the clutch locked, kg*m^2.
 *
 * Engine inertia is referred through the gearing by the square of the ratio,
 * which is why first gear feels so much heavier to rev than fifth.
 */
export function lockedDrivelineInertia(car: Car, tune: Tune, gearIndex: number): number {
  const ratio = totalRatio(car, tune, gearIndex);
  return car.tyres.inertiaKgM2 + car.engine.inertiaKgM2 * ratio * ratio;
}

/** Wheel torque produced by a given flywheel torque in the given gear, Nm. */
export function wheelTorque(
  car: Car,
  tune: Tune,
  gearIndex: number,
  flywheelTorqueNm: number,
): number {
  return flywheelTorqueNm * totalRatio(car, tune, gearIndex) * car.gearbox.driveEfficiency;
}
