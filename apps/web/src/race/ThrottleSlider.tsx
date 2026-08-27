import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './renderer/layout.js';
import { GAS_SLIDER } from './renderer/cluster.js';

interface ThrottleSliderProps {
  /** Current opening, 0 at the bottom to 1 at the top. */
  value: number;
  onChange: (value: number) => void;
  /** Called when the slider is let go, so the throttle can spring shut. */
  onRelease: () => void;
}

/**
 * The gas pedal: an invisible drag surface sitting over the canvas.
 *
 * The cluster paints the pedal, because it belongs to the instrument panel and
 * has to move with it. But pointer capture, focus and assistive technology are
 * all things the DOM already does properly and a canvas does not, so the
 * control itself stays a DOM element -- positioned in percentages over the
 * canvas region the cluster draws into, so the two cannot drift apart.
 *
 * Sprung, like a real throttle: let go and it closes over about a second. The
 * component only reports the release; the closing happens in the simulation
 * loop, in step with the physics rather than on an animation of its own.
 */
export function ThrottleSlider({ value, onChange, onRelease }: ThrottleSliderProps) {
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
    onRelease();
  };

  const percent = Math.round(value * 100);

  // Positioned as a share of the canvas, which is itself scaled by CSS. Doing
  // it in percentages means the hit area tracks the drawn pedal at any size.
  const style = {
    left: `${(GAS_SLIDER.x / CANVAS_WIDTH) * 100}%`,
    top: `${(GAS_SLIDER.y / CANVAS_HEIGHT) * 100}%`,
    width: `${(GAS_SLIDER.w / CANVAS_WIDTH) * 100}%`,
    height: `${(GAS_SLIDER.h / CANVAS_HEIGHT) * 100}%`,
  };

  return (
    <div
      ref={trackRef}
      className="throttle-grip"
      style={style}
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
    />
  );
}
