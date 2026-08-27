import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SCREEN_LABELS, SCREEN_STAGE } from '../nav/screens.js';
/**
 * A screen that exists but is not built yet.
 *
 * It says which stage fills it in, so the app is honest about what works rather
 * than showing a convincing but dead interface.
 */
export function PlaceholderScreen({ screen, summary }) {
    return (_jsx("div", { className: "screen", children: _jsxs("section", { className: "panel", children: [_jsx("h2", { className: "panel__heading", children: SCREEN_LABELS[screen] }), _jsx("div", { className: "panel__body", children: _jsxs("p", { className: "placeholder", children: [summary, _jsx("br", {}), _jsx("br", {}), "Built in ", _jsx("code", { children: SCREEN_STAGE[screen] }), ". See ", _jsx("code", { children: "ROADMAP.md" }), "."] }) })] }) }));
}
//# sourceMappingURL=PlaceholderScreen.js.map