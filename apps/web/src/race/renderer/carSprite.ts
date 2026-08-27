import { project } from './projection.js';

/**
 * The car, seen from behind.
 *
 * Drawn from paths at whatever scale the projection gives for its distance, so
 * it shrinks into the scene on the same terms as the road and the scenery.
 *
 * Everything here goes through `CarArtwork`. That interface is the seam: real
 * per-car artwork drops in behind it later without the race screen, the
 * showroom or the paint shop having to know. The paint shop is hue, saturation
 * and brightness sliders over three separately tinted zones
 * (`docs/reference/garage-paint-shop.webp`), which is why colours arrive as
 * parameters rather than being baked into the drawing.
 */

/** Real dimensions, metres. A compact hatchback. */
const BODY_WIDTH_M = 1.72;
const BODY_HEIGHT_M = 1.36;
const TRACK_WIDTH_M = 1.5;
const WHEEL_DIAMETER_M = 0.6;

export interface CarPaint {
  /** Main bodywork. */
  readonly body: string;
  /** The graphics layer -- stripes, flames, whatever the preset is. */
  readonly graphics: string;
  readonly glass: string;
}

export interface RearViewOptions {
  /** Lateral offset from the centreline, metres. */
  readonly laneOffsetM: number;
  /** Distance ahead of the camera, metres. */
  readonly z: number;
  readonly paint: CarPaint;
  /** Body travel on the springs, in metres, so it scales with distance. */
  readonly bounceM: number;
  /** Positive squats the tail, negative lifts it. Radians. */
  readonly pitch: number;
  /** Lights the brake lamps. */
  readonly braking: boolean;
  /** Kicks tyre smoke out from behind the car. */
  readonly wheelspin: boolean;
}

export interface CarArtwork {
  /** The view used on the strip. */
  drawRear(ctx: CanvasRenderingContext2D, options: RearViewOptions): void;
}

export const DEFAULT_PAINT: CarPaint = {
  body: '#d8b62a',
  graphics: '#8a7418',
  glass: '#1b2530',
};

/**
 * Placeholder artwork: a hatchback rear drawn from paths.
 *
 * Deliberately generic. Its job is to prove the seam and to recolour instantly
 * for the paint shop, not to be a particular car.
 */
export const PLACEHOLDER_CAR: CarArtwork = {
  drawRear(ctx, options) {
    const { laneOffsetM, z, paint, bounceM, pitch } = options;
    const base = project(laneOffsetM, z);
    const s = base.scale;

    const width = BODY_WIDTH_M * s;
    const height = BODY_HEIGHT_M * s;
    const wheelR = (WHEEL_DIAMETER_M / 2) * s;
    const groundY = base.y - bounceM * s;

    if (options.wheelspin) smoke(ctx, base.x, groundY, width);

    // Wheels first: the body overlaps them, which reads as the arches sitting
    // proud of the tyres rather than the car floating above them.
    const trackHalf = (TRACK_WIDTH_M / 2) * s;
    wheel(ctx, base.x - trackHalf, groundY - wheelR, wheelR);
    wheel(ctx, base.x + trackHalf, groundY - wheelR, wheelR);

    ctx.save();
    ctx.translate(base.x, groundY);
    ctx.rotate(pitch);
    ctx.translate(-base.x, -groundY);

    body(ctx, base.x, groundY, width, height, paint);

    ctx.restore();
  },
};

