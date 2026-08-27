import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { CIVIC_SI, stockTune } from '@nitto/game-core';
import { useRaceSession } from '../race/useRaceSession.js';
import { DebugPanel } from '../race/DebugPanel.js';
import { TimingSlipCard } from '../race/TimingSlipCard.js';
/**
 * The Race Track: stage the car, take the tree, run the quarter.
 *
 * Stage 1 races a stock Civic Si alone against the clock. Opponents are Stage 6
 * and beyond.
 */
/** What to tell the driver to do next. */
const PROMPTS = {
    approach: 'Hold THROTTLE to roll up to the beams.',
    prestaged: 'Pre-staged. Ease forward to light the stage beam.',
    staged: 'Staged. Hold THROTTLE to build launch rpm.',
    tree: 'Tree is running — hit LAUNCH on the green.',
    launched: 'Go!',
    running: 'Shift at the top of each gear.',
    finished: 'Run complete. Press R to run again.',
};
export function RaceTrackScreen() {
    const car = CIVIC_SI;
    // Memoised so the session is not torn down and restarted on every render.
    const tune = useMemo(() => stockTune(car), [car]);
    const { canvasRef, snapshot, startPass, width, height } = useRaceSession(car, tune);
    return (_jsx("div", { className: "screen", children: _jsxs("div", { className: "race", children: [_jsxs("div", { children: [_jsx("section", { className: "panel", style: { marginBottom: 0 }, children: _jsxs("h2", { className: "panel__heading", children: ["Race Track \u2014 ", car.manufacturer, " ", car.displayName, " \u2014 Stock"] }) }), _jsx("canvas", { ref: canvasRef, className: "race__canvas", width: width, height: height, "aria-label": "Drag strip" }), _jsx("p", { className: "race__prompt", children: PROMPTS[snapshot.phase] }), _jsxs("div", { className: "race__actions", children: [_jsx("button", { type: "button", className: "button", onClick: startPass, children: "Reset Run" }), _jsx("span", { className: "tag", children: "Single car \u00B7 No opponent until Stage 6" })] })] }), _jsxs("div", { children: [_jsxs("section", { className: "panel", children: [_jsx("h3", { className: "panel__heading", children: "Controls" }), _jsxs("div", { className: "panel__body keymap", children: [_jsxs("div", { children: [_jsx("kbd", { children: "\u2191 / W" }), " Throttle"] }), _jsxs("div", { children: [_jsx("kbd", { children: "Space" }), " Launch, then shift up"] }), _jsxs("div", { children: [_jsx("kbd", { children: "\u2190 / A" }), " Shift down"] }), _jsxs("div", { children: [_jsx("kbd", { children: "R" }), " Reset run"] }), _jsxs("p", { className: "placeholder", style: { marginBottom: 0, marginTop: 8 }, children: ["Original key layout unconfirmed \u2014 see ", _jsx("code", { children: "HISTORICAL_NOTES.md" }), "."] })] })] }), snapshot.slip && (_jsxs("section", { className: "panel", children: [_jsx("h3", { className: "panel__heading", children: "Result" }), _jsx("div", { className: "panel__body", children: _jsx(TimingSlipCard, { slip: snapshot.slip, carName: car.displayName }) })] })), _jsx(DebugPanel, { snapshot: snapshot })] })] }) }));
}
//# sourceMappingURL=RaceTrackScreen.js.map