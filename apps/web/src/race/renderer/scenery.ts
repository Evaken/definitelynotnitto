import { CANVAS_WIDTH, CAR_SCREEN_X, HORIZON_Y, PX_PER_M, TRACK_Y } from './layout.js';

/**
 * Roadside scenery.
 *
 * The strip on its own gives almost nothing to judge speed against -- surface
 * texture flickering past reads as noise rather than movement. Objects at
 * different distances do the work instead: the further back a layer sits, the
 * slower it slides, and the gap between them is what makes the car look like it
 * is travelling rather than the ground looking like it is vibrating.
 *
 * Everything is placed from the car's position, so it is deterministic: the same
 * pass always draws the same trees in the same places.
 */

interface Layer {
  /** Fraction of the car's motion this layer moves at. 1 is trackside. */
  readonly parallax: number;
  /** Metres between objects. */
  readonly spacingM: number;
}

const FAR_TREES: Layer = { parallax: 0.12, spacingM: 5 };
const NEAR_TREES: Layer = { parallax: 0.42, spacingM: 9 };
/**
 * Trackside, so these move at the full speed of the ground and do most of the
 * work of showing it. Spaced closer than the canvas is wide (about 16m at this
 * zoom) so there is always at least one in shot -- further apart and the layer
 * carrying the sense of speed keeps disappearing.
 */
const LIGHT_POSTS: Layer = { parallax: 1, spacingM: 13 };

const FAR_TREE_BASE_Y = HORIZON_Y + 3;
const NEAR_TREE_BASE_Y = HORIZON_Y + 42;
const POST_BASE_Y = TRACK_Y - 2;

const FAR_TREE_COLOR = '#1d232e';
const NEAR_TREE_COLOR = '#252d3a';
const NEAR_TREE_TRUNK = '#1b212b';
const POST_COLOR = '#39404d';
const LAMP_HOUSING = '#4a5361';
const LAMP_GLOW = 'rgba(255, 214, 138, 0.20)';
const LAMP_LENS = '#ffe4a8';

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

/**
 * Walks the objects of one layer that are currently on screen.
 *
 * Only what is visible gets drawn, so the cost does not grow with the length of
 * the strip.
 */
function eachVisible(
  layer: Layer,
  camera: number,
  visit: (screenX: number, variation: number, variation2: number) => void,
): void {
  const shift = camera * layer.parallax;
  const leftEdgeM = shift - CAR_SCREEN_X / PX_PER_M;
  const firstIndex = Math.floor(leftEdgeM / layer.spacingM) - 1;
  const lastIndex = firstIndex + Math.ceil(CANVAS_WIDTH / (layer.spacingM * PX_PER_M)) + 3;

  for (let index = firstIndex; index <= lastIndex; index++) {
    const screenX = CAR_SCREEN_X + (index * layer.spacingM - shift) * PX_PER_M;
    if (screenX < -140 || screenX > CANVAS_WIDTH + 140) continue;
    visit(screenX, hash(index), hash(index * 2654435761 + 17));
  }
}

export function drawScenery(ctx: CanvasRenderingContext2D, camera: number): void {
  drawFarTrees(ctx, camera);
  drawNearTrees(ctx, camera);
  drawLightPosts(ctx, camera);
}

/** A low, flat band of silhouettes sitting on the horizon. */
function drawFarTrees(ctx: CanvasRenderingContext2D, camera: number): void {
  ctx.fillStyle = FAR_TREE_COLOR;
  eachVisible(FAR_TREES, camera, (x, v, v2) => {
    const height = 16 + v * 20;
    const width = 14 + v2 * 16;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, FAR_TREE_BASE_Y);
    ctx.quadraticCurveTo(x - width / 2, FAR_TREE_BASE_Y - height, x, FAR_TREE_BASE_Y - height);
    ctx.quadraticCurveTo(x + width / 2, FAR_TREE_BASE_Y - height, x + width / 2, FAR_TREE_BASE_Y);
    ctx.closePath();
    ctx.fill();
  });
}

/** Bigger trees closer in, which carry most of the sense of speed. */
function drawNearTrees(ctx: CanvasRenderingContext2D, camera: number): void {
  eachVisible(NEAR_TREES, camera, (x, v, v2) => {
    const height = 46 + v * 40;
    const width = 26 + v2 * 22;
    const trunk = height * 0.28;

    ctx.fillStyle = NEAR_TREE_TRUNK;
    ctx.fillRect(x - 2, NEAR_TREE_BASE_Y - trunk, 4, trunk);

    ctx.fillStyle = NEAR_TREE_COLOR;
    ctx.beginPath();
    ctx.ellipse(
      x,
      NEAR_TREE_BASE_Y - trunk - height * 0.34,
      width / 2,
      height * 0.4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // A second, offset mass so the canopy is not a plain oval.
    ctx.beginPath();
    ctx.ellipse(
      x + (v - 0.5) * width * 0.45,
      NEAR_TREE_BASE_Y - trunk - height * 0.56,
      width * 0.32,
      height * 0.26,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });
}

/** Light posts along the trackside. */
function drawLightPosts(ctx: CanvasRenderingContext2D, camera: number): void {
  eachVisible(LIGHT_POSTS, camera, (x, v) => {
    const height = 150 + v * 22;
    const topY = POST_BASE_Y - height;

    ctx.strokeStyle = POST_COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, POST_BASE_Y);
    ctx.lineTo(x, topY + 10);
    ctx.stroke();

    // Arm reaching out over the strip.
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, topY + 10);
    ctx.quadraticCurveTo(x, topY, x + 20, topY);
    ctx.stroke();

    ctx.fillStyle = LAMP_GLOW;
    ctx.beginPath();
    ctx.ellipse(x + 24, topY + 4, 17, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = LAMP_HOUSING;
    ctx.fillRect(x + 18, topY - 2, 14, 5);
    ctx.fillStyle = LAMP_LENS;
    ctx.fillRect(x + 19, topY + 3, 12, 2);
  });
}
