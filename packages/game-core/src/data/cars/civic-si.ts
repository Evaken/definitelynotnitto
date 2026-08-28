import type { Car } from '../../types/car.js';

/**
 * Honda Civic Si Hatchback -- the starter car.
 *
 * The name is the original's: `docs/reference/garage-paint-shop.webp` and
 * `race-view-two-civics.webp` both show `Civic SI Hatchback` in the status bar,
 * and the render is unmistakably a sixth-generation EK hatchback rather than the
 * EP3 this project modelled until now.
 *
 * IMPORTANT: these figures are real-world approximations for a B16A2 -- the
 * 1.6 VTEC of the 1999-2000 Civic Si, 160hp at 7,600rpm and 111 lb-ft at
 * 7,000rpm -- and are NOT values recovered from Nitto 1320 Challenge. The
 * original game's stock Civic performance is still unknown and calibrating to it
 * is Stage 15's job. Until then this car is *plausible*, not *right*.
 *
 * What changed with the correction is which car it is plausible *as*. The old
 * K20A3 numbers described a car the original never had.
 */
export const CIVIC_SI: Car = {
  id: 'civic-si',
  displayName: 'Civic Si Hatchback',
  manufacturer: 'Honda',
  year: 1999,
  price: 12000,
  drivetrain: 'FWD',

  engine: {
    code: 'B16A2',
    idleRpm: 800,
    // The marked redline is 8,000; the fuel cut is a little past it, and the
    // limiter is what the simulation actually needs.
    redlineRpm: 8200,
    // Lighter reciprocating assembly than the 2.0 it replaces, which is part of
    // why it picks up revs the way it does.
    inertiaKgM2: 0.14,
    // A B16 makes its torque high and holds very little of it low down. The
    // step at 5,500 is VTEC crossover -- the defining feature of driving one,
    // and the reason gearing and shift points matter far more here than they
    // did on the EP3's flatter one.
    curve: [
      { rpm: 800, torqueNm: 98 },
      { rpm: 1000, torqueNm: 105 },
      { rpm: 2000, torqueNm: 128 },
      { rpm: 3000, torqueNm: 138 },
      { rpm: 4000, torqueNm: 143 },
      { rpm: 5000, torqueNm: 140 },
      { rpm: 5500, torqueNm: 143 },
      { rpm: 6000, torqueNm: 148 },
      { rpm: 6500, torqueNm: 151 },
      { rpm: 7000, torqueNm: 152 },
      { rpm: 7600, torqueNm: 149 },
      { rpm: 8000, torqueNm: 138 },
      { rpm: 8200, torqueNm: 130 },
    ],
  },

  // The S4C five-speed and 4.266 final drive that came behind this engine. Short
  // enough that the revs barely fall on a change, which is what keeps a 1.6
  // in its power band.
  gearbox: {
    gearRatios: [3.23, 2.105, 1.458, 1.107, 0.848],
    reverseRatio: 3.153,
    finalDrive: 4.266,
    driveEfficiency: 0.9,
  },

  tyres: {
    // 195/55R15, which works out at almost exactly the same rolling radius as
    // the EP3's wheel, so the rolling radius is unchanged by the correction.
    //
    // Grip above 1.0 looks high for a road tyre, but a drag surface is sticky
    // and the traction compound is part of why a strip time beats anything
    // achievable on the road.
    //
    // 1.05 rather than the 1.15 carried over from the EP3. That figure was
    // picked for a car 140kg heavier making 27Nm more, and against this engine
    // it is simply more grip than a stock B16 can overcome -- launch revs stopped
    // mattering entirely, because nothing the driver did could light the tyres
    // up. See BALANCE_NOTES.md for the sweep.
    radiusM: 0.3,
    peakGrip: 1.05,
    peakSlipRatio: 0.14,
    slidingGripFraction: 0.85,
    inertiaKgM2: 1.4,
  },

  chassis: {
    // An EK hatch is a small, light car -- around 140kg under the EP3, which
    // matters more off the line than the torque it gives away.
    massKg: 1150,
    wheelbaseM: 2.62,
    cgHeightM: 0.51,
    frontWeightBias: 0.62,
    dragCoefficient: 0.36,
    frontalAreaM2: 1.94,
    rollingResistance: 0.013,
  },
};
