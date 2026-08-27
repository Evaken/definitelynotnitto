import { describe, expect, it } from 'vitest';
import { CLUSTER } from './layout.js';
import { DIALS, SHIFT_LIGHT } from './cluster.js';

/**
 * The shift light has to sit above and to the right of the tachometer without
 * touching anything, and the Browser pane cannot be screenshotted from here, so
 * the clearances are asserted rather than eyeballed.
 */
describe('where the shift light sits', () => {
  const { cx, cy, r } = SHIFT_LIGHT;
  const LABEL_DROP = 9; // matches lamp(): the label baseline is cy + r + LABEL_DROP

  it('is above and to the right of the tachometer', () => {
    expect(cx).toBeGreaterThan(DIALS.rpm.cx);
    expect(cy).toBeLessThan(DIALS.rpm.cy);
  });

  it('clears every dial, label included', () => {
    for (const [name, dial] of Object.entries(DIALS)) {
      const gap = Math.hypot(cx - dial.cx, cy - dial.cy) - dial.r - r;
      expect(gap, `${name} dial`).toBeGreaterThan(10);
    }
  });

  it('fits inside the cluster panel', () => {
    expect(cy - r).toBeGreaterThan(CLUSTER.y);
    expect(cy + r + LABEL_DROP).toBeLessThan(CLUSTER.y + CLUSTER.h);
    expect(cx - r).toBeGreaterThan(CLUSTER.x);
    expect(cx + r).toBeLessThan(CLUSTER.x + CLUSTER.w);
  });

  it('is larger than the SLIP and LIMIT tell-tales', () => {
    // Those are 11px. This one is asking for an input rather than reporting
    // state, so it reads first.
    expect(r).toBeGreaterThan(11);
  });
});
