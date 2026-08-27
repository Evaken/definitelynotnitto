import type { TimingSlip } from '@nitto/game-core';
interface TimingSlipCardProps {
    slip: TimingSlip;
    carName: string;
}
/**
 * The slip handed over at the end of a run, laid out like a real one: printed
 * on paper, splits down the page, elapsed time and speed at the bottom.
 */
export declare function TimingSlipCard({ slip, carName }: TimingSlipCardProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=TimingSlipCard.d.ts.map