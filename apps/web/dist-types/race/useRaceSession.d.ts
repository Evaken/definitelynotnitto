import { type Car, type RacePhase, type TimingSlip, type Tune } from '@nitto/game-core';
/**
 * Drives one pass: owns the fixed-step loop, the keyboard and the canvas.
 *
 * Everything that decides what the car does lives in game-core.  This hook only
 * moves data across the boundary -- keys in, pixels out -- which is what keeps
 * the simulation testable and, from Stage 10, re-runnable on a server
 * (PROJECT_SPEC 6.1).
 */
/** What the React tree needs to see. Read at a human rate, not every tick. */
export interface RaceSnapshot {
    readonly phase: RacePhase;
    readonly elapsed: number;
    readonly rpm: number;
    readonly gear: number;
    readonly speedMph: number;
    readonly distanceFt: number;
    readonly wheelTorqueNm: number;
    readonly gripLimitN: number;
    readonly tractiveForceN: number;
    readonly slipRatio: number;
    readonly wheelspin: boolean;
    readonly clutchEngagement: number;
    readonly clutchLocked: boolean;
    readonly limiterActive: boolean;
    readonly shifting: boolean;
    readonly foul: boolean;
    readonly stagedDepthM: number | null;
    readonly slip: TimingSlip | null;
    /**
     * Whether re-running the recorded inputs reproduced this pass exactly.
     * Checked only in development, and only once the pass is over: it is the
     * same verification the server will perform on a submitted race in Stage 10,
     * done here against real keyboard input rather than a scripted drive.
     */
    readonly replayVerified: boolean | null;
}
export declare function useRaceSession(car: Car, tune: Tune): {
    canvasRef: import("react").RefObject<HTMLCanvasElement | null>;
    snapshot: RaceSnapshot;
    startPass: () => void;
    width: number;
    height: number;
};
//# sourceMappingURL=useRaceSession.d.ts.map