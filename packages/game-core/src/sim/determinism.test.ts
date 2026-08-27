import { describe, expect, it } from 'vitest';
import { CIVIC_SI } from '../data/cars/civic-si.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan } from '../testing/drive.js';
import { replayPass } from './replay.js';

/**
 * PROJECT_SPEC 6.3: the same car, tune, seed and input sequence must always
 * produce the same result.
 *
 * This is the load-bearing guarantee of the whole project.  Physics regression
 * tests are meaningless without it, and Stage 10 depends on the server being
 * able to re-run a submitted pass and get the challenger's claimed time back.
 */

const tune = stockTune(CIVIC_SI);

describe('a pass is reproducible', () => {
  it('gives identical results when run twice', () => {
    const first = drive(CIVIC_SI, tune, goodDrivePlan(42));
    const second = drive(CIVIC_SI, tune, goodDrivePlan(42));

    expect(second.slip).toEqual(first.slip);
    expect(second.state.tick).toBe(first.state.tick);
    expect(second.state.positionM).toBe(first.state.positionM);
    expect(second.state.speedMs).toBe(first.state.speedMs);
  });

  it('replays a recorded timeline to the same timing slip', () => {
    const live = drive(CIVIC_SI, tune, goodDrivePlan(7));
    const replayed = replayPass(CIVIC_SI, tune, live.timeline);

    expect(replayed.slip).toEqual(live.slip);
  });

  it('replays every one of a range of different drives', () => {
    // One good pass replaying correctly could be luck. These cover a bog, a
    // wheelspin launch, a red light and an early upshift.
    const plans = [
      { ...goodDrivePlan(1), launchRpm: 1200 },
      { ...goodDrivePlan(2), launchRpm: 6700 },
      { ...goodDrivePlan(3), reactionSeconds: -0.8 },
      { ...goodDrivePlan(4), shiftRpm: 4200 },
      { ...goodDrivePlan(5), throttleOffAtM: -0.3 },
    ];

    for (const plan of plans) {
      const live = drive(CIVIC_SI, tune, plan);
      const replayed = replayPass(CIVIC_SI, tune, live.timeline);
      expect(replayed.slip, `plan seeded ${plan.seed}`).toEqual(live.slip);
    }
  });

  it('records only the moments the controls changed', () => {
    // Stage 10 will store these, so a pass has to be far cheaper to keep than
    // one entry per tick. The scripted driver holds its launch rpm by pumping
    // the throttle, which is the worst case for a change-based recording and
    // still lands an order of magnitude below the tick count.
    const { timeline } = drive(CIVIC_SI, tune, goodDrivePlan(7));

    expect(timeline.changes.length).toBeGreaterThan(2);
    expect(timeline.changes.length).toBeLessThan(timeline.durationTicks / 10);

    for (let i = 1; i < timeline.changes.length; i++) {
      expect(timeline.changes[i]!.tick).toBeGreaterThan(timeline.changes[i - 1]!.tick);
    }
  });

  it('carries its seed with it', () => {
    const { timeline } = drive(CIVIC_SI, tune, goodDrivePlan(1234));
    expect(timeline.seed).toBe(1234);
  });
});
