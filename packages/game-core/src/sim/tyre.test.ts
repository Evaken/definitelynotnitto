import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { drivenAxleLoad, gripCoefficient, isWheelspinning, slipRatio } from './tyre.js';
import { ENVIRONMENT } from '../config/historical.js';
import type { Car } from '../types/car.js';

const tyre = CIVIC_SI.tyres;

describe('the grip curve', () => {
  it('produces no force at all when the tyre is rolling cleanly', () => {
    expect(gripCoefficient(tyre, 0)).toBeCloseTo(0, 6);
  });

  it('peaks at the tyre s peak slip ratio', () => {
    const peak = gripCoefficient(tyre, tyre.peakSlipRatio);
    expect(peak).toBeCloseTo(tyre.peakGrip, 6);

    expect(gripCoefficient(tyre, tyre.peakSlipRatio * 0.5)).toBeLessThan(peak);
    expect(gripCoefficient(tyre, tyre.peakSlipRatio * 2)).toBeLessThan(peak);
  });

  it('rises without dipping on the way to the peak', () => {
    let previous = -1;
    for (let slip = 0; slip <= tyre.peakSlipRatio; slip += tyre.peakSlipRatio / 20) {
      const mu = gripCoefficient(tyre, slip);
      expect(mu).toBeGreaterThanOrEqual(previous);
      previous = mu;
    }
  });

  it('falls away towards the sliding value once past the peak', () => {
    // The gap between peak and sliding grip is what makes wheelspin cost time.
    const sliding = gripCoefficient(tyre, 4);
    expect(sliding).toBeLessThan(tyre.peakGrip);
    expect(sliding).toBeGreaterThan(tyre.peakGrip * tyre.slidingGripFraction * 0.98);
  });

  it('behaves the same under braking as under power', () => {
    expect(gripCoefficient(tyre, -0.2)).toBeCloseTo(gripCoefficient(tyre, 0.2), 6);
  });
});

describe('slip ratio', () => {
  const radius = tyre.radiusM;

  it('is zero for a freely rolling wheel', () => {
    const speed = 20;
    expect(slipRatio(speed / radius, radius, speed)).toBeCloseTo(0, 6);
  });

  it('is positive when the tyre outruns the car', () => {
    expect(slipRatio(30 / radius, radius, 20)).toBeGreaterThan(0);
  });

  it('is negative when the car outruns the tyre', () => {
    expect(slipRatio(10 / radius, radius, 20)).toBeLessThan(0);
  });

  it('stays finite at a standstill', () => {
    // Slip ratio divides by vehicle speed, so without a floor on the
    // denominator the launch would produce an infinity on the first tick.
    expect(Number.isFinite(slipRatio(50, radius, 0))).toBe(true);
    expect(Number.isFinite(slipRatio(0, radius, 0))).toBe(true);
  });

  it('is bounded however fast the tyre spins', () => {
    expect(Math.abs(slipRatio(10000, radius, 0))).toBeLessThanOrEqual(4);
  });

  it('reports wheelspin only past the grip peak', () => {
    expect(isWheelspinning(tyre, tyre.peakSlipRatio * 0.5)).toBe(false);
    expect(isWheelspinning(tyre, tyre.peakSlipRatio * 2)).toBe(true);
  });
});

describe('weight transfer', () => {
  const weight = CIVIC_SI.chassis.massKg * ENVIRONMENT.gravity;

  it('leaves the static split alone when the car is not accelerating', () => {
    expect(drivenAxleLoad(CIVIC_SI, 0)).toBeCloseTo(weight * CIVIC_SI.chassis.frontWeightBias, 3);
  });

  it('takes load off the front wheels of a front-driver under power', () => {
    // The reason a FWD car struggles to launch is mechanical, not a penalty
    // applied to front-wheel drive: it goes light on the wheels doing the work.
    expect(drivenAxleLoad(CIVIC_SI, 6)).toBeLessThan(drivenAxleLoad(CIVIC_SI, 0));
  });

  it('puts load onto the rear wheels of a rear-driver under power', () => {
    const rwd: Car = { ...CIVIC_SI, drivetrain: 'RWD' };
    expect(drivenAxleLoad(rwd, 6)).toBeGreaterThan(drivenAxleLoad(rwd, 0));
  });

  it('gives an all-wheel-drive car the whole weight of the car', () => {
    const awd: Car = { ...CIVIC_SI, drivetrain: 'AWD' };
    expect(drivenAxleLoad(awd, 6)).toBeCloseTo(weight, 3);
  });

  it('never reports a negative load', () => {
    expect(drivenAxleLoad(CIVIC_SI, 500)).toBeGreaterThanOrEqual(0);
  });
});
