import { describe,expect,it } from 'vitest';
import { parseWorkshopSave } from './workshopSave.js';
import { stockTune, getCar } from '@nitto/game-core';

describe('workshop save',()=>{
  it('round-trips valid owned and fitted parts',()=>{
    const state=parseWorkshopSave(JSON.stringify({cash:8120,ownedPartIds:['panel-filter'],build:{carId:'civic-si',fittedPartIds:['panel-filter']}}));
    expect(state).toEqual({cash:8120,ownedPartIds:['panel-filter'],build:{carId:'civic-si',fittedPartIds:['panel-filter']},tune:stockTune(getCar('civic-si')),condition:100});
  });
  it('drops unknown parts and fitted parts that are not owned',()=>{
    const state=parseWorkshopSave(JSON.stringify({cash:9000,ownedPartIds:['panel-filter','unknown'],build:{carId:'civic-si',fittedPartIds:['panel-filter','sports-muffler']}}));
    expect(state?.ownedPartIds).toEqual(['panel-filter']);
    expect(state?.build.fittedPartIds).toEqual(['panel-filter']);
  });
  it('rejects malformed saves',()=>{expect(parseWorkshopSave('{bad')).toBeNull();expect(parseWorkshopSave(JSON.stringify({cash:-1}))).toBeNull();});
  it('keeps a valid tune and repairs an invalid one',()=>{
    const base={cash:9000,ownedPartIds:[],build:{carId:'civic-si',fittedPartIds:[]}};
    const tune={gearRatios:[3.1,2,1.4,1,.7],finalDrive:3.9};
    expect(parseWorkshopSave(JSON.stringify({...base,tune}))?.tune).toEqual(tune);
    expect(parseWorkshopSave(JSON.stringify({...base,tune:{gearRatios:[1,2],finalDrive:99}}))?.tune).toEqual(stockTune(getCar('civic-si')));
  });
});
