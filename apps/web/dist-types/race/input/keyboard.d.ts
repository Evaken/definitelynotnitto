import { type RaceInput } from '@nitto/game-core';
/**
 * Reads the keyboard into the shape the simulator wants.
 *
 * Held state rather than events: the simulator asks what is being held on every
 * tick and works out presses itself, which keeps a recorded pass replayable.
 *
 * Bindings come from game-core config because the original's control scheme is
 * not confirmed and will likely need correcting -- see HISTORICAL_NOTES.md.
 */
export interface KeyboardState extends RaceInput {
    readonly reset: boolean;
}
export declare class KeyboardReader {
    private readonly held;
    /** Starts listening. Returns the function that stops it again. */
    attach(target?: GlobalEventHandlers): () => void;
    read(): KeyboardState;
    private anyHeld;
}
//# sourceMappingURL=keyboard.d.ts.map