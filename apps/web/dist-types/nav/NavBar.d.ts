import { type ScreenId } from './screens.js';
interface NavBarProps {
    active: ScreenId;
    onNavigate: (screen: ScreenId) => void;
}
/** The period top navigation: seven equal tabs, no menus, no drawers. */
export declare function NavBar({ active, onNavigate }: NavBarProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=NavBar.d.ts.map