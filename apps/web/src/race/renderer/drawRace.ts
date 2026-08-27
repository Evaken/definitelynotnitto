import {
  STAGING,
  TRACK_MARKS,
  displayGear,
  engineRpm,
  metresToFeet,
  msToMph,
  SIM_HZ,
  type PassState,
} from '@nitto/game-core';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CAR_SCREEN_X,
  COLORS,
  HORIZON_Y,
  HUD_HEIGHT,
  PX_PER_M,
  TRACK_BOTTOM,
  TRACK_Y,
  worldToScreen,
} from './layout.js';
import { drawCar } from './car.js';

/**
 * Draws one frame of the race.
 *
 * Pure rendering: it reads simulation state and produces pixels, and never
 * writes back.  Keeping it out of React means the scene can redraw every frame
 * without the component tree being involved (PROJECT_SPEC 6.1).
 */
export function drawRace(ctx: CanvasRenderingContext2D, state: PassState): void {
  const camera = state.positionM;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawSky(ctx);
  drawTrack(ctx, camera);
  drawDistanceMarkers(ctx, camera);
  drawBeams(ctx, camera, state);
  drawFinishLine(ctx, camera);

  drawCar(ctx, {
    noseX: CAR_SCREEN_X,
    wheelAngle: state.wheelOmega * 0.06 + state.positionM * 2,
    // Squat is proportional to acceleration, capped so it stays a suggestion.
    pitch: Math.max(-0.03, Math.min(0.03, state.accelMs2 * 0.0035)),
    drivenAxle: state.car.drivetrain === 'RWD' ? 'rear' : 'front',
    wheelspin: state.wheelspin,
  });

  drawHud(ctx, state);
  drawTree(ctx, state);
  drawDistanceStrip(ctx, state);
}

// ---------------------------------------------------------------------------
// Scenery
// ---------------------------------------------------------------------------

function drawSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, HUD_HEIGHT, 0, HORIZON_Y);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, HORIZON_Y - HUD_HEIGHT);

  // A flat treeline so the horizon reads as distance rather than as a void.
  ctx.fillStyle = COLORS.distant;
  ctx.fillRect(0, HORIZON_Y - 26, CANVAS_WIDTH, 26);
  ctx.fillRect(0, HORIZON_Y, CANVAS_WIDTH, TRACK_Y - HORIZON_Y);
}

function drawTrack(ctx: CanvasRenderingContext2D, camera: number): void {
  const surface = ctx.createLinearGradient(0, TRACK_Y - 4, 0, TRACK_BOTTOM);
  surface.addColorStop(0, COLORS.trackTop);
  surface.addColorStop(1, COLORS.trackBottom);
  ctx.fillStyle = surface;
  ctx.fillRect(0, TRACK_Y - 4, CANVAS_WIDTH, TRACK_BOTTOM - TRACK_Y + 4);

  ctx.strokeStyle = COLORS.laneLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, TRACK_Y - 4.5);
  ctx.lineTo(CANVAS_WIDTH, TRACK_Y - 4.5);
  ctx.stroke();

  // Surface texture every half metre, which is what sells the sense of speed.
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  const spacing = 0.5;
  const first = Math.floor((camera - CAR_SCREEN_X / PX_PER_M) / spacing) * spacing;
  for (let m = first; worldToScreen(m, camera) < CANVAS_WIDTH; m += spacing) {
    const x = worldToScreen(m, camera);
    if (x < 0) continue;
    ctx.beginPath();
    ctx.moveTo(x, TRACK_Y + 6);
    ctx.lineTo(x, TRACK_BOTTOM);
    ctx.stroke();
  }
}

function drawDistanceMarkers(ctx: CanvasRenderingContext2D, camera: number): void {
  const majors: readonly (readonly [number, string])[] = [
    [TRACK_MARKS.sixtyFoot, '60 FT'],
    [TRACK_MARKS.threeThirty, '330'],
    [TRACK_MARKS.eighthMile, '1/8'],
    [TRACK_MARKS.thousandFoot, '1000'],
    [TRACK_MARKS.quarterMile, '1/4'],
  ];

  ctx.font = 'bold 10px "Lucida Console", monospace';
  ctx.textAlign = 'center';

  for (const [distance, label] of majors) {
    const x = worldToScreen(distance, camera);
    if (x < -40 || x > CANVAS_WIDTH + 40) continue;

    ctx.strokeStyle = COLORS.markerMajor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, TRACK_Y - 4);
    ctx.lineTo(x, TRACK_Y - 42);
    ctx.stroke();

    ctx.fillStyle = COLORS.markerMajor;
    ctx.fillText(label, x, TRACK_Y - 48);
  }
}

function drawFinishLine(ctx: CanvasRenderingContext2D, camera: number): void {
  const x = worldToScreen(TRACK_MARKS.quarterMile, camera);
  if (x < -20 || x > CANVAS_WIDTH + 20) return;

  const squares = 8;
  const size = (TRACK_BOTTOM - TRACK_Y + 4) / squares;
  for (let i = 0; i < squares; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#e8eaee' : '#1a1d23';
    ctx.fillRect(x - 6, TRACK_Y - 4 + i * size, 12, size);
  }
}

/**
 * The pre-stage and stage beams, and the point at which the clock starts.
 *
 * Drawn at true spacing so what the player sees matches what the simulator
 * measures: how much tyre is still in the beam is exactly the rollout they get.
 */
