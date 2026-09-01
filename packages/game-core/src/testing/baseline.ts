import { createEmptyGarageState, partList, purchaseAndFitPart, resolveBuild, buyCar, selectCar, type GarageState } from '../garage.js';
import { CARS, getCar } from '../data/cars/index.js';
import { stockTune } from '../types/tune.js';
import { drive, goodDrivePlan } from './drive.js';
import type { Car } from '../types/car.js';

/**
 * The deterministic performance baseline for the whole roster.
 *
 * Every figure in `BALANCE_NOTES.md` comes from the scripted driver, and the
 * file has silently gone stale twice -- once when the driver was changed and
 * once when the starter car was corrected. Nothing failed either time, because
 * the only absolute assertion in the suite is a 13-to-19-second band on the
 * Civic, which is wide enough to swallow almost any regression.
 *
 * That band is deliberately loose and stays loose: nothing here is calibrated to
 * the original game, so asserting an exact ET would be asserting an invented
 * number as fact. This file solves the other half of the problem instead. It
 * records what the roster measures *today*, to three decimal places, so that any
 * change to the physics, the car data, the parts or the driver shows up as a
 * failing test naming the cars that moved and by how much. It says nothing about
 * whether the numbers are right -- only whether they changed, and changing them
 * has to be a decision rather than an accident.
 */

export interface BaselineRow {
  readonly id: string;
  readonly quarterMileEt: number;
  readonly quarterMileMph: number;
  readonly sixtyFoot: number;
}

export interface Baseline {
  readonly stock: readonly BaselineRow[];
  readonly built: readonly BaselineRow[];
}

/**
 * The one drive plan every baseline figure is measured with.
 *
 * Fixed rather than swept, so the baseline runs in a second or two and so that
 * two people measuring the same car cannot disagree about how it was driven.
 */
function measure(car: Car, id: string): BaselineRow {
  const { slip } = drive(car, stockTune(car), {
    ...goodDrivePlan(7),
    stageAtM: -0.27,
    neutralRevRpm: 4000,
    shiftRpm: car.engine.redlineRpm - 150,
  });
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return {
    id,
    quarterMileEt: slip.incomplete ? -1 : round(slip.quarterMileEt),
    quarterMileMph: slip.incomplete ? -1 : round(slip.quarterMileMph),
    sixtyFoot: slip.sixtyFoot === undefined ? -1 : round(slip.sixtyFoot),
  };
}

/** Every part the car will take, which is the configuration players end up at. */
export function fullyBuilt(carId: string): Car {
  let state: GarageState = {
    ...createEmptyGarageState(50_000_000),
    record: { wins: 999, losses: 0, races: 999 },
  };
  const bought = buyCar(state, carId, 'v1');
  if (!bought.ok) throw new Error(`${carId}: ${bought.reason}`);
  state = bought.state;
  const selected = selectCar(state, 'v1');
  if (selected.ok) state = selected.state;

  // Repeated because fitting one part can unlock the part that supersedes it.
  for (let pass = 0; pass < 6; pass++) {
    for (const part of partList()) {
      if (part.category === 'supercharger') continue;
      const fitted = purchaseAndFitPart(state, part.id);
      if (fitted.ok) state = fitted.state;
    }
  }
  return resolveBuild(state.build, state.condition);
}

export function measureBaseline(): Baseline {
  const ids = [...CARS.keys()];
  return {
    stock: ids.map((id) => measure(getCar(id), id)),
    // The career specials take no parts, so a built column would be a copy of
    // the stock one. They are measured once, as supplied.
    built: ids.filter((id) => !getCar(id).special).map((id) => measure(fullyBuilt(id), id)),
  };
}
