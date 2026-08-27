import { TRACK_MARKS, metresToFeet, stagingZoneStart, type PassState } from '@nitto/game-core';
import { BOARD_LEFT, BOARD_RIGHT, COLORS, POSITION_BAR } from './layout.js';

/**
 * The timing boards flanking the strip, and the position bar down the far left.
 *
 * Both follow `docs/reference/race-view-two-civics.webp`: a sponsor plate at the
 * top of each board, a red LED elapsed time under it, and a dark panel below
 * that fills in as the car passes each mark.
 */

/** How far back the staging bar starts caring, metres before the line. */
const APPROACH_FROM_M = 9;

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
  ctx.fillStyle = '#141922';
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

  // Sponsor plate.
  const plate = ctx.createLinearGradient(0, box.y, 0, box.y + 54);
  plate.addColorStop(0, '#39404d');
  plate.addColorStop(1, '#222831');
  ctx.fillStyle = plate;
  ctx.fillRect(box.x + 6, box.y + 6, box.w - 12, 48);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.fillStyle = isPlayer ? COLORS.accent : COLORS.textDim;
  ctx.fillText(isPlayer ? 'YOUR LANE' : 'OPEN LANE', box.x + box.w / 2, box.y + 30);

  // Elapsed time, as a red LED readout.
  const etText = isPlayer ? elapsedText(state) : '--.---';
  ledPanel(ctx, box.x + 6, box.y + 60, box.w - 12, 34, etText, isPlayer);

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
  ctx.fillRect(box.x + 6, box.y + 102, box.w - 12, box.h - 140);

  rows.forEach(([label, value], index) => {
    const y = box.y + 122 + index * 30;
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
    // Bottom of the bar is APPROACH_FROM_M behind the line; the top is the line
    // itself. So t runs 0 at the far end to 1 at the stage line.
    const yFor = (metres: number) => {
      const t = (metres + APPROACH_FROM_M) / APPROACH_FROM_M;
      return inner.y + inner.h - Math.max(0, Math.min(1, t)) * inner.h;
    };

    ctx.fillStyle = '#1b2029';
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

    // The window itself, which is the thing being aimed at.
    const windowTop = yFor(0);
    const windowBottom = yFor(zoneStart);
    const settled = state.phase === 'staged' || state.phase === 'tree';
    ctx.fillStyle = settled ? 'rgba(63, 211, 90, 0.85)' : 'rgba(232, 163, 23, 0.8)';
    ctx.fillRect(inner.x, windowTop, inner.w, windowBottom - windowTop);

    // The stage line closes the top of the window.
    ctx.fillStyle = COLORS.laneLine;
    ctx.fillRect(inner.x, windowTop - 1, inner.w, 2);

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
