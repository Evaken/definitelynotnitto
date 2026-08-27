import type { PassState } from '@nitto/game-core';
import { COLORS, VIEW, VIEW_CENTER_X, VIEW_RIGHT } from './layout.js';
import { isVisible, project } from './projection.js';

/**
 * The Christmas tree, standing between the lanes.
 *
 * Placed in the world rather than pinned to the screen, so it grows as the car
 * rolls up to the line and whips past overhead on the launch, the way it does
 * from the driver's seat. That only works because it shares the projection with
 * the road -- pinning it to a fixed screen position would leave it hanging in
 * mid-air while everything around it moved.
 *
 * `docs/reference/race-view-two-civics.webp` shows it centred between the lanes
 * with a bulb column per lane, and PRE-STAGED / STAGED plates above.
 */

/** Where the tree stands, in metres past the stage line. */
const TREE_Z_M = 7;
/** Height of the bulb stack above the road, metres. */
const TREE_HEIGHT_M = 4.6;
const BULB_SPACING_M = 0.62;
const BULB_RADIUS_M = 0.25;

export function drawChristmasTree(ctx: CanvasRenderingContext2D, state: PassState): void {
  const z = TREE_Z_M - state.positionM;
  if (!isVisible(z)) return;

  const base = project(0, z);
  const s = base.scale;
  if (base.x < VIEW.x - 200 || base.x > VIEW_RIGHT + 200) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();

  const topY = base.y - TREE_HEIGHT_M * s;
  const spacing = BULB_SPACING_M * s;
  const radius = BULB_RADIUS_M * s;

  // The post.
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = Math.max(1, 0.16 * s);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(base.x, topY);
  ctx.stroke();

  if (radius < 0.8) {
    ctx.restore();
    return;
  }

  const { lights } = state;
  // Top to bottom, matching a real tree: two staging bulbs, three ambers, green,
  // then red. Both columns show the same thing while there is only one car.
  const column: readonly (readonly [boolean, string, boolean])[] = [
    [lights.prestage, COLORS.amber, true],
    [lights.stage, COLORS.amber, true],
    [lights.ambers[0], COLORS.amber, false],
    [lights.ambers[1], COLORS.amber, false],
    [lights.ambers[2], COLORS.amber, false],
    [lights.green, COLORS.green, false],
    [lights.red, COLORS.red, false],
  ];

  const laneSpread = 0.62 * s;
  for (const side of [-1, 1] as const) {
    const x = base.x + side * laneSpread;
    column.forEach(([lit, color, small], index) => {
      const cy = topY + index * spacing + (small ? spacing * 0.15 : 0);
      const r = small ? radius * 0.58 : radius;

      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = lit ? color : COLORS.bulbOff;
      ctx.fill();

      if (lit) {
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.min(24, r * 2.2);
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
 * Fixed to the top of the view rather than projected. In the reference they sit
 * above the tree and stay legible whatever the tree is doing, which a plate that
 * shrank into the distance would not.
 */
export function drawStageIndicators(ctx: CanvasRenderingContext2D, state: PassState): void {
  const plateW = 104;
  const plateH = 42;
  const y = VIEW.y + 8;

  plate(ctx, VIEW_CENTER_X - plateW - 26, y, plateW, plateH, state.lights.prestage, state.lights.stage);
  plate(ctx, VIEW_CENTER_X + 26, y, plateW, plateH, false, false);
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
  ctx.fillStyle = 'rgba(10, 13, 18, 0.82)';
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
    const rowY = y + 12 + index * 18;
    ctx.fillStyle = lit ? COLORS.amber : COLORS.textDim;
    ctx.fillText(label, x + 8, rowY);

    for (let bulb = 0; bulb < 2; bulb++) {
      const cx = x + w - 26 + bulb * 14;
      ctx.beginPath();
      ctx.arc(cx, rowY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = lit ? COLORS.amber : COLORS.bulbOff;
      ctx.fill();
      ctx.strokeStyle = '#0e1116';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}
