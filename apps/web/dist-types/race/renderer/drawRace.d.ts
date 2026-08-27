import { type PassState } from '@nitto/game-core';
/**
 * Draws one frame of the race.
 *
 * Pure rendering: it reads simulation state and produces pixels, and never
 * writes back.  Keeping it out of React means the scene can redraw every frame
 * without the component tree being involved (PROJECT_SPEC 6.1).
 */
export declare function drawRace(ctx: CanvasRenderingContext2D, state: PassState): void;
//# sourceMappingURL=drawRace.d.ts.map