import type { Car } from '../types/car.js';
import type { Tune } from '../types/tune.js';
import type { InputChange, InputTimeline, PassState, RaceInput, TimingSlip } from '../types/sim.js';
import { NEUTRAL_INPUT } from '../types/sim.js';
import { createPassState, isPassComplete, stepPass, MAX_PASS_TICKS } from './pass.js';
import { buildTimingSlip } from './timing.js';

/**
 * Recording and replaying a pass.
 *
 * A pass is fully described by its car, tune, seed and the sequence of inputs
 * the driver held.  Recording only the changes keeps that description tiny --
 * a fifteen-second pass is a handful of entries, not fifteen thousand.
 *
 * In Stage 1 this exists to prove the simulator is deterministic.  It is also
 * what Stage 10 will store for an asynchronous challenge, so the server can
 * re-run a submitted pass rather than believe a claimed elapsed time
 * (PROJECT_SPEC 6.4).
 */

function sameInput(a: RaceInput, b: RaceInput): boolean {
  return (
    a.throttle === b.throttle &&
    a.brake === b.brake &&
    a.shiftUp === b.shiftUp &&
    a.shiftDown === b.shiftDown
  );
}

/**
 * Accumulates input changes as a pass is driven live.
 *
 * The UI hands it whatever the keyboard currently reads on every tick; it keeps
 * only the moments something actually changed.
 */
export class TimelineRecorder {
  private readonly changes: InputChange[] = [];
  private last: RaceInput = NEUTRAL_INPUT;
  private ticks = 0;

  constructor(private readonly seed: number) {}

  record(tick: number, input: RaceInput): void {
    if (!sameInput(input, this.last)) {
      this.changes.push({ tick, input: { ...input } });
      this.last = { ...input };
    }
    this.ticks = tick + 1;
  }

  build(): InputTimeline {
    return { seed: this.seed, changes: [...this.changes], durationTicks: this.ticks };
  }
}

/** The input being held at a given tick, per the timeline. */
export function inputAtTick(timeline: InputTimeline, tick: number): RaceInput {
  let current = NEUTRAL_INPUT;
  for (const change of timeline.changes) {
    if (change.tick > tick) break;
    current = change.input;
  }
  return current;
}

/**
 * Re-runs a recorded pass from scratch.
 *
 * Given the same car and tune, this must produce a byte-identical timing slip
 * to the original run.  `determinism.test.ts` holds that promise.
 */
export function replayPass(
  car: Car,
  tune: Tune,
  timeline: InputTimeline,
): { state: PassState; slip: TimingSlip } {
  const state = createPassState(car, tune, timeline.seed);

  let changeIndex = 0;
  let current = NEUTRAL_INPUT;
  const limit = Math.max(timeline.durationTicks, MAX_PASS_TICKS);

  while (!isPassComplete(state) && state.tick < limit) {
    while (
      changeIndex < timeline.changes.length &&
      timeline.changes[changeIndex]!.tick <= state.tick
    ) {
      current = timeline.changes[changeIndex]!.input;
      changeIndex++;
    }
    stepPass(state, current);
  }

  return { state, slip: buildTimingSlip(state) };
}
