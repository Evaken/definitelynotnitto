import { DEFAULT_BINDINGS } from '@nitto/game-core';
const bindingSets = {
    throttle: new Set(DEFAULT_BINDINGS.throttle),
    launchShift: new Set(DEFAULT_BINDINGS.launchShift),
    shiftDown: new Set(DEFAULT_BINDINGS.shiftDown),
    reset: new Set(DEFAULT_BINDINGS.reset),
};
/** Keys the browser would otherwise use to scroll the page. */
const SWALLOWED = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
export class KeyboardReader {
    held = new Set();
    /** Starts listening. Returns the function that stops it again. */
    attach(target = window) {
        const down = (event) => {
            const key = event.key;
            if (SWALLOWED.has(key))
                event.preventDefault();
            this.held.add(key);
        };
        const up = (event) => {
            this.held.delete(event.key);
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
    read() {
        return {
            throttle: this.anyHeld(bindingSets.throttle),
            launchShift: this.anyHeld(bindingSets.launchShift),
            shiftDown: this.anyHeld(bindingSets.shiftDown),
            reset: this.anyHeld(bindingSets.reset),
        };
    }
    anyHeld(keys) {
        for (const key of this.held) {
            if (keys.has(key))
                return true;
        }
        return false;
    }
}
//# sourceMappingURL=keyboard.js.map