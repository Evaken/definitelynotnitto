import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { NavBar } from './nav/NavBar.js';
import { PlaceholderScreen } from './screens/PlaceholderScreen.js';
import { RaceTrackScreen } from './screens/RaceTrackScreen.js';
/**
 * The game shell: a bounded canvas with the original's seven tabs.
 *
 * Only the Race Track is built in Stage 1. The rest are honest placeholders
 * naming the stage that fills them in (PROJECT_SPEC 11.4 -- later stages must
 * not be scaffolded early).
 */
const PLACEHOLDER_SUMMARIES = {
    main: 'Player summary, cash, record and news.',
    challenge: 'Incoming, outgoing and completed asynchronous challenges.',
    garage: 'Owned cars, installed parts, specifications and best times.',
    parts: 'Buy and fit individual parts. Compatibility and exclusions enforced here.',
    showroom: 'Browse and buy the car roster.',
    team: 'Create or join a team, team funds, and team races.',
};
export function App() {
    const [screen, setScreen] = useState('track');
    return (_jsxs("div", { className: "shell", children: [_jsxs("header", { className: "shell__masthead", children: [_jsx("h1", { className: "shell__title", children: "Nitto 1320 Challenge" }), _jsx("span", { className: "shell__stage", children: "Stage 1 \u00B7 Drag Race Simulator" })] }), _jsx(NavBar, { active: screen, onNavigate: setScreen }), screen === 'track' ? (_jsx(RaceTrackScreen, {})) : (_jsx(PlaceholderScreen, { screen: screen, summary: PLACEHOLDER_SUMMARIES[screen] ?? '' }))] }));
}
//# sourceMappingURL=App.js.map