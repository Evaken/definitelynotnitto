import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Development-only telemetry (PROJECT_SPEC Stage 1).
 *
 * Shows the values that explain why a pass went the way it did -- particularly
 * grip against demanded force, which is the difference between hooking up and
 * going up in smoke.
 */
export function DebugPanel({ snapshot }) {
    if (!import.meta.env.DEV)
        return null;
    return (_jsxs("section", { className: "panel", children: [_jsx("h3", { className: "panel__heading", children: "Debug Telemetry" }), _jsxs("div", { className: "panel__body debug", children: [_jsx(Row, { label: "Phase", value: snapshot.phase }), _jsx(Row, { label: "Elapsed", value: `${snapshot.elapsed.toFixed(3)} s` }), _jsx(Row, { label: "RPM", value: snapshot.rpm.toFixed(0), alert: snapshot.limiterActive }), _jsx(Row, { label: "Gear", value: snapshot.shifting ? 'shifting' : String(snapshot.gear) }), _jsx(Row, { label: "Speed", value: `${snapshot.speedMph.toFixed(1)} mph` }), _jsx(Row, { label: "Distance", value: `${snapshot.distanceFt.toFixed(1)} ft` }), _jsx(Row, { label: "Wheel torque", value: `${snapshot.wheelTorqueNm.toFixed(0)} Nm` }), _jsx(Row, { label: "Grip available", value: `${snapshot.gripLimitN.toFixed(0)} N` }), _jsx(Row, { label: "Tractive force", value: `${snapshot.tractiveForceN.toFixed(0)} N` }), _jsx(Row, { label: "Slip ratio", value: snapshot.slipRatio.toFixed(3), alert: snapshot.wheelspin }), _jsx(Row, { label: "Wheelspin", value: snapshot.wheelspin ? 'YES' : 'no', alert: snapshot.wheelspin }), _jsx(Row, { label: "Clutch", value: snapshot.clutchLocked ? 'locked' : `${(snapshot.clutchEngagement * 100).toFixed(0)}%` }), _jsx(Row, { label: "Limiter", value: snapshot.limiterActive ? 'CUT' : 'off', alert: snapshot.limiterActive }), _jsx(Row, { label: "Stage depth", value: snapshot.stagedDepthM === null ? '--' : `${(snapshot.stagedDepthM * 100).toFixed(1)} cm` }), snapshot.replayVerified !== null && (_jsx(Row, { label: "Replay check", value: snapshot.replayVerified ? 'deterministic' : 'MISMATCH', alert: !snapshot.replayVerified }))] })] }));
}
function Row({ label, value, alert }) {
    return (_jsxs("div", { className: "debug__row", children: [_jsx("span", { className: "debug__label", children: label }), _jsx("span", { className: `debug__value${alert ? ' debug__value--alert' : ''}`, children: value })] }));
}
//# sourceMappingURL=DebugPanel.js.map