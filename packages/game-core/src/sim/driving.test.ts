import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan, type DrivePlan } from '../testing/drive.js';
import type { Car } from '../types/car.js';

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
const run = (overrides: Partial<DrivePlan>) =>
  drive(CIVIC_SI, tune, { ...goodDrivePlan(7), ...overrides }).slip;

/** Sits in first at the line and simply opens the throttle on the green. */
function inGearPlan(overrides: Partial<DrivePlan> = {}): DrivePlan {
  const plan = { ...goodDrivePlan(7), ...overrides };
  delete (plan as { neutralRevRpm?: number }).neutralRevRpm;
  return plan;
}

describe('the launch', () => {
  it('rewards holding revs in neutral and dropping into gear on the green', () => {
    // With no clutch pedal this is the only way to have the engine already
    // making torque when the drive connects. Sitting in gear and opening the
    // throttle means the clutch comes home while the engine is still at idle.
    const dropped = run({ neutralRevRpm: 3500 });
    const fromIdle = drive(CIVIC_SI, tune, inGearPlan()).slip;

    expect(dropped.sixtyFoot).toBeLessThan(fromIdle.sixtyFoot);
    expect(dropped.quarterMileEt).toBeLessThan(fromIdle.quarterMileEt);
  });

  it('costs time when the revs are too low to pull', () => {
    expect(run({ neutralRevRpm: 1500 }).quarterMileEt).toBeGreaterThan(
      run({ neutralRevRpm: 3500 }).quarterMileEt,
    );
  });

  it('costs time when the revs are high enough to light the tyres up', () => {
    expect(run({ neutralRevRpm: 6500 }).quarterMileEt).toBeGreaterThan(
      run({ neutralRevRpm: 3500 }).quarterMileEt,
    );
  });

  it('has an optimum in between, not at either extreme', () => {
    // The bog-versus-spin trade-off is the whole point of choosing where to
    // hold the revs. If the best launch ever becomes "as many revs as
    // possible", the decision has stopped existing.
    const sweep = [1500, 2500, 3500, 4500, 5500, 6500].map((neutralRevRpm) => ({
      neutralRevRpm,
      time: run({ neutralRevRpm }).quarterMileEt,
    }));

    const best = sweep.reduce((a, b) => (b.time < a.time ? b : a));
    expect(best.neutralRevRpm).toBeGreaterThan(1500);
    expect(best.neutralRevRpm).toBeLessThan(6500);
  });

  it('loses time when the throttle is not opened all the way', () => {
    expect(run({ launchThrottle: 0.5 }).quarterMileEt).toBeGreaterThan(
      run({ launchThrottle: 1 }).quarterMileEt,
    );
  });
});

describe('shift timing', () => {
  it('loses time when the driver short-shifts out of the power band', () => {
    expect(run({ shiftRpm: 4500 }).quarterMileEt).toBeGreaterThan(run({ shiftRpm: 6500 }).quarterMileEt);
  });

  it('loses more the earlier the shift', () => {
    const times = [4500, 5000, 5500, 6000, 6500].map((shiftRpm) => run({ shiftRpm }).quarterMileEt);
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!, `shift point ${i}`).toBeLessThan(times[i - 1]!);
    }
  });

  it('costs trap speed as well as elapsed time', () => {
    expect(run({ shiftRpm: 4500 }).quarterMileMph).toBeLessThan(run({ shiftRpm: 6500 }).quarterMileMph);
  });
});

describe('staging depth', () => {
  const shallow = run({ stageAtM: -1.1 });
  const deep = run({ stageAtM: -0.05 });

  it('trades elapsed time for reaction time when staging deep', () => {
    // Stopping close to the stage line leaves less ground to cover before the
    // clock starts, so the light is quicker -- but also less run-up in which to
    // build speed, so the run itself is slower.
    expect(deep.reactionTime).toBeLessThan(shallow.reactionTime);
    expect(deep.quarterMileEt).toBeGreaterThan(shallow.quarterMileEt);
  });

  it('moves both ways across the window rather than only at the extremes', () => {
    const depths = [-1.1, -0.8, -0.5, -0.2, -0.05].map((stageAtM) => run({ stageAtM }));
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i]!.reactionTime, `depth ${i}`).toBeLessThan(depths[i - 1]!.reactionTime);
      expect(depths[i]!.quarterMileEt, `depth ${i}`).toBeGreaterThan(depths[i - 1]!.quarterMileEt);
    }
  });
});

