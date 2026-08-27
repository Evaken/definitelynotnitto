import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan } from '../testing/drive.js';
import { reactionTime, scheduleTree, treeLightsAt } from './tree.js';
import { SIM_HZ } from '../types/sim.js';
import { TREE } from '../config/historical.js';

const tune = stockTune(CIVIC_SI);

describe('the tree sequence', () => {
  const { schedule } = scheduleTree(0, 99);

  it('waits before lighting the ambers', () => {
    expect(schedule.amberTick).toBeGreaterThanOrEqual((TREE.armDelayMinMs.value / 1000) * SIM_HZ);
    expect(schedule.amberTick).toBeLessThanOrEqual((TREE.armDelayMaxMs.value / 1000) * SIM_HZ);
  });

  it('greens after the ambers, never before', () => {
    expect(schedule.greenTick).toBeGreaterThan(schedule.amberTick);
  });

  it('picks the same sequence for the same seed', () => {
    expect(scheduleTree(0, 99).schedule).toEqual(scheduleTree(0, 99).schedule);
  });

  it('picks different sequences for different seeds', () => {
    // Otherwise the start could be memorised.
    const draws = new Set([12, 34, 56, 78, 90].map((seed) => scheduleTree(0, seed).schedule.amberTick));
    expect(draws.size).toBeGreaterThan(1);
  });

  it('is dark before it runs and green after', () => {
    const before = treeLightsAt(schedule.amberTick - 1, schedule, true, true, false);
    expect(before.ambers).toEqual([false, false, false]);
    expect(before.green).toBe(false);

    const after = treeLightsAt(schedule.greenTick, schedule, true, true, false);
    expect(after.green).toBe(true);
    expect(after.ambers).toEqual([false, false, false]);
  });

  it('shows ambers between the two', () => {
    const mid = treeLightsAt(schedule.amberTick, schedule, true, true, false);
    expect(mid.ambers.some(Boolean)).toBe(true);
    expect(mid.green).toBe(false);
  });
});

describe('reaction time', () => {
  it('is zero for a perfect light', () => {
    expect(reactionTime(1000, 1000)).toBe(0);
  });

  it('is positive when the beam clears after the green', () => {
    expect(reactionTime(1000, 1250)).toBeCloseTo(0.25, 6);
  });

  it('is negative when the beam clears before the green', () => {
    expect(reactionTime(1000, 900)).toBeCloseTo(-0.1, 6);
  });
});

describe('red lights', () => {
  it('are called when the car leaves early enough to beat the green', () => {
    const result = drive(CIVIC_SI, tune, { ...goodDrivePlan(7), reactionSeconds: -0.9 });
    expect(result.slip.reactionTime).toBeLessThan(0);
    expect(result.slip.foul).toBe(true);
  });

  it('are not called for a good light', () => {
    const result = drive(CIVIC_SI, tune, { ...goodDrivePlan(7), reactionSeconds: 0 });
    expect(result.slip.reactionTime).toBeGreaterThan(0);
    expect(result.slip.foul).toBe(false);
  });

  it('agree exactly with the sign of the reaction time', () => {
    // The two must never disagree: a foul is defined as a negative reaction,
    // so any drift between them is a bug in one or the other.
    for (const reactionSeconds of [-1.2, -0.6, -0.4, -0.2, 0, 0.3]) {
      const { slip } = drive(CIVIC_SI, tune, { ...goodDrivePlan(7), reactionSeconds });
      expect(slip.foul, `reaction ${reactionSeconds}`).toBe(slip.reactionTime < 0);
    }
  });

  it('still let the driver complete the run', () => {
    // A red light loses the race but the car keeps going, as it does on a real
    // strip -- the timing slip records both the foul and the elapsed time.
    const result = drive(CIVIC_SI, tune, { ...goodDrivePlan(7), reactionSeconds: -0.9 });
    expect(result.slip.foul).toBe(true);
    expect(result.slip.incomplete).toBe(false);
    expect(result.slip.quarterMileEt).toBeGreaterThan(0);
  });
});
