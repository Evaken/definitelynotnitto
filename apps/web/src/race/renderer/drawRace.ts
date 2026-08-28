import { TRACK_MARKS, stagingZoneStart, type PassState } from '@nitto/game-core';
import {
  BOARD_LEFT,
  BOARD_RIGHT,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CAR_Z,
  COLORS,
  LANE_OFFSET_M,
  VIEW,
  VIEW_CENTER_X,
} from './layout.js';
import { cameraPosition, isVisible, project, roadHalfWidth } from './projection.js';
import { drawRoad, drawRoadside, drawSky } from './road.js';
import { DEFAULT_PAINT, PLACEHOLDER_CAR, suspensionMotion } from './carSprite.js';
import { drawChristmasTree, drawStageIndicators } from './christmasTree.js';
import { drawCluster } from './cluster.js';
import { drawBoards, drawStagingBar } from './boards.js';
import { drawBoardBezel, drawDashCowl, drawSidePanels } from './chrome.js';

/**
 * Draws one frame of the race.
 *
 * A chase camera from behind the car looking down the strip, matching
 * `docs/reference/race-view-two-civics.webp`. Stage 1 built this side-on
 * because the specification said so twice; it was wrong.
 *
 * Pure rendering: reads simulation state and produces pixels, never writes back.
 * Keeping it out of React means the scene redraws every frame without the
 * component tree being involved (PROJECT_SPEC 6.1) -- and keeping the whole view
 * behind this one function is what made swapping the camera affordable at all.
 */
export function drawRace(ctx: CanvasRenderingContext2D, state: PassState): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.frame;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Measured from the camera, which trails the car. Handing these functions the
  // car's position instead would draw the whole world CAR_Z metres too close.
  const cameraM = cameraPosition(state.positionM);

  drawSky(ctx);
  drawRoad(ctx, cameraM);
  drawRoadside(ctx, cameraM);
  drawStagingLines(ctx, cameraM);
  drawDistanceMarks(ctx, cameraM);
  drawChristmasTree(ctx, state, cameraM);
  drawPlayerCar(ctx, state);
  drawStageIndicators(ctx, state);
  drawPrompt(ctx, state);

  // Everything from here is the casting the game sits in, painted over the
  // finished scene rather than the scene being fitted around it. That is what
  // keeps the projection out of it: the cowl can move without the road moving.
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(VIEW.x + 0.5, VIEW.y + 0.5, VIEW.w - 1, VIEW.h - 1);

  // The side panels are blocks of dashboard the view is a hole in, so they go
  // down before the boards that sit on them.
  drawSidePanels(ctx);

  drawBoardBezel(ctx, BOARD_LEFT);
  drawBoardBezel(ctx, BOARD_RIGHT);
  drawBoards(ctx, state);
  drawStagingBar(ctx, state);

  drawDashCowl(ctx);
  drawCluster(ctx, state, state.prevInput.throttle);
}

function drawPlayerCar(ctx: CanvasRenderingContext2D, state: PassState): void {
  const shaken = state.wheelspin || state.wheelsLocked;
  const ride = suspensionMotion(state.positionM, state.speedMs, shaken);

  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();

  PLACEHOLDER_CAR.drawRear(ctx, {
    laneOffsetM: -LANE_OFFSET_M,
    z: CAR_Z,
    paint: DEFAULT_PAINT,
    bounceM: ride.bounceM,
    // Acceleration squats the tail; the surface works the body on top of that.
    pitch: Math.max(-0.03, Math.min(0.03, -state.accelMs2 * 0.0035)) + ride.pitchWobble,
    braking: state.prevInput.brake,
    wheelspin: shaken,
  });

  ctx.restore();
}

/**
 * The pre-stage and stage lines, painted across the road.
 *
 * Lines rather than the shaded band the side-on view used: from behind, a band
 * is foreshortened into almost nothing, so the two edges have to carry it.
 */
function drawStagingLines(ctx: CanvasRenderingContext2D, cameraM: number): void {
  const zoneStart = stagingZoneStart() - cameraM;
  const stageLine = -cameraM;

  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();

  surfaceBand(ctx, zoneStart, stageLine, 'rgba(232, 163, 23, 0.28)');
  surfaceLine(ctx, zoneStart, COLORS.accent, 0.14);
  surfaceLine(ctx, stageLine, COLORS.laneLine, 0.22);

  ctx.restore();
}

