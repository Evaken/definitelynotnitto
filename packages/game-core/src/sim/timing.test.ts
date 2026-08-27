import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan } from '../testing/drive.js';
import { buildTimingSlip } from './timing.js';
import { createPassState } from './pass.js';

const tune = stockTune(CIVIC_SI);

describe('the timing slip', () => {
  const { slip } = drive(CIVIC_SI, tune, goodDrivePlan(7));

  it('reports every figure a real slip carries', () => {
    expect(slip.reactionTime).toBeGreaterThan(0);
    expect(slip.sixtyFoot).toBeGreaterThan(0);
    expect(slip.threeThirty).toBeGreaterThan(0);
    expect(slip.eighthMileEt).toBeGreaterThan(0);
    expect(slip.eighthMileMph).toBeGreaterThan(0);
    expect(slip.thousandFoot).toBeGreaterThan(0);
    expect(slip.quarterMileEt).toBeGreaterThan(0);
    expect(slip.quarterMileMph).toBeGreaterThan(0);
  });

  it('rounds times to thousandths and speeds to hundredths', () => {
    const thousandths = (n: number) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-9;
    const hundredths = (n: number) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;

    expect(thousandths(slip.quarterMileEt)).toBe(true);
    expect(thousandths(slip.sixtyFoot)).toBe(true);
    expect(thousandths(slip.reactionTime)).toBe(true);
    expect(hundredths(slip.quarterMileMph)).toBe(true);
  });

  it('measures trap speed across the trap rather than at a point', () => {
    // An instantaneous reading at the finish line would be higher than the
    // 66-foot average that a real timing system reports.
    const averageOverWholeRun = (402.336 / slip.quarterMileEt) * 2.2369362920544;
    expect(slip.quarterMileMph).toBeGreaterThan(averageOverWholeRun);
  });

  it('marks a pass that never finished as incomplete', () => {
    // Nothing has been driven, so no split exists.
    const untouched = buildTimingSlip(createPassState(CIVIC_SI, tune, 1));

    expect(untouched.incomplete).toBe(true);
    expect(untouched.quarterMileEt).toBe(0);
    expect(untouched.quarterMileMph).toBe(0);
  });
});
