import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

interface ThrottleSliderProps {
  /** Current opening, 0 at the bottom to 1 at the top. */
  value: number;
  onChange: (value: number) => void;
}

/**
 * The throttle: a slider dragged by hand, and the only way to open it.
 *
 * How far and how fast it is pushed is the launch.  Snapping it wide open from
 * a standstill drops the clutch while the engine is still at idle; feeding it
 * in rolls the car gently enough to stage.  A keyboard cannot express that,
 * which is why the throttle is deliberately not bound to one.
 *
 * The value stays where it is left rather than springing back, so a run does
 * not need the pointer held down for fifteen seconds.
 */
export function ThrottleSlider({ value, onChange }: ThrottleSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  /** Which pointer is currently dragging, if any. */
  const draggingRef = useRef<number | null>(null);

  const applyFromPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.height <= 0) return;

      // Top of the track is fully open, bottom is closed.
      const fraction = 1 - (clientY - rect.top) / rect.height;
      // Quantised to hundredths to match what the simulator records: a dragged
      // slider emits a different float every frame otherwise, which bloats a
      // recorded pass and invites drift between a run and its replay.
      onChange(Math.round(Math.min(1, Math.max(0, fraction)) * 100) / 100);
    },
    [onChange],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = event.pointerId;
    // Move the throttle first and capture second. Capture is a convenience --
    // it keeps the drag alive when the pointer wanders off the track -- but it
    // can refuse, and the throttle must not depend on it having worked.
    applyFromPointer(event.clientY);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Dragging still works, just not beyond the edges of the control.
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== event.pointerId) return;
    applyFromPointer(event.clientY);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== event.pointerId) return;
    draggingRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Nothing to release.
    }
  };

  const percent = Math.round(value * 100);

  return (
    <div className="throttle">
      <div className="throttle__label">Throttle</div>
      <div
        ref={trackRef}
        className="throttle__track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="slider"
        aria-label="Throttle"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent} percent throttle`}
      >
        <div className="throttle__fill" style={{ height: `${percent}%` }} />
        <div className="throttle__handle" style={{ bottom: `calc(${percent}% - 6px)` }} />
        {[100, 75, 50, 25, 0].map((mark) => (
          <div key={mark} className="throttle__tick" style={{ bottom: `${mark}%` }} />
        ))}
      </div>
      <div className="throttle__readout">{percent}%</div>
    </div>
  );
}