/** The distance marks, painted across the surface where they actually are. */
function drawDistanceMarks(ctx: CanvasRenderingContext2D, cameraM: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();

  const marks: readonly (readonly [number, string])[] = [
    [TRACK_MARKS.sixtyFoot, '60'],
    [TRACK_MARKS.threeThirty, '330'],
    [TRACK_MARKS.eighthMile, '1/8'],
    [TRACK_MARKS.thousandFoot, '1000'],
  ];

  for (const [distance, label] of marks) {
    const z = distance - cameraM;
    if (!isVisible(z) || z > 160) continue;
    surfaceLine(ctx, z, 'rgba(232, 234, 238, 0.7)', 0.1);
    markerPost(ctx, z, label);
  }

  // The finish line gets a chequered band.
  const finishZ = TRACK_MARKS.quarterMile - cameraM;
  if (isVisible(finishZ) && finishZ < 200) chequered(ctx, finishZ);

  ctx.restore();
}

/** A stripe painted across the road at a given distance. */
function surfaceLine(
  ctx: CanvasRenderingContext2D,
  z: number,
  color: string,
  thicknessM: number,
): void {
  if (!isVisible(z)) return;
  const near = project(0, z);
  const far = project(0, z + thicknessM);
  const halfNear = roadHalfWidth(z);
  const halfFar = roadHalfWidth(z + thicknessM);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(VIEW_CENTER_X - halfNear, near.y);
  ctx.lineTo(VIEW_CENTER_X + halfNear, near.y);
  ctx.lineTo(VIEW_CENTER_X + halfFar, far.y);
  ctx.lineTo(VIEW_CENTER_X - halfFar, far.y);
  ctx.closePath();
  ctx.fill();
}

function surfaceBand(
  ctx: CanvasRenderingContext2D,
  zNear: number,
  zFar: number,
  color: string,
): void {
  if (!isVisible(zFar)) return;
  const a = project(0, Math.max(zNear, 0.4));
  const b = project(0, zFar);
  const halfA = roadHalfWidth(Math.max(zNear, 0.4));
  const halfB = roadHalfWidth(zFar);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(VIEW_CENTER_X - halfA, a.y);
  ctx.lineTo(VIEW_CENTER_X + halfA, a.y);
  ctx.lineTo(VIEW_CENTER_X + halfB, b.y);
  ctx.lineTo(VIEW_CENTER_X - halfB, b.y);
  ctx.closePath();
  ctx.fill();
}

function markerPost(ctx: CanvasRenderingContext2D, z: number, label: string): void {
  const edge = project(-4.6, z);
  const height = 1.8 * edge.scale;
  if (height < 6) return;

  ctx.fillStyle = 'rgba(10, 13, 18, 0.8)';
  const w = Math.max(10, 1.4 * edge.scale);
  const h = Math.max(8, 0.9 * edge.scale);
  ctx.fillRect(edge.x - w / 2, edge.y - height - h, w, h);

  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(7, Math.round(h * 0.62))}px "Lucida Console", monospace`;
  ctx.fillText(label, edge.x, edge.y - height - h / 2);
}

function chequered(ctx: CanvasRenderingContext2D, z: number): void {
  const near = project(0, z);
  const far = project(0, z + 1.2);
  const halfNear = roadHalfWidth(z);
  const halfFar = roadHalfWidth(z + 1.2);
  const squares = 12;

  for (let i = 0; i < squares; i++) {
    const t0 = i / squares;
    const t1 = (i + 1) / squares;
    ctx.fillStyle = i % 2 === 0 ? '#e8eaee' : '#1a1d23';
    ctx.beginPath();
    ctx.moveTo(VIEW_CENTER_X + (t0 * 2 - 1) * halfNear, near.y);
    ctx.lineTo(VIEW_CENTER_X + (t1 * 2 - 1) * halfNear, near.y);
    ctx.lineTo(VIEW_CENTER_X + (t1 * 2 - 1) * halfFar, far.y);
    ctx.lineTo(VIEW_CENTER_X + (t0 * 2 - 1) * halfFar, far.y);
    ctx.closePath();
    ctx.fill();
  }
}

/** The state of the run, called out under the tree as the original did. */
function drawPrompt(ctx: CanvasRenderingContext2D, state: PassState): void {
  const text = promptFor(state);
  if (!text) return;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 19px Verdana, sans-serif';

  const y = VIEW.y + VIEW.h - 30;
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(6, 9, 13, 0.85)';
  ctx.strokeText(text, VIEW_CENTER_X, y);

  ctx.fillStyle = state.foul ? COLORS.red : COLORS.green;
  ctx.fillText(text, VIEW_CENTER_X, y);
}

function promptFor(state: PassState): string | null {
  if (state.positionM > 0 && state.clockStartTick === null) return 'BACK UP';
  switch (state.phase) {
    case 'approach':
      return 'ROLL UP';
    case 'staged':
      return 'STAGING';
    case 'tree':
      return 'STAGED';
    case 'running':
      return state.foul ? 'RED LIGHT' : null;
    case 'shutdown':
      return 'SHUT DOWN';
    case 'finished':
      return null;
  }
}
