import {
  engineRpm,
  gearLabel,
  msToMph,
  shouldShiftUp,
  type PassState,
} from '@nitto/game-core';
import { CLUSTER, COLORS } from './layout.js';

/**
 * The instrument cluster along the bottom of the screen.
 *
 * Follows `docs/reference/race-view-two-civics.webp`: boost, tachometer and
 * speedometer left to right, the gas and clutch sliders beside them, and a gear
 * column reading 6 down to R at the right-hand edge.
 *
 * The boost gauge stays on a naturally aspirated car with its needle at rest
 * rather than disappearing -- that is what the original did, and it means the
 * cluster never reflows when a turbo is fitted in Stage 3.
 */

/** Where the gas slider is drawn. Exported so the drag surface can sit on it. */
export const GAS_SLIDER = { x: 694, y: 430, w: 34, h: 140 } as const;
/** The clutch bar. A readout here, not a control -- see below. */
export const CLUTCH_SLIDER = { x: 748, y: 430, w: 34, h: 140 } as const;

export const DIALS = {
  boost: { cx: 232, cy: 496, r: 62 },
  rpm: { cx: 424, cy: 496, r: 80 },
  mph: { cx: 616, cy: 496, r: 62 },
} as const;

const GEAR_COLUMN = { x: 872, y: 392, w: 44, rowHeight: 25 } as const;

/**
 * The shift light, in the gap between the tachometer and the speedometer.
 *
 * Deliberately bigger than the SLIP and LIMIT tell-tales: those report what the
 * car is doing, this one is asking for an input, and it has to be readable
 * without looking away from the strip.
 */
export const SHIFT_LIGHT = { cx: 528, cy: 428, r: 15 } as const;

/** Sweep of every dial: south-west round to south-east. */
const START_ANGLE = Math.PI * 0.75;
const SWEEP = Math.PI * 1.5;

export function drawCluster(ctx: CanvasRenderingContext2D, state: PassState, throttle: number): void {
  // The dashboard casting itself is drawn by chrome.ts before this runs.
  // Everything here goes on top of it.
  drawBoost(ctx);
  drawTacho(ctx, state);
  drawSpeedo(ctx, state);

  drawSlider(ctx, GAS_SLIDER, throttle, 'GAS', COLORS.green);
  drawSlider(ctx, CLUTCH_SLIDER, state.clutchEngagement, 'CLUTCH', COLORS.amber, true);

  drawGearColumn(ctx, state);
  drawLamps(ctx, state);
  drawShiftLight(ctx, state);
}

const CANVAS_RIGHT = CLUSTER.x + CLUSTER.w;

// ---------------------------------------------------------------------------
// Dials
// ---------------------------------------------------------------------------

function drawBoost(ctx: CanvasRenderingContext2D): void {
  const { cx, cy, r } = DIALS.boost;
  // Nothing produces boost until forced induction arrives in Stage 3, so the
  // needle sits at rest. The gauge stays regardless, as the original's did.
  dial(ctx, cx, cy, r, 0, 35, 0, 'BOOST', 'PSI', 5, null);
}

function drawTacho(ctx: CanvasRenderingContext2D, state: PassState): void {
  const { cx, cy, r } = DIALS.rpm;
  const rpm = engineRpm(state);
  // Scaled in thousands, and the red zone comes from the car rather than being
  // painted on, so a different engine marks its own limit.
  dial(
    ctx,
    cx,
    cy,
    r,
    0,
    10,
    rpm / 1000,
    'RPM',
    'x1000',
    1,
    state.car.engine.redlineRpm / 1000,
  );
}

function drawSpeedo(ctx: CanvasRenderingContext2D, state: PassState): void {
  const { cx, cy, r } = DIALS.mph;
  dial(ctx, cx, cy, r, 0, 160, Math.abs(msToMph(state.speedMs)), 'MPH', '', 20, null);
}

