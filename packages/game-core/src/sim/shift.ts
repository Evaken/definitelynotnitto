import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';
import { torqueAtRpm } from './engine.js';
import { forwardGearCount, gearRatio } from './drivetrain.js';

/**
 * Where the optimal upshift is.
 *
 * Not a fixed number of revs below the limiter -- that only happens to be right
 * for one gearbox. Shifting is worth it exactly when the next gear would put
 * more force at the wheels than the current one, and where that crossover falls
 * depends on the torque curve and on the gap between the two ratios. A close
 * ratio drops the engine barely at all and is worth taking early; a wide one
 * dumps it out of the power band and is worth holding.
 *
 * Force at the wheels is `torque(rpm) * ratio * finalDrive / tyreRadius`. The
 * final drive and radius are the same either side of a shift, so they cancel and
 * the comparison is just `torque * gearRatio`.
 */

/** How far below the crossover the shift light comes on. */
const LIGHT_LEAD_RPM = 400;

/**
 * The lowest engine speed at which shifting up from `gear` gains more than it
 * costs, or `null` if there is no higher gear to take.
 *
 * Never returns more than the redline: if the crossover lies beyond it, the
 * engine runs out of revs before the next gear is ever the better choice, and
 * the answer is to shift at the limiter.
 */
export function optimalShiftRpm(car: Car, tune: Tune, gear: number): number | null {
  if (gear < 1 || gear >= forwardGearCount(car, tune)) return null;

  const current = gearRatio(car, tune, gear);
  const next = gearRatio(car, tune, gear + 1);
  if (current <= 0 || next <= 0) return null;

  const { curve, idleRpm, redlineRpm } = car.engine;
  const drop = next / current;

  for (let rpm = idleRpm; rpm <= redlineRpm; rpm += 10) {
    const holding = torqueAtRpm(curve, rpm) * current;
    const shifting = torqueAtRpm(curve, rpm * drop) * next;
    if (shifting >= holding) return rpm;
  }

  return redlineRpm;
}

/**
 * Whether the shift light should be lit right now.
 *
 * Comes on a little before the crossover, because a driver who waits for the
 * light and then reacts has already gone past it.
 */
export function shouldShiftUp(car: Car, tune: Tune, gear: number, rpm: number): boolean {
  const optimal = optimalShiftRpm(car, tune, gear);
  if (optimal === null) return false;
  return rpm >= optimal - LIGHT_LEAD_RPM;
}
