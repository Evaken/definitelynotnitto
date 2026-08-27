import { SCREENS, SCREEN_LABELS, type ScreenId } from './screens.js';

interface NavBarProps {
  active: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

/** The period top navigation: seven equal tabs, no menus, no drawers. */
export function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav className="nav">
      {SCREENS.map((screen) => (
        <button
          key={screen}
          type="button"
          className={`nav__tab${screen === active ? ' nav__tab--active' : ''}`}
          aria-current={screen === active ? 'page' : undefined}
          onClick={() => onNavigate(screen)}
        >
          {SCREEN_LABELS[screen]}
        </button>
      ))}
    </nav>
  );
}
