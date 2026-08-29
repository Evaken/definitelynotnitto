import { project } from './projection.js';
import { raceRearArt,type RaceArtworkDirection } from '../../vehicleArt.js';
import type {Appearance} from '@nitto/game-core';
import {civicFrame} from '../../carRenderer/civicCompositor.js';

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
/**
 * Tyre section width, derived so the outer wall lines up with the flank rather
 * than standing proud of it. Falls out at 0.22m, which is a real tyre.
 */
const TYRE_WIDTH_M = BODY_WIDTH_M - TRACK_WIDTH_M;

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
  /** CSS canvas filter applied only to isolated raster artwork. */
  readonly filter?: string;
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
    const tyreHalf = (TYRE_WIDTH_M / 2) * s;
    wheel(ctx, base.x - trackHalf, groundY - wheelR, wheelR, tyreHalf);
    wheel(ctx, base.x + trackHalf, groundY - wheelR, wheelR, tyreHalf);

    ctx.save();
    ctx.translate(base.x, groundY);
    ctx.rotate(pitch);
    ctx.translate(-base.x, -groundY);

    body(ctx, base.x, groundY, width, height, paint);

    ctx.restore();
  },
};

/**
 * Clean-room Civic artwork for the strip.
 *
 * The source image was created for this project from a written brief, using the
 * surviving race screenshot only for camera angle and composition. It is not an
 * extracted client asset. Loading stays lazy so importing the renderer in the
 * Node test environment never requires a DOM global.
 */
const rearImages=new Map<string,HTMLImageElement>();

function loadedRearImage(url:string):HTMLImageElement|null {
  if(typeof Image==='undefined')return null;
  let image=rearImages.get(url);
  if(!image){image=new Image();image.decoding='async';image.src=url;rearImages.set(url,image);}
  return image.complete&&image.naturalWidth>0?image:null;
}


/**
 * Where a car's tyres meet the road, as a fraction of its artwork's height.
 *
 * The renderer used to put each image's *bottom edge* on the ground line, which
 * assumes the bottom row of pixels is the contact patch. None of the artwork is
 * drawn that way: every car carries transparent space and a soft shadow under
 * its wheels, and the amount differs per car -- 11.8% on the Skyline, 19.8% on
 * the Evo, 23.1% on the Supra. So every car floated, by a different amount, and
 * the Civic looked least wrong only because its gap is the smallest.
 *
 * Measured from the image rather than tabulated, so new artwork lands on the
 * road without anyone remembering to add a number. Solid pixels only: the soft
 * shadow beneath the tyres reaches the bottom edge on some cars and would
 * otherwise be mistaken for the car itself.
 */
const SOLID_ALPHA = 200;
/** Ignore a row that is only a few stray pixels of antialiasing. */
const MIN_ROW_COVERAGE = 0.005;

/**
 * Lowest row carrying real bodywork, as a fraction of the image height.
 *
 * Pure so it can be tested without a canvas: the thresholds and the direction
 * of the scan are the parts that can be wrong, and a soft shadow reaching the
 * bottom edge is exactly what a naive scan mistakes for the car.
 */
export function solidContactFraction(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number {
  const needed = Math.max(1, Math.round(width * MIN_ROW_COVERAGE));
  for (let y = height - 1; y >= 0; y--) {
    let solid = 0;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > SOLID_ALPHA && ++solid >= needed) return (y + 1) / height;
    }
  }
  return 1;
}

const contactFractions = new Map<string, number>();

function contactFraction(url: string, image: HTMLImageElement): number {
  const cached = contactFractions.get(url);
  if (cached !== undefined) return cached;

  let fraction = 1;
  try {
    const probe = document.createElement('canvas');
    probe.width = image.naturalWidth;
    probe.height = image.naturalHeight;
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, probe.width, probe.height);
      fraction = solidContactFraction(data, probe.width, probe.height);
    }
  } catch {
    // A canvas that will not surrender its pixels leaves the car where it was.
  }

  contactFractions.set(url, fraction);
  return fraction;
}

