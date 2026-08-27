import { describe, expect, it } from 'vitest';
import { STAGING, stagingZoneStart } from '@nitto/game-core';
import { stagingBarFraction } from './boards.js';

const stageLine = 0;
const preStageLine = stagingZoneStart();

describe('the staging bar', () => {
  it('puts the window in the middle, not at the top', () => {
    // The point of the change: there has to be scale above the window as well
    // as below it, or an overshoot has nowhere to be drawn.
    const top = stagingBarFraction(stageLine);
    const bottom = stagingBarFraction(preStageLine);
    const middle = (top + bottom) / 2;
    expect(middle).toBeCloseTo(0.5, 2);
  });

  it('gives the window real height', () => {
    // It collapsed to zero once. It reads as a missing feature rather than a
    // broken sum, so it is worth asserting outright.
    const height = stagingBarFraction(stageLine) - stagingBarFraction(preStageLine);
    expect(height).toBeGreaterThan(0.05);
    expect(height).toBeLessThan(0.3);
  });

  it('runs up the bar as the car runs down the strip', () => {
    const samples = [-6, -4, -2, preStageLine, -0.5, stageLine, 1, 3].map(stagingBarFraction);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!).toBeGreaterThanOrEqual(samples[i - 1]!);
    }
  });

  it('shows the car from the moment it spawns', () => {
    // Pinned at the very bottom would be indistinguishable from being miles
    // back, so the spawn point has to land inside the scale.
    const spawn = stagingBarFraction(STAGING.startLineOffsetM.value);
    expect(spawn).toBeGreaterThan(0);
    expect(spawn).toBeLessThan(0.2);
  });

  it('separates an overshoot from a car sitting on the line', () => {
    // What the driver reads to know how far to reverse.
    expect(stagingBarFraction(1)).toBeGreaterThan(stagingBarFraction(stageLine));
    expect(stagingBarFraction(3)).toBeGreaterThan(stagingBarFraction(1));
  });

  it('pins rather than running off either end', () => {
    expect(stagingBarFraction(-500)).toBe(0);
    expect(stagingBarFraction(500)).toBe(1);
  });
});
