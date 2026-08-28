import { useEffect } from 'react';
import { lastRunWasBestEt, type Car, type RacePhase, type TimingSlip, type Tune } from '@nitto/game-core';
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

export function RaceTrackScreen({
  car,
  tune,
  fittedPartCount = 0,
  initialHistory = [],
  onHistoryChange,
  onPassStress,
  opponent,
  onCompleted,
}: {
  car: Car;
  tune: Tune;
  fittedPartCount?: number;
  initialHistory?: readonly TimingSlip[];
  onHistoryChange?: (history: readonly TimingSlip[]) => void;
  onPassStress?:(stress:number)=>void;
  opponent?:{name:string;difficulty:string;slip:TimingSlip;settled:boolean;won?:boolean};
  onCompleted?:(slip:TimingSlip)=>void;
}) {
  /**
   * One source for the heading and for the slip.
   *
   * They used to disagree: the heading read the build, while the slip had
   * "STOCK — NO PARTS FITTED" painted into the image with nothing threaded
   * through to contradict it. A modified car handed out a slip claiming it was
   * standard, and the slip is the thing players share.
   */
  const modified = fittedPartCount > 0;
  const buildLabel = modified
    ? `MODIFIED — ${fittedPartCount} PART${fittedPartCount === 1 ? '' : 'S'} FITTED`
    : 'STOCK — NO PARTS FITTED';

  const {
    canvasRef,
    snapshot,
    history,
    clearHistory,
    startPass,
    throttle,
    setThrottle,
    releaseThrottle,
    setNitrous,
  } = useRaceSession(car, tune, initialHistory,onPassStress,onCompleted);

  useEffect(()=>{onHistoryChange?.(history);},[history,onHistoryChange]);

  const runComplete = snapshot.slip !== null;
  const newBest = runComplete && lastRunWasBestEt(history);

  const prompt = snapshot.rolledThrough
    ? 'Rolled through the stage line — select R and back up into the window.'
    : PROMPTS[snapshot.phase];

  return (
    <div className="screen screen--race">
      <div className="race__viewport">
        <canvas
          ref={canvasRef}
          className="race__canvas"
          aria-label="Drag strip, viewed from behind the car"
        />
        <ThrottleSlider value={throttle} onChange={setThrottle} onRelease={releaseThrottle} />
        {car.nitrous&&<button className={`nitrous-trigger${snapshot.nitrousActive?' nitrous-trigger--active':''}`} type="button" onPointerDown={()=>setNitrous(true)} onPointerUp={()=>setNitrous(false)} onPointerLeave={()=>setNitrous(false)}><strong>N₂O</strong><span>{snapshot.nitrousRemainingSeconds.toFixed(1)} sec</span></button>}
        {opponent&&<aside className={`cpu-race-strip${opponent.settled?(opponent.won?' cpu-race-strip--win':' cpu-race-strip--loss'):''}`}><span>{opponent.difficulty} CPU</span><strong>{opponent.name}</strong><b>{opponent.settled?opponent.won?'YOU WIN':'YOU LOSE':'OPPONENT STAGED'}</b><small>{opponent.settled?`${opponent.slip.quarterMileEt.toFixed(3)} @ ${opponent.slip.quarterMileMph.toFixed(1)} mph`:'Time hidden until finish'}</small></aside>}
      </div>

      <div className="race-status" aria-label="Selected car and account status">
        <div className="race-status__car">
          <span>Selected car:</span>
          <img src={`${import.meta.env.BASE_URL}assets/race-civic-ek-rear-v2.webp`} alt="" />
          <strong>{car.displayName}</strong>
          <small>{modified ? `${fittedPartCount} parts fitted` : 'Stock'}</small>
        </div>
        <div className="race-status__account">Edit my account</div>
        <div className="race-status__challenge">No new challenge info</div>
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
        <span className="tag">{opponent?`${opponent.name} · ${opponent.difficulty.toUpperCase()} CPU`:'Solo test pass'}</span>
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
              {car.nitrous&&<><br/><kbd>N</kbd> Hold nitrous spray</>}
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
              <TimingSlipCard
                slip={snapshot.slip}
                carName={car.displayName}
                buildLabel={buildLabel}
              />
            </div>
          </section>
        )}

        <RunHistoryPanel runs={history} onClear={clearHistory} />

        <DebugPanel snapshot={snapshot} />
      </div>
    </div>
  );
}
