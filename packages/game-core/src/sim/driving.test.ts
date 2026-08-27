import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan } from '../testing/drive.js';

/**
 * Driving well has to beat driving badly.
 *
 * Stage 1 only requires that different inputs produce different outcomes, but
 * the shape of those differences is the game itself, so it is worth pinning
 * down now: these are the behaviours Stage 2 will sharpen rather than invent.
 *
 * The assertions are all comparative -- "this is quicker than that" -- never
 * absolute times.  Calibration is Stage 15's job, and a test that named exact
 * ETs would have to be rewritten every time the car data is tuned.
 */

const tune = stockTune(CIVIC_SI);
const et = (overrides: Partial<ReturnType<typeof goodDrivePlan>>) =>
  drive(CIVIC_SI, tune, { ...goodDrivePlan(7), launchRpm: 3000, ...overrides }).slip;

describe('launch rpm', () => {
  const bogged = et({ launchRpm: 1200 });
  const good = et({ launchRpm: 3000 });
  const redline = et({ launchRpm: 6700 });

  it('costs time when the engine is too far below the power band', () => {
    expect(bogged.sixtyFoot).toBeGreaterThan(good.sixtyFoot);
    expect(bogged.quarterMileEt).toBeGreaterThan(good.quarterMileEt);
  });

  it('costs time when the launch is high enough to light the tyres up', () => {
    expect(redline.sixtyFoot).toBeGreaterThan(good.sixtyFoot);
    expect(redline.quarterMileEt).toBeGreaterThan(good.quarterMileEt);
  });

  it('has an optimum in between, not at either extreme', () => {
    // The bog-versus-spin trade-off is the whole point of choosing a launch
    // rpm. If the best launch ever becomes "as many revs as possible", the
    // decision has stopped existing.
    const sweep = [1200, 2000, 3000, 4000, 5000, 6000, 6700].map((launchRpm) => ({
      launchRpm,
      time: et({ launchRpm }).quarterMileEt,
    }));

    const best = sweep.reduce((a, b) => (b.time < a.time ? b : a));
    expect(best.launchRpm).toBeGreaterThan(1200);
    expect(best.launchRpm).toBeLessThan(6700);
  });

  it('makes the tyres slip when the clutch is dropped at redline', () => {
    const spun = drive(CIVIC_SI, tune, { ...goodDrivePlan(7), launchRpm: 6700 });
    expect(Math.abs(spun.state.slipRatio)).toBeGreaterThan(0);
  });
});

describe('shift timing', () => {
  it('loses time when the driver short-shifts out of the power band', () => {
    expect(et({ shiftRpm: 4200 }).quarterMileEt).toBeGreaterThan(et({ shiftRpm: 6500 }).quarterMileEt);
  });

  it('loses more the earlier the shift', () => {
    const times = [4200, 4800, 5400, 6000, 6500].map((shiftRpm) => et({ shiftRpm }).quarterMileEt);
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!, `shift point ${i}`).toBeLessThan(times[i - 1]!);
    }
  });

  it('costs trap speed as well as elapsed time', () => {
    expect(et({ shiftRpm: 4200 }).quarterMileMph).toBeLessThan(et({ shiftRpm: 6500 }).quarterMileMph);
  });
});

describe('staging depth', () => {
  const shallow = et({ throttleOffAtM: -0.1 });
  const deep = et({ throttleOffAtM: 0.12 });

  it('trades elapsed time for reaction time when staging deep', () => {
    // Rolling in deep leaves less tyre in the beam, so the clock starts sooner
    // after the launch -- a quicker light bought with a slower run, because the
    // car has had less rollout to build speed in before the clock starts.
    expect(deep.reactionTime).toBeLessThan(shallow.reactionTime);
    expect(deep.quarterMileEt).toBeGreaterThan(shallow.quarterMileEt);
  });
});

describe('reaction time', () => {
  it('tracks how early or late the driver leaves, without changing the run', () => {
    const early = et({ reactionSeconds: -0.2 });
    const onTime = et({ reactionSeconds: 0 });
    const late = et({ reactionSeconds: 0.3 });

    expect(early.reactionTime).toBeLessThan(onTime.reactionTime);
    expect(late.reactionTime).toBeGreaterThan(onTime.reactionTime);

    // Reaction is measured from the green; it does not make the car quicker.
    expect(early.quarterMileEt).toBeCloseTo(onTime.quarterMileEt, 1);
  });
});

describe('a good drive against a bad one', () => {
  it('is quicker in every measure that matters', () => {
    const good = et({ launchRpm: 3000, shiftRpm: 6500, throttleOffAtM: -0.1 });
    const bad = et({ launchRpm: 6700, shiftRpm: 4200, throttleOffAtM: 0.12 });

    expect(good.sixtyFoot).toBeLessThan(bad.sixtyFoot);
    expect(good.eighthMileEt).toBeLessThan(bad.eighthMileEt);
    expect(good.quarterMileEt).toBeLessThan(bad.quarterMileEt);
    expect(good.quarterMileMph).toBeGreaterThan(bad.quarterMileMph);
  });
});
