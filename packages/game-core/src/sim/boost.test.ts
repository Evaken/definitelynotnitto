import { describe, expect, it } from 'vitest';
import { ATMOSPHERIC_BAR, barToPsi, boostBar, chargeTorqueMultiplier, wotBoostBar } from './boost.js';
import type { ForcedInductionSpec } from '../types/car.js';

const REDLINE = 8200;
const turbo: ForcedInductionSpec = { type: 'turbo', peakBoostBar: 0.6, spoolRpm: 3200 };
const blower: ForcedInductionSpec = { type: 'supercharger', peakBoostBar: 0.6, spoolRpm: 0 };

describe('a turbocharger', () => {
  it('makes nothing before it spools', () => {
    expect(wotBoostBar(turbo, 1500, REDLINE)).toBe(0);
    expect(wotBoostBar(turbo, turbo.spoolRpm, REDLINE)).toBe(0);
  });

  it('comes in over a range rather than switching on', () => {
    const low = wotBoostBar(turbo, 3800, REDLINE);
    const mid = wotBoostBar(turbo, 4400, REDLINE);
    expect(low).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(low);
  });

  it('reaches its rating and stops there', () => {
    expect(wotBoostBar(turbo, REDLINE, REDLINE)).toBeCloseTo(turbo.peakBoostBar, 6);
    expect(wotBoostBar(turbo, REDLINE * 2, REDLINE)).toBeCloseTo(turbo.peakBoostBar, 6);
  });
});

describe('a supercharger', () => {
  it('is making pressure from the moment the engine turns', () => {
    // Belt-driven: no exhaust energy to wait for. This is the whole difference
    // in how the two feel, and it is why they are not one setting.
    expect(wotBoostBar(blower, 1500, REDLINE)).toBeGreaterThan(0);
  });

  it('beats an equally rated turbo everywhere below the turbo\'s spool', () => {
    for (const rpm of [1200, 2000, 3000]) {
      expect(wotBoostBar(blower, rpm, REDLINE)).toBeGreaterThan(wotBoostBar(turbo, rpm, REDLINE));
    }
  });

  it('is beaten by it up top, where the turbo has run away', () => {
    expect(wotBoostBar(turbo, REDLINE, REDLINE)).toBeGreaterThanOrEqual(
      wotBoostBar(blower, REDLINE, REDLINE),
    );
  });

  it('reaches its rating well before the redline and holds it', () => {
    expect(wotBoostBar(blower, REDLINE * 0.6, REDLINE)).toBeCloseTo(blower.peakBoostBar, 6);
  });
});

describe('what the gauge shows', () => {
  it('follows the throttle', () => {
    const wot = wotBoostBar(turbo, 6000, REDLINE);
    expect(boostBar(turbo, 6000, REDLINE, 1)).toBeCloseTo(wot, 6);
    expect(boostBar(turbo, 6000, REDLINE, 0.5)).toBeCloseTo(wot / 2, 6);
    expect(boostBar(turbo, 6000, REDLINE, 0)).toBe(0);
  });

  it('reads zero on a car with no compressor', () => {
    expect(boostBar(undefined, 6000, REDLINE, 1)).toBe(0);
  });

  it('converts to the units the dial is marked in', () => {
    expect(barToPsi(1)).toBeCloseTo(14.5038, 4);
    expect(barToPsi(0.6)).toBeGreaterThan(8);
    expect(barToPsi(0.6)).toBeLessThan(9);
  });
});

describe('turning pressure into torque', () => {
  it('leaves a naturally aspirated engine alone', () => {
    expect(chargeTorqueMultiplier(undefined, 6000, REDLINE)).toBe(1);
  });

  it('gives nothing where there is no boost', () => {
    expect(chargeTorqueMultiplier(turbo, 2000, REDLINE)).toBe(1);
  });

  it('scales with pressure, but not one for one', () => {
    // Airflow follows absolute pressure; torque does not follow airflow exactly,
    // because heat and pumping losses take a share.
    const ideal = 1 + turbo.peakBoostBar / ATMOSPHERIC_BAR;
    const actual = chargeTorqueMultiplier(turbo, REDLINE, REDLINE);
    expect(actual).toBeGreaterThan(1);
    expect(actual).toBeLessThan(ideal);
  });

  it('shapes the curve rather than lifting it uniformly', () => {
    // The thing a flat torque multiplier could not do, and the reason a turbo
    // car drives differently rather than just harder.
    const low = chargeTorqueMultiplier(turbo, 2500, REDLINE);
    const high = chargeTorqueMultiplier(turbo, REDLINE, REDLINE);
    expect(high).toBeGreaterThan(low * 1.2);
  });
});
