import { describe, expect, it } from 'vitest';
import { quantiseThrottle, springThrottleClosed } from './throttle.js';
import { THROTTLE_RELEASE_MS } from '../config/historical.js';
import { SIM_DT } from '../types/sim.js';

const TICK_MS = SIM_DT * 1000;

/** Runs the spring for a stretch of time, one simulation tick at a time. */
function springFor(start: number, durationMs: number): number {
  let value = start;
  for (let elapsed = 0; elapsed < durationMs; elapsed += TICK_MS) {
    value = springThrottleClosed(value, TICK_MS);
  }
  return value;
}

describe('quantising the throttle', () => {
  it('rounds to hundredths', () => {
    expect(quantiseThrottle(0.123456)).toBe(0.12);
    expect(quantiseThrottle(0.126)).toBe(0.13);
  });

  it('clamps to the usable range', () => {
    expect(quantiseThrottle(-0.5)).toBe(0);
    expect(quantiseThrottle(1.5)).toBe(1);
  });
});

describe('the return spring', () => {
  it('shuts a wide-open throttle in about the configured time', () => {
    const release = THROTTLE_RELEASE_MS.value;

    expect(springFor(1, release * 0.5)).toBeGreaterThan(0.4);
    expect(springFor(1, release * 0.5)).toBeLessThan(0.6);
    expect(springFor(1, release * 1.1)).toBe(0);
  });

  it('shuts a half-open throttle in half the time, like a sprung pedal', () => {
    const release = THROTTLE_RELEASE_MS.value;
    expect(springFor(0.5, release * 0.45)).toBeGreaterThan(0);
    expect(springFor(0.5, release * 0.6)).toBe(0);
  });

  it('closes steadily rather than in jumps', () => {
    let previous = 1;
    for (let elapsed = 0; elapsed < THROTTLE_RELEASE_MS.value; elapsed += 100) {
      const now = springFor(1, elapsed);
      expect(now).toBeLessThanOrEqual(previous);
      previous = now;
    }
  });

  it('stays shut once closed', () => {
    expect(springThrottleClosed(0, 500)).toBe(0);
    expect(springThrottleClosed(-1, 500)).toBe(0);
  });

  it('never goes below zero', () => {
    expect(springThrottleClosed(0.01, 10_000)).toBe(0);
  });
});
