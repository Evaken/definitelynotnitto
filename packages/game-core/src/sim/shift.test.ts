import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { optimalShiftRpm, shouldShiftUp } from './shift.js';
import { NEUTRAL_GEAR, REVERSE_GEAR } from '../types/sim.js';
import type { Car } from '../types/car.js';

const tune = stockTune(CIVIC_SI);
const { redlineRpm } = CIVIC_SI.engine;

/**
 * A deliberately peaky engine, for the tests that need a crossover to exist.
 *
 * The Civic's curve is flat -- 13% from peak to redline -- so no gearbox put in
 * front of it ever wants an early shift, and comparisons between gearboxes all
 * come out at the limiter. This one falls away hard after 4000, which is what
 * makes the choice of ratio matter. It is roughly the shape the EK B16 will
 * have when the starter car is corrected at Stage 15.
 */
function peaky(gearRatios: readonly number[]): Car {
  return {
    ...CIVIC_SI,
    engine: {
      ...CIVIC_SI.engine,
      redlineRpm: 8000,
      curve: [
        { rpm: 800, torqueNm: 60 },
        { rpm: 2000, torqueNm: 110 },
        { rpm: 4000, torqueNm: 200 },
        { rpm: 5000, torqueNm: 195 },
        { rpm: 6000, torqueNm: 170 },
        { rpm: 7000, torqueNm: 130 },
        { rpm: 8000, torqueNm: 95 },
      ],
    },
    gearbox: { ...CIVIC_SI.gearbox, gearRatios: [...gearRatios] },
  };
}

describe('where to shift', () => {
  it('has an answer for every gear but the last', () => {
    for (let gear = 1; gear < CIVIC_SI.gearbox.gearRatios.length; gear++) {
      const rpm = optimalShiftRpm(CIVIC_SI, tune, gear);
      expect(rpm, `gear ${gear}`).not.toBeNull();
      expect(rpm!).toBeGreaterThan(CIVIC_SI.engine.idleRpm);
      expect(rpm!).toBeLessThanOrEqual(redlineRpm);
    }
  });

  it('has none for top gear, neutral or reverse', () => {
    expect(optimalShiftRpm(CIVIC_SI, tune, CIVIC_SI.gearbox.gearRatios.length)).toBeNull();
    expect(optimalShiftRpm(CIVIC_SI, tune, NEUTRAL_GEAR)).toBeNull();
    expect(optimalShiftRpm(CIVIC_SI, tune, REVERSE_GEAR)).toBeNull();
  });

  it('never asks for more revs than the engine has', () => {
    // If the crossover lies past the redline the engine runs out first, and the
    // answer is to shift at the limiter rather than at an rpm it cannot reach.
    for (let gear = 1; gear < CIVIC_SI.gearbox.gearRatios.length; gear++) {
      expect(optimalShiftRpm(CIVIC_SI, tune, gear)!).toBeLessThanOrEqual(redlineRpm);
    }
  });

  it('shifts earlier through a close ratio than a wide one', () => {
    // The point of computing this rather than picking a number: a gear that
    // barely drops the revs is worth taking sooner than one that dumps the
    // engine out of its power band.
    const close = peaky([3.2, 2.9, 2.6]);
    const wide = peaky([3.2, 1.6, 0.9]);

    const closeShift = optimalShiftRpm(close, stockTune(close), 1)!;
    const wideShift = optimalShiftRpm(wide, stockTune(wide), 1)!;
    expect(closeShift).toBeLessThan(wideShift);
  });

  it('follows the tune, not the car, once gearing is editable', () => {
    // Stage 4 lets the player change ratios. The shift point has to move with
    // them or the light would be advising on a gearbox the car no longer has.
    const car = peaky([3.2, 1.6, 0.9]);
    const closerTune = { ...stockTune(car), gearRatios: [3.2, 2.9, 2.6] };
    expect(optimalShiftRpm(car, closerTune, 1)!).toBeLessThan(
      optimalShiftRpm(car, stockTune(car), 1)!,
    );
  });
});

describe('the shift light', () => {
  it('stays dark at idle and lights up near the shift point', () => {
    expect(shouldShiftUp(CIVIC_SI, tune, 1, CIVIC_SI.engine.idleRpm)).toBe(false);
    expect(shouldShiftUp(CIVIC_SI, tune, 1, redlineRpm)).toBe(true);
  });

  it('comes on a little before the crossover, not after it', () => {
    // A driver who waits for the light and then reacts is already past it.
    const optimal = optimalShiftRpm(CIVIC_SI, tune, 1)!;
    expect(shouldShiftUp(CIVIC_SI, tune, 1, optimal)).toBe(true);
    expect(shouldShiftUp(CIVIC_SI, tune, 1, optimal - 100)).toBe(true);
    expect(shouldShiftUp(CIVIC_SI, tune, 1, optimal - 2000)).toBe(false);
  });

  it('stays dark in top gear however hard the engine is revving', () => {
    const top = CIVIC_SI.gearbox.gearRatios.length;
    expect(shouldShiftUp(CIVIC_SI, tune, top, redlineRpm)).toBe(false);
  });

  it('stays dark in neutral and reverse', () => {
    expect(shouldShiftUp(CIVIC_SI, tune, NEUTRAL_GEAR, redlineRpm)).toBe(false);
    expect(shouldShiftUp(CIVIC_SI, tune, REVERSE_GEAR, redlineRpm)).toBe(false);
  });
});

describe('the stock Civic', () => {
  it('wants every gear held to the limiter', () => {
    // Its curve is flat enough that the next gear never out-pulls the current
    // one before the revs run out, which is what BALANCE_NOTES already records
    // by measurement: shifting at 6800 beats shifting at 6500.
    //
    // This is a fact about the K20A3 curve, not a rule. Correcting the starter
    // car to the EK B16 at Stage 15 should be expected to break it, and that is
    // the test doing its job -- a peakier engine genuinely wants earlier shifts.
    for (let gear = 1; gear < CIVIC_SI.gearbox.gearRatios.length; gear++) {
      expect(optimalShiftRpm(CIVIC_SI, tune, gear), `gear ${gear}`).toBe(redlineRpm);
    }
  });
});
