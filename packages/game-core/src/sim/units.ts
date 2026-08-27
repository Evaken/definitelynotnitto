/**
 * Unit conversions.
 *
 * The simulation is SI internally.  These exist for the presentation boundary
 * and for the timing slip, which reads in feet and mph like a real one.
 */

export const RPM_PER_RAD_S = 60 / (2 * Math.PI);
export const RAD_S_PER_RPM = (2 * Math.PI) / 60;

export function radPerSecToRpm(omega: number): number {
  return omega * RPM_PER_RAD_S;
}

export function rpmToRadPerSec(rpm: number): number {
  return rpm * RAD_S_PER_RPM;
}

export function msToMph(metresPerSecond: number): number {
  return metresPerSecond * 2.2369362920544;
}

export function metresToFeet(metres: number): number {
  return metres / 0.3048;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Rounds to a fixed number of decimals, so results compare exactly. */
export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
