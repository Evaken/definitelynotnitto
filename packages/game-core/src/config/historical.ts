/**
 * Every rule or magic number whose original Nitto 1320 Challenge behaviour is
 * NOT confirmed lives here, tagged with how much confidence stands behind it.
 *
 * PROJECT_SPEC 11.12 and 11.13: document uncertain historical behaviour rather
 * than inventing certainty, and isolate unknown rules behind configuration so
 * they can be corrected later without touching game logic.
 *
 * When research settles a value, change it here and flip its confidence.  No
 * simulation code should ever need editing to correct a historical detail.
 *
 * See HISTORICAL_NOTES.md for the reasoning behind each entry.
 */

/**
 * How much evidence stands behind a value.
 *
 * - `sourced`     — confirmed from period documentation, screenshots or code.
 * - `real-world`  — correct for real drag racing, but unverified for the game.
 * - `assumed`     — a plausible guess made to get the game running. Suspect it.
 */
export type Confidence = 'sourced' | 'real-world' | 'assumed';

export interface Uncertain<T> {
  readonly value: T;
  readonly confidence: Confidence;
  readonly note: string;
}

function uncertain<T>(value: T, confidence: Confidence, note: string): Uncertain<T> {
  return { value, confidence, note };
}

// ---------------------------------------------------------------------------
// Track geometry
// ---------------------------------------------------------------------------

const FEET_TO_M = 0.3048;

/** Distance marks along the strip, metres from the stage beam. */
export const TRACK_MARKS = {
  sixtyFoot: 60 * FEET_TO_M,
  threeThirty: 330 * FEET_TO_M,
  /** Entry to the 1/8-mile speed trap, 66ft before the mark. */
  eighthTrapEntry: (660 - 66) * FEET_TO_M,
  eighthMile: 660 * FEET_TO_M,
  thousandFoot: 1000 * FEET_TO_M,
  /** Entry to the 1/4-mile speed trap, 66ft before the mark. */
  quarterTrapEntry: (1320 - 66) * FEET_TO_M,
  quarterMile: 1320 * FEET_TO_M,
} as const;

/** Length of the speed traps, metres. MPH is an average across this. */
export const TRAP_LENGTH_M = 66 * FEET_TO_M;

export const STAGING = {
  /**
   * Gap between the pre-stage and stage beams.  NHRA uses 7 inches.
   */
  beamSpacingM: uncertain(
    7 * 0.0254,
    'real-world',
    'NHRA standard. Whether Challenge modelled two separate beams at all is unconfirmed.',
  ),
  /**
   * How far the car must roll before the stage beam is clear and the ET clock
   * starts.  Physically this is the length of tyre blocking the beam, so
   * staging deep leaves less of it -- which is what makes staging depth a real
   * trade-off between reaction time and elapsed time.
   */
  beamBlockLengthM: uncertain(
    0.28,
    'real-world',
    'Roughly 11in of contact patch, typical for a street tyre. Whether Challenge modelled rollout at all is unconfirmed.',
  ),
  /** Where the car sits when the screen loads, metres before the stage beam. */
  startLineOffsetM: uncertain(-1.2, 'assumed', 'Presentation choice, no historical basis.'),
  /** Force available to creep the car forward on a slipping clutch, newtons. */
  creepForceN: uncertain(2600, 'assumed', 'Tuned so staging feels controllable, not sourced.'),
  /** The car will not creep faster than this, m/s. */
  creepMaxSpeedMs: uncertain(1.1, 'assumed', 'Tuned for controllable staging.'),
  /**
   * How far above idle the engine sits while creeping in on a slipping clutch.
   *
   * The engine is loaded while the car is rolling up to the beams, so it cannot
   * free-rev.  Without this the throttle needed to creep would also pin the
   * engine against the limiter, and the driver would arrive on the line unable
   * to bleed the revs back down in time to choose a launch rpm.
   */
  creepRpmRange: uncertain(900, 'assumed', 'Tuned for controllable staging.'),
  /** The car must sit still this long after staging before the tree arms. */
  settleMs: uncertain(400, 'assumed', 'Prevents the tree firing mid-creep.'),
} as const;

