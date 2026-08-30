import {describe,expect,it} from 'vitest';
import {firstModificationSystem,MODIFICATION_DEPARTMENTS,modificationDepartmentFor} from './modificationDepartments.js';

describe('modification workshop departments',()=>{
  it('presents every production system exactly once',()=>{
    const systems=MODIFICATION_DEPARTMENTS.flatMap(department=>department.systems.map(system=>`${system.groupId}:${system.category}`));
    expect(new Set(systems).size).toBe(systems.length);
    expect(systems).toEqual(expect.arrayContaining(['intake:intake','engine:ecu','engine:engine','boost:turbo','boost:supercharger','boost:turbo-accessory','nitrous:nitrous','drivetrain:clutch','drivetrain:transmission','tyres:tyres','tyres:wheels','suspension:suspension','weight:weight-reduction','exhaust:exhaust']));
  });
  it('maps an existing setup route into its physical department',()=>{
    expect(modificationDepartmentFor('engine','ecu').id).toBe('engine-bay');
    expect(modificationDepartmentFor('nitrous','nitrous').id).toBe('power-adders');
    expect(modificationDepartmentFor('weight','weight-reduction').id).toBe('chassis');
  });
  it('opens each department on a real system slot',()=>{
    for(const department of MODIFICATION_DEPARTMENTS)expect(department.systems).toContain(firstModificationSystem(department.id));
  });
});
