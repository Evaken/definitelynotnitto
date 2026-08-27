import { SIM_HZ } from '@nitto/game-core';

/**
 * Turns wall-clock frames into whole simulation ticks.
 *
 * The simulation advances in fixed 1ms steps whatever the display is doing, so
 * a slow frame or a 144Hz monitor cannot change the outcome of a pass.  The
 * leftover fraction of a tick is carried to the next frame.
 */

export const TICK_MS = 1000 / SIM_HZ;

/**
 * Longest stretch of wall time simulated in one frame.
 *
 * Caps the catch-up after a stall so a hitch cannot turn into a spiral where
 * each frame owes more simulation than the last.
 */
export const MAX_FRAME_MS = 100;

export class FrameClock {
  private accumulator = 0;
  private lastMs: number;

  constructor(nowMs: number) {
    this.lastMs = nowMs;
  }

  /**
   * How many ticks to run this frame.
   *
   * A finished pass banks nothing. This matters more than it looks: time only
   * leaves the accumulator by being simulated, so a finished pass left sitting
   * on screen would otherwise hoard every millisecond until the next pass
   * consumed the lot in a single frame -- reset after a couple of minutes and
   * the fresh pass is used up the instant it is created, which reads as the
   * reset button doing nothing at all.
   */
  advance(nowMs: number, passComplete: boolean): number {
    this.accumulator += Math.min(nowMs - this.lastMs, MAX_FRAME_MS);
    this.lastMs = nowMs;

    if (passComplete) {
      this.accumulator = 0;
      return 0;
    }

    const ticks = Math.floor(this.accumulator / TICK_MS);
    this.accumulator -= ticks * TICK_MS;
    return ticks;
  }

  /** Starts a fresh pass: nothing owed, and the clock rebased to now. */
  reset(nowMs: number): void {
    this.accumulator = 0;
    this.lastMs = nowMs;
  }
}