function dial(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  min: number,
  max: number,
  value: number,
  label: string,
  unit: string,
  step: number,
  redlineFrom: number | null,
): void {
  const face = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
  face.addColorStop(0, '#20262f');
  face.addColorStop(1, COLORS.dialFace);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.dialRim;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const angleFor = (v: number) => START_ANGLE + ((v - min) / (max - min)) * SWEEP;

  if (redlineFrom !== null) {
    ctx.strokeStyle = 'rgba(229, 70, 47, 0.75)';
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.84, angleFor(redlineFrom), angleFor(max));
    ctx.stroke();
  }

  ctx.strokeStyle = COLORS.text;
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(r * 0.17)}px "Lucida Console", monospace`;

  for (let v = min; v <= max; v += step) {
    const a = angleFor(v);
    const major = (v - min) % (step * 2) === 0;
    ctx.lineWidth = major ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
    ctx.lineTo(cx + Math.cos(a) * r * (major ? 0.76 : 0.82), cy + Math.sin(a) * r * (major ? 0.76 : 0.82));
    ctx.stroke();

    if (major) {
      ctx.fillText(String(v), cx + Math.cos(a) * r * 0.63, cy + Math.sin(a) * r * 0.63);
    }
  }

  ctx.font = `bold ${Math.round(r * 0.16)}px Verdana, sans-serif`;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(label, cx, cy + r * 0.44);
  if (unit) {
    ctx.font = `${Math.round(r * 0.12)}px Verdana, sans-serif`;
    ctx.fillText(unit, cx, cy + r * 0.6);
  }

  // Needle, clamped so an over-revving engine pins rather than sweeping past
  // the stop and round the back of the dial.
  const clamped = Math.max(min, Math.min(max, value));
  const a = angleFor(clamped);
  ctx.strokeStyle = COLORS.needle;
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(a) * r * 0.14, cy - Math.sin(a) * r * 0.14);
  ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.fillStyle = COLORS.dialRim;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Sliders and gears
// ---------------------------------------------------------------------------

interface SliderBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * A vertical bar. The gas pedal is a control; the clutch is a readout.
 *
 * The original had a `CLUTCH FEATHER` slider the driver worked. This project
 * deliberately leaves the clutch out and lets it follow the throttle instead,
 * so the bar shows what the clutch is actually doing rather than accepting
 * input. Marked `AUTO` so it does not look like something that can be dragged.
 */
function drawSlider(
  ctx: CanvasRenderingContext2D,
  box: SliderBox,
  value: number,
  label: string,
  fill: string,
  readOnly = false,
): void {
  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(box.x, box.y, box.w, box.h);

  const filled = Math.max(0, Math.min(1, value)) * box.h;
  const grad = ctx.createLinearGradient(0, box.y + box.h - filled, 0, box.y + box.h);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, shadeHex(fill, 0.5));
  ctx.fillStyle = grad;
  ctx.fillRect(box.x + 2, box.y + box.h - filled, box.w - 4, filled);

  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

  for (let i = 1; i < 4; i++) {
    const y = box.y + (box.h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(box.x, y);
    ctx.lineTo(box.x + 5, y);
    ctx.stroke();
  }

  if (!readOnly) {
    const handleY = box.y + box.h - filled;
    ctx.fillStyle = '#e8eaee';
    ctx.fillRect(box.x - 3, handleY - 3, box.w + 6, 6);
  }

  // Above the bar, horizontal. Rotated underneath, these ran off the bottom of
  // the canvas and lost half their text.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 9px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(label, box.x + box.w / 2, box.y - 14);

  ctx.font = '8px Verdana, sans-serif';
  ctx.fillStyle = readOnly ? COLORS.textDim : COLORS.accent;
  ctx.fillText(
    readOnly ? 'AUTO' : `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`,
    box.x + box.w / 2,
    box.y - 4,
  );
}

/**
 * The gear column.
 *
 * Six forward gears are always drawn so the cluster keeps its shape across
 * cars, with any the current car does not have dimmed out.
 */
function drawGearColumn(ctx: CanvasRenderingContext2D, state: PassState): void {
  const gears = [6, 5, 4, 3, 2, 1, 0, -1];
  const available = state.car.gearbox.gearRatios.length;
  const shifting = state.shiftTicksRemaining > 0;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  gears.forEach((gear, index) => {
    const y = GEAR_COLUMN.y + index * GEAR_COLUMN.rowHeight;
    const selected = gear === state.gear && !shifting;
    const usable = gear <= available;

    ctx.fillStyle = selected ? COLORS.red : '#161a20';
    ctx.fillRect(GEAR_COLUMN.x, y, GEAR_COLUMN.w, GEAR_COLUMN.rowHeight - 3);

    ctx.strokeStyle = selected ? COLORS.red : '#2c313b';
    ctx.lineWidth = 1;
    ctx.strokeRect(GEAR_COLUMN.x + 0.5, y + 0.5, GEAR_COLUMN.w - 1, GEAR_COLUMN.rowHeight - 4);

    ctx.font = 'bold 15px "Lucida Console", monospace';
    ctx.fillStyle = selected ? '#ffffff' : usable ? COLORS.text : '#3a404b';
    ctx.fillText(
      gearLabel(gear),
      GEAR_COLUMN.x + GEAR_COLUMN.w / 2,
      y + (GEAR_COLUMN.rowHeight - 3) / 2,
    );
  });
}

/**
 * Two tell-tales stacked beside the sliders. Amber for the limiter rather than
 * green, so it does not read as a second shift light -- it means the opposite.
 */
function drawLamps(ctx: CanvasRenderingContext2D, state: PassState): void {
  lamp(ctx, 816, 476, COLORS.red, state.wheelspin || state.wheelsLocked, 'SLIP');
  lamp(ctx, 816, 536, COLORS.amber, state.limiterActive, 'LIMIT');
}

/**
 * Green when the next gear would pull harder than the one selected.
 *
 * Where that point falls is computed from the torque curve and the two ratios
 * either side of the change, not hardcoded -- see sim/shift.ts. On the stock
 * Civic it works out at the limiter, because the gearbox's ratios are close
 * enough that the revs barely fall on a change -- a wider gearset or a curve that
 * collapses after peak will move it, and the light moves with it.
 *
 * It comes on shortly before the crossover so a driver who reacts to it is not
 * already past. LIMIT beside it still means what it always did: too late.
 */
function drawShiftLight(ctx: CanvasRenderingContext2D, state: PassState): void {
  const { cx, cy, r } = SHIFT_LIGHT;
  const lit = shouldShiftUp(state.car, state.tune, state.gear, engineRpm(state));
  lamp(ctx, cx, cy, COLORS.green, lit, 'SHIFT', r);
}

function lamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  lit: boolean,
  label: string,
  radius = 11,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = lit ? color : COLORS.bulbOff;
  ctx.fill();
  if (lit) {
    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 1.3;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = '#12151b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '8px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + radius + 9);
}

function shadeHex(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * factor);
  const g = Math.round(((n >> 8) & 0xff) * factor);
  const b = Math.round((n & 0xff) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}
