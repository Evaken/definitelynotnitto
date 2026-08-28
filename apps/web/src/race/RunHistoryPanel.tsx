import { bestRuns, type TimingSlip } from '@nitto/game-core';

interface RunHistoryPanelProps {
  runs: readonly TimingSlip[];
  onClear: () => void;
}

/**
 * Every pass made this session, newest first, with the session bests called out.
 *
 * A single run in isolation says almost nothing -- the whole point of a drag
 * strip is that you go again. Keeping the previous times on screen is what turns
 * "that felt better" into a number, and it is what the launch and shift
 * decisions in BALANCE_NOTES.md are actually for.
 */
export function RunHistoryPanel({ runs, onClear }: RunHistoryPanelProps) {
  const best = bestRuns(runs);
  const completed = runs.filter((run) => !run.incomplete).length;

  return (
    <section className="panel">
      <h3 className="panel__heading">
        Run History
        {completed > 0 && <span className="panel__count">{completed}</span>}
      </h3>
      <div className="panel__body">
        {runs.length === 0 ? (
          <p className="placeholder" style={{ marginBottom: 0 }}>
            No runs yet. Stage the car, take the tree and the times will collect here.
          </p>
        ) : (
          <>
            <dl className="bests">
              <Best label="Best ET" run={runs[best.quarterMileEt ?? -1]} format={(s) => s.quarterMileEt.toFixed(3)} />
              <Best label="Best MPH" run={runs[best.quarterMileMph ?? -1]} format={(s) => s.quarterMileMph.toFixed(2)} />
              <Best label="Best 60 ft" run={runs[best.sixtyFoot ?? -1]} format={(s) => s.sixtyFoot.toFixed(3)} />
              <Best label="Best R/T" run={runs[best.reactionTime ?? -1]} format={(s) => s.reactionTime.toFixed(3)} />
            </dl>

            <table className="runs">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">R/T</th>
                  <th scope="col">60 ft</th>
                  <th scope="col">1/4 ET</th>
                  <th scope="col">MPH</th>
                </tr>
              </thead>
              <tbody>
                {runs
                  .map((run, index) => ({ run, index }))
                  .reverse()
                  .map(({ run, index }) => (
                    <tr
                      key={index}
                      className={index === best.quarterMileEt ? 'runs__row--best' : undefined}
                    >
                      <th scope="row">{index + 1}</th>
                      <td className={run.foul ? 'runs__foul' : undefined}>
                        {run.reactionTime.toFixed(3)}
                        {run.foul && <span className="runs__flag" title="Red light">RED</span>}
                      </td>
                      <td>{run.sixtyFoot.toFixed(3)}</td>
                      <td>{run.quarterMileEt.toFixed(3)}</td>
                      <td>{run.quarterMileMph.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <button type="button" className="button button--secondary" onClick={onClear}>
              Clear history
            </button>
            <p className="placeholder" style={{ marginBottom: 0, marginTop: 8 }}>
              Times last as long as the tab does. Persistent garages arrive in Stage 9.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Best({
  label,
  run,
  format,
}: {
  label: string;
  run: TimingSlip | undefined;
  format: (slip: TimingSlip) => string;
}) {
  return (
    <div className="bests__item">
      <dt>{label}</dt>
      <dd>{run ? format(run) : '--'}</dd>
    </div>
  );
}
