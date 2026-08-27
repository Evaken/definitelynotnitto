import { useCallback, useEffect, useRef, useState } from 'react';
import { SIM_HZ, TimelineRecorder, buildTimingSlip, createPassState, displayGear, engineRpm, isPassComplete, metresToFeet, msToMph, replayPass, stepPass, } from '@nitto/game-core';
import { KeyboardReader } from './input/keyboard.js';
import { drawRace } from './renderer/drawRace.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './renderer/layout.js';
/** How many rendered frames pass between React updates. */
const FRAMES_PER_SNAPSHOT = 4;
/** Never simulate more than this much wall time in one frame. */
const MAX_FRAME_MS = 100;
const TICK_MS = 1000 / SIM_HZ;
function snapshotOf(state, replayVerified) {
    const complete = isPassComplete(state);
    return {
        phase: state.phase,
        elapsed: state.clockStartTick === null ? 0 : Math.max(0, (state.tick - state.clockStartTick) / SIM_HZ),
        rpm: engineRpm(state),
        gear: displayGear(state),
        speedMph: msToMph(state.speedMs),
        distanceFt: metresToFeet(state.positionM),
        wheelTorqueNm: state.wheelTorqueNm,
        gripLimitN: state.gripLimitN,
        tractiveForceN: state.tractiveForceN,
        slipRatio: state.slipRatio,
        wheelspin: state.wheelspin,
        clutchEngagement: state.clutchEngagement,
        clutchLocked: state.clutchLocked,
        limiterActive: state.limiterActive,
        shifting: state.shiftTicksRemaining > 0,
        foul: state.foul,
        stagedDepthM: state.stagedPositionM,
        slip: complete ? buildTimingSlip(state) : null,
        replayVerified,
    };
}
export function useRaceSession(car, tune) {
    const canvasRef = useRef(null);
    const stateRef = useRef(createPassState(car, tune, 1));
    const recorderRef = useRef(new TimelineRecorder(1));
    const verifiedRef = useRef(null);
    const [snapshot, setSnapshot] = useState(() => snapshotOf(stateRef.current, null));
    const startPass = useCallback(() => {
        // The seed only decides how long the tree holds before the ambers. Drawn
        // here rather than in game-core, which must stay free of Math.random so a
        // pass stays reproducible from its seed.
        const seed = Math.floor(Math.random() * 0x7fffffff);
        stateRef.current = createPassState(car, tune, seed);
        recorderRef.current = new TimelineRecorder(seed);
        verifiedRef.current = null;
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
        if (!canvas || !ctx)
            return;
        const keyboard = new KeyboardReader();
        const detach = keyboard.attach();
        let frameHandle = 0;
        let lastFrameMs = performance.now();
        let accumulator = 0;
        let frameCount = 0;
        let resetHeld = false;
        let finishHandled = false;
        let lastPhase = stateRef.current.phase;
        const loop = (now) => {
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
            const input = {
                throttle: keys.throttle,
                launchShift: keys.launchShift,
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
         * race in Stage 10, exercised here against real keyboard input rather than
         * the scripted drives the test suite uses.
         */
        function verifyReplay(state) {
            if (!import.meta.env.DEV)
                return null;
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
    return { canvasRef, snapshot, startPass, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
}
//# sourceMappingURL=useRaceSession.js.map