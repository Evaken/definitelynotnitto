import { describe, expect, it } from 'vitest';
import { COWL_CROWN_Y, dashTopY, panelEdgeXAt } from './chrome.js';
import { CANVAS_WIDTH, HORIZON_Y, VIEW } from './layout.js';
import { CLUTCH_SLIDER, DIALS, GAS_SLIDER, SHIFT_LIGHT } from './cluster.js';

const CENTRE = CANVAS_WIDTH / 2;

/**
 * The cowl is an overlay: it is painted over the finished scene rather than the
 * scene being fitted around it. That is only safe while it stays out of the road
 * view and every instrument stays on it, which is what these assert -- the
 * Browser pane cannot be screenshotted from here, so the shape is checked by
 * arithmetic rather than by eye.
 */
describe('the dashboard cowl', () => {
  it('is highest in the middle', () => {
    // Lower y is higher on screen.
    expect(dashTopY(CENTRE)).toBeLessThan(dashTopY(0));
    expect(dashTopY(CENTRE)).toBeLessThan(dashTopY(CANVAS_WIDTH));
    expect(dashTopY(CENTRE)).toBeCloseTo(COWL_CROWN_Y, 6);
  });

  it('is symmetric about the centre', () => {
    for (const offset of [40, 160, 320, 470]) {
      expect(dashTopY(CENTRE - offset)).toBeCloseTo(dashTopY(CENTRE + offset), 6);
    }
  });

  it('falls away steadily from the crown', () => {
    let previous = dashTopY(CENTRE);
    for (let x = CENTRE; x <= CANVAS_WIDTH; x += 40) {
      const y = dashTopY(x);
      expect(y).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = y;
    }
  });

  it('overlaps the bottom of the road view without eating it', () => {
    // The cowl sits in front of the picture rather than below it -- that is what
    // closes the black band that used to run along the top of the dash. It is
    // still an overlay, so the only rule is that it must not climb far enough to
    // matter: the projection has no idea it is there.
    const bottom = VIEW.y + VIEW.h;
    let deepest = 0;
    for (let x = VIEW.x; x <= VIEW.x + VIEW.w; x += 10) {
      deepest = Math.max(deepest, bottom - dashTopY(x));
    }
    expect(deepest).toBeGreaterThan(0);
    expect(deepest).toBeLessThan(VIEW.h * 0.15);
  });

  it('stays nowhere near the horizon', () => {
    for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
      expect(dashTopY(x), `x=${x}`).toBeGreaterThan(HORIZON_Y + VIEW.h * 0.5);
    }
  });

  it('leaves the corners of the canvas clear', () => {
    // Where the original put the things that are not instruments.
    expect(dashTopY(0)).toBeGreaterThan(COWL_CROWN_Y + 60);
    expect(dashTopY(CANVAS_WIDTH)).toBeGreaterThan(COWL_CROWN_Y + 60);
  });
});

describe('the instruments sit on the dashboard', () => {
  it('holds every dial', () => {
    for (const [name, dial] of Object.entries(DIALS)) {
      // The dial's highest point has to clear the cowl edge beneath it, or it
      // would be drawn hanging off the front of the dash.
      expect(dial.cy - dial.r, `${name} dial`).toBeGreaterThan(dashTopY(dial.cx));
    }
  });

  it('holds the shift light', () => {
    expect(SHIFT_LIGHT.cy - SHIFT_LIGHT.r).toBeGreaterThan(dashTopY(SHIFT_LIGHT.cx));
  });

  it('holds both sliders across their full width', () => {
    for (const [name, slider] of [
      ['gas', GAS_SLIDER],
      ['clutch', CLUTCH_SLIDER],
    ] as const) {
      // Checked at the outer corner, which is the one nearest the falling edge.
      expect(slider.y, `${name} slider`).toBeGreaterThan(dashTopY(slider.x + slider.w));
    }
  });
});

describe('the side panels', () => {
  // Offsets measured off a marked-up screenshot of the original, so the shape
  // is a source rather than a preference. It was drawn backwards twice before
  // this: the opening pinches at the TOP and opens out toward the dash.
  const WAIST_Y = 300;

  it('reaches into the view at the top', () => {
    expect(panelEdgeXAt(0, 'left')).toBeGreaterThan(VIEW.x + 30);
    expect(panelEdgeXAt(0, 'right')).toBeLessThan(VIEW.x + VIEW.w - 30);
  });

  it('sweeps outward going down, not inward', () => {
    // The direction that was wrong twice. Lower on the panel means further out.
    expect(panelEdgeXAt(WAIST_Y, 'left')).toBeLessThan(panelEdgeXAt(0, 'left'));
    expect(panelEdgeXAt(WAIST_Y, 'right')).toBeGreaterThan(panelEdgeXAt(0, 'right'));
  });

  it('opens past the view entirely by the time it reaches the dash', () => {
    // Around the middle the panel is clear of the picture altogether, which is
    // what makes the opening widest where the eye actually is.
    expect(panelEdgeXAt(WAIST_Y, 'left')).toBeLessThan(VIEW.x);
    expect(panelEdgeXAt(WAIST_Y, 'right')).toBeGreaterThan(VIEW.x + VIEW.w);
  });

  it('sweeps monotonically outward down the picture', () => {
    let previous = panelEdgeXAt(0, 'left');
    for (let y = 0; y <= VIEW.y + VIEW.h; y += 10) {
      const x = panelEdgeXAt(y, 'left');
      expect(x, `y=${y}`).toBeLessThanOrEqual(previous + 0.01);
      previous = x;
    }
  });

  it('bows away from the view rather than running straight', () => {
    // The assertion that would have caught the three separate times this was
    // drawn wrong. Direction of travel is not enough: the edge has to sweep out
    // quickly near the top and flatten toward the dash, which means sitting well
    // outside the straight line between its own endpoints.
    const top = panelEdgeXAt(0, 'left');
    const bottom = panelEdgeXAt(VIEW.y + VIEW.h, 'left');
    const middleY = (VIEW.y + VIEW.h) / 2;
    const chord = top + (bottom - top) * 0.5;

    expect(chord - panelEdgeXAt(middleY, 'left')).toBeGreaterThan(20);

    const rTop = panelEdgeXAt(0, 'right');
    const rBottom = panelEdgeXAt(VIEW.y + VIEW.h, 'right');
    const rChord = rTop + (rBottom - rTop) * 0.5;
    expect(panelEdgeXAt(middleY, 'right') - rChord).toBeGreaterThan(20);
  });

  it('is symmetric about the view', () => {
    for (const y of [0, 120, 255, 330]) {
      const fromLeft = panelEdgeXAt(y, 'left') - VIEW.x;
      const fromRight = VIEW.x + VIEW.w - panelEdgeXAt(y, 'right');
      expect(fromRight).toBeCloseTo(fromLeft, 4);
    }
  });

  it('never closes over the road', () => {
    for (let y = 0; y <= VIEW.y + VIEW.h; y += 10) {
      const gap = panelEdgeXAt(y, 'right') - panelEdgeXAt(y, 'left');
      expect(gap, `y=${y}`).toBeGreaterThan(VIEW.w * 0.75);
    }
  });
});
