import { THROTTLE_RELEASE_MS } from '../config/historical.js';

/**
 * The throttle's return spring.
 *
 * Lives here rather than in the UI because it changes how the car drives: it
 * decides how long the engine keeps pulling after the driver stops asking it to
 * (PROJECT_SPEC 6.1).  The client only decides *when* the throttle has been let
 * go; what happens next is a rule of the game.
 */

/**
 * Throttle values are quantised to hundredths.
 *
 * A dragged slider -- or a spring closing at 1kHz -- would otherwise produce a
 * different float every tick, which bloats a recorded pass and invites drift
 * between a run and its replay.
 */
export function quantiseThrottle(value: number): number {
  const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
  return Math.round(clamped * 100) / 100;
}

/**
 * Closes the throttle by one step of the return spring.
 *
 * Linear, so a throttle released from wide open takes the full
 * `THROTTLE_RELEASE_MS` to shut and one released from half that takes half as
 * long -- the same as a pedal coming back under spring load.
 *
 * Returns the precise value, deliberately unquantised. At a 1ms step the spring
 * moves a thousandth at a time, and rounding each step to hundredths would put
 * it straight back where it started: the throttle would sit at wide open
 * forever. Quantise once, where the value is handed to the simulator.
 */
export function springThrottleClosed(current: number, elapsedMs: number): number {
  if (current <= 0) return 0;
  const step = elapsedMs / THROTTLE_RELEASE_MS.value;
  return Math.max(0, current - step);
}
