import type { TimingSlip } from '@nitto/game-core';

/**
 * Draws a timing slip to an image, for copying to the clipboard.
 *
 * Painted onto a canvas rather than screenshotted from the DOM: no dependency,
 * no fonts to wait on, and full control of the result at whatever resolution
 * looks right when pasted somewhere else.
 */

const WIDTH = 380;
const HEIGHT = 470;
/** Drawn at twice the size so it stays sharp when pasted. */
const SCALE = 2;

const PAPER = '#f4f1e8';
const INK = '#1a1a1a';
const FADED = '#6b6656';
const RULE = '#9a9482';
const FOUL = '#c0392b';

const MONO = '"Lucida Console", "Courier New", monospace';

interface Row {
  readonly label: string;
  readonly value: string;
  readonly emphasis?: boolean;
}

function rowsFor(slip: TimingSlip): readonly Row[] {
  return [
    { label: 'R/T', value: slip.reactionTime.toFixed(3) },
    { label: '60 ft', value: slip.sixtyFoot.toFixed(3) },
    { label: '330 ft', value: slip.threeThirty.toFixed(3) },
    { label: '1/8 ET', value: slip.eighthMileEt.toFixed(3) },
    { label: '1/8 MPH', value: slip.eighthMileMph.toFixed(2) },
    { label: '1000 ft', value: slip.thousandFoot.toFixed(3) },
    { label: '1/4 ET', value: slip.quarterMileEt.toFixed(3), emphasis: true },
    { label: '1/4 MPH', value: slip.quarterMileMph.toFixed(2), emphasis: true },
  ];
}

export function drawSlipImage(
  ctx: CanvasRenderingContext2D,
  slip: TimingSlip,
  carName: string,
  buildLabel: string,
): void {
  ctx.save();
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, WIDTH - 1, HEIGHT - 1);

  const left = 28;
  const right = WIDTH - 28;

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `bold 18px ${MONO}`;
  ctx.fillText('NITTO 1320 CHALLENGE', WIDTH / 2, 46);

  ctx.font = `13px ${MONO}`;
  ctx.fillStyle = FADED;
  ctx.fillText('TIME SLIP', WIDTH / 2, 68);
  ctx.fillText(`${carName} — Quarter Mile`, WIDTH / 2, 90);

  dashedRule(ctx, left, right, 106);

  let y = 140;
  for (const row of rowsFor(slip)) {
    if (row.emphasis) {
      y += 6;
      solidRule(ctx, left, right, y - 22);
    }

    ctx.font = row.emphasis ? `bold 20px ${MONO}` : `15px ${MONO}`;
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.fillText(row.label, left, y);
    ctx.textAlign = 'right';
    ctx.fillText(row.value, right, y);

    y += row.emphasis ? 36 : 30;
  }

  if (slip.foul) {
    ctx.fillStyle = FOUL;
    ctx.fillRect(left, y - 4, right - left, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 15px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('RED LIGHT — FOUL', WIDTH / 2, y + 16);
    y += 42;
  }

  dashedRule(ctx, left, right, HEIGHT - 44);
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = FADED;
  ctx.textAlign = 'center';
  ctx.fillText(buildLabel, WIDTH / 2, HEIGHT - 22);

  ctx.restore();
}

function dashedRule(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number): void {
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
}

function solidRule(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number): void {
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
}

/** Renders the slip and hands back a PNG. */
export function renderSlipToBlob(
  slip: TimingSlip,
  carName: string,
  buildLabel: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE;
  canvas.height = HEIGHT * SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Could not get a 2D context'));

  drawSlipImage(ctx, slip, carName, buildLabel);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode the slip'));
    }, 'image/png');
  });
}

/**
 * Puts the slip on the clipboard as an image.
 *
 * The blob is handed to `ClipboardItem` as a promise rather than being awaited
 * first: Safari drops the user-gesture permission across an await, and refuses
 * the write.  Passing the promise keeps the call synchronous from its point of
 * view.
 */
export async function copySlipToClipboard(
  slip: TimingSlip,
  carName: string,
  buildLabel: string,
): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('This browser cannot copy images to the clipboard');
  }

  const item = new ClipboardItem({ 'image/png': renderSlipToBlob(slip, carName, buildLabel) });
  await navigator.clipboard.write([item]);
}
