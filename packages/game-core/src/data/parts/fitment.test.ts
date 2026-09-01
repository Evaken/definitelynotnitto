import { describe, expect, it } from 'vitest';
import { getPart } from './index.js';
import { CARS } from '../cars/index.js';
import { createEmptyGarageState, buyCar, selectCar, buyPart, fitPart, partList, purchaseAndFitPart, type GarageState } from '../../garage.js';

/**
 * What fits what, and what "owning a part" means.
 *
 * Two separate questions that are easy to confuse:
 *
 * - Ownership is per vehicle. Buying an exhaust with the Mustang selected does
 *   not put one in the Viper's boot; it has to be bought again. That is what
 *   `OwnedCarState.ownedPartIds` is for.
 * - Fitment is whether the part goes on that engine at all. Only the
 *   supercharger parts restrict it, because a belt-driven blower needs a crank
 *   snout that a factory-turbocharged engine has already spoken for.
 */

function garageWith(carId: string, vehicleId: string): GarageState {
  const bought = buyCar({ ...createEmptyGarageState(5_000_000) }, carId, vehicleId);
  if (!bought.ok) throw new Error(bought.reason);
  return bought.state;
}

describe('what fits what', () => {
  it('lets the generic parts go on anything', () => {
    // An empty list means "no restriction". Only the blower parts name cars.
    const restricted = partList().filter((part) => part.compatibleCarIds.length > 0);
    expect(restricted.map((part) => part.id).sort()).toEqual(
      ['race-supercharger', 'street-supercharger', 'supercharger-bracket'],
    );
  });

  it('offers a supercharger on the naturally aspirated cars', () => {
    const naturally = [...CARS.values()].filter((car) => car.engine.forcedInduction === undefined);
    expect(naturally.length).toBeGreaterThan(0);
    for (const car of naturally) {
      expect(getPart('supercharger-bracket').compatibleCarIds, car.id).toContain(car.id);
    }
  });

  it('refuses one on a car that left the factory with a compressor', () => {
    const blown = [...CARS.values()].filter((car) => car.engine.forcedInduction !== undefined);
    expect(blown.length).toBeGreaterThan(0);
    for (const car of blown) {
      const state = garageWith(car.id, 'v1');
      const attempt = buyPart(state, 'supercharger-bracket');
      expect(attempt.ok, `${car.id} should refuse a blower`).toBe(false);
    }
  });

  it('derives the list from the roster rather than hardcoding it', () => {
    // A car added tomorrow has to be covered without anyone editing the parts
    // file. Every car is either on the list or factory-blown -- never neither.
    for (const car of CARS.values()) {
      const listed = getPart('street-supercharger').compatibleCarIds.includes(car.id);
      expect(listed, car.id).toBe(car.engine.forcedInduction === undefined);
    }
  });
});

describe('owning a part', () => {
  it('does not carry it across to another car in the garage', () => {
    let state = garageWith('mustang-cobra', 'stang');
    const second = buyCar(state, 'viper-srt10', 'viper');
    if (!second.ok) throw new Error(second.reason);
    state = second.state;

    const bought = purchaseAndFitPart(state, 'sports-muffler');
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    state = bought.state;
    expect(state.ownedPartIds).toContain('sports-muffler');

    const switched = selectCar(state, 'viper');
    expect(switched.ok).toBe(true);
    if (!switched.ok) return;
    state = switched.state;

    expect(state.ownedPartIds).not.toContain('sports-muffler');
    const refit = fitPart(state, 'sports-muffler');
    expect(refit.ok).toBe(false);
    if (!refit.ok) expect(refit.reason).toMatch(/buy this part first/i);
  });

  it('keeps what the first car had when you go back to it', () => {
    let state = garageWith('mustang-cobra', 'stang');
    const second = buyCar(state, 'viper-srt10', 'viper');
    if (!second.ok) throw new Error(second.reason);
    state = second.state;

    const bought = purchaseAndFitPart(state, 'sports-muffler');
    if (!bought.ok) throw new Error(bought.reason);
    state = bought.state;

    for (const vehicleId of ['viper', 'stang']) {
      const switched = selectCar(state, vehicleId);
      if (!switched.ok) throw new Error(switched.reason);
      state = switched.state;
    }

    expect(state.build.carId).toBe('mustang-cobra');
    expect(state.build.fittedPartIds).toContain('sports-muffler');
  });
});
