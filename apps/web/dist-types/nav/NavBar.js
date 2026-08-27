import { jsx as _jsx } from "react/jsx-runtime";
import { SCREENS, SCREEN_LABELS } from './screens.js';
/** The period top navigation: seven equal tabs, no menus, no drawers. */
export function NavBar({ active, onNavigate }) {
    return (_jsx("nav", { className: "nav", children: SCREENS.map((screen) => (_jsx("button", { type: "button", className: `nav__tab${screen === active ? ' nav__tab--active' : ''}`, "aria-current": screen === active ? 'page' : undefined, onClick: () => onNavigate(screen), children: SCREEN_LABELS[screen] }, screen))) }));
}
//# sourceMappingURL=NavBar.js.map