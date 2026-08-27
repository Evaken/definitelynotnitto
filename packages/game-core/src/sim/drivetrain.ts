import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';
import { NEUTRAL_GEAR, REVERSE_GEAR } from '../types/sim.js';

/**
 * Gear selection and gearing.
 *
 * Gears are numbered the way a driver counts them: -1 reverse, 0 neutral, 1 for
 * first.  Forward ratios come from the tune, falling back to the car's factory
 * gearbox, so Stage 4's gear tuning needs no change here -- it only has to write
 * a different `Tune`.
 */

function forwardRatios(car: Car, tune: Tune): readonly number[] {
  return tune.gearRatios.length > 0 ? tune.gearRatios : car.gearbox.gearRatios;
}

/** How many forward gears this car has. */
export function forwardGearCount(car: Car, tune: Tune): number {
  return forwardRatios(car, tune).length;
}

/**
 * Ratio of the selected gear.
 *
 * Neutral is zero -- no connection at all -- and reverse is negative, which is
 * what makes the wheels turn backwards without the physics needing to know it
 * is reverse.
 */
export function gearRatio(car: Car, tune: Tune, gear: number): number {
  if (gear === NEUTRAL_GEAR) return 0;
  if (gear === REVERSE_GEAR) return -car.gearbox.reverseRatio;
  return forwardRatios(car, tune)[gear - 1] ?? 0;
}

export function finalDrive(car: Car, tune: Tune): number {
  return tune.finalDrive > 0 ? tune.finalDrive : car.gearbox.finalDrive;
}

/** Combined gear x final drive: engine turns per wheel turn. */
export function totalRatio(car: Car, tune: Tune, gear: number): number {
  return gearRatio(car, tune, gear) * finalDrive(car, tune);
}

/** The lowest and highest selectable gear, for clamping a shift. */
export function gearRange(car: Car, tune: Tune): { lowest: number; highest: number } {
  return { lowest: REVERSE_GEAR, highest: forwardGearCount(car, tune) };
}

/** How a gear reads on the dash: "R", "N", or its number. */
export function gearLabel(gear: number): string {
  if (gear === REVERSE_GEAR) return 'R';
  if (gear === NEUTRAL_GEAR) return 'N';
  return String(gear);
}

/**
 * Rotational inertia seen at the driven wheels with the clutch locked, kg*m^2.
 *
 * Engine inertia is referred through the gearing by the square of the ratio,
 * which is why first gear feels so much heavier to rev than fifth.
 */
export function lockedDrivelineInertia(car: Car, tune: Tune, gear: number): number {
  const ratio = totalRatio(car, tune, gear);
  return car.tyres.inertiaKgM2 + car.engine.inertiaKgM2 * ratio * ratio;
}

/** Wheel torque produced by a given flywheel torque in the given gear, Nm. */
export function wheelTorque(
  car: Car,
  tune: Tune,
  gear: number,
  flywheelTorqueNm: number,
): number {
  return flywheelTorqueNm * totalRatio(car, tune, gear) * car.gearbox.driveEfficiency;
}
