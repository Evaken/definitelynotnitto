import type { ScreenId } from '../nav/screens.js';
import { SCREEN_LABELS, SCREEN_STAGE } from '../nav/screens.js';

interface PlaceholderScreenProps {
  screen: ScreenId;
  summary: string;
}

/**
 * A screen that exists but is not built yet.
 *
 * It says which stage fills it in, so the app is honest about what works rather
 * than showing a convincing but dead interface.
 */
export function PlaceholderScreen({ screen, summary }: PlaceholderScreenProps) {
  return (
    <div className="screen">
      <section className="panel">
        <h2 className="panel__heading">{SCREEN_LABELS[screen]}</h2>
        <div className="panel__body">
          <p className="placeholder">
            {summary}
            <br />
            <br />
            Built in <code>{SCREEN_STAGE[screen]}</code>. See <code>ROADMAP.md</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
