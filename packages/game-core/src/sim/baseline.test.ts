import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { measureBaseline, type Baseline, type BaselineRow } from '../testing/baseline.js';

/**
 * Nothing in the roster may move by accident.
 *
 * Set UPDATE_BASELINE=1 to re-record it after a change you meant to make, and
 * regenerate the tables in BALANCE_NOTES.md in the same commit -- `npm run
 * baseline` does both halves of the first part for you.
 */

const FILE = fileURLToPath(new URL('./baseline.json', import.meta.url));
const TOLERANCE = 0.005;

const measured = measureBaseline();

if (process.env.UPDATE_BASELINE === '1' || !existsSync(FILE)) {
  writeFileSync(FILE, `${JSON.stringify(measured, null, 2)}\n`, 'utf8');
}

const recorded = JSON.parse(readFileSync(FILE, 'utf8')) as Baseline;

function compare(name: string, now: readonly BaselineRow[], then: readonly BaselineRow[]) {
  describe(name, () => {
    it('covers the same cars', () => {
      expect(now.map((row) => row.id)).toEqual(then.map((row) => row.id));
    });

    it('finishes every pass', () => {
      // -1 is the marker for a car that did not complete the quarter. A car
      // that stops finishing is the most important regression there is, and a
      // comparative test cannot catch it.
      expect(now.filter((row) => row.quarterMileEt < 0).map((row) => row.id)).toEqual([]);
    });

    it.each(then.map((row) => row.id))('%s runs what it ran before', (id) => {
      const before = then.find((row) => row.id === id)!;
      const after = now.find((row) => row.id === id)!;
      const drift = (key: keyof BaselineRow) =>
        `${key}: was ${before[key]}, now ${after[key]}`;

      expect(after.quarterMileEt, drift('quarterMileEt')).toBeCloseTo(before.quarterMileEt, 2);
      expect(after.quarterMileMph, drift('quarterMileMph')).toBeCloseTo(before.quarterMileMph, 1);
      expect(
        Math.abs(after.sixtyFoot - before.sixtyFoot),
        drift('sixtyFoot'),
      ).toBeLessThan(TOLERANCE);
    });
  });
}

compare('the roster as sold', measured.stock, recorded.stock);
compare('the roster fully built', measured.built, recorded.built);
