import {
  CAMERA_HEIGHT_M,
  CAR_Z,
  FOCAL_LENGTH,
  HORIZON_Y,
  ROAD_HALF_WIDTH_M,
  VIEW_BOTTOM,
  VIEW_CENTER_X,
} from './layout.js';

/**
 * Pinhole projection for a dead-straight road.
 *
 * A drag strip never turns and never climbs, which removes almost everything
 * that makes a pseudo-3D road renderer complicated: no curvature accumulation,
 * no hill segments, no z-sorting beyond drawing far things first. What is left
 * is one division.
 *
 * Everything on the ground scales as 1/z. A point `z` metres ahead of the camera
 * lands `FOCAL_LENGTH * CAMERA_HEIGHT_M / z` pixels below the horizon, and
 * `FOCAL_LENGTH * x / z` pixels to the side of the centreline. That single
 * relationship gives the road edges, the lane markings, the scenery and the
 * cars, all in agreement with each other.
 */

export interface Projected {
  /** Screen x of the point. */
  readonly x: number;
  /** Screen y where the point meets the ground. */
  readonly y: number;
  /**
   * Pixels per world metre at this distance. Multiply any real dimension by it
   * to get the on-screen size, which is what keeps a tree, a car and the road
   * consistent with one another.
   */
  readonly scale: number;
}

/**
 * Closest the camera will project.
 *
 * Guards the division. Anything nearer is behind the driver's shoulder and is
 * not drawn at all, but clamping rather than dividing by zero keeps a rounding
 * error from producing an infinity mid-frame.
 */
export const MIN_Z = 0.35;

/** Projects a point on the road surface at lateral offset `xM`, `z` ahead. */
export function project(xM: number, z: number): Projected {
  const depth = Math.max(z, MIN_Z);
  const scale = FOCAL_LENGTH / depth;
  return {
    x: VIEW_CENTER_X + xM * scale,
    y: HORIZON_Y + CAMERA_HEIGHT_M * scale,
    scale,
  };
}

/** Half the road's on-screen width at a given distance, in pixels. */
export function roadHalfWidth(z: number): number {
  return ROAD_HALF_WIDTH_M * (FOCAL_LENGTH / Math.max(z, MIN_Z));
}

/**
 * Distance at which the ground meets the bottom of the view.
 *
 * The nearest thing the camera can see, and therefore where the road starts.
 */
export const Z_NEAR = (FOCAL_LENGTH * CAMERA_HEIGHT_M) / (VIEW_BOTTOM - HORIZON_Y);

/** True if a point is in front of the camera and worth drawing. */
export function isVisible(z: number): boolean {
  return z > MIN_Z;
}

/**
 * Where the camera sits, in world metres.
 *
 * Behind the car by `CAR_Z`, which is what makes it a chase camera. Every
 * distance handed to `project` has to be measured from here and not from the
 * car -- confusing the two draws the whole world `CAR_Z` metres too close, which
 * puts the staging lines behind the driver and turns the tree into a wall.
 */
export function cameraPosition(carPositionM: number): number {
  return carPositionM - CAR_Z;
}

/** Distance from the camera to a fixed point on the strip. */
export function depthOf(worldM: number, cameraM: number): number {
  return worldM - cameraM;
}
