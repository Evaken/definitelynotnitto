import { DEFAULT_BINDINGS } from '@nitto/game-core';

/**
 * Reads the keyboard.
 *
 * Gears and brakes only -- throttle comes from the slider, by hand.  Held state
 * rather than events: the simulator asks what is being held on every tick and
 * works out presses itself, which keeps a recorded pass replayable.
 *
 * Bindings come from game-core config because the original's control scheme is
 * not confirmed and will likely need correcting -- see HISTORICAL_NOTES.md.
 */

export interface KeyboardState {
  readonly shiftUp: boolean;
  readonly shiftDown: boolean;
  readonly brake: boolean;
  readonly reset: boolean;
  readonly nitrous:boolean;
}

const bindingSets = {
  shiftUp: new Set<string>(DEFAULT_BINDINGS.shiftUp),
  shiftDown: new Set<string>(DEFAULT_BINDINGS.shiftDown),
  brake: new Set<string>(DEFAULT_BINDINGS.brake),
  reset: new Set<string>(DEFAULT_BINDINGS.reset),
  nitrous:new Set<string>(DEFAULT_BINDINGS.nitrous),
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
      shiftUp: this.anyHeld(bindingSets.shiftUp),
      shiftDown: this.anyHeld(bindingSets.shiftDown),
      brake: this.anyHeld(bindingSets.brake),
      reset: this.anyHeld(bindingSets.reset),
      nitrous:this.anyHeld(bindingSets.nitrous),
    };
  }

  private anyHeld(keys: ReadonlySet<string>): boolean {
    for (const key of this.held) {
      if (keys.has(key)) return true;
    }
    return false;
  }
}
