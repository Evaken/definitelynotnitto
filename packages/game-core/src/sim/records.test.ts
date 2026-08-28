import { describe, expect, it } from 'vitest';
import { bestRuns, lastRunWasBestEt, noRuns } from './records.js';
import type { TimingSlip } from '../types/sim.js';

function slip(over: Partial<TimingSlip> = {}): TimingSlip {
  return {
    reactionTime: 0.5,
    sixtyFoot: 2.5,
    threeThirty: 6.5,
    eighthMileEt: 10,
    eighthMileMph: 72,
    thousandFoot: 12.8,
    quarterMileEt: 15.5,
    quarterMileMph: 91,
    foul: false,
    incomplete: false,
    ...over,
  };
}

describe('best runs', () => {
  it('finds nothing in an empty session', () => {
    expect(bestRuns([])).toEqual(noRuns());
  });

  it('picks the quickest, fastest and hardest-launching runs independently', () => {
    // They need not be the same run: a quick ET and a high trap speed come from
    // different parts of the pass.
    const slips = [
      slip({ quarterMileEt: 15.5, quarterMileMph: 91, sixtyFoot: 2.5 }),
      slip({ quarterMileEt: 15.2, quarterMileMph: 90, sixtyFoot: 2.6 }),
      slip({ quarterMileEt: 15.8, quarterMileMph: 93, sixtyFoot: 2.4 }),
    ];
    const best = bestRuns(slips);
    expect(best.quarterMileEt).toBe(1);
    expect(best.quarterMileMph).toBe(2);
    expect(best.sixtyFoot).toBe(2);
  });

  it('ignores a run that never finished', () => {
    // Its splits are meaningless, and its ET is whatever the clock happened to
    // read when the pass gave up.
    const slips = [
      slip({ quarterMileEt: 15.5 }),
      slip({ quarterMileEt: 0.1, sixtyFoot: 0, quarterMileMph: 200, incomplete: true }),
    ];
    const best = bestRuns(slips);
    expect(best.quarterMileEt).toBe(0);
    expect(best.quarterMileMph).toBe(0);
    expect(best.sixtyFoot).toBe(0);
  });

  it('finds nothing when every run is incomplete', () => {
    expect(bestRuns([slip({ incomplete: true }), slip({ incomplete: true })])).toEqual(noRuns());
  });

  it('counts a red-lit run for elapsed time', () => {
    // The clock starts on the stage beam whether the driver left early or not,
    // so the ET was really achieved.
    const slips = [slip({ quarterMileEt: 15.5 }), slip({ quarterMileEt: 15.1, foul: true })];
    expect(bestRuns(slips).quarterMileEt).toBe(1);
  });

  it('does not count a red-lit run for reaction time', () => {
    // Leaving early is the thing being measured. A negative light would win
    // every time and mean nothing.
    const slips = [
      slip({ reactionTime: 0.4 }),
      slip({ reactionTime: -0.12, foul: true }),
    ];
    expect(bestRuns(slips).reactionTime).toBe(0);
  });

  it('has no best reaction time when every light was red', () => {
    const best = bestRuns([slip({ reactionTime: -0.2, foul: true })]);
    expect(best.reactionTime).toBeNull();
    expect(best.quarterMileEt).toBe(0);
  });

  it('keeps the earlier run when two are identical', () => {
    expect(bestRuns([slip(), slip()]).quarterMileEt).toBe(0);
  });
});

describe('telling the player they just did something', () => {
  it('reports a new best on the run that set it', () => {
    expect(lastRunWasBestEt([slip({ quarterMileEt: 15.5 }), slip({ quarterMileEt: 15.2 })])).toBe(
      true,
    );
  });

  it('says nothing when the last run was slower', () => {
    expect(lastRunWasBestEt([slip({ quarterMileEt: 15.2 }), slip({ quarterMileEt: 15.5 })])).toBe(
      false,
    );
  });

  it('counts the very first completed run', () => {
    expect(lastRunWasBestEt([slip()])).toBe(true);
  });

  it('says nothing about an empty session or an unfinished run', () => {
    expect(lastRunWasBestEt([])).toBe(false);
    expect(lastRunWasBestEt([slip({ incomplete: true })])).toBe(false);
  });
});
