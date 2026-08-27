import type { Car, TyreSpec } from '../types/car.js';
import { ENVIRONMENT } from '../config/historical.js';
import { clamp } from './units.js';

/**
 * Longitudinal tyre model.
 *
 * A single slip-ratio curve produces both failure modes the game needs.  Too
 * much torque off the line spins the tyres past their grip peak and loses time;
 * too little leaves the tyres below the peak and the car bogs.  Neither is a
 * special case in the code -- they are the two sides of one curve, which is
 * what lets Stage 2 tune launch feel by editing tyre data rather than logic.
 */

/**
 * Below this speed the slip-ratio denominator is held constant.
 *
 * Slip ratio divides by vehicle speed, so at a standstill it is undefined and
 * near a standstill it is violently sensitive -- tiny wheel-speed changes swing
 * the force enormously and the integrator rings.  Holding the denominator at a
 * floor keeps the launch stable without distorting behaviour once moving.
 */
const SPEED_FLOOR_MS = 2.0;

/** Slip beyond this is clamped; the curve is flat out there anyway. */
const MAX_SLIP_RATIO = 4;

/**
 * Longitudinal slip ratio: how much faster the tyre surface is turning than the
 * car is travelling, as a fraction.  Zero is a perfectly rolling tyre.
 */
export function slipRatio(wheelOmega: number, tyreRadiusM: number, speedMs: number): number {
  const surfaceSpeed = wheelOmega * tyreRadiusM;
  const denominator = Math.max(Math.abs(speedMs), SPEED_FLOOR_MS);
  return clamp((surfaceSpeed - speedMs) / denominator, -MAX_SLIP_RATIO, MAX_SLIP_RATIO);
}

/**
 * Coefficient of friction at a given slip ratio.
 *
 * Rises to `peakGrip` at `peakSlipRatio` on a quarter-sine -- which flattens out
 * at the peak and keeps the integrator well behaved -- then decays towards the
 * sliding value as the tyre gives up.
 */
export function gripCoefficient(tyre: TyreSpec, slip: number): number {
  const magnitude = Math.abs(slip);
  const peakSlip = tyre.peakSlipRatio;

  if (magnitude <= peakSlip) {
    return tyre.peakGrip * Math.sin((Math.PI / 2) * (magnitude / peakSlip));
  }

  const decayWidth = peakSlip * 3;
  const decay = Math.exp(-(magnitude - peakSlip) / decayWidth);
  const sliding = tyre.slidingGripFraction;
  return tyre.peakGrip * (sliding + (1 - sliding) * decay);
}

/** True once slip has carried the tyre past its grip peak. */
export function isWheelspinning(tyre: TyreSpec, slip: number): boolean {
  return Math.abs(slip) > tyre.peakSlipRatio;
}

/**
 * Vertical load carried by the driven axle, newtons.
 *
 * Acceleration pitches load rearwards, so a front-wheel-drive car goes light on
 * exactly the wheels it is trying to put power through.  That is a real
 * mechanical consequence of the drivetrain type rather than a penalty applied
 * to FWD cars, which is why the Civic behaves the way it does off the line.
 */
export function drivenAxleLoad(car: Car, accelMs2: number): number {
  const { massKg, wheelbaseM, cgHeightM, frontWeightBias } = car.chassis;
  const weight = massKg * ENVIRONMENT.gravity;

  const staticFront = weight * frontWeightBias;
  const staticRear = weight - staticFront;
  const transfer = (massKg * accelMs2 * cgHeightM) / wheelbaseM;

  switch (car.drivetrain) {
    case 'FWD':
      return Math.max(0, staticFront - transfer);
    case 'RWD':
      return Math.max(0, staticRear + transfer);
    case 'AWD':
      return weight;
  }
}

/** Peak longitudinal force the driven tyres can deliver right now, newtons. */
export function gripLimit(car: Car, accelMs2: number): number {
  return car.tyres.peakGrip * drivenAxleLoad(car, accelMs2);
}

/** Longitudinal force the driven tyres are actually delivering, newtons. */
export function tractiveForce(car: Car, slip: number, accelMs2: number): number {
  const mu = gripCoefficient(car.tyres, slip);
  const load = drivenAxleLoad(car, accelMs2);
  return mu * load * Math.sign(slip);
}

/** Aerodynamic drag opposing motion, newtons. */
export function aeroDrag(car: Car, speedMs: number): number {
  const { dragCoefficient, frontalAreaM2 } = car.chassis;
  return 0.5 * ENVIRONMENT.airDensity * dragCoefficient * frontalAreaM2 * speedMs * speedMs;
}

/** Rolling resistance opposing motion, newtons. */
export function rollingResistance(car: Car, speedMs: number): number {
  if (speedMs <= 0) return 0;
  return car.chassis.rollingResistance * car.chassis.massKg * ENVIRONMENT.gravity;
}
