import { useMemo } from 'react';
import { CIVIC_SI, lastRunWasBestEt, stockTune, type RacePhase } from '@nitto/game-core';
import { useRaceSession } from '../race/useRaceSession.js';
import { DebugPanel } from '../race/DebugPanel.js';
import { ThrottleSlider } from '../race/ThrottleSlider.js';
import { TimingSlipCard } from '../race/TimingSlipCard.js';
import { RunHistoryPanel } from '../race/RunHistoryPanel.js';

/**
 * The Race Track: roll in, stage the car, take the tree, run the quarter.
 *
 * Viewed from behind the car looking down the strip, following
 * `docs/reference/race-view-two-civics.webp`. Stage 1 races a stock Civic Si
 * alone against the clock; the second lane stays empty until Stage 6.
 */

/** What to tell the driver to do next. */
const PROMPTS: Record<RacePhase, string> = {
  approach: 'Shift to 1st, then drag the gas pedal to roll toward the lines.',
  staged: 'Staged. Hold it there — the tree will arm shortly.',
  tree: 'Tree is armed. Watch for the green.',
  running: 'Go! Shift at the top of each gear.',
  shutdown: 'Through the traps — coasting down. Press R when you are ready to go again.',
  finished: 'Run complete. Press R, or Run Again, to go back to the line.',
};

export function RaceTrackScreen() {
  const car = CIVIC_SI;
  // Memoised so the session is not torn down and restarted on every render.
  const tune = useMemo(() => stockTune(car), [car]);

  const {
    canvasRef,
    snapshot,
    history,
    clearHistory,
    startPass,
    throttle,
    setThrottle,
    releaseThrottle,
    width,
    height,
  } = useRaceSession(car, tune);

  const runComplete = snapshot.slip !== null;
  const newBest = runComplete && lastRunWasBestEt(history);

  const prompt = snapshot.rolledThrough
    ? 'Rolled through the stage line — select R and back up into the window.'
    : PROMPTS[snapshot.phase];

  return (
    <div className="screen">
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
          aria-label="Drag strip, viewed from behind the car"
        />
        <ThrottleSlider value={throttle} onChange={setThrottle} onRelease={releaseThrottle} />
      </div>

      <p className="race__prompt">{prompt}</p>

      <div className="race__actions">
        <button
          type="button"
          className={runComplete ? 'button' : 'button button--secondary'}
          onClick={startPass}
        >
          {runComplete ? 'Run Again' : 'Reset Run'}
        </button>
        {newBest && <span className="tag tag--best">New best ET this session</span>}
        <span className="tag">Single car &middot; No opponent until Stage 6</span>
      </div>

      <div className="race__below">
        <section className="panel">
          <h3 className="panel__heading">Controls</h3>
          <div className="panel__body keymap">
            <div>
              <kbd>drag</kbd> Gas pedal &mdash; springs shut on release
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
              move. The clutch bar is a readout, not a control &mdash; see{' '}
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

        <RunHistoryPanel runs={history} onClear={clearHistory} />

        <DebugPanel snapshot={snapshot} />
      </div>
    </div>
  );
}
