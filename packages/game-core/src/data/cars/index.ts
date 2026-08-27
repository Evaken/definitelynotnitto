import type { Car } from '../../types/car.js';
import { CIVIC_SI } from './civic-si.js';

/**
 * Every car in the game, by id.
 *
 * Stage 1 ships the Civic Si alone.  The rest of the roster arrives in Stage 7,
 * and adding one should mean adding a file here and nothing else.
 */
export const CARS: ReadonlyMap<string, Car> = new Map([[CIVIC_SI.id, CIVIC_SI]]);

export function getCar(id: string): Car {
  const car = CARS.get(id);
  if (!car) throw new Error(`Unknown car id: ${id}`);
  return car;
}

export { CIVIC_SI };
