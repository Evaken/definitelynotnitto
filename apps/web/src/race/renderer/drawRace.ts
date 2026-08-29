import { TRACK_MARKS, stagingZoneStart, type Appearance, type PassState } from '@nitto/game-core';
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
import { DEFAULT_PAINT, PLACEHOLDER_CAR, raceArtworkFor, suspensionMotion } from './carSprite.js';
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
export function drawRace(ctx: CanvasRenderingContext2D, state: PassState,appearance?:Appearance): void {
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
  drawPlayerCar(ctx, state,appearance);
  drawStageIndicators(ctx, state);
  drawPrompt(ctx, state);

  // Everything from here is the casting the game sits in, painted over the
  // finished scene rather than the scene being fitted around it. That is what
  // keeps the projection out of it: the cowl can move without the road moving.
  // The side panels are blocks of dashboard the view is a hole in, so they go
  // down before the boards that sit on them.
  drawSidePanels(ctx);

  drawBoardBezel(ctx, BOARD_LEFT);
  drawBoardBezel(ctx, BOARD_RIGHT);
  drawBoards(ctx, state);
  drawStagingBar(ctx, state);

  drawDashCowl(ctx);
  drawCluster(ctx, state, state.prevInput.throttle);
  drawGraphicSettings(ctx);
}

function drawPlayerCar(ctx: CanvasRenderingContext2D, state: PassState,appearance?:Appearance): void {
  const shaken = state.wheelspin || state.wheelsLocked;
  const ride = suspensionMotion(state.positionM, state.speedMs, shaken);

  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();

  const raceArt=raceArtworkFor(state.car.id,appearance);
  const artwork=raceArt?.artwork??PLACEHOLDER_CAR;
  const paint=appearance?{body:`hsl(${appearance.hue} ${appearance.saturation}% ${Math.max(20,Math.min(75,appearance.brightness*.58))}%)`,graphics:`hsl(${appearance.graphicsHue} 80% 55%)`,glass:'#182733'}:DEFAULT_PAINT;
  artwork.drawRear(ctx, {
    laneOffsetM: -LANE_OFFSET_M,
    z: CAR_Z,
    paint,
    bounceM: ride.bounceM-(appearance?.rideHeight??0)/1000,
    // Acceleration squats the tail; the surface works the body on top of that.
    pitch: Math.max(-0.03, Math.min(0.03, -state.accelMs2 * 0.0035)) + ride.pitchWobble,
    braking: state.prevInput.brake,
    wheelspin: shaken,
    ...(appearance&&raceArt&&!raceArt.composited?{filter:`hue-rotate(${appearance.hue-raceArt.baseHue}deg) saturate(${Math.max(.15,appearance.saturation/78)}) brightness(${appearance.brightness/88})`}:{}),
  });
  if(appearance&&!raceArt?.composited)drawRaceCustomization(ctx,appearance,ride.bounceM);

  ctx.restore();
}

function drawRaceCustomization(ctx:CanvasRenderingContext2D,appearance:Appearance,bounceM:number):void{
  const laneOffset=-LANE_OFFSET_M,base=project(laneOffset,CAR_Z),width=2.35*base.scale,height=width*.55,groundY=base.y-bounceM*base.scale,orientation=laneOffset<0?-1:1;
  ctx.save();ctx.translate(base.x,groundY);ctx.fillStyle=`hsl(${appearance.graphicsHue} 88% 58%)`;
  if(appearance.graphicsId==='centre-stripe')ctx.fillRect(-width*.07,-height*.92,width*.14,height*.76);
  if(appearance.graphicsId==='twin-stripe'){ctx.fillRect(-width*.12,-height*.92,width*.07,height*.76);ctx.fillRect(width*.05,-height*.92,width*.07,height*.76);}
  if(appearance.graphicsId==='side-sweep'){ctx.beginPath();ctx.moveTo(-width*.45,-height*.45);ctx.lineTo(width*.4,-height*.56);ctx.lineTo(width*.38,-height*.46);ctx.lineTo(-width*.44,-height*.36);ctx.fill();}
  if(appearance.components.spoiler!=='spoiler-none'){ctx.fillStyle='#26343a';ctx.fillRect(-width*.39,-height*.82,width*.78,height*.055);if(appearance.components.spoiler==='spoiler-gt'){ctx.fillRect(-width*.34,-height*.86,width*.025,height*.12);ctx.fillRect(width*.315,-height*.86,width*.025,height*.12);}}
  if(appearance.components.exhaustTip!=='exhaust-stock'){ctx.strokeStyle=appearance.components.exhaustTip==='exhaust-titanium'?'#7184da':'#d8e3e7';ctx.lineWidth=Math.max(2,width*.025);ctx.beginPath();ctx.arc(width*.29*orientation,-height*.07,width*.045,0,Math.PI*2);ctx.stroke();}
  if(appearance.components.headlights==='lights-smoked'){ctx.fillStyle='#05080a88';ctx.fillRect(-width*.43,-height*.49,width*.86,height*.16);}
  ctx.font=`900 ${Math.max(7,width*.09)}px Impact`;ctx.textAlign='center';ctx.textBaseline='middle';for(const decal of appearance.decals.filter(item=>item.surface==='rear-quarter').slice(0,3)){ctx.fillStyle=`hsl(${decal.colorHue} 90% 62%)`;ctx.fillText(decal.decalId==='decal-star'?'★':decal.decalId==='decal-bolt'?'ϟ':'1320',(decal.x-.5)*width*.7*orientation,-height*(.25+decal.y*.35));}
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

  const stagingPrompt = state.phase === 'approach' || state.phase === 'staged' || state.phase === 'tree';
  if (stagingPrompt) drawDirectionArrow(ctx);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 25px Impact, "Arial Narrow", sans-serif';

  const y = stagingPrompt ? VIEW.y + 274 : VIEW.y + 78;
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(6, 9, 13, 0.85)';
  ctx.strokeText(text, VIEW_CENTER_X, y);

  ctx.fillStyle = state.foul ? COLORS.red : COLORS.green;
  ctx.fillText(text, VIEW_CENTER_X, y);
}

function drawGraphicSettings(ctx: CanvasRenderingContext2D): void {
  const x = 52;
  const y = 343;
  const w = 140;
  const h = 28;
  const face = ctx.createLinearGradient(0, y, 0, y + h);
  face.addColorStop(0, '#5fcbe4');
  face.addColorStop(1, '#087796');
  ctx.fillStyle = face;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#d9f4fb';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  const orb = ctx.createRadialGradient(x + 17, y + 10, 2, x + 18, y + 14, 11);
  orb.addColorStop(0, '#fff4a0');
  orb.addColorStop(0.55, '#e0ae18');
  orb.addColorStop(1, '#473300');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(x + 18, y + h / 2, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('GRAPHIC SETTINGS', x + 34, y + h / 2);
}

function drawDirectionArrow(ctx: CanvasRenderingContext2D): void {
  const x = VIEW_CENTER_X;
  const y = VIEW.y + 210;
  ctx.fillStyle = '#ffd51c';
  ctx.strokeStyle = 'rgba(85, 62, 0, 0.72)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 25);
  ctx.lineTo(x + 24, y);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x + 10, y + 28);
  ctx.lineTo(x - 10, y + 28);
  ctx.lineTo(x - 10, y);
  ctx.lineTo(x - 24, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function promptFor(state: PassState): string | null {
  if (state.positionM > 0 && state.clockStartTick === null) return 'BACK UP';
  switch (state.phase) {
    case 'approach':
      return 'ROLL FORWARD';
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
