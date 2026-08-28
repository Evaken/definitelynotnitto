import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SIM_HZ,
  TimelineRecorder,
  buildTimingSlip,
  createPassState,
  engineRpm,
  gearLabel,
  isPassComplete,
  isRunComplete,
  metresToFeet,
  msToMph,
  quantiseThrottle,
  replayPass,
  springThrottleClosed,
  stepPass,
  type Car,
  type Appearance,
  type PassState,
  type RacePhase,
  type RaceInput,
  type TimingSlip,
  type Tune,
} from '@nitto/game-core';
import { KeyboardReader } from './input/keyboard.js';
import { FrameClock, TICK_MS } from './frameClock.js';
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
  readonly nitrousActive:boolean;
  readonly nitrousRemainingSeconds:number;
  readonly mechanicalStress:number;
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

function snapshotOf(state: PassState, replayVerified: boolean | null): RaceSnapshot {
  const runComplete = isRunComplete(state);
  return {
    phase: state.phase,
    // The clock stops at the finish line, not when the car finally rolls to a
    // halt: what follows the traps is a shut-down, not part of the run.
    elapsed:
      state.splits.quarterMile ??
      (state.clockStartTick === null
        ? 0
        : Math.max(0, (state.tick - state.clockStartTick) / SIM_HZ)),
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
    nitrousActive:state.nitrousActive,
    nitrousRemainingSeconds:state.nitrousRemainingSeconds,
    mechanicalStress:state.mechanicalStress,
    foul: state.foul,
    stagedDepthM: state.stagedPositionM,
    rolledThrough: state.positionM > 0 && state.clockStartTick === null,
    slip: runComplete ? buildTimingSlip(state) : null,
    replayVerified,
  };
}