function drawBeams(ctx: CanvasRenderingContext2D, camera: number, state: PassState): void {
  const beams: readonly (readonly [number, string, boolean])[] = [
    [-STAGING.beamSpacingM.value, 'PRE', state.lights.prestage],
    [0, 'STAGE', state.lights.stage],
    [STAGING.beamBlockLengthM.value, 'CLOCK', state.clockStartTick !== null],
  ];

  ctx.font = '9px "Lucida Console", monospace';
  ctx.textAlign = 'center';

  for (const [distance, label, lit] of beams) {
    const x = worldToScreen(distance, camera);
    if (x < -30 || x > CANVAS_WIDTH + 30) continue;

    ctx.strokeStyle = lit ? COLORS.accent : COLORS.marker;
    ctx.lineWidth = lit ? 2 : 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, TRACK_Y + 2);
    ctx.lineTo(x, TRACK_Y - 60);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = lit ? COLORS.accent : COLORS.marker;
    ctx.fillText(label, x, TRACK_Y - 66);
  }
}

// ---------------------------------------------------------------------------
// Instruments
// ---------------------------------------------------------------------------

function drawHud(ctx: CanvasRenderingContext2D, state: PassState): void {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.strokeStyle = '#454c59';
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT - 0.5);
  ctx.lineTo(CANVAS_WIDTH, HUD_HEIGHT - 0.5);
  ctx.stroke();

  const elapsed =
    state.clockStartTick === null ? 0 : Math.max(0, (state.tick - state.clockStartTick) / SIM_HZ);

  readout(ctx, 16, 'ET', elapsed.toFixed(3));
  readout(ctx, 118, 'MPH', msToMph(state.speedMs).toFixed(1));
  readout(ctx, 208, 'GEAR', String(displayGear(state)));
  readout(ctx, 278, 'FEET', Math.max(0, metresToFeet(state.positionM)).toFixed(0));

  drawTacho(ctx, 386, 12, 400, 30, state);
}

function readout(ctx: CanvasRenderingContext2D, x: number, label: string, value: string): void {
  ctx.textAlign = 'left';
  ctx.font = '9px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(label, x, 17);

  ctx.font = 'bold 20px "Lucida Console", monospace';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(value, x, 40);
}

/** Horizontal rev counter, with the last slice before redline marked out. */
function drawTacho(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  state: PassState,
): void {
  const { redlineRpm } = state.car.engine;
  const rpm = engineRpm(state);
  const fraction = Math.max(0, Math.min(1, rpm / redlineRpm));
  const redlineStart = 0.88;

  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = 'rgba(229, 70, 47, 0.22)';
  ctx.fillRect(x + width * redlineStart, y, width * (1 - redlineStart), height);

  ctx.fillStyle = state.limiterActive
    ? COLORS.red
    : fraction > redlineStart
      ? COLORS.amber
      : COLORS.green;
  ctx.fillRect(x + 2, y + 2, (width - 4) * fraction, height - 4);

  ctx.strokeStyle = '#454c59';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

  ctx.textAlign = 'right';
  ctx.font = 'bold 12px "Lucida Console", monospace';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`${rpm.toFixed(0)} RPM`, x + width + 140, y + 21);

  ctx.textAlign = 'left';
  ctx.font = '9px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('TACHO', x, y - 1);
}

/**
 * The Christmas tree.
 *
 * Fixed to the left of the canvas rather than standing at the start line in
 * world space, so it stays readable once the car has left it behind.
 */
function drawTree(ctx: CanvasRenderingContext2D, state: PassState): void {
  const x = 40;
  const top = HUD_HEIGHT + 18;
  const spacing = 21;
  const radius = 8;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.72)';
  ctx.fillRect(x - 22, top - 14, 44, spacing * 6 + 26);
  ctx.strokeStyle = '#454c59';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 21.5, top - 13.5, 43, spacing * 6 + 25);

  const { lights } = state;
  const bulbs: readonly (readonly [boolean, string])[] = [
    [lights.prestage, COLORS.amber],
    [lights.stage, COLORS.amber],
    [lights.ambers[0]!, COLORS.amber],
    [lights.ambers[1]!, COLORS.amber],
    [lights.ambers[2]!, COLORS.amber],
    [lights.green, COLORS.green],
    [lights.red, COLORS.red],
  ];

  bulbs.forEach(([lit, color], index) => {
    // The two staging bulbs are small, as they are on a real tree.
    const small = index < 2;
    const cy = top + index * spacing - (small ? 6 : 0);
    const r = small ? radius * 0.55 : radius;

    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = lit ? color : COLORS.bulbOff;
    ctx.fill();

    if (lit) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = '#12151b';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

/** Split times along the bottom, filling in as the car passes each mark. */
function drawDistanceStrip(ctx: CanvasRenderingContext2D, state: PassState): void {
  const y = TRACK_BOTTOM + 8;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, y, CANVAS_WIDTH, CANVAS_HEIGHT - y);

  const columns: readonly (readonly [string, number | undefined])[] = [
    ['60 FT', state.splits.sixtyFoot],
    ['330', state.splits.threeThirty],
    ['1/8 ET', state.splits.eighthMile],
    ['1000', state.splits.thousandFoot],
    ['1/4 ET', state.splits.quarterMile],
  ];

  const columnWidth = CANVAS_WIDTH / columns.length;
  ctx.textAlign = 'center';

  columns.forEach(([label, value], index) => {
    const cx = columnWidth * (index + 0.5);

    ctx.font = '9px Verdana, sans-serif';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(label, cx, y + 16);

    ctx.font = 'bold 15px "Lucida Console", monospace';
    ctx.fillStyle = value === undefined ? '#3a404b' : COLORS.accent;
    ctx.fillText(value === undefined ? '--.---' : value.toFixed(3), cx, y + 38);

    if (index > 0) {
      ctx.strokeStyle = '#2c313b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(columnWidth * index, y + 4);
      ctx.lineTo(columnWidth * index, CANVAS_HEIGHT - 4);
      ctx.stroke();
    }
  });
}
