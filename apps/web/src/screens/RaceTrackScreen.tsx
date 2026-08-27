import { useMemo } from 'react';
import { CIVIC_SI, stockTune, type RacePhase } from '@nitto/game-core';
import { useRaceSession } from '../race/useRaceSession.js';
import { DebugPanel } from '../race/DebugPanel.js';
import { ThrottleSlider } from '../race/ThrottleSlider.js';
import { TimingSlipCard } from '../race/TimingSlipCard.js';

/**
 * The Race Track: roll in, stage the car, take the tree, run the quarter.
 *
 * Stage 1 races a stock Civic Si alone against the clock. Opponents are Stage 6
 * and beyond.
 */

/** What to tell the driver to do next. */
const PROMPTS: Record<RacePhase, string> = {
  approach: 'Shift to 1st, then drag the throttle up to roll toward the lines.',
  staged: 'Staged. Hold it there — the tree will arm shortly.',
  tree: 'Tree is armed. Watch for the green.',
  running: 'Go! Shift at the top of each gear.',
  finished: 'Run complete. Press R to run again.',
};

export function RaceTrackScreen() {
  const car = CIVIC_SI;
  // Memoised so the session is not torn down and restarted on every render.
  const tune = useMemo(() => stockTune(car), [car]);

  const { canvasRef, snapshot, startPass, throttle, setThrottle, releaseThrottle, width, height } =
    useRaceSession(car, tune);

  const prompt = snapshot.rolledThrough
    ? 'Rolled through the stage line — select R and back up into the window.'
    : PROMPTS[snapshot.phase];

  return (
    <div className="screen">
      <div className="race">
        <div>
          <section className="panel" style={{ marginBottom: 0 }}>
            <h2 className="panel__heading">
              Race Track &mdash; {car.manufacturer} {car.displayName} &mdash; Stock
            </h2>
          </section>

          <div className="race__viewport">
            <canvas
              ref={canvasRef}
              className="race__canvas"
              width={width}
              height={height}
              aria-label="Drag strip"
            />
            <ThrottleSlider value={throttle} onChange={setThrottle} onRelease={releaseThrottle} />
          </div>

          <p className="race__prompt">{prompt}</p>

          <div className="race__actions">
            <button type="button" className="button" onClick={startPass}>
              Reset Run
            </button>
            <span className="tag">Single car &middot; No opponent until Stage 6</span>
          </div>
        </div>

        <div>
          <section className="panel">
            <h3 className="panel__heading">Controls</h3>
            <div className="panel__body keymap">
              <div>
                <kbd>drag</kbd> Throttle &mdash; springs shut on release
              </div>
              <div>
                <kbd>W</kbd> Gear up &nbsp;R &rarr; N &rarr; 1 &rarr; 2&hellip;
              </div>
              <div>
                <kbd>A</kbd> Gear down
              </div>
              <div>
                <kbd>S</kbd> Brake
              </div>
              <div>
                <kbd>R</kbd> Reset run
              </div>
              <p className="placeholder" style={{ marginBottom: 0, marginTop: 8 }}>
                The car starts in <strong>N</strong>. Select a gear <em>and</em> open the throttle to
                move. Original control scheme unconfirmed &mdash; see{' '}
                <code>HISTORICAL_NOTES.md</code>.
              </p>
            </div>
          </section>

          {snapshot.slip && (
            <section className="panel">
              <h3 className="panel__heading">Result</h3>
              <div className="panel__body">
                <TimingSlipCard slip={snapshot.slip} carName={car.displayName} />
              </div>
            </section>
          )}

          <DebugPanel snapshot={snapshot} />
        </div>
      </div>
    </div>
  );
}
