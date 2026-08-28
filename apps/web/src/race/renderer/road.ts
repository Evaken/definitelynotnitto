import {
  CAR_Z,
  COLORS,
  FAR_PLANE_M,
  HORIZON_Y,
  LANE_OFFSET_M,
  VIEW,
  VIEW_BOTTOM,
  VIEW_CENTER_X,
  VIEW_RIGHT,
} from './layout.js';
import { Z_NEAR, isVisible, project, roadHalfWidth } from './projection.js';

/**
 * The strip, drawn away from the camera.
 *
 * Built from bands rather than one trapezoid. A flat trapezoid is the correct
 * shape for a straight road, but it gives the eye nothing to measure speed
 * against -- and conveying speed is the only reason this view exists. Banding it
 * lets the surface, the rumble strips and the centreline all cycle past at the
 * right rate, because every band takes its position from the same 1/z
 * projection as everything else in the scene.
 */

/** Length of one surface band, metres. */
const BAND_M = 3;
const POST_SPACING_M = 24;

let sceneryImage: HTMLImageElement | null = null;

function loadedSceneryImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (sceneryImage === null) {
    sceneryImage = new Image();
    sceneryImage.decoding = 'async';
    sceneryImage.src = `${import.meta.env.BASE_URL}assets/race-scenery-v2.webp`;
  }
  return sceneryImage.complete && sceneryImage.naturalWidth > 0 ? sceneryImage : null;
}

/**
 * Stable pseudo-random value for an object index.
 *
 * Deterministic and stateless, so the tree standing at 300 metres is the same
 * height every run without anything having to be stored.
 */
function hash(index: number): number {
  let x = Math.imul(index ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export function drawSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, VIEW.y, 0, HORIZON_Y);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(VIEW.x, VIEW.y, VIEW.w, HORIZON_Y - VIEW.y);

  // A ridge on the horizon so the distance does not read as a void.
  ctx.fillStyle = COLORS.hills;
  ctx.beginPath();
  ctx.moveTo(VIEW.x, HORIZON_Y);
  for (let x = VIEW.x; x <= VIEW_RIGHT; x += 26) {
    ctx.lineTo(x, HORIZON_Y - (6 + hash(Math.round(x)) * 14));
  }
  ctx.lineTo(VIEW_RIGHT, HORIZON_Y);
  ctx.closePath();
  ctx.fill();
}

/**
 * The road surface, its shoulders and its markings.
 *
 * `cameraM` is where the camera sits on the strip, not where the car is -- the
 * camera trails the car by `CAR_Z`. Everything on the ground has a fixed world
 * position and is drawn relative to the camera, so the scene moves at exactly
 * the rate the simulation says the car is moving.
 */
