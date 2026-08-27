/**
 * Fixed geometry for the race canvas.
 *
 * A bounded, fixed-size playfield rather than a responsive layout
 * (PROJECT_SPEC 5): the canvas renders at these dimensions and CSS scales the
 * whole thing, so the scene never reflows and proportions never shift.
 */

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 440;

/**
 * One world metre in pixels.
 *
 * Everything -- car, wheels, distance markers, staging lines -- is drawn at this
 * single scale, so the wheels turn at a rate that matches the ground going by
 * and wheelspin is visible rather than implied.
 *
 * Close enough that the staging window is a target the driver can judge by eye
 * and the car reads as a car rather than a token.
 */
export const PX_PER_M = 58;

/**
 * Where the car sits on screen; the world scrolls past it.
 *
 * Set back from the middle so there is room to see the lines ahead while
 * staging, but with enough behind the car to see where it is reversing to after
 * rolling through.
 */
export const CAR_SCREEN_X = 430;

export const HUD_HEIGHT = 56;
export const HORIZON_Y = 236;
/** Ground level: where the tyres meet the track. */
export const TRACK_Y = 330;
export const TRACK_BOTTOM = 368;

export const COLORS = {
  hudBg: '#12151b',
  skyTop: '#1b2433',
  skyBottom: '#39404f',
  distant: '#242b38',
  trackTop: '#3a3f48',
  trackBottom: '#22262d',
  laneLine: '#5a616d',
  marker: '#8b93a1',
  markerMajor: '#e8a317',
  text: '#d8dce3',
  textDim: '#8b93a1',
  accent: '#e8a317',
  amber: '#ffb400',
  green: '#3fd35a',
  red: '#e5462f',
  bulbOff: '#2a2f38',
  bodyLight: '#c8ccd4',
  bodyDark: '#7d838e',
  glass: '#2c3746',
  tyre: '#15181d',
  rim: '#9aa2b0',
} as const;

/** Screen x for a world position, given where the camera is. */
export function worldToScreen(worldM: number, cameraM: number): number {
  return CAR_SCREEN_X + (worldM - cameraM) * PX_PER_M;
}
