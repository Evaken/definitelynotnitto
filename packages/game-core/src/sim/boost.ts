import type { ForcedInductionSpec } from '../types/car.js';
import { clamp } from './units.js';

/**
 * Manifold pressure, and the torque it buys.
 *
 * Forced induction used to be modelled as a flat torque multiplier -- a turbo
 * simply made the engine 32% stronger everywhere. That is wrong in a way that
 * shows: a turbo makes nothing off boost and a great deal on it, which is most
 * of what separates driving one from driving a big naturally aspirated engine.
 * It also left the boost gauge with nothing to read, because no pressure was
 * ever computed.
 *
 * Both now come from one place. The gauge reads what the torque is derived
 * from, so they cannot disagree.
 */

/** Sea-level atmospheric pressure, bar. */
export const ATMOSPHERIC_BAR = 1.013;

/**
 * How much of the extra air becomes torque.
 *
 * Airflow scales with absolute pressure, but heat and pumping losses mean the
 * torque does not scale with it one for one. Assumed, not sourced.
 */
const CHARGE_EFFICIENCY = 0.85;

/** How many rpm a turbo takes to go from first pressure to full song. */
const SPOOL_SPREAD_RPM = 1800;

/** Fraction of the redline by which a supercharger is making everything it has. */
const BLOWER_FULL_FRACTION = 0.55;

export function barToPsi(bar: number): number {
  return bar * 14.5038;
}

/**
 * Gauge pressure at wide-open throttle.
 *
 * A turbo is exhaust-driven, so it makes nothing until there is enough gas to
 * spin it and then comes in over a range. A supercharger is belt-driven: it is
 * making pressure the moment the engine turns, rising with engine speed.
 */
export function wotBoostBar(spec: ForcedInductionSpec, rpm: number, redlineRpm: number): number {
  if (spec.peakBoostBar <= 0) return 0;

  if (spec.type === 'supercharger') {
    const full = redlineRpm * BLOWER_FULL_FRACTION;
    return spec.peakBoostBar * clamp(rpm / Math.max(full, 1), 0, 1);
  }

  const ramp = (rpm - spec.spoolRpm) / SPOOL_SPREAD_RPM;
  return spec.peakBoostBar * clamp(ramp, 0, 1);
}

/**
 * Pressure the gauge should be showing.
 *
 * Boost follows the throttle, because a closed throttle has nothing to push
 * against. The same linear relationship the engine torque already uses, so the
 * needle and the power arrive together.
 */
export function boostBar(
  spec: ForcedInductionSpec | undefined,
  rpm: number,
  redlineRpm: number,
  throttle: number,
): number {
  if (!spec) return 0;
  return wotBoostBar(spec, rpm, redlineRpm) * clamp(throttle, 0, 1);
}

/**
 * What the boost is worth as a torque multiplier at a given engine speed.
 *
 * Applied to the naturally aspirated curve when a build is resolved, so the
 * boosted curve is just a curve and nothing downstream -- the shift point, the
 * dyno, the simulator -- has to know forced induction exists.
 */
export function chargeTorqueMultiplier(
  spec: ForcedInductionSpec | undefined,
  rpm: number,
  redlineRpm: number,
): number {
  if (!spec) return 1;
  return 1 + (wotBoostBar(spec, rpm, redlineRpm) / ATMOSPHERIC_BAR) * CHARGE_EFFICIENCY;
}