export function drawRoad(ctx: CanvasRenderingContext2D, cameraM: number): void {
  const ground = ctx.createLinearGradient(0, HORIZON_Y, 0, VIEW_BOTTOM);
  ground.addColorStop(0, COLORS.grassFar);
  ground.addColorStop(1, COLORS.grassNear);
  ctx.fillStyle = ground;
  ctx.fillRect(VIEW.x, HORIZON_Y, VIEW.w, VIEW_BOTTOM - HORIZON_Y);

  smoothRoad(ctx);

  // Stepped from the far plane inwards so nearer bands paint over further ones
  // and the edges stay clean.
  const phase = ((cameraM % BAND_M) + BAND_M) % BAND_M;
  const bandCount = Math.ceil((FAR_PLANE_M - Z_NEAR) / BAND_M);

  for (let i = bandCount; i >= 0; i--) {
    const zFar = Z_NEAR + i * BAND_M - phase + BAND_M;
    const zNear = Math.max(zFar - BAND_M, Z_NEAR);
    if (!isVisible(zFar) || zFar <= zNear) continue;

    const yNear = project(0, zNear).y;
    const yFar = project(0, zFar).y;
    const halfNear = roadHalfWidth(zNear);
    const halfFar = roadHalfWidth(zFar);

    // Indexed in world space, so the stripes do not crawl along the surface.
    const alternate = Math.floor((cameraM + zNear) / BAND_M) % 2 === 0;

    const rumbleColor = alternate ? COLORS.rumbleLight : COLORS.rumbleDark;
    edgeBand(ctx, yNear, yFar, halfNear, halfFar, -1, rumbleColor);
    edgeBand(ctx, yNear, yFar, halfNear, halfFar, 1, rumbleColor);

    // Centreline between the lanes, dashed by taking every other band.
    if (alternate) {
      const w = Math.max(0.6, halfNear * 0.016);
      const wFar = Math.max(0.4, halfFar * 0.016);
      ctx.fillStyle = COLORS.laneLine;
      ctx.beginPath();
      ctx.moveTo(VIEW_CENTER_X - w, yNear);
      ctx.lineTo(VIEW_CENTER_X + w, yNear);
      ctx.lineTo(VIEW_CENTER_X + wFar, yFar);
      ctx.lineTo(VIEW_CENTER_X - wFar, yFar);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawSceneryPlate(ctx);
}

function smoothRoad(ctx: CanvasRenderingContext2D): void {
  const near = project(0, Z_NEAR);
  const far = project(0, FAR_PLANE_M);
  const halfNear = roadHalfWidth(Z_NEAR);
  const halfFar = roadHalfWidth(FAR_PLANE_M);
  const asphalt = ctx.createLinearGradient(0, far.y, 0, near.y);
  asphalt.addColorStop(0, COLORS.roadFar);
  asphalt.addColorStop(0.65, '#454550');
  asphalt.addColorStop(1, COLORS.roadNear);
  ctx.fillStyle = asphalt;
  ctx.beginPath();
  ctx.moveTo(VIEW_CENTER_X - halfNear, near.y);
  ctx.lineTo(VIEW_CENTER_X + halfNear, near.y);
  ctx.lineTo(VIEW_CENTER_X + halfFar, far.y);
  ctx.lineTo(VIEW_CENTER_X - halfFar, far.y);
  ctx.closePath();
  ctx.fill();
}

function drawSceneryPlate(ctx: CanvasRenderingContext2D): void {
  const image = loadedSceneryImage();
  if (image === null) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();
  ctx.drawImage(image, VIEW.x - 20, VIEW.y + 16, VIEW.w + 40, 250);
  ctx.restore();
}

function edgeBand(
  ctx: CanvasRenderingContext2D,
  yNear: number,
  yFar: number,
  halfNear: number,
  halfFar: number,
  side: -1 | 1,
  color: string,
): void {
  const widthNear = Math.max(1, halfNear * 0.09);
  const widthFar = Math.max(0.5, halfFar * 0.09);
  const outerNear = VIEW_CENTER_X + side * halfNear;
  const outerFar = VIEW_CENTER_X + side * halfFar;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(outerNear, yNear);
  ctx.lineTo(outerNear - side * widthNear, yNear);
  ctx.lineTo(outerFar - side * widthFar, yFar);
  ctx.lineTo(outerFar, yFar);
  ctx.closePath();
  ctx.fill();
}

/**
 * Roadside furniture: trees along both verges, light posts on the left.
 *
 * Drawn far to near so nearer objects overlap further ones. Everything sits at
 * an absolute world distance and shrinks with the same 1/z as the road, which
 * is what stops the scenery sliding relative to the surface.
 */
export function drawRoadside(ctx: CanvasRenderingContext2D, cameraM: number): void {
  interface Item {
    readonly z: number;
    readonly xM: number;
    readonly kind: 'post';
  }

  const items: Item[] = [];

  const firstPost = Math.floor(cameraM / POST_SPACING_M);
  for (let i = firstPost; i * POST_SPACING_M - cameraM < FAR_PLANE_M; i++) {
    const z = i * POST_SPACING_M - cameraM;
    if (!isVisible(z)) continue;
    items.push({ z, xM: -5.4, kind: 'post' });
  }

  items.sort((a, b) => b.z - a.z);

  ctx.save();
  ctx.beginPath();
  ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  ctx.clip();
  for (const item of items) {
    post(ctx, item.xM, item.z);
  }
  ctx.restore();
}

function post(ctx: CanvasRenderingContext2D, xM: number, z: number): void {
  const base = project(xM, z);
  if (base.x < VIEW.x - 70 || base.x > VIEW_RIGHT + 70) return;

  const h = 7 * base.scale;
  if (h < 2) return;

  ctx.strokeStyle = '#4a5361';
  ctx.lineWidth = Math.max(1, 0.12 * base.scale);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(base.x, base.y - h);
  const arm = 1.6 * base.scale;
  ctx.lineTo(base.x + arm, base.y - h * 0.97);
  ctx.stroke();

  const lamp = Math.max(1, 0.9 * base.scale);
  ctx.fillStyle = '#ffe4a8';
  ctx.fillRect(base.x + arm - lamp / 2, base.y - h * 0.99, lamp, Math.max(1, lamp * 0.35));
}

/** Screen x of a lane centreline at a given distance. */
export function laneCenterX(lane: 'left' | 'right', z = CAR_Z): number {
  return project(lane === 'left' ? -LANE_OFFSET_M : LANE_OFFSET_M, z).x;
}
