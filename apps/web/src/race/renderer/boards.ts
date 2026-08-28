import { TRACK_MARKS, metresToFeet, stagingZoneStart, type PassState } from '@nitto/game-core';
import { BOARD_LEFT, BOARD_RIGHT, COLORS, POSITION_BAR } from './layout.js';

/**
 * The timing boards flanking the strip, and the position bar down the far left.
 *
 * Both follow `docs/reference/race-view-two-civics.webp`: a sponsor plate at the
 * top of each board, a red LED elapsed time under it, and a dark panel below
 * that fills in as the car passes each mark.
 */

/**
 * How much strip the staging bar shows either side of the window, in metres.
 *
 * Five puts the car's spawn point (STAGING.startLineOffsetM) just inside the
 * bottom of the bar, so the marker is on the scale from the moment the run
 * starts, and leaves the same distance above for reading back an overshoot.
 */
const BAR_REACH_M = 5;

/**
 * Where a point on the strip sits on the staging bar: 0 at the bottom, 1 at the
 * top, clamped at both ends so the car marker pins rather than disappearing.
 *
 * Pulled out of the drawing code because it is the part that can be wrong
 * silently -- an earlier version inverted this and collapsed the window to
 * nothing, which looked like a missing feature rather than a broken sum.
 */
export function stagingBarFraction(metres: number): number {
  const centre = stagingZoneStart() / 2;
  const t = (metres - centre + BAR_REACH_M) / (BAR_REACH_M * 2);
  return Math.max(0, Math.min(1, t));
}

interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export function drawBoards(ctx: CanvasRenderingContext2D, state: PassState): void {
  drawBoard(ctx, BOARD_LEFT, state, true);
  drawBoard(ctx, BOARD_RIGHT, state, false);
}

/**
 * One board. The right-hand one has no car in it.
 *
 * Opponents are Stage 6 work, and inventing a ghost car to fill the lane would
 * be scaffolding a later stage. A solo run down one lane is a real thing on a
 * real strip, so the empty board reads as a single rather than as a bug.
 */
