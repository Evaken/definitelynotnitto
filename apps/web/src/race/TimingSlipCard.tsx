import type { TimingSlip } from '@nitto/game-core';

interface TimingSlipCardProps {
  slip: TimingSlip;
  carName: string;
}

/**
 * The slip handed over at the end of a run, laid out like a real one: printed
 * on paper, splits down the page, elapsed time and speed at the bottom.
 */
export function TimingSlipCard({ slip, carName }: TimingSlipCardProps) {
  if (slip.incomplete) {
    return (
      <div className="slip">
        <h3 className="slip__heading">Time Slip</h3>
        <p className="slip__subheading">{carName}</p>
        <div className="slip__row">
          <span>Run not completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="slip">
      <h3 className="slip__heading">Time Slip</h3>
      <p className="slip__subheading">{carName} &middot; Quarter Mile</p>

      <Row label="R/T" value={slip.reactionTime.toFixed(3)} />
      <Row label="60 ft" value={slip.sixtyFoot.toFixed(3)} />
      <Row label="330 ft" value={slip.threeThirty.toFixed(3)} />
      <Row label="1/8 ET" value={slip.eighthMileEt.toFixed(3)} />
      <Row label="1/8 MPH" value={slip.eighthMileMph.toFixed(2)} />
      <Row label="1000 ft" value={slip.thousandFoot.toFixed(3)} />

      <div className="slip__row slip__row--total">
        <span>1/4 ET</span>
        <span>{slip.quarterMileEt.toFixed(3)}</span>
      </div>
      <div className="slip__row slip__row--total">
        <span>1/4 MPH</span>
        <span>{slip.quarterMileMph.toFixed(2)}</span>
      </div>

      {slip.foul && <div className="slip__foul">Red Light &mdash; Foul</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="slip__row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
