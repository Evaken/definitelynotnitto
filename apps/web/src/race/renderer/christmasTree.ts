import type { PassState } from '@nitto/game-core';
import { COLORS, VIEW, VIEW_CENTER_X, VIEW_RIGHT } from './layout.js';
import { panelEdgeXAt } from './chrome.js';
import { isVisible, project } from './projection.js';

/**
 * The Christmas tree, standing between the lanes.
 *
 * Placed in the world rather than pinned to the screen, so it grows as the car
 * rolls up to the line and passes overhead on the launch, the way it does from
 * the driver's seat. That only works because it shares the projection with the
 * road -- pinning it to a fixed screen position would leave it hanging in
 * mid-air while everything around it moved.
 *
 * `docs/reference/race-view-two-civics.webp` shows it centred between the lanes
 * with a bulb column per lane, and PRE-STAGED / STAGED plates above.
 */

/** Where the tree stands, in metres past the stage line. */
const TREE_Z_M = 1.5;
/** Height of the bulb stack above the road, metres. */
const TREE_HEIGHT_M = 4.4;
const BULB_SPACING_M = 0.5;
const BULB_RADIUS_M = 0.2;
/** Half the gap between the two lanes' bulb columns, metres. */
const COLUMN_SPREAD_M = 0.5;

/**
 * Largest a bulb is allowed to be drawn, pixels.
 *
 * The driver ends up very close to the tree while staged, and unclamped
 * perspective turns it into a wall of circles filling the view. Capping the
 * scale keeps it a tree that happens to be near rather than an obstruction.
 */
const MAX_BULB_RADIUS_PX = 13;

export function drawChristmasTree(ctx: CanvasRenderingContext2D, state: PassState, cameraM: number): void {
  const z = TREE_Z_M - cameraM;
  if (!isVisible(z)) return;

  const base = project(0, z);
  if (base.x < VIEW.x - 200 || base.x > VIEW_RIGHT + 200) return;

  const scale = Math.min(base.scale, MAX_BULB_RADIUS_PX / BULB_RADIUS_M);
  const radius = BULB_RADIUS_M * scale;
  if (radius < 1) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();

  const topY = base.y - TREE_HEIGHT_M * scale;
  const spacing = BULB_SPACING_M * scale;

  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = Math.max(1, 0.14 * scale);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(base.x, topY);
  ctx.stroke();

  const { lights } = state;
  // Top to bottom, matching a real tree: two staging bulbs, three ambers, green,
  // then red. Only the left lane has a car in it, so the right column stays
  // dark -- opponents are Stage 6.
  const column: readonly (readonly [boolean, string, boolean])[] = [
    [lights.prestage, COLORS.amber, true],
    [lights.stage, COLORS.amber, true],
    [lights.ambers[0], COLORS.amber, false],
    [lights.ambers[1], COLORS.amber, false],
    [lights.ambers[2], COLORS.amber, false],
    [lights.green, COLORS.green, false],
    [lights.red, COLORS.red, false],
  ];

  const spread = COLUMN_SPREAD_M * scale;
  for (const side of [-1, 1] as const) {
    const x = base.x + side * spread;
    const live = side === -1;

    column.forEach(([lit, color, small], index) => {
      const cy = topY + index * spacing + (small ? spacing * 0.2 : 0);
      const r = small ? radius * 0.55 : radius;
      const on = live && lit;

      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = on ? color : COLORS.bulbOff;
      ctx.fill();

      if (on) {
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.min(20, r * 2.2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = '#0e1116';
      ctx.lineWidth = Math.max(0.5, r * 0.16);
      ctx.stroke();
    });
  }

  ctx.restore();
}

/**
 * PRE-STAGED and STAGED plates, one per lane.
 *
 * Pinned to the top corners of the view rather than projected. In the reference
 * they sit above the tree and stay legible whatever it is doing, which a plate
 * that shrank into the distance would not -- and putting them in the corners
 * keeps them clear of the tree at any distance.
 */
export function drawStageIndicators(ctx: CanvasRenderingContext2D, state: PassState): void {
  const w = 112;
  const h = 40;
  const y = VIEW.y + 6;

  // Positioned off the side panels' actual curve rather than a fixed inset.
  // The panel is at its narrowest right at the top edge and widens fast, so a
  // constant gutter clears it at the plate's top corner and clips its bottom.
  const clearance = 6;
  const left = Math.max(panelEdgeXAt(y, 'left'), panelEdgeXAt(y + h, 'left'));
  const right = Math.min(panelEdgeXAt(y, 'right'), panelEdgeXAt(y + h, 'right'));

  plate(ctx, left + clearance, y, w, h, state.lights.prestage, state.lights.stage);
  plate(ctx, right - w - clearance, y, w, h, false, false);
}

function plate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  prestaged: boolean,
  staged: boolean,
): void {
  ctx.fillStyle = 'rgba(10, 13, 18, 0.86)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9px Verdana, sans-serif';

  const rows: readonly (readonly [string, boolean])[] = [
    ['PRE-STAGED', prestaged],
    ['STAGED', staged],
  ];

  rows.forEach(([label, lit], index) => {
    const rowY = y + 12 + index * 17;
    ctx.fillStyle = lit ? COLORS.amber : COLORS.textDim;
    ctx.fillText(label, x + 8, rowY);

    for (let bulb = 0; bulb < 2; bulb++) {
      const cx = x + w - 24 + bulb * 13;
      ctx.beginPath();
      ctx.arc(cx, rowY, 4, 0, Math.PI * 2);
      ctx.fillStyle = lit ? COLORS.amber : COLORS.bulbOff;
      ctx.fill();
      ctx.strokeStyle = '#0e1116';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}
