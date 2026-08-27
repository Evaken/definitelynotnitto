import { DEFAULT_BINDINGS, type RaceInput } from '@nitto/game-core';

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

const bindingSets = {
  throttle: new Set<string>(DEFAULT_BINDINGS.throttle),
  launchShift: new Set<string>(DEFAULT_BINDINGS.launchShift),
  shiftDown: new Set<string>(DEFAULT_BINDINGS.shiftDown),
  reset: new Set<string>(DEFAULT_BINDINGS.reset),
};

/** Keys the browser would otherwise use to scroll the page. */
const SWALLOWED = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);

export class KeyboardReader {
  private readonly held = new Set<string>();

  /** Starts listening. Returns the function that stops it again. */
  attach(target: GlobalEventHandlers = window): () => void {
    const down = (event: Event) => {
      const key = (event as KeyboardEvent).key;
      if (SWALLOWED.has(key)) event.preventDefault();
      this.held.add(key);
    };
    const up = (event: Event) => {
      this.held.delete((event as KeyboardEvent).key);
    };
    // Keys held when the window loses focus would otherwise stay stuck down.
    const clear = () => this.held.clear();

    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    window.addEventListener('blur', clear);

    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      this.held.clear();
    };
  }

  read(): KeyboardState {
    return {
      throttle: this.anyHeld(bindingSets.throttle),
      launchShift: this.anyHeld(bindingSets.launchShift),
      shiftDown: this.anyHeld(bindingSets.shiftDown),
      reset: this.anyHeld(bindingSets.reset),
    };
  }

  private anyHeld(keys: ReadonlySet<string>): boolean {
    for (const key of this.held) {
      if (keys.has(key)) return true;
    }
    return false;
  }
}