describe('reaction time', () => {
  it('tracks how early or late the driver leaves, without changing the run', () => {
    const early = run({ reactionSeconds: -0.2 });
    const onTime = run({ reactionSeconds: 0 });
    const late = run({ reactionSeconds: 0.3 });

    expect(early.reactionTime).toBeLessThan(onTime.reactionTime);
    expect(late.reactionTime).toBeGreaterThan(onTime.reactionTime);

    // Reaction is measured from the green; it does not make the car quicker.
    // Not exactly equal: leaving at a different moment catches the engine at a
    // slightly different point in its rev hold, so the launch is not quite
    // identical. Thousandths, not tenths.
    expect(early.quarterMileEt).toBeCloseTo(onTime.quarterMileEt, 1);
    expect(late.quarterMileEt).toBeCloseTo(onTime.quarterMileEt, 1);
  });
});

describe('a good drive against a bad one', () => {
  it('is quicker in every measure that matters', () => {
    const good = run({ neutralRevRpm: 3500, shiftRpm: 6500, stageAtM: -1.1, launchThrottle: 1 });
    const bad = drive(
      CIVIC_SI,
      tune,
      inGearPlan({ shiftRpm: 4500, stageAtM: -0.05, launchThrottle: 0.8 }),
    ).slip;

    expect(good.sixtyFoot).toBeLessThan(bad.sixtyFoot);
    expect(good.eighthMileEt).toBeLessThan(bad.eighthMileEt);
    expect(good.quarterMileEt).toBeLessThan(bad.quarterMileEt);
    expect(good.quarterMileMph).toBeGreaterThan(bad.quarterMileMph);
  });
});

describe('the scripted driver itself', () => {
  it('does not chain-shift a car with enough torque to slip its clutch', () => {
    // The clutch is open through a change, so a strong engine free-revs back
    // past the shift point in about forty milliseconds. Without a floor on how
    // often a shift can be taken, the driver walks a turbo car into top gear at
    // 29mph with the clutch at 1% and the run is destroyed. Every measurement
    // in BALANCE_NOTES comes through this driver, so it has to drive.
    const boosted: Car = {
      ...CIVIC_SI,
      engine: {
        ...CIVIC_SI.engine,
        curve: CIVIC_SI.engine.curve.map((point) => ({ ...point, torqueNm: point.torqueNm * 1.6 })),
      },
      gearbox: { ...CIVIC_SI.gearbox, clutchCapacityNm: 340 },
    };

    const result = drive(boosted, stockTune(boosted), goodDrivePlan(7));
    expect(result.slip.quarterMileEt).toBeLessThan(
      drive(CIVIC_SI, stockTune(CIVIC_SI), goodDrivePlan(7)).slip.quarterMileEt,
    );
    // Trap speed is power-to-weight and barely touched by traction, so it is the
    // measure that exposes a car which spent the run in the wrong gear.
    expect(result.slip.quarterMileMph).toBeGreaterThan(100);
  });
});

describe('the driver managing traction', () => {
  const overpowered: Car = {
    ...CIVIC_SI,
    engine: {
      ...CIVIC_SI.engine,
      curve: CIVIC_SI.engine.curve.map((point) => ({ ...point, torqueNm: point.torqueNm * 2.4 })),
    },
    gearbox: { ...CIVIC_SI.gearbox, clutchCapacityNm: 900 },
  };

  it('is quicker than driving a traction-limited car flat out', () => {
    // Flat out, a car with more torque than grip spins, and the tacho reports
    // wheel speed rather than road speed. Easing off is worth seconds.
    const plan = { ...goodDrivePlan(7), shiftRpm: CIVIC_SI.engine.redlineRpm - 150 };
    const flatOut = drive(overpowered, stockTune(overpowered), plan).slip;
    const managed = drive(overpowered, stockTune(overpowered), { ...plan, tractionControl: true }).slip;
    expect(managed.quarterMileEt).toBeLessThan(flatOut.quarterMileEt);
    expect(managed.quarterMileMph).toBeGreaterThan(flatOut.quarterMileMph);
  });

  it('costs time on a car that is not traction limited', () => {
    // Not a free win, and worth stating: the stock Civic's best launch
    // deliberately uses some slip, so a driver who refuses to spin the tyres at
    // all is slower. That is why this is opt-in rather than simply better.
    const plan = { ...goodDrivePlan(7), stageAtM: -0.27 };
    const plain = drive(CIVIC_SI, stockTune(CIVIC_SI), plan).slip;
    const managed = drive(CIVIC_SI, stockTune(CIVIC_SI), { ...plan, tractionControl: true }).slip;
    expect(managed.quarterMileEt).toBeGreaterThan(plain.quarterMileEt);
  });

  it('is off unless asked for', () => {
    const plan = { ...goodDrivePlan(7), shiftRpm: CIVIC_SI.engine.redlineRpm - 150 };
    expect(drive(overpowered, stockTune(overpowered), plan).slip.quarterMileEt).toBe(
      drive(overpowered, stockTune(overpowered), { ...plan, tractionControl: false }).slip.quarterMileEt,
    );
  });
});