export function raceArtworkFor(carId:string,appearance?:Appearance):{artwork:CarArtwork;baseHue:number;composited?:boolean}|null {
  if(carId==='civic-si'&&appearance)return{baseHue:appearance.hue,composited:true,artwork:{drawRear(ctx,options){
    const frame=civicFrame('race-rear',appearance);if(frame===null){PLACEHOLDER_CAR.drawRear(ctx,options);return;}
    const base=project(options.laneOffsetM,options.z),width=2.5*base.scale,height=width*(frame.height/frame.width),groundY=base.y-options.bounceM*base.scale;
    if(options.wheelspin)smoke(ctx,base.x,groundY,width*.72);ctx.save();ctx.translate(base.x,groundY);ctx.drawImage(frame,-width*.5,-height*.86,width,height);
    if(options.braking){ctx.fillStyle='rgba(255,35,22,.52)';ctx.shadowColor='#ff2d1c';ctx.shadowBlur=Math.max(5,width*.055);ctx.beginPath();ctx.ellipse(-width*.3,-height*.5,width*.047,height*.09,0,0,Math.PI*2);ctx.ellipse(width*.3,-height*.5,width*.047,height*.09,0,0,Math.PI*2);ctx.fill();}ctx.restore();
  }}};
  const art=raceRearArt(carId);if(!art)return null;
  return {baseHue:art.baseHue,artwork:{drawRear(ctx,options){
    const image = loadedRearImage(art.url);
    if (image === null) {
      PLACEHOLDER_CAR.drawRear(ctx, options);
      return;
    }

    const base = project(options.laneOffsetM, options.z);
    // Where the tyres are in this image, not where its bottom edge happens to be.
    const contact = contactFraction(art.url, image);
    const width = 2.35 * base.scale;
    const height = width * (image.naturalHeight / image.naturalWidth);
    const groundY = base.y - options.bounceM * base.scale;

    if (options.wheelspin) smoke(ctx, base.x, groundY, width * 0.72);

    ctx.save();
    ctx.translate(base.x, groundY);

    // A tight road shadow belongs in the renderer rather than in the bitmap so
    // it follows the road projection and body movement.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, -height * 0.025, width * 0.43, height * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.filter=options.filter??'none';
    // Each source portrait records which way its nose points. Match that to the
    // inward vanishing point of whichever lane the car occupies.
    if(shouldMirrorRaceArtwork(art.sourceNose,options.laneOffsetM))ctx.scale(-1,1);
    ctx.drawImage(image, -width * 0.5, -height * contact, width, height);
    ctx.restore();

    if (options.braking) {
      ctx.fillStyle = 'rgba(255, 42, 20, 0.5)';
      ctx.shadowColor = '#ff321f';
      ctx.shadowBlur = Math.max(4, width * 0.05);
      ctx.beginPath();
      // 0.46 down from the image's top edge -- the same place they sat when the
      // bottom edge was assumed to be the contact patch.
      const lampY = height * (0.46 - contact);
      ctx.ellipse(-width * 0.34, lampY, width * 0.042, height * 0.095, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 0.34, lampY, width * 0.042, height * 0.095, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }}};
}

export function shouldMirrorRaceArtwork(sourceNose:RaceArtworkDirection,laneOffsetM:number):boolean{
  if(sourceNose==='centre')return false;
  const desiredNose=laneOffsetM<0?'right':'left';
  return sourceNose!==desiredNose;
}

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

/**
 * A tyre, seen from directly behind.
 *
 * A rectangle, not a circle. The wheel's axis points across the car, so from
 * behind you are looking at the tread band edge-on: as wide as the tyre's
 * section and as tall as its diameter. The round faces are turned away and
 * contribute nothing. Drawing them as ellipses put the circle in the one plane
 * where it cannot be seen, which is why it read as wrong without being obvious
 * why.
 *
 * The gradient across the width is the only curvature there is to show -- a
 * cylinder lit from in front, brightest along its centre line.
 */
function wheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  halfWidth: number,
): void {
  if (r < 0.6) return;

  const shade = ctx.createLinearGradient(x - halfWidth, 0, x + halfWidth, 0);
  shade.addColorStop(0, '#0e1115');
  shade.addColorStop(0.42, '#2b3138');
  shade.addColorStop(1, '#12161b');

  ctx.fillStyle = shade;
  ctx.fillRect(x - halfWidth, y - r, halfWidth * 2, r * 2);
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