function body(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  width: number,
  height: number,
  paint: CarPaint,
): void {
  const half = width / 2;
  const roofY = groundY - height;
  const beltY = groundY - height * 0.52;
  const sillY = groundY - height * 0.2;
  // The roof is narrower than the sills, which is most of what makes a shape
  // read as a car rather than a box.
  const roofHalf = half * 0.78;

  const shell = ctx.createLinearGradient(cx - half, roofY, cx + half, groundY);
  shell.addColorStop(0, paint.body);
  shell.addColorStop(0.55, shade(paint.body, 0.82));
  shell.addColorStop(1, shade(paint.body, 0.6));

  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.moveTo(cx - roofHalf, roofY);
  ctx.lineTo(cx + roofHalf, roofY);
  ctx.lineTo(cx + half, beltY);
  ctx.lineTo(cx + half, sillY);
  ctx.lineTo(cx - half, sillY);
  ctx.lineTo(cx - half, beltY);
  ctx.closePath();
  ctx.fill();

  // Rear screen.
  ctx.fillStyle = paint.glass;
  ctx.beginPath();
  ctx.moveTo(cx - roofHalf * 0.86, roofY + height * 0.07);
  ctx.lineTo(cx + roofHalf * 0.86, roofY + height * 0.07);
  ctx.lineTo(cx + half * 0.84, beltY - height * 0.03);
  ctx.lineTo(cx - half * 0.84, beltY - height * 0.03);
  ctx.closePath();
  ctx.fill();

  // Graphics layer -- one of the paint shop's three tintable zones.
  ctx.fillStyle = paint.graphics;
  ctx.fillRect(cx - half * 0.9, beltY + height * 0.06, width * 0.9, Math.max(1, height * 0.05));

  // Tail lamps.
  const lampW = width * 0.2;
  const lampH = Math.max(1.5, height * 0.11);
  const lampY = beltY + height * 0.15;
  ctx.fillStyle = '#c22b1f';
  ctx.fillRect(cx - half * 0.92, lampY, lampW, lampH);
  ctx.fillRect(cx + half * 0.92 - lampW, lampY, lampW, lampH);

  // Bumper and a shadow under the tail so it sits on the road.
  ctx.fillStyle = shade(paint.body, 0.45);
  ctx.fillRect(cx - half, sillY - Math.max(1, height * 0.05), width, Math.max(1, height * 0.05));

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY, half * 0.95, Math.max(1, height * 0.05), 0, 0, Math.PI * 2);
  ctx.fill();
}

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  if (r < 0.6) return;
  ctx.fillStyle = '#15181d';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.62, r, 0, 0, Math.PI * 2);
  ctx.fill();

  if (r < 3) return;
  ctx.fillStyle = '#9aa2b0';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.3, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Tyre smoke.
 *
 * Seen from behind the smoke comes towards the camera, so it spreads outwards
 * and upwards from the contact patches rather than trailing off to one side the
 * way it did in the old side-on view.
 */
function smoke(ctx: CanvasRenderingContext2D, cx: number, groundY: number, width: number): void {
  ctx.fillStyle = 'rgba(214, 218, 226, 0.20)';
  for (let i = 0; i < 5; i++) {
    const spread = width * (0.28 + i * 0.16);
    ctx.beginPath();
    ctx.ellipse(cx, groundY - i * width * 0.06, spread, spread * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Multiplies a hex colour towards black. */
function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * factor);
  const g = Math.round(((n >> 8) & 0xff) * factor);
  const b = Math.round((n & 0xff) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * How the body is riding right now.
 *
 * Driven by distance travelled rather than by elapsed time, so the car reacts to
 * the surface going under it: it settles when stopped, works harder the faster
 * it goes, and never drifts out of step with the road scrolling past.
 *
 * Returned in metres and radians rather than pixels, because the car is now in
 * perspective -- the same physical bounce has to look smaller when the car is
 * further away.
 */
export function suspensionMotion(
  positionM: number,
  speedMs: number,
  wheelspin: boolean,
): { bounceM: number; pitchWobble: number } {
  const load = Math.min(1, Math.abs(speedMs) / 26);
  const agitation = wheelspin ? 1.5 : 1;

  const slow = Math.sin(positionM * 0.8);
  const fast = Math.sin(positionM * 1.9 + 1.3);

  return {
    bounceM: (slow * 0.6 + fast * 0.4) * (0.002 + load * 0.022) * agitation,
    pitchWobble: (slow * 0.4 + fast * 0.6) * (0.0004 + load * 0.005) * agitation,
  };
}
