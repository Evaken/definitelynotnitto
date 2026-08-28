import { CANVAS_HEIGHT, CANVAS_WIDTH, VIEW } from './layout.js';

/**
 * The moulded chrome the instruments and the road view sit in.
 *
 * `docs/reference/race-view-two-civics.webp` frames the game in a single
 * dashboard casting rather than in rectangles: an oval cowl sweeping across the
 * bottom with the gauges set into it, curved bezels pinching the road view at
 * either side, and the timing boards inset as separate panels.
 *
 * All of it is overlay. The cowl is painted *over* the finished scene rather
 * than the scene being reshaped around it, so `projection.ts` is untouched and
 * the arc can be moved without anything in the world moving with it.
 */

/**
 * The cowl is the top of a large ellipse, most of which is off-canvas below.
 *
 * Centre and radii rather than a hand-drawn bezier because the shape has to be
 * queryable: `dashTopY` is what tells the instruments whether they are actually
 * sitting on the dashboard, and a bezier would only tell you after you drew it.
 */
const COWL = { cx: CANVAS_WIDTH / 2, cy: 555, rx: 640, ry: 245 } as const;

/** Height of the bright lip running along the top of the cowl. */
const LIP_HEIGHT = 13;

/**
 * Top edge of the dashboard at a given x.
 *
 * Highest in the middle, falling away to either side, so the corners of the
 * canvas stay clear -- which is where the original put the things that are not
 * instruments.
 */
export function dashTopY(x: number): number {
  const dx = (x - COWL.cx) / COWL.rx;
  if (dx <= -1 || dx >= 1) return COWL.cy;
  return COWL.cy - COWL.ry * Math.sqrt(1 - dx * dx);
}

/** The path of the cowl: the arc across the top, then down and around. */
function cowlPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  // Angles run clockwise from the +x axis, so PI to 2PI traces the upper half
  // from left to right.
  ctx.ellipse(COWL.cx, COWL.cy, COWL.rx, COWL.ry, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(COWL.cx + COWL.rx, CANVAS_HEIGHT);
  ctx.lineTo(COWL.cx - COWL.rx, CANVAS_HEIGHT);
  ctx.closePath();
}

/**
 * The dashboard itself, drawn before the instruments go on it.
 *
 * Three passes: the face, a bright lip along the leading edge, and a shadow
 * under the lip. The lip is what makes it read as a moulding catching the light
 * rather than as a shape someone filled in.
 */
export function drawDashCowl(ctx: CanvasRenderingContext2D): void {
  const top = dashTopY(COWL.cx);

  ctx.save();
  cowlPath(ctx);

  const face = ctx.createLinearGradient(0, top, 0, CANVAS_HEIGHT);
  face.addColorStop(0, '#f3f5f5');
  face.addColorStop(0.025, '#9ca2a7');
  face.addColorStop(0.1, '#4d5157');
  face.addColorStop(0.34, '#25282d');
  face.addColorStop(1, '#08090b');
  ctx.fillStyle = face;
  ctx.fill();

  // Clip to the cowl so the lip band cannot spill past the arc.
  ctx.clip();
  const lip = ctx.createLinearGradient(0, top, 0, top + LIP_HEIGHT);
  lip.addColorStop(0, 'rgba(244, 246, 248, 0.62)');
  lip.addColorStop(1, 'rgba(244, 246, 248, 0)');
  ctx.fillStyle = lip;
  ctx.fillRect(0, top - 4, CANVAS_WIDTH, LIP_HEIGHT + 4);
  ctx.restore();

  // The leading edge, and a soft shadow cast onto the face below it.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(COWL.cx, COWL.cy, COWL.rx, COWL.ry, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = 'rgba(238, 240, 242, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(COWL.cx, COWL.cy + LIP_HEIGHT, COWL.rx, COWL.ry, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = 'rgba(8, 10, 14, 0.45)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
}

/**
/**
 * The panels down either side of the road view.
 *
 * Not a border drawn inside the viewport but two solid blocks of dashboard that
 * the road view is a hole in. They run the full height of the canvas and finish
 * against the cowl, so the casting reads as one continuous piece rather than as
 * three separate widgets that happen to touch.
 *
 * The opening is narrowest at the top and flares out as it comes down to meet
 * the dash, and the edge is concave getting there -- it holds its line through
 * the upper half and then sweeps away, the way a windscreen surround does.
 * Drawn before the timing boards, which sit on top of them.
 */
export function drawSidePanels(ctx: CanvasRenderingContext2D): void {
  panel(ctx, 'left');
  panel(ctx, 'right');
}

/**
 * The inner edge, as offsets from the road view's edge at four heights.
 *
 * Positive reaches into the view, negative sits outside it. Measured off a
 * marked-up screenshot rather than invented: the edge starts well inside the
 * picture at the top, sweeps outward past the view's own edge around the middle
 * so the opening is widest where the eye is, then turns back in to run into the
 * cowl. One continuous sweep from the roof to the dashboard, which is what makes
 * it read as a cockpit rather than as three panels bolted together.
 */
