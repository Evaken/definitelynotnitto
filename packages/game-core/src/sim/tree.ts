import type { TreeLights, TreeSchedule } from '../types/sim.js';
import { SIM_HZ } from '../types/sim.js';
import { TREE } from '../config/historical.js';
import { nextRandomRange } from './rng.js';

/**
 * The Christmas tree.
 *
 * Both NHRA tree styles are implemented and selected by configuration, because
 * which one Nitto 1320 Challenge used is not confirmed.  Changing
 * `TREE.type` in config/historical.ts is the only edit needed to switch.
 */

const msToTicks = (ms: number): number => Math.round((ms / 1000) * SIM_HZ);

/**
 * Picks when the tree will run, given the tick it armed on.
 *
 * The pause before the ambers is randomised so the start cannot be memorised,
 * but it is drawn from the pass's seeded generator, so the same seed always
 * produces the same tree (PROJECT_SPEC 6.3).
 */
export function scheduleTree(
  armTick: number,
  rngState: number,
): { schedule: TreeSchedule; rngState: number } {
  const draw = nextRandomRange(rngState, TREE.armDelayMinMs.value, TREE.armDelayMaxMs.value);
  const amberTick = armTick + msToTicks(draw.value);

  const greenTick =
    TREE.type.value === 'pro'
      ? amberTick + msToTicks(TREE.proDelayMs.value)
      : amberTick + msToTicks(TREE.sportsmanIntervalMs.value * 3);

  return { schedule: { amberTick, greenTick }, rngState: draw.state };
}

/** Which amber bulbs are lit at a given tick. */
function ambersAt(tick: number, schedule: TreeSchedule): [boolean, boolean, boolean] {
  if (tick < schedule.amberTick || tick >= schedule.greenTick) return [false, false, false];

  if (TREE.type.value === 'pro') {
    // All three flash together, 0.400s before the green.
    return [true, true, true];
  }

  const interval = msToTicks(TREE.sportsmanIntervalMs.value);
  const elapsed = tick - schedule.amberTick;
  return [elapsed >= 0, elapsed >= interval, elapsed >= interval * 2];
}

export function treeLightsAt(
  tick: number,
  schedule: TreeSchedule | null,
  prestage: boolean,
  stage: boolean,
  red: boolean,
): TreeLights {
  if (schedule === null) {
    return { prestage, stage, ambers: [false, false, false], green: false, red };
  }

  return {
    prestage,
    stage,
    ambers: ambersAt(tick, schedule),
    green: tick >= schedule.greenTick,
    red,
  };
}

/**
 * Reaction time in seconds: green light to the car clearing the stage beam.
 *
 * Zero is a perfect light.  Negative means the beam was cleared before the
 * green -- a red light, and a loss regardless of elapsed time.
 */
export function reactionTime(greenTick: number, clockStartTick: number): number {
  return (clockStartTick - greenTick) / SIM_HZ;
}
