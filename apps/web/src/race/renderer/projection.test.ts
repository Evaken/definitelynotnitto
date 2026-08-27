import { describe, expect, it } from 'vitest';
import { MIN_Z, Z_NEAR, isVisible, project, roadHalfWidth } from './projection.js';
import { HORIZON_Y, VIEW_BOTTOM, VIEW_CENTER_X } from './layout.js';

/**
 * The projection is the one piece of the chase camera that is arithmetic rather
 * than draughtsmanship, and everything in the scene agrees with everything else
 * only because they all go through it. Worth holding to its shape.
 */

describe('projecting the road', () => {
  it('puts the centreline down the middle of the view', () => {
    for (const z of [1, 10, 100]) {
      expect(project(0, z).x).toBeCloseTo(VIEW_CENTER_X, 6);
    }
  });

  it('converges on the horizon as distance grows', () => {
    const near = project(0, 10).y;
    const far = project(0, 1000).y;
    const further = project(0, 100_000).y;

    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(further);
    expect(further).toBeGreaterThan(HORIZON_Y);
    // Sub-pixel by then, but never actually there.
    expect(further).toBeCloseTo(HORIZON_Y, 1);
  });

  it('never reaches the horizon, however far away', () => {
    // A point on the horizon would be infinitely distant. Anything that
    // actually landed on it would mean the maths had lost a division.
    expect(project(0, 1e6).y).toBeGreaterThan(HORIZON_Y);
  });

  it('meets the bottom of the view at the near plane', () => {
    expect(project(0, Z_NEAR).y).toBeCloseTo(VIEW_BOTTOM, 6);
  });

  it('narrows the road with distance', () => {
    const widths = [5, 20, 80, 200].map(roadHalfWidth);
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]!).toBeLessThan(widths[i - 1]!);
    }
    expect(widths[widths.length - 1]!).toBeGreaterThan(0);
  });

  it('scales sideways and vertically by the same amount', () => {
    // Everything in the scene -- road, cars, trees, the tree -- is sized by
    // `scale`. If lateral and vertical scaling ever diverged, a car would sit
    // at the right height on a road of the wrong width.
    const z = 25;
    const p = project(3, z);
    const centre = project(0, z);

    expect(p.x - centre.x).toBeCloseTo(3 * p.scale, 6);
    expect(p.y).toBeCloseTo(centre.y, 6);
  });

  it('mirrors either side of the centreline', () => {
    const left = project(-2.5, 40);
    const right = project(2.5, 40);

    expect(VIEW_CENTER_X - left.x).toBeCloseTo(right.x - VIEW_CENTER_X, 6);
    expect(left.y).toBeCloseTo(right.y, 6);
  });

  it('halves the scale when the distance doubles', () => {
    expect(project(0, 40).scale).toBeCloseTo(project(0, 20).scale / 2, 6);
  });
});

describe('guarding the division', () => {
  it('stays finite at zero and behind the camera', () => {
    for (const z of [0, -1, -1000]) {
      const p = project(1, z);
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(Number.isFinite(p.scale)).toBe(true);
    }
  });

  it('clamps rather than blowing up as z approaches zero', () => {
    expect(project(0, 1e-9).scale).toBe(project(0, MIN_Z).scale);
  });

  it('reports anything at or behind the camera as not worth drawing', () => {
    expect(isVisible(-5)).toBe(false);
    expect(isVisible(0)).toBe(false);
    expect(isVisible(MIN_Z)).toBe(false);
    expect(isVisible(1)).toBe(true);
  });
});
