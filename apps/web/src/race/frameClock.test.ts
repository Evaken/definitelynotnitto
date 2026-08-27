import { describe, expect, it } from 'vitest';
import { FrameClock, MAX_FRAME_MS, TICK_MS } from './frameClock.js';

describe('pacing the simulation', () => {
  it('turns a frame into that many milliseconds of ticks', () => {
    const clock = new FrameClock(0);
    expect(clock.advance(16, false)).toBe(16);
    expect(clock.advance(32, false)).toBe(16);
  });

  it('carries the leftover fraction of a tick into the next frame', () => {
    const clock = new FrameClock(0);
    // 16.7ms frames: sixteen ticks most frames, seventeen when the remainder
    // has built up enough to pay for one.
    let total = 0;
    for (let i = 1; i <= 60; i++) total += clock.advance(i * 16.7, false);
    expect(total).toBe(1002);
  });

  it('caps how much it will catch up after a stall', () => {
    // Otherwise one long hitch owes more simulation than the next frame can
    // afford, and every frame after it falls further behind.
    const clock = new FrameClock(0);
    expect(clock.advance(5000, false)).toBe(MAX_FRAME_MS / TICK_MS);
  });
});

describe('a finished pass', () => {
  it('banks nothing while it sits on screen', () => {
    const clock = new FrameClock(0);
    for (let i = 1; i <= 20; i++) expect(clock.advance(i * 50, true)).toBe(0);
  });

  it('does not dump the wait into the pass that follows it', () => {
    // The bug this guards: a pass left finished for a couple of minutes used to
    // hoard every millisecond of it, and the next pass was simulated to death
    // in a single frame the moment it started.
    const clock = new FrameClock(0);

    let atMs = 0;
    for (let i = 0; i < 2400; i++) {
      atMs += 50;
      clock.advance(atMs, true);
    }

    // Reset, then the first frame of the new pass.
    clock.reset(atMs);
    atMs += 16;
    expect(clock.advance(atMs, false)).toBe(16);
  });

  it('starts clean even if the reset is missed', () => {
    // Belt and braces: draining while complete is enough on its own.
    const clock = new FrameClock(0);

    let atMs = 0;
    for (let i = 0; i < 600; i++) {
      atMs += 100;
      clock.advance(atMs, true);
    }

    atMs += 16;
    expect(clock.advance(atMs, false)).toBe(16);
  });
});

describe('resetting', () => {
  it('drops anything owed and rebases to now', () => {
    const clock = new FrameClock(0);
    clock.advance(80, false);

    clock.reset(10_000);
    expect(clock.advance(10_016, false)).toBe(16);
  });
});
