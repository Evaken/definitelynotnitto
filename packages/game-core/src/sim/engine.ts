import type { EngineSpec, TorqueCurve } from '../types/car.js';
import { DRIVELINE } from '../config/historical.js';
import { clamp } from './units.js';

/**
 * Engine torque production.
 *
 * The curve is pure data (PROJECT_SPEC 6.2) -- nothing here knows which car it
 * belongs to, and adding an engine means adding points to a car definition.
 */

/**
 * Wide-open-throttle torque at a given speed, linearly interpolated between
 * curve points and clamped to the end points outside the defined range.
 */
export function torqueAtRpm(curve: TorqueCurve, rpm: number): number {
  if (curve.length === 0) return 0;

  const first = curve[0]!;
  if (rpm <= first.rpm) return first.torqueNm;

  const last = curve[curve.length - 1]!;
  if (rpm >= last.rpm) return last.torqueNm;

  for (let i = 1; i < curve.length; i++) {
    const upper = curve[i]!;
    if (rpm > upper.rpm) continue;
    const lower = curve[i - 1]!;
    const span = upper.rpm - lower.rpm;
    // Guard against duplicate rpm entries in hand-written car data.
    if (span <= 0) return upper.torqueNm;
    const t = (rpm - lower.rpm) / span;
    return lower.torqueNm + t * (upper.torqueNm - lower.torqueNm);
  }

  return last.torqueNm;
}

/** Peak torque and the speed it occurs at. Used by the dyno from Stage 4. */
export function peakTorque(curve: TorqueCurve): { torqueNm: number; rpm: number } {
  let best = { torqueNm: 0, rpm: 0 };
  for (const point of curve) {
    if (point.torqueNm > best.torqueNm) best = { torqueNm: point.torqueNm, rpm: point.rpm };
  }
  return best;
}

/** Power in kilowatts at a given speed. */
export function powerKwAtRpm(curve: TorqueCurve, rpm: number): number {
  return (torqueAtRpm(curve, rpm) * rpm * 2 * Math.PI) / 60 / 1000;
}

export function kwToHp(kw: number): number {
  return kw * 1.34102209;
}

/**
 * Net flywheel torque this step, after throttle, the rev limiter and internal
 * friction.
 *
 * `limiterActive` is carried on the pass state rather than recomputed, because
 * the limiter has hysteresis: once it cuts, fuel stays off until the engine has
 * dropped a little way below redline.  That is what produces the bounce off the
 * limiter instead of a buzzing chatter at exactly the redline.
 */
export function netEngineTorque(
  engine: EngineSpec,
  rpm: number,
  throttle: number,
  limiterActive: boolean,
): { torqueNm: number; limiterActive: boolean } {
  const cutIn = engine.redlineRpm;
  const cutOut = engine.redlineRpm - DRIVELINE.limiterHysteresisRpm.value;

  const nowLimited = limiterActive ? rpm > cutOut : rpm >= cutIn;
  const friction = frictionTorque(engine, rpm);

  if (nowLimited) {
    // Fuel cut: the engine still drags itself down through internal friction.
    return { torqueNm: -friction, limiterActive: true };
  }

  const openness = clamp(throttle, 0, 1);
  const wot = torqueAtRpm(engine.curve, rpm);

  // The published curve is already net of friction at wide-open throttle, so
  // friction is only subtracted as the throttle closes -- otherwise the car
  // would be down on power everywhere against its own quoted figures.
  return { torqueNm: wot * openness - friction * (1 - openness), limiterActive: false };
}

/**
 * Closed-throttle drag torque at a given speed.
 *
 * Scales with engine speed, because pumping losses do: an engine lifted at
 * redline falls away quickly and one lifted just off idle barely slows at all.
 * A flat figure makes the revs hang after a lift, which in turn makes setting a
 * deliberate launch rpm on the line impossible.
 */
function frictionTorque(engine: EngineSpec, rpm: number): number {
  const atRedline = DRIVELINE.engineFrictionNm.value;
  return atRedline * clamp(rpm / engine.redlineRpm, 0.2, 1.2);
}
