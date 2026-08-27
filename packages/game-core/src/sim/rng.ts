/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * The simulator must be reproducible from a seed alone (PROJECT_SPEC 6.3), so
 * `Math.random` is banned inside `sim/`.  The generator's state lives on
 * `PassState`, which makes a pass replayable and -- once Stage 10 arrives --
 * lets the server re-run a submitted race and check the claimed result.
 */

/** Advances the state and returns a float in [0, 1). */
export function nextRandom(state: number): { value: number; state: number } {
  let a = (state + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: a };
}

/** Advances the state and returns a float in [min, max). */
export function nextRandomRange(
  state: number,
  min: number,
  max: number,
): { value: number; state: number } {
  const r = nextRandom(state);
  return { value: min + r.value * (max - min), state: r.state };
}
