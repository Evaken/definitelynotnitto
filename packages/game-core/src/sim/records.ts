import type { TimingSlip } from '../types/sim.js';

/**
 * Which runs in a session are the best ones.
 *
 * Pure, and here rather than in the web app, because it is gameplay logic
 * rather than presentation: Stage 9 puts a garage behind a login and Stage 10
 * has the server decide whether a submitted run beats a standing record, and
 * both need to agree with what the client showed the player.
 */

export interface BestRuns {
  /** Index into the slips given, or null when no run qualifies. */
  readonly quarterMileEt: number | null;
  readonly quarterMileMph: number | null;
  readonly sixtyFoot: number | null;
  readonly reactionTime: number | null;
}

const NONE: BestRuns = {
  quarterMileEt: null,
  quarterMileMph: null,
  sixtyFoot: null,
  reactionTime: null,
};

/**
 * Best run for each measure, by index.
 *
 * Two rules worth stating, because neither is obvious:
 *
 * A run that never reached the finish line is ignored outright. Its splits are
 * meaningless and its ET is whatever the clock happened to read.
 *
 * A red-lit run still counts for elapsed time, trap speed and 60ft. The foul is
 * about when the driver left, not about how the car ran -- the clock starts on
 * the stage beam either way, so the ET is honest and was really achieved. It
 * does *not* count for reaction time, where leaving early is precisely the
 * thing being measured and would otherwise win every time by going negative.
 *
 * Ties keep the earlier run: the first time you did it is when you did it.
 */
export function bestRuns(slips: readonly TimingSlip[]): BestRuns {
  let et: number | null = null;
  let mph: number | null = null;
  let sixty: number | null = null;
  let rt: number | null = null;

  for (let i = 0; i < slips.length; i++) {
    const slip = slips[i]!;
    if (slip.incomplete) continue;

    if (et === null || slip.quarterMileEt < slips[et]!.quarterMileEt) et = i;
    if (mph === null || slip.quarterMileMph > slips[mph]!.quarterMileMph) mph = i;
    if (sixty === null || slip.sixtyFoot < slips[sixty]!.sixtyFoot) sixty = i;
    if (!slip.foul && (rt === null || slip.reactionTime < slips[rt]!.reactionTime)) rt = i;
  }

  return { quarterMileEt: et, quarterMileMph: mph, sixtyFoot: sixty, reactionTime: rt };
}

/** Nothing recorded yet. Saves the caller special-casing an empty session. */
export function noRuns(): BestRuns {
  return NONE;
}

/**
 * Whether the last run in the list set a new quarter-mile best.
 *
 * Used to tell the player they just did something, which is the only reason a
 * best time is worth tracking at all.
 */
export function lastRunWasBestEt(slips: readonly TimingSlip[]): boolean {
  if (slips.length === 0) return false;
  const best = bestRuns(slips).quarterMileEt;
  return best === slips.length - 1;
}

/** Mean quarter-mile ET of completed passes, or null before the first finish. */
export function averageQuarterMileEt(slips:readonly TimingSlip[]):number|null{
  const completed=slips.filter(slip=>!slip.incomplete);
  return completed.length?completed.reduce((sum,slip)=>sum+slip.quarterMileEt,0)/completed.length:null;
}