function drawBoard(
  ctx: CanvasRenderingContext2D,
  box: Box,
  state: PassState,
  isPlayer: boolean,
): void {
  const surround = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
  surround.addColorStop(0, '#aebfc2');
  surround.addColorStop(0.48, '#6f8e94');
  surround.addColorStop(1, '#26373d');
  ctx.fillStyle = surround;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = '#0aa1c4';
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

  // Sponsor plate.
  const plate = ctx.createLinearGradient(0, box.y, 0, box.y + 78);
  plate.addColorStop(0, '#e8f2f3');
  plate.addColorStop(0.55, '#8ba5aa');
  plate.addColorStop(1, '#52676d');
  ctx.fillStyle = plate;
  ctx.fillRect(box.x + 7, box.y + 7, box.w - 14, 72);

  ctx.strokeStyle = isPlayer ? '#198fbe' : '#8e9da1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(box.x + box.w / 2, box.y + 32, 18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.fillStyle = '#f5f8f8';
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.shadowBlur = 2;
  ctx.fillText(isPlayer ? 'RACE TEAM' : 'OPEN LANE', box.x + box.w / 2, box.y + 61);
  ctx.shadowBlur = 0;

  // Elapsed time, as a red LED readout.
  const etText = isPlayer ? elapsedText(state) : '--.---';
  ledPanel(ctx, box.x + 7, box.y + 86, box.w - 14, 30, etText, isPlayer);

  // Splits fill in as the car passes each mark.
  const rows: readonly (readonly [string, number | undefined])[] = isPlayer
    ? [
        ['60 FT', state.splits.sixtyFoot],
        ['330 FT', state.splits.threeThirty],
        ['1/8 ET', state.splits.eighthMile],
        ['1000 FT', state.splits.thousandFoot],
        ['1/4 ET', state.splits.quarterMile],
      ]
    : [
        ['60 FT', undefined],
        ['330 FT', undefined],
        ['1/8 ET', undefined],
        ['1000 FT', undefined],
        ['1/4 ET', undefined],
      ];

  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(box.x + 7, box.y + 123, box.w - 14, box.h - 154);

  rows.forEach(([label, value], index) => {
    const y = box.y + 143 + index * 25;
    ctx.textAlign = 'left';
    ctx.font = '10px Verdana, sans-serif';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(label, box.x + 16, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold 15px "Lucida Console", monospace';
    ctx.fillStyle = value === undefined ? '#2f3542' : COLORS.accent;
    ctx.fillText(value === undefined ? '--.---' : value.toFixed(3), box.x + box.w - 16, y);
  });

  // Reaction time sits apart from the splits: it is not a distance.
  ctx.textAlign = 'left';
  ctx.font = '10px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('R/T', box.x + 16, box.y + box.h - 22);

  ctx.textAlign = 'right';
  ctx.font = 'bold 15px "Lucida Console", monospace';
  const rt = isPlayer && state.clockStartTick !== null && state.treeSchedule !== null;
  ctx.fillStyle = state.foul ? COLORS.red : rt ? COLORS.accent : '#2f3542';
  ctx.fillText(
    rt ? reactionText(state) : '--.---',
    box.x + box.w - 16,
    box.y + box.h - 22,
  );
}

function elapsedText(state: PassState): string {
  const finished = state.splits.quarterMile;
  if (finished !== undefined) return finished.toFixed(3);
  if (state.clockStartTick === null) return '--.---';
  return Math.max(0, (state.tick - state.clockStartTick) / 1000).toFixed(3);
}

function reactionText(state: PassState): string {
  if (state.clockStartTick === null || state.treeSchedule === null) return '--.---';
  return ((state.clockStartTick - state.treeSchedule.greenTick) / 1000).toFixed(3);
}

function ledPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  live: boolean,
): void {
  ctx.fillStyle = '#160607';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a1512';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px "Lucida Console", monospace';
  ctx.fillStyle = live ? COLORS.led : COLORS.ledDim;
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

/**
 * The staging approach bar, down the far left.
 *
 * Not a progress bar for the whole quarter mile -- that would spend its entire
 * length in the bottom pixel while the driver is doing the one thing this view
 * makes hard, which is judging a metre and a half of roll-in from behind the
 * car. It shows only the last stretch up to the line, with the staging window
 * marked, so "how much further" is readable at a glance.
 *
 * Once the run is under way there is nothing left to approach, so it hands the
 * space over to distance covered.
 */
export function drawStagingBar(ctx: CanvasRenderingContext2D, state: PassState): void {
  const box = POSITION_BAR;
  const zoneStart = stagingZoneStart();
  const staging = state.clockStartTick === null;

  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

  const inner = { x: box.x + 3, y: box.y + 3, w: box.w - 6, h: box.h - 6 };

  if (staging) {
    // The window sits in the middle of the bar rather than at the top, so there
    // is scale on both sides of it: ground still to cover below, and ground
    // overshot above. A driver who rolls through can read off how far back to
    // reverse instead of guessing.
    const yFor = (metres: number) =>
      inner.y + inner.h - stagingBarFraction(metres) * inner.h;

    ctx.fillStyle = '#1b2029';
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

    // The window itself, which is the thing being aimed at.
    const windowTop = yFor(0);
    const windowBottom = yFor(zoneStart);
    const settled = state.phase === 'staged' || state.phase === 'tree';
    ctx.fillStyle = settled ? 'rgba(63, 211, 90, 0.85)' : 'rgba(232, 163, 23, 0.8)';
    ctx.fillRect(inner.x, windowTop, inner.w, windowBottom - windowTop);

    // Both beams: the stage line closing the top, the pre-stage line the bottom.
    ctx.fillStyle = COLORS.laneLine;
    ctx.fillRect(inner.x, windowTop - 1, inner.w, 2);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.fillRect(inner.x, windowBottom - 1, inner.w, 2);

    // The car. Red once it is past the stage line, which is the state reverse
    // exists to get out of.
    const carY = yFor(state.positionM);
    const past = state.positionM > 0;
    ctx.fillStyle = past ? COLORS.red : COLORS.text;
    ctx.fillRect(box.x - 1, carY - 2, box.w + 2, 4);

    ctx.save();
    ctx.translate(box.x + box.w / 2, inner.y + inner.h - 4);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '8px Verdana, sans-serif';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('STAGING', 0, 0);
    ctx.restore();
    return;
  }

  const t = Math.max(0, Math.min(1, state.positionM / TRACK_MARKS.quarterMile));
  const filled = t * inner.h;
  const gradient = ctx.createLinearGradient(0, inner.y, 0, inner.y + inner.h);
  gradient.addColorStop(0, '#7a4a06');
  gradient.addColorStop(1, '#e8a317');
  ctx.fillStyle = gradient;
  ctx.fillRect(inner.x, inner.y + inner.h - filled, inner.w, filled);

  ctx.save();
  ctx.translate(box.x + box.w / 2, inner.y + inner.h - 4);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '8px Verdana, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`${Math.max(0, metresToFeet(state.positionM)).toFixed(0)} FT`, 0, 0);
  ctx.restore();
}
