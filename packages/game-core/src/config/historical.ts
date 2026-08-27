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
   * Distance between the pre-stage line and the stage line, metres.
   *
   * The driver has to bring the car to a stop with its nose inside this window:
   * short of the pre-stage line is not staged, past the stage line has rolled
   * through and has to be reversed back.  NHRA runs its two beams 7 inches
   * apart, which at any sane zoom level is far too fine a target to hit by
   * feathering a throttle, so this is deliberately widened for playability.
   */
  stagingZoneLengthM: uncertain(
    1.2,
    'assumed',
    'Widened well beyond the NHRA 7in beam spacing so stopping in the window is a skill rather than a coin toss.',
  ),
  /** Below this speed the car counts as stopped, m/s. */
  stoppedSpeedMs: uncertain(0.06, 'assumed', 'Tolerance for "come to a stop".'),
  /** The car must sit still this long inside the window before the tree arms. */
  settleMs: uncertain(700, 'assumed', 'Confirms the driver has settled rather than rolled through.'),
  /** Where the car sits when the screen loads, metres before the stage line. */
  startLineOffsetM: uncertain(-5, 'assumed', 'Far enough back to need a deliberate roll-in.'),
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
    'sportsman',
    'assumed',
    'Challenge tree style is unconfirmed. Both are implemented; switching this value is the only change needed.',
  ),
  /** Delay from ambers to green on a Pro tree, milliseconds. */
  proDelayMs: uncertain(400, 'real-world', 'NHRA .400 Pro tree.'),
  /**
   * Interval between ambers, and amber-to-green, on a Sportsman tree.
   *
   * A full second rather than the NHRA half, so the count down the tree is
   * something the driver can read and time against rather than a flicker. Each
   * amber lights in turn and stays lit, then the green a second after the last.
   */
  sportsmanIntervalMs: uncertain(1000, 'assumed', 'NHRA runs 500ms; slowed for legibility.'),
  /**
   * Random pause between the car settling on the line and the ambers lighting,
   * so the start cannot be memorised.  Seeded, therefore reproducible.
   *
   * Long enough that the driver is genuinely waiting on the tree rather than
   * anticipating a beat after coming to a stop. The tree itself then takes
   * another three seconds to count down, so the total wait from settling to the
   * green is around five to six seconds.
   */
  armDelayMinMs: uncertain(1800, 'assumed', 'Not sourced.'),
  armDelayMaxMs: uncertain(3200, 'assumed', 'Not sourced.'),
} as const;

// ---------------------------------------------------------------------------
// Driveline behaviour
// ---------------------------------------------------------------------------

export const DRIVELINE = {
  /**
   * Dead time on a gear change, during which no torque reaches the wheels.
   * This is the cost of shifting badly and a large part of how the game feels.
   */
  shiftTimeMs: uncertain(150, 'assumed', 'Stage 2 will tune this against how the original felt.'),
  /**
   * How long the clutch takes to go from fully open to fully clamped.
   *
   * There is no clutch pedal: the clutch follows the throttle, so opening the
   * throttle sharply in gear drops it in hard.  This has to stay short, because
   * a slow engagement lets the engine run away to the limiter before the clutch
   * has any grip and every launch ends up a redline launch.
   */
  clutchEngageMs: uncertain(130, 'assumed', 'Governs how much launch rpm survives into wheelspin.'),
  /**
   * How much clutch clamp a given throttle opening asks for.
   *
   * Above 1, so part throttle still gets the clutch fully home once the car is
   * rolling; the driver eases in by opening the throttle gently rather than by
   * modulating a pedal that does not exist.
   */
  clutchThrottleGain: uncertain(1.6, 'assumed', 'Tuned so a gentle roll-in is possible.'),
  /**
   * Above this speed the clutch stays clamped whatever the throttle is doing,
   * so lifting mid-run gives engine braking rather than coasting in neutral.
   */
  clutchLockSpeedMs: uncertain(3, 'assumed', 'Tuned so staging coasts but the run does not.'),
  /**
   * Braking torque at the wheels, newton-metres.
   *
   * Applied through the tyre model rather than straight to the car, so locking
   * the brakes loses grip the same way spinning the tyres does.
   */
  brakeTorqueNm: uncertain(2600, 'assumed', 'Tuned so the car can be stopped inside the staging window.'),
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
 * The original's control scheme is not confirmed.  Throttle is deliberately not
 * on the keyboard at all: it comes from the slider beside the strip, dragged by
 * hand, so how quickly and how far the driver opens it is part of the launch.
 *
 * The keyboard only selects gears and brakes.  Shifting alone moves nothing --
 * the car has to be in a forward gear *and* have throttle applied.
 */
export const DEFAULT_BINDINGS = {
  /** Up through R - N - 1 - 2 - 3 ... */
  shiftUp: ['w', 'W', 'ArrowUp'],
  /** Back down the same list. */
  shiftDown: ['a', 'A', 'ArrowDown'],
  brake: ['s', 'S', ' '],
  reset: ['r', 'R'],
} as const;

export const CONTROLS_CONFIDENCE: Confidence = 'assumed';

/**
 * How long the throttle takes to close on its own once the slider is let go.
 *
 * A real throttle is sprung: take your foot off and it shuts. Leaving the
 * slider wherever it was dropped would mean the car pulls away by itself the
 * moment the driver stops paying attention to it, which is neither how a car
 * behaves nor something a player can plan around.
 */
export const THROTTLE_RELEASE_MS = uncertain(
  1000,
  'assumed',
  'Return-spring feel. Not sourced.',
);
