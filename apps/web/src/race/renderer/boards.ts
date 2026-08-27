import { TRACK_MARKS, metresToFeet, type PassState } from '@nitto/game-core';
import { BOARD_LEFT, BOARD_RIGHT, COLORS, POSITION_BAR } from './layout.js';

/**
 * The timing boards flanking the strip, and the position bar down the far left.
 *
 * Both follow `docs/reference/race-view-two-civics.webp`: a sponsor plate at the
 * top of each board, a red LED elapsed time under it, and a dark panel below
 * that fills in as the car passes each mark.
 */

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
 * Progress down the strip, as a vertical bar on the far left.
 *
 * The original has a bar in this position whose purpose is not confirmed --
 * see `docs/reference/README.md`. Progress is the most likely reading and the
 * most useful thing to put there, so that is what it does until better evidence
 * turns up.
 */
export function drawPositionBar(ctx: CanvasRenderingContext2D, state: PassState): void {
  const box = POSITION_BAR;

  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

  // Bottom of the bar is the start line, top is the finish.
  const yFor = (metres: number) => {
    const t = Math.max(0, Math.min(1, metres / TRACK_MARKS.quarterMile));
    return box.y + box.h - t * box.h;
  };

  const gradient = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  gradient.addColorStop(0, '#7a4a06');
  gradient.addColorStop(1, '#e8a317');
  ctx.fillStyle = gradient;
  ctx.fillRect(box.x + 3, box.y + 3, box.w - 6, box.h - 6);

  // The marks, so the bar reads as a strip rather than a meter.
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  for (const distance of [
    TRACK_MARKS.sixtyFoot,
    TRACK_MARKS.threeThirty,
    TRACK_MARKS.eighthMile,
    TRACK_MARKS.thousandFoot,
  ]) {
    const y = yFor(distance);
    ctx.beginPath();
    ctx.moveTo(box.x + 3, y);
    ctx.lineTo(box.x + box.w - 3, y);
    ctx.stroke();
  }

  const carY = yFor(Math.max(0, state.positionM));
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(box.x - 1, carY - 3, box.w + 2, 6);
  ctx.strokeStyle = '#0a0d12';
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x - 0.5, carY - 3.5, box.w + 1, 7);

  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h - 6);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '8px Verdana, sans-serif';
  ctx.fillStyle = '#0a0d12';
  ctx.fillText(`${Math.max(0, metresToFeet(state.positionM)).toFixed(0)} FT`, 0, 0);
  ctx.restore();
}
