/**
 * Fixed geometry for the race canvas.
 *
 * The original ran in a bounded window and never reflowed (PROJECT_SPEC 5), so
 * the canvas renders at these dimensions and CSS scales the whole thing.
 * Proportions here follow `docs/reference/race-view-two-civics.webp`: timing
 * boards flanking a road view, an instrument cluster along the bottom, and a
 * position bar down the far left edge.
 */

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 600;

// --- Regions ---------------------------------------------------------------

/** Progress down the strip, down the far left edge. */
export const POSITION_BAR = { x: 0, y: 8, w: 22, h: 388 } as const;

/** Timing boards either side of the road. Left is the player. */
export const BOARD_LEFT = { x: 34, y: 8, w: 172, h: 388 } as const;
export const BOARD_RIGHT = { x: 754, y: 8, w: 172, h: 388 } as const;

/** The road view itself. */
export const VIEW = { x: 214, y: 8, w: 532, h: 376 } as const;
export const VIEW_RIGHT = VIEW.x + VIEW.w;
export const VIEW_BOTTOM = VIEW.y + VIEW.h;
export const VIEW_CENTER_X = VIEW.x + VIEW.w / 2;

/** Where the road meets the sky. Everything beyond converges here. */
export const HORIZON_Y = VIEW.y + 139;

/** The instrument cluster fills the rest. */
export const CLUSTER = { x: 0, y: 384, w: CANVAS_WIDTH, h: CANVAS_HEIGHT - 384 } as const;

// --- Camera ----------------------------------------------------------------

/**
 * Focal length in pixels, and the camera's height above the road.
 *
 * Together these fix the whole projection: a point one metre to the side at one
 * metre ahead lands `FOCAL_LENGTH` pixels off centre, and the horizon sits where
 * an infinitely distant road converges. Tuned by eye against the reference
 * screenshot rather than derived from a real lens.
 */
export const FOCAL_LENGTH = 400;
export const CAMERA_HEIGHT_M = 3;

/** Half the paved width, metres. Two lanes plus a little shoulder. */
export const ROAD_HALF_WIDTH_M = 3.6;
/** Lane centres sit this far either side of the centreline. */
export const LANE_OFFSET_M = 1.8;

/** How far ahead of the camera the player's car sits. */
export const CAR_Z = 7.5;

/** Nothing is drawn beyond this; it is already sub-pixel by then. */
export const FAR_PLANE_M = 260;

export const COLORS = {
  frame: '#0b0d11',
  panel: '#171a20',
  panelEdge: '#454c59',
  skyTop: '#2a5d8f',
  skyBottom: '#9dc4e0',
  hills: '#3f5a52',
  treeLine: '#24402f',
  grassNear: '#3c5a34',
  grassFar: '#43614a',
  roadNear: '#4a4f57',
  roadFar: '#5b616b',
  rumbleLight: '#d8dce3',
  rumbleDark: '#b23b2e',
  laneLine: '#e8eaee',
  text: '#d8dce3',
  textDim: '#8b93a1',
  accent: '#e8a317',
  amber: '#ffb400',
  green: '#3fd35a',
  red: '#e5462f',
  bulbOff: '#2a2f38',
  led: '#ff3b2f',
  ledDim: '#3a1512',
  dialFace: '#0e1116',
  dialRim: '#9aa2b0',
  needle: '#e5462f',
} as const;
