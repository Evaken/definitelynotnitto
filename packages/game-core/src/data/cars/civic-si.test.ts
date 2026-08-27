import { describe, expect, it } from 'vitest';
import { CARS, CIVIC_SI, getCar } from './index.js';
import { stockTune } from '../../types/tune.js';
import { kwToHp, peakTorque, powerKwAtRpm, torqueAtRpm } from '../../sim/engine.js';
import { createPassState } from '../../sim/pass.js';

/**
 * The Civic loads from structured data and the simulator can be handed it
 * without any car-specific code in between (PROJECT_SPEC Stage 0 criteria).
 */

describe('Civic Si data', () => {
  it('is reachable through the car registry', () => {
    expect(getCar('civic-si')).toBe(CIVIC_SI);
    expect(CARS.get('civic-si')).toBe(CIVIC_SI);
  });

  it('rejects unknown cars rather than returning undefined', () => {
    expect(() => getCar('delorean')).toThrow(/Unknown car id/);
  });

  it('has a torque curve ordered by rising rpm', () => {
    const { curve } = CIVIC_SI.engine;
    expect(curve.length).toBeGreaterThan(3);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]!.rpm).toBeGreaterThan(curve[i - 1]!.rpm);
      expect(curve[i]!.torqueNm).toBeGreaterThan(0);
    }
  });

  it('has gears that get progressively taller', () => {
    const { gearRatios } = CIVIC_SI.gearbox;
    expect(gearRatios.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < gearRatios.length; i++) {
      expect(gearRatios[i]!).toBeLessThan(gearRatios[i - 1]!);
    }
  });

  it('makes roughly the horsepower a Civic Si should', () => {
    // A calibration anchor, not a physics claim: if a change to the torque
    // interpolation quietly moves peak power, this notices.
    let peakHp = 0;
    for (let rpm = 1000; rpm <= CIVIC_SI.engine.redlineRpm; rpm += 50) {
      peakHp = Math.max(peakHp, kwToHp(powerKwAtRpm(CIVIC_SI.engine.curve, rpm)));
    }
    expect(peakHp).toBeGreaterThan(140);
    expect(peakHp).toBeLessThan(185);
  });

  it('interpolates torque between curve points and clamps outside them', () => {
    const { curve } = CIVIC_SI.engine;
    const first = curve[0]!;
    const last = curve[curve.length - 1]!;

    expect(torqueAtRpm(curve, first.rpm - 500)).toBe(first.torqueNm);
    expect(torqueAtRpm(curve, last.rpm + 500)).toBe(last.torqueNm);

    const midpoint = torqueAtRpm(curve, 3000);
    expect(midpoint).toBeGreaterThan(torqueAtRpm(curve, 2500));
    expect(midpoint).toBeLessThan(torqueAtRpm(curve, 3500));
  });

  it('peaks its torque inside the rev range', () => {
    const peak = peakTorque(CIVIC_SI.engine.curve);
    expect(peak.rpm).toBeGreaterThan(CIVIC_SI.engine.idleRpm);
    expect(peak.rpm).toBeLessThan(CIVIC_SI.engine.redlineRpm);
  });

  it('can be handed straight to the simulator', () => {
    const state = createPassState(CIVIC_SI, stockTune(CIVIC_SI), 1);
    expect(state.car).toBe(CIVIC_SI);
    expect(state.phase).toBe('approach');
    expect(state.tick).toBe(0);
    expect(state.positionM).toBeLessThan(0);
  });

  it('starts on its own factory gearing', () => {
    const tune = stockTune(CIVIC_SI);
    expect(tune.gearRatios).toEqual([...CIVIC_SI.gearbox.gearRatios]);
    expect(tune.finalDrive).toBe(CIVIC_SI.gearbox.finalDrive);
  });
});
