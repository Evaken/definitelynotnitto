import { describe, expect, it } from 'vitest';
import { suspensionMotion } from './car.js';

/**
 * The body's ride is cosmetic, but it is the main thing that makes the car look
 * like it is travelling rather than being slid along, so it is worth holding to
 * its shape.
 */

/** Largest body travel over a stretch of track at a given speed. */
function peakBounce(speedMs: number, wheelspin = false): number {
  let peak = 0;
  for (let m = 100; m < 140; m += 0.05) {
    peak = Math.max(peak, Math.abs(suspensionMotion(m, speedMs, wheelspin).bounce));
  }
  return peak;
}

describe('body ride', () => {
  it('all but settles when the car is stopped', () => {
    expect(peakBounce(0)).toBeLessThan(0.4);
  });

  it('works harder the faster the car goes', () => {
    const speeds = [0, 5, 15, 25, 40];
    const peaks = speeds.map((s) => peakBounce(s));
    for (let i = 1; i < peaks.length; i++) {
      expect(peaks[i]!, `${speeds[i]!} m/s`).toBeGreaterThan(peaks[i - 1]!);
    }
  });

  it('stays a suggestion rather than a bucking horse', () => {
    expect(peakBounce(45)).toBeLessThan(6);
  });

  it('shakes harder when the tyres are spinning', () => {
    expect(peakBounce(8, true)).toBeGreaterThan(peakBounce(8, false));
  });

  it('is driven by distance, so it stays in step with the ground', () => {
    // Same place on the track, same attitude -- no hidden clock of its own, and
    // nothing to drift out of sync with the scenery scrolling past.
    expect(suspensionMotion(42.5, 30, false)).toEqual(suspensionMotion(42.5, 30, false));
    expect(suspensionMotion(42.5, 30, false).bounce).not.toBe(
      suspensionMotion(43.9, 30, false).bounce,
    );
  });

  it('does not care which way the car is travelling', () => {
    // Reversing out of the staging window rides the same surface.
    expect(suspensionMotion(3, -2, false)).toEqual(suspensionMotion(3, 2, false));
  });
});