export function useRaceSession(car: Car, tune: Tune, initialHistory:readonly TimingSlip[] = [],onPassStress?:(stress:number)=>void,onCompleted?:(slip:TimingSlip)=>void,appearance?:Appearance) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PassState>(createPassState(car, tune, 1));
  const recorderRef = useRef<TimelineRecorder>(new TimelineRecorder(1));
  const verifiedRef = useRef<boolean | null>(null);

  // The slider writes here every time it moves. The loop reads it every tick,
  // which keeps a 60Hz drag from having to re-render the component tree.
  const throttleRef = useRef(0);
  const draggingRef = useRef(false);
  const nitrousRef=useRef(false);
  const stressCallbackRef=useRef(onPassStress);
  const completedCallbackRef=useRef(onCompleted);
  useEffect(()=>{stressCallbackRef.current=onPassStress;},[onPassStress]);
  useEffect(()=>{completedCallbackRef.current=onCompleted;},[onCompleted]);
  /** Last value pushed to React, so the spring-back only re-renders on change. */
  const throttleShownRef = useRef(0);
  const [throttle, setThrottleState] = useState(0);

  /**
   * Bumped every time a pass is started.
   *
   * The render loop watches it and resets its own bookkeeping when it changes.
   * Without this the loop's timing accumulator survives a reset -- and since it
   * is only drained while a pass is running, a finished pass left sitting on
   * screen banks every millisecond of wall time until the next one is simulated
   * away in a single frame. Reset after a couple of minutes and the fresh pass
   * is consumed the instant it is created, which reads as the reset button
   * doing nothing at all.
   */
  const generationRef = useRef(0);

  const [snapshot, setSnapshot] = useState<RaceSnapshot>(() => snapshotOf(stateRef.current, null));

  /**
   * Every completed run this session, oldest first.
   *
   * Deliberately not persisted. Stage 9 gives the player an account and a
   * garage that outlives the tab; writing to local storage now would be a
   * second, throwaway answer to the same question.
   */
  const [history, setHistory] = useState<readonly TimingSlip[]>(initialHistory);

  const setThrottle = useCallback((value: number) => {
    draggingRef.current = true;
    throttleRef.current = value;
    throttleShownRef.current = value;
    setThrottleState(value);
  }, []);

  /** Let go of the slider: the throttle springs shut on its own from here. */
  const releaseThrottle = useCallback(() => {
    draggingRef.current = false;
  }, []);
  const setNitrous=useCallback((active:boolean)=>{nitrousRef.current=active;},[]);

  const startPass = useCallback(() => {
    // The seed only decides how long the tree holds before the ambers. Drawn
    // here rather than in game-core, which must stay free of Math.random so a
    // pass stays reproducible from its seed.
    const seed = Math.floor(Math.random() * 0x7fffffff);
    stateRef.current = createPassState(car, tune, seed);
    recorderRef.current = new TimelineRecorder(seed);
    verifiedRef.current = null;
    throttleRef.current = 0;
    throttleShownRef.current = 0;
    draggingRef.current = false;
    nitrousRef.current=false;
    generationRef.current++;
    setThrottleState(0);
    setSnapshot(snapshotOf(stateRef.current, null));
  }, [car, tune]);

  // Restart whenever the car or tune changes, so the screen is never showing a
  // pass belonging to a different vehicle. The owning App retains completed
  // slips while this screen is unmounted; a build change clears them there.
  useEffect(() => {
    startPass();
  }, [startPass]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    /**
     * Match the backing store to the pixels the canvas actually occupies.
     *
     * A 960x600 buffer stretched by CSS to any other size is resampled by the
     * browser, and on a high-density display it is resampled again -- which is
     * why the canvas text looked soft next to the DOM text beside it, drawn at
     * native resolution. Sizing the buffer to (displayed box x devicePixelRatio)
     * and scaling the context by the same factor means every stroke lands on a
     * real device pixel while the drawing code goes on working in the 960x600
     * coordinates it was written in.
     */
    const applyScale = () => {
      const box = canvas.getBoundingClientRect();
      if (box.width <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(box.width * dpr);
      const height = Math.round((box.width * dpr * CANVAS_HEIGHT) / CANVAS_WIDTH);

      // Assigning either dimension clears the canvas and resets the context, so
      // only do it when something really changed.
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      lastDpr = dpr;
      ctx.setTransform(width / CANVAS_WIDTH, 0, 0, height / CANVAS_HEIGHT, 0, 0);
    };

    let lastDpr = window.devicePixelRatio || 1;
    applyScale();

    const observer = new ResizeObserver(applyScale);
    observer.observe(canvas);

    const keyboard = new KeyboardReader();
    const detach = keyboard.attach();

    let frameHandle = 0;
    const clock = new FrameClock(performance.now());
    let frameCount = 0;
    let resetHeld = false;
    let finishHandled = false;
    let generation = generationRef.current;
    let lastPhase: RacePhase = stateRef.current.phase;

    const loop = (now: number) => {
      frameHandle = requestAnimationFrame(loop);

      // Dragging the window to a display of a different density changes this
      // without changing the element's size, so the observer never fires.
      if (window.devicePixelRatio !== lastDpr) applyScale();

      const keys = keyboard.read();
      if (keys.reset && !resetHeld) startPass();
      resetHeld = keys.reset;

      // A new pass -- from either the key or the button -- clears everything
      // the loop was carrying about the old one.
      if (generation !== generationRef.current) {
        generation = generationRef.current;
        clock.reset(now);
        finishHandled = false;
        lastPhase = stateRef.current.phase;
      }

      const state = stateRef.current;
      const ticks = clock.advance(now, isPassComplete(state));

      for (let i = 0; i < ticks && !isPassComplete(state); i++) {
        // The throttle closes on its own once the slider is let go, the way a
        // sprung pedal does. Stepped alongside the simulation rather than on an
        // animation of its own, so it advances at exactly the rate the physics
        // sees.
        if (!draggingRef.current) {
          throttleRef.current = springThrottleClosed(throttleRef.current, TICK_MS);
        }

        const input: RaceInput = {
          // Quantised here, at the one place the value crosses into the
          // simulator, so a recorded pass stays compact and replays exactly.
          throttle: quantiseThrottle(throttleRef.current),
          brake: keys.brake,
          shiftUp: keys.shiftUp,
          shiftDown: keys.shiftDown,
          nitrous:keys.nitrous||nitrousRef.current,
        };

        recorderRef.current.record(state.tick, input);
        stepPass(state, input);
      }

      // The slider is a controlled component, so the spring has to reach React
      // to be seen. Compared at display precision, so a closing throttle
      // re-renders about a hundred times rather than once per tick.
      const shown = quantiseThrottle(throttleRef.current);
      if (!draggingRef.current && shown !== throttleShownRef.current) {
        throttleShownRef.current = shown;
        setThrottleState(shown);
      }

      drawRace(ctx, state,appearance);

      const justFinished = isRunComplete(state) && !finishHandled;
      if (justFinished) {
        finishHandled = true;
        verifiedRef.current = verifyReplay(state);
        // Recorded the moment the run is done rather than on the next reset, so
        // a player who coasts off into the shut-down area and closes the tab
        // still made the pass.
        const completedSlip=buildTimingSlip(state);
        setHistory((previous) => [...previous, completedSlip]);
        stressCallbackRef.current?.(state.mechanicalStress);
        completedCallbackRef.current?.(completedSlip);
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
      // A pass that timed out never raced. Replaying it would re-simulate the
      // full timeout synchronously -- minutes of ticks in one frame -- to check
      // a slip with nothing on it.
      if (live.incomplete) return null;
      const again = replayPass(car, tune, recorderRef.current.build()).slip;
      return JSON.stringify(live) === JSON.stringify(again);
    }

    frameHandle = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameHandle);
      observer.disconnect();
      detach();
    };
  }, [appearance,car, tune, startPass]);

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    canvasRef,
    snapshot,
    history,
    clearHistory,
    startPass,
    throttle,
    setThrottle,
    releaseThrottle,
    setNitrous,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  };
}