const EDGE_OFFSETS = [62, -22, -38, -22] as const;
const EDGE_HEIGHTS = [-1, 90, 220, CANVAS_HEIGHT + 20] as const;

/**
 * The four control points of one panel's inner edge, top to bottom.
 *
 * Shared by the drawing and by `panelEdgeXAt` so a plate positioned against the
 * curve cannot end up measured against a different curve than the one painted.
 */
function edgeCurve(side: 'left' | 'right'): readonly [number, number][] {
  const inward = side === 'left' ? 1 : -1;
  const edge = side === 'left' ? VIEW.x : VIEW.x + VIEW.w;
  return EDGE_OFFSETS.map(
    (offset, i) => [edge + inward * offset, EDGE_HEIGHTS[i]!] as [number, number],
  );
}

function cubicAt(p: readonly [number, number][], t: number): [number, number] {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  let x = 0;
  let y = 0;
  for (let i = 0; i < 4; i++) {
    x += w[i]! * p[i]![0];
    y += w[i]! * p[i]![1];
  }
  return [x, y];
}

function traceEdge(ctx: CanvasRenderingContext2D, p: readonly [number, number][]): void {
  ctx.moveTo(p[0]![0], p[0]![1]);
  ctx.bezierCurveTo(p[1]![0], p[1]![1], p[2]![0], p[2]![1], p[3]![0], p[3]![1]);
}

function panel(ctx: CanvasRenderingContext2D, side: 'left' | 'right'): void {
  const inward = side === 'left' ? 1 : -1;
  const outer = side === 'left' ? -1 : CANVAS_WIDTH + 1;
  const p = edgeCurve(side);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(outer, -1);
  ctx.lineTo(p[0]![0], p[0]![1]);
  ctx.bezierCurveTo(p[1]![0], p[1]![1], p[2]![0], p[2]![1], p[3]![0], p[3]![1]);
  ctx.lineTo(outer, CANVAS_HEIGHT + 1);
  ctx.closePath();

  const shade = ctx.createLinearGradient(outer, 0, p[0]![0], 0);
  // Mustard rather than the blue-grey everything else uses, following the
  // original: the surround is the one warm thing on the screen, which is part of
  // why the road view reads as lit from outside.
  shade.addColorStop(0, '#241d0c');
  shade.addColorStop(0.5, '#5a4715');
  shade.addColorStop(0.85, '#9c7d24');
  shade.addColorStop(1, '#cfa93a');

  // The shadow comes off the panel's own fill rather than a second stroke laid
  // over the picture. A stroke has hard edges on both sides, so it read as a
  // dark stripe painted on the grass instead of as the panel standing proud of
  // it -- which is exactly how it looked.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = inward * 5;
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.restore();

  // The lip where the moulding turns away from the view...
  ctx.save();
  ctx.beginPath();
  traceEdge(ctx, p);
  ctx.strokeStyle = 'rgba(246, 216, 130, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/**
 * Where a side panel's inner edge sits at a given height, for anything that has
 * to keep clear of it.
 *
 * Walks the curve rather than inverting it: a cubic in y has no tidy inverse,
 * and a couple of hundred samples is exact enough to position a plate against.
 */
export function panelEdgeXAt(y: number, side: 'left' | 'right'): number {
  const p = edgeCurve(side);
  let best = p[0]![0];
  let bestGap = Infinity;
  for (let i = 0; i <= 200; i++) {
    const [px, py] = cubicAt(p, i / 200);
    const gap = Math.abs(py - y);
    if (gap < bestGap) {
      bestGap = gap;
      best = px;
    }
  }
  return best;
}


/**
 * A raised surround for one timing board.
 *
 * Light along the top and left, dark along the bottom and right: the oldest
 * trick there is for making a flat rectangle sit proud of what is behind it,
 * and the one the original's panels use.
 */
export function drawBoardBezel(
  ctx: CanvasRenderingContext2D,
  box: { readonly x: number; readonly y: number; readonly w: number; readonly h: number },
): void {
  const x = box.x - BOARD_BEZEL_PAD;
  const y = box.y - BOARD_BEZEL_PAD;
  const w = box.w + BOARD_BEZEL_PAD * 2;
  const h = box.h + BOARD_BEZEL_PAD * 2;

  const face = ctx.createLinearGradient(x, y, x + w, y + h);
  face.addColorStop(0, '#6a6355');
  face.addColorStop(1, '#2a2721');
  ctx.fillStyle = face;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = 'rgba(232, 224, 198, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 0.5, y + h - 0.5);
  ctx.lineTo(x + 0.5, y + 0.5);
  ctx.lineTo(x + w - 0.5, y + 0.5);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(6, 8, 12, 0.7)';
  ctx.beginPath();
  ctx.moveTo(x + w - 0.5, y + 0.5);
  ctx.lineTo(x + w - 0.5, y + h - 0.5);
  ctx.lineTo(x + 0.5, y + h - 0.5);
  ctx.stroke();
}

/** How far the raised surround stands outside its board on every side. */
export const BOARD_BEZEL_PAD = 5;

/** Where the cowl's crown sits, for anything that needs to clear it. */
export const COWL_CROWN_Y = COWL.cy - COWL.ry;


