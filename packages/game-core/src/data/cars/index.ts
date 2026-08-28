import type { Car } from '../../types/car.js';
import { CIVIC_SI } from './civic-si.js';
import { CORE_ROSTER,SPECIAL_ROSTER } from './roster.js';

/**
 * Every car in the game, by id.
 *
 * Stage 1 ships the Civic Si alone.  The rest of the roster arrives in Stage 7,
 * and adding one should mean adding a file here and nothing else.
 */
export const CARS: ReadonlyMap<string, Car> = new Map([CIVIC_SI,...CORE_ROSTER,...SPECIAL_ROSTER].map(car=>[car.id,car]));

export function getCar(id: string): Car {
  const car = CARS.get(id);
  if (!car) throw new Error(`Unknown car id: ${id}`);
  return car;
}

export { CIVIC_SI };
export { CORE_ROSTER,SPECIAL_ROSTER };
