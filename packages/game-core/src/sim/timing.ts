import type { PassState, TimingSlip } from '../types/sim.js';
import { TRAP_LENGTH_M } from '../config/historical.js';
import { reactionTime } from './tree.js';
import { msToMph, round } from './units.js';

/**
 * Turning a finished pass into a timing slip.
 *
 * Reads like a real one: times in seconds from the clock start, speeds in mph
 * measured as an average across the 66-foot trap ahead of each mark rather than
 * as an instantaneous reading, which is how a real timing system does it.
 */

/**
 * Average speed through a trap, in mph.
 *
 * Returns 0 when the car never reached the far end, which happens on an
 * abandoned pass.
 */
function trapSpeedMph(entryTime: number | undefined, exitTime: number | undefined): number {
  if (entryTime === undefined || exitTime === undefined) return 0;
  const duration = exitTime - entryTime;
  if (duration <= 0) return 0;
  return msToMph(TRAP_LENGTH_M / duration);
}

export function buildTimingSlip(state: PassState): TimingSlip {
  const { splits } = state;
  const finished = splits.quarterMile !== undefined;

  const rt =
    state.clockStartTick !== null && state.treeSchedule !== null
      ? reactionTime(state.treeSchedule.greenTick, state.clockStartTick)
      : 0;

  return {
    reactionTime: round(rt, 3),
    sixtyFoot: round(splits.sixtyFoot ?? 0, 3),
    threeThirty: round(splits.threeThirty ?? 0, 3),
    eighthMileEt: round(splits.eighthMile ?? 0, 3),
    eighthMileMph: round(trapSpeedMph(splits.eighthTrapEntry, splits.eighthMile), 2),
    thousandFoot: round(splits.thousandFoot ?? 0, 3),
    quarterMileEt: round(splits.quarterMile ?? 0, 3),
    quarterMileMph: round(trapSpeedMph(splits.quarterTrapEntry, splits.quarterMile), 2),
    foul: state.foul,
    incomplete: !finished,
  };
}
