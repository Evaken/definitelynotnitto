import { useMemo } from 'react';
import { CIVIC_SI, stockTune, type RacePhase } from '@nitto/game-core';
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
const PROMPTS: Record<RacePhase, string> = {
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

  return (
    <div className="screen">
      <div className="race">
        <div>
          <section className="panel" style={{ marginBottom: 0 }}>
            <h2 className="panel__heading">
              Race Track &mdash; {car.manufacturer} {car.displayName} &mdash; Stock
            </h2>
          </section>

          <canvas
            ref={canvasRef}
            className="race__canvas"
            width={width}
            height={height}
            aria-label="Drag strip"
          />
          <p className="race__prompt">{PROMPTS[snapshot.phase]}</p>

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
                <kbd>&uarr; / W</kbd> Throttle
              </div>
              <div>
                <kbd>Space</kbd> Launch, then shift up
              </div>
              <div>
                <kbd>&larr; / A</kbd> Shift down
              </div>
              <div>
                <kbd>R</kbd> Reset run
              </div>
              <p className="placeholder" style={{ marginBottom: 0, marginTop: 8 }}>
                Original key layout unconfirmed &mdash; see <code>HISTORICAL_NOTES.md</code>.
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
