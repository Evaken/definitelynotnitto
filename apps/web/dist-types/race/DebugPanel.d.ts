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
export declare function DebugPanel({ snapshot }: DebugPanelProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=DebugPanel.d.ts.map