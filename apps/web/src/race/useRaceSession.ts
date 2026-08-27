import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SIM_HZ,
  TimelineRecorder,
  buildTimingSlip,
  createPassState,
  engineRpm,
  gearLabel,
  isPassComplete,
  metresToFeet,
  msToMph,
  replayPass,
  stepPass,
  type Car,
  type PassState,
  type RacePhase,
  type RaceInput,
  type TimingSlip,
  type Tune,
} from '@nitto/game-core';
import { KeyboardReader } from './input/keyboard.js';
import { drawRace } from './renderer/drawRace.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './renderer/layout.js';

/**
 * Drives one pass: owns the fixed-step loop, the controls and the canvas.
 *
 * Everything that decides what the car does lives in game-core.  This hook only
 * moves data across the boundary -- slider and keys in, pixels out -- which is
 * what keeps the simulation testable and, from Stage 10, re-runnable on a server
 * (PROJECT_SPEC 6.1).
 */

/** What the React tree needs to see. Read at a human rate, not every tick. */
export interface RaceSnapshot {
  readonly phase: RacePhase;
  readonly elapsed: number;
  readonly rpm: number;
  readonly gear: string;
  readonly speedMph: number;
  readonly distanceFt: number;
  readonly wheelTorqueNm: number;
  readonly gripLimitN: number;
  readonly tractiveForceN: number;
  readonly slipRatio: number;
  readonly wheelspin: boolean;
  readonly wheelsLocked: boolean;
  readonly clutchEngagement: number;
  readonly clutchLocked: boolean;
  readonly limiterActive: boolean;
  readonly shifting: boolean;
  readonly foul: boolean;
  readonly stagedDepthM: number | null;
  /** True once the nose is past the stage line without having staged. */
  readonly rolledThrough: boolean;
  readonly slip: TimingSlip | null;
  /**
   * Whether re-running the recorded inputs reproduced this pass exactly.
   * Checked only in development, and only once the pass is over: it is the
   * same verification the server will perform on a submitted race in Stage 10,
   * done here against real player input rather than a scripted drive.
   */
  readonly replayVerified: boolean | null;
}

/** How many rendered frames pass between React updates. */
const FRAMES_PER_SNAPSHOT = 4;
/** Never simulate more than this much wall time in one frame. */
const MAX_FRAME_MS = 100;
const TICK_MS = 1000 / SIM_HZ;

function snapshotOf(state: PassState, replayVerified: boolean | null): RaceSnapshot {
  const complete = isPassComplete(state);
  return {
    phase: state.phase,
    elapsed:
      state.clockStartTick === null ? 0 : Math.max(0, (state.tick - state.clockStartTick) / SIM_HZ),
    rpm: engineRpm(state),
    gear: gearLabel(state.gear),
    speedMph: msToMph(state.speedMs),
    distanceFt: metresToFeet(state.positionM),
    wheelTorqueNm: state.wheelTorqueNm,
    gripLimitN: state.gripLimitN,
    tractiveForceN: state.tractiveForceN,
    slipRatio: state.slipRatio,
    wheelspin: state.wheelspin,
    wheelsLocked: state.wheelsLocked,
    clutchEngagement: state.clutchEngagement,
    clutchLocked: state.clutchLocked,
    limiterActive: state.limiterActive,
    shifting: state.shiftTicksRemaining > 0,
    foul: state.foul,
    stagedDepthM: state.stagedPositionM,
    rolledThrough: state.positionM > 0 && state.clockStartTick === null,
    slip: complete ? buildTimingSlip(state) : null,
    replayVerified,
  };
}

export function useRaceSession(car: Car, tune: Tune) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PassState>(createPassState(car, tune, 1));
  const recorderRef = useRef<TimelineRecorder>(new TimelineRecorder(1));
  const verifiedRef = useRef<boolean | null>(null);

  // The slider writes here every time it moves. The loop reads it every tick,
  // which keeps a 60Hz drag from having to re-render the component tree.
  const throttleRef = useRef(0);
  const [throttle, setThrottleState] = useState(0);

  const [snapshot, setSnapshot] = useState<RaceSnapshot>(() => snapshotOf(stateRef.current, null));

  const setThrottle = useCallback((value: number) => {
    throttleRef.current = value;
    setThrottleState(value);
  }, []);

  const startPass = useCallback(() => {
    // The seed only decides how long the tree holds before the ambers. Drawn
    // here rather than in game-core, which must stay free of Math.random so a
    // pass stays reproducible from its seed.
    const seed = Math.floor(Math.random() * 0x7fffffff);
    stateRef.current = createPassState(car, tune, seed);
    recorderRef.current = new TimelineRecorder(seed);
    verifiedRef.current = null;
    throttleRef.current = 0;
    setThrottleState(0);
    setSnapshot(snapshotOf(stateRef.current, null));
  }, [car, tune]);

  // Restart whenever the car or tune changes, so the screen is never showing a
  // pass belonging to a different vehicle.
  useEffect(() => {
    startPass();
  }, [startPass]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const keyboard = new KeyboardReader();
    const detach = keyboard.attach();

    let frameHandle = 0;
    let lastFrameMs = performance.now();
    let accumulator = 0;
    let frameCount = 0;
    let resetHeld = false;
    let finishHandled = false;
    let lastPhase: RacePhase = stateRef.current.phase;

    const loop = (now: number) => {
      frameHandle = requestAnimationFrame(loop);

      const keys = keyboard.read();
      if (keys.reset && !resetHeld) {
        startPass();
        lastFrameMs = now;
        accumulator = 0;
        finishHandled = false;
      }
      resetHeld = keys.reset;

      const state = stateRef.current;
      const input: RaceInput = {
        throttle: throttleRef.current,
        brake: keys.brake,
        shiftUp: keys.shiftUp,
        shiftDown: keys.shiftDown,
      };

      // Fixed-step accumulator: the simulation always advances in whole 1ms
      // ticks regardless of the display's refresh rate, so a slow frame or a
      // 144Hz monitor cannot change the outcome of a pass.
      accumulator += Math.min(now - lastFrameMs, MAX_FRAME_MS);
      lastFrameMs = now;

      while (accumulator >= TICK_MS && !isPassComplete(state)) {
        recorderRef.current.record(state.tick, input);
        stepPass(state, input);
        accumulator -= TICK_MS;
      }

      drawRace(ctx, state);

      const justFinished = isPassComplete(state) && !finishHandled;
      if (justFinished) {
        finishHandled = true;
        verifiedRef.current = verifyReplay(state);
      }

      const phaseChanged = state.phase !== lastPhase;
      lastPhase = state.phase;

      if (phaseChanged || justFinished || ++frameCount % FRAMES_PER_SNAPSHOT === 0) {
        setSnapshot(snapshotOf(state, verifiedRef.current));
      }
    };

    /**
     * Re-runs the pass that was just driven from its recorded inputs alone and
     * checks the timing slip comes back identical.
     *
     * Development only. It is the same check the server will run on a submitted
     * race in Stage 10, exercised here against real player input rather than
     * the scripted drives the test suite uses.
     */
    function verifyReplay(state: PassState): boolean | null {
      if (!import.meta.env.DEV) return null;
      const live = buildTimingSlip(state);
      const again = replayPass(car, tune, recorderRef.current.build()).slip;
      return JSON.stringify(live) === JSON.stringify(again);
    }

    frameHandle = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameHandle);
      detach();
    };
  }, [car, tune, startPass]);

  return {
    canvasRef,
    snapshot,
    startPass,
    throttle,
    setThrottle,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  };
}