// ---------------------------------------------------------------------------
// Christmas tree
// ---------------------------------------------------------------------------

/**
 * `pro` flashes all three ambers together, green 0.400s later.
 * `sportsman` steps down the ambers 0.500s apart, green 0.500s after the last.
 */
export type TreeType = 'pro' | 'sportsman';

export const TREE = {
  type: uncertain<TreeType>(
    'pro',
    'assumed',
    'Challenge tree style is unconfirmed. Both are implemented; switching this value is the only change needed.',
  ),
  /** Delay from ambers to green on a Pro tree, milliseconds. */
  proDelayMs: uncertain(400, 'real-world', 'NHRA .400 Pro tree.'),
  /** Interval between ambers, and amber-to-green, on a Sportsman tree. */
  sportsmanIntervalMs: uncertain(500, 'real-world', 'NHRA .500 full tree.'),
  /**
   * Random pause between the car arming the tree and the ambers lighting, so
   * the start cannot be memorised.  Seeded, therefore reproducible.
   */
  armDelayMinMs: uncertain(600, 'assumed', 'Not sourced.'),
  armDelayMaxMs: uncertain(1400, 'assumed', 'Not sourced.'),
} as const;

// ---------------------------------------------------------------------------
// Driveline behaviour
// ---------------------------------------------------------------------------

export const DRIVELINE = {
  /**
   * Dead time on an upshift, during which no torque reaches the wheels.
   * This is the cost of shifting badly and a large part of how the game feels.
   */
  shiftTimeMs: uncertain(150, 'assumed', 'Stage 2 will tune this against how the original felt.'),
  /**
   * How long the clutch takes to go from fully open to fully clamped.
   *
   * This has to be short.  A slow engagement lets the engine run away to the
   * limiter with the throttle pinned before the clutch has any grip, which
   * erases the driver's choice of launch rpm entirely -- every launch becomes a
   * redline launch.  Keeping it brief is what makes launch rpm a decision.
   */
  clutchEngageMs: uncertain(130, 'assumed', 'Governs how much launch rpm survives into wheelspin.'),
  /**
   * Peak torque the clutch can transmit while slipping, newton-metres.
   *
   * A stock clutch is rated a little above the engine's peak output -- enough
   * to hold it, not enough to dump the whole flywheel into the tyres at once.
   * Setting this far above engine torque makes launch rpm irrelevant, because
   * the clutch then drags the engine down to driveline speed almost instantly
   * whatever it was revving at.
   */
  clutchCapacityNm: uncertain(240, 'assumed', 'Stage 3 will make this a property of the fitted clutch.'),
  /**
   * Closed-throttle drag torque at redline, newton-metres, scaling down with
   * engine speed.  This is what pulls the revs back when the driver lifts, so
   * it has to be brisk: a sluggish figure leaves the engine hanging and makes
   * the launch rpm on the line impossible to set deliberately.
   */
  engineFrictionNm: uncertain(60, 'assumed', 'Pumping and friction losses; not sourced.'),
  /** Once the limiter cuts, fuel returns this far below redline. */
  limiterHysteresisRpm: uncertain(250, 'assumed', 'Produces an audible/visible bounce off the limiter.'),
} as const;

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const ENVIRONMENT = {
  /** Air density at sea level, 15C, kg/m^3. */
  airDensity: 1.225,
  gravity: 9.80665,
} as const;

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

/**
 * Default key bindings.
 *
 * The original's control scheme is not confirmed.  This scheme gives one key
 * both the launch and the upshift job, which was common in period browser drag
 * games: hold throttle on the line to build launch rpm, then hit LAUNCH as the
 * tree drops -- that press is your reaction time -- and hit the same key for
 * every gear change afterwards.
 */
export const DEFAULT_BINDINGS = {
  throttle: ['ArrowUp', 'w', 'W'],
  launchShift: [' ', 'ArrowRight', 'd', 'D'],
  shiftDown: ['ArrowLeft', 'a', 'A'],
  reset: ['r', 'R'],
} as const;

export const CONTROLS_CONFIDENCE: Confidence = 'assumed';
