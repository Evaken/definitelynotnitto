import { describe, expect, it } from 'vitest';
import { CLUSTER } from './layout.js';
import { DIALS, SHIFT_LIGHT } from './cluster.js';
import { dashTopY } from './chrome.js';

/**
 * Where the shift light sits, asserted rather than eyeballed.
 *
 * It used to float in the gap beside the tachometer. Once the dials were sized
 * and clustered off the reference there was no gap left, and the reference puts
 * the light on the tacho's rim anyway -- overlapping it at the upper right.
 */
describe('where the shift light sits', () => {
  const { cx, cy, r } = SHIFT_LIGHT;

  it('is above and to the right of the tachometer', () => {
    expect(cx).toBeGreaterThan(DIALS.rpm.cx);
    expect(cy).toBeLessThan(DIALS.rpm.cy);
  });

  it('sits on the tacho rim rather than clear of it or biting into it', () => {
    // Tangent, near enough. Deep inside the dial it read as a mistake; well
    // outside it read as floating in a gap that no longer exists.
    const overlap = DIALS.rpm.r + r - Math.hypot(cx - DIALS.rpm.cx, cy - DIALS.rpm.cy);
    expect(overlap).toBeGreaterThan(-8);
    expect(overlap).toBeLessThan(8);
  });

  it('clears the other two dials', () => {
    for (const name of ['boost', 'mph'] as const) {
      const dial = DIALS[name];
      const gap = Math.hypot(cx - dial.cx, cy - dial.cy) - dial.r - r;
      expect(gap, `${name} dial`).toBeGreaterThan(10);
    }
  });

  it('sits on the dashboard, not off the front of it', () => {
    expect(cy - r).toBeGreaterThan(dashTopY(cx));
  });

  it('fits inside the cluster panel', () => {
    // No label any more -- it overlaps the tacho, and there is nowhere to put
    // one. The original has no label here either.
    expect(cy + r).toBeLessThan(CLUSTER.y + CLUSTER.h);
    expect(cx - r).toBeGreaterThan(CLUSTER.x);
    expect(cx + r).toBeLessThan(CLUSTER.x + CLUSTER.w);
  });

  it('is larger than the SLIP and LIMIT tell-tales', () => {
    // Those are 11px. This one is asking for an input rather than reporting
    // state, so it reads first.
    expect(r).toBeGreaterThan(11);
  });
});
