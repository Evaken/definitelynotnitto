import { describe,expect,it } from 'vitest';
import { parseWorkshopSave } from './workshopSave.js';

describe('workshop save',()=>{
  it('round-trips valid owned and fitted parts',()=>{
    const state=parseWorkshopSave(JSON.stringify({cash:8120,ownedPartIds:['panel-filter'],build:{carId:'civic-si',fittedPartIds:['panel-filter']}}));
    expect(state).toEqual({cash:8120,ownedPartIds:['panel-filter'],build:{carId:'civic-si',fittedPartIds:['panel-filter']}});
  });
  it('drops unknown parts and fitted parts that are not owned',()=>{
    const state=parseWorkshopSave(JSON.stringify({cash:9000,ownedPartIds:['panel-filter','unknown'],build:{carId:'civic-si',fittedPartIds:['panel-filter','sports-muffler']}}));
    expect(state?.ownedPartIds).toEqual(['panel-filter']);
    expect(state?.build.fittedPartIds).toEqual(['panel-filter']);
  });
  it('rejects malformed saves',()=>{expect(parseWorkshopSave('{bad')).toBeNull();expect(parseWorkshopSave(JSON.stringify({cash:-1}))).toBeNull();});
});
