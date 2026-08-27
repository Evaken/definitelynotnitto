import type { Car } from '../../types/car.js';

/**
 * Honda Civic Si — the starter car.
 *
 * IMPORTANT: these figures are real-world approximations for a 2002-2005
 * EP3 Civic Si (K20A3), NOT values recovered from Nitto 1320 Challenge.  The
 * original game's stock Civic performance is unknown and calibrating to it is
 * explicitly Stage 15's job.  Until then this car is *plausible*, not *right*,
 * and the Stage 1 tests assert only wide sanity bands.
 *
 * Torque is flywheel torque in newton-metres.  The K20A3 makes roughly 160hp
 * at 6500rpm and 132 lb-ft at 5000rpm, which is the shape reproduced here.
 */
export const CIVIC_SI: Car = {
  id: 'civic-si',
  displayName: 'Civic Si',
  manufacturer: 'Honda',
  year: 2003,
  price: 12000,
  drivetrain: 'FWD',

  engine: {
    code: 'K20A3',
    idleRpm: 850,
    redlineRpm: 6800,
    inertiaKgM2: 0.16,
    curve: [
      { rpm: 800, torqueNm: 95 },
      { rpm: 1500, torqueNm: 132 },
      { rpm: 2500, torqueNm: 158 },
      { rpm: 3500, torqueNm: 168 },
      { rpm: 4500, torqueNm: 176 },
      { rpm: 5000, torqueNm: 179 },
      { rpm: 5500, torqueNm: 177 },
      { rpm: 6000, torqueNm: 172 },
      { rpm: 6500, torqueNm: 164 },
      { rpm: 6800, torqueNm: 155 },
    ],
  },

  gearbox: {
    gearRatios: [3.27, 2.13, 1.52, 1.15, 0.92],
    finalDrive: 4.39,
    driveEfficiency: 0.9,
  },

  tyres: {
    // Street tyres on a prepared strip. Grip above 1.0 looks high for a road
    // tyre but a drag surface is sticky and the traction compound is part of
    // why a strip time beats anything achievable on the road.
    radiusM: 0.3,
    peakGrip: 1.15,
    peakSlipRatio: 0.14,
    slidingGripFraction: 0.85,
    inertiaKgM2: 1.4,
  },

  chassis: {
    massKg: 1290,
    wheelbaseM: 2.57,
    cgHeightM: 0.53,
    frontWeightBias: 0.62,
    dragCoefficient: 0.34,
    frontalAreaM2: 2.07,
    rollingResistance: 0.013,
  },
};
