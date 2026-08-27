import type { RaceSnapshot } from './useRaceSession.js';

interface DebugPanelProps {
  snapshot: RaceSnapshot;
}

/**
 * Development-only telemetry (PROJECT_SPEC Stage 1).
 *
 * Shows the values that explain why a pass went the way it did -- particularly
 * grip against demanded force, which is the difference between hooking up and
 * going up in smoke.
 */
export function DebugPanel({ snapshot }: DebugPanelProps) {
  if (!import.meta.env.DEV) return null;

  return (
    <section className="panel">
      <h3 className="panel__heading">Debug Telemetry</h3>
      <div className="panel__body debug">
        <Row label="Phase" value={snapshot.phase} />
        <Row label="Elapsed" value={`${snapshot.elapsed.toFixed(3)} s`} />
        <Row label="RPM" value={snapshot.rpm.toFixed(0)} alert={snapshot.limiterActive} />
        <Row label="Gear" value={snapshot.shifting ? 'shifting' : String(snapshot.gear)} />
        <Row label="Speed" value={`${snapshot.speedMph.toFixed(1)} mph`} />
        <Row label="Distance" value={`${snapshot.distanceFt.toFixed(1)} ft`} />
        <Row label="Wheel torque" value={`${snapshot.wheelTorqueNm.toFixed(0)} Nm`} />
        <Row label="Grip available" value={`${snapshot.gripLimitN.toFixed(0)} N`} />
        <Row label="Tractive force" value={`${snapshot.tractiveForceN.toFixed(0)} N`} />
        <Row
          label="Slip ratio"
          value={snapshot.slipRatio.toFixed(3)}
          alert={snapshot.wheelspin}
        />
        <Row label="Wheelspin" value={snapshot.wheelspin ? 'YES' : 'no'} alert={snapshot.wheelspin} />
        <Row
          label="Clutch"
          value={
            snapshot.clutchLocked ? 'locked' : `${(snapshot.clutchEngagement * 100).toFixed(0)}%`
          }
        />
        <Row label="Limiter" value={snapshot.limiterActive ? 'CUT' : 'off'} alert={snapshot.limiterActive} />
        <Row
          label="Stage depth"
          value={snapshot.stagedDepthM === null ? '--' : `${(snapshot.stagedDepthM * 100).toFixed(1)} cm`}
        />
        {snapshot.replayVerified !== null && (
          <Row
            label="Replay check"
            value={snapshot.replayVerified ? 'deterministic' : 'MISMATCH'}
            alert={!snapshot.replayVerified}
          />
        )}
      </div>
    </section>
  );
}

function Row({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="debug__row">
      <span className="debug__label">{label}</span>
      <span className={`debug__value${alert ? ' debug__value--alert' : ''}`}>{value}</span>
    </div>
  );
}
