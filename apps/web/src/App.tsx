import { useState } from 'react';
import { NavBar } from './nav/NavBar.js';
import type { ScreenId } from './nav/screens.js';
import { PlaceholderScreen } from './screens/PlaceholderScreen.js';
import { RaceTrackScreen } from './screens/RaceTrackScreen.js';

/**
 * The game shell: a bounded canvas with the original's seven tabs.
 *
 * Only the Race Track is built in Stage 1. The rest are honest placeholders
 * naming the stage that fills them in (PROJECT_SPEC 11.4 -- later stages must
 * not be scaffolded early).
 */

const PLACEHOLDER_SUMMARIES: Partial<Record<ScreenId, string>> = {
  main: 'Player summary, cash, record and news.',
  challenge: 'Incoming, outgoing and completed asynchronous challenges.',
  garage: 'Owned cars, installed parts, specifications and best times.',
  parts: 'Buy and fit individual parts. Compatibility and exclusions enforced here.',
  showroom: 'Browse and buy the car roster.',
  team: 'Create or join a team, team funds, and team races.',
};

export function App() {
  const [screen, setScreen] = useState<ScreenId>('track');

  return (
    <div className="shell">
      <header className="shell__masthead">
        <h1 className="shell__title">Nitto 1320 Challenge</h1>
        <span className="shell__stage">Stage 1 &middot; Drag Race Simulator</span>
      </header>

      <NavBar active={screen} onNavigate={setScreen} />

      {screen === 'track' ? (
        <RaceTrackScreen />
      ) : (
        <PlaceholderScreen screen={screen} summary={PLACEHOLDER_SUMMARIES[screen] ?? ''} />
      )}
    </div>
  );
}
