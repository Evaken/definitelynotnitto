import type {PartCategory} from '@nitto/game-core';
import type {WorkshopGroupId} from './screens/WorkshopFrame.js';

export type ModificationFocus='engine'|'power'|'underbody'|'wheels'|'rear';
export type ModificationDepartmentId='engine-bay'|'power-adders'|'running-gear'|'chassis'|'exhaust';

export interface ModificationSystemSlot {
  readonly groupId:WorkshopGroupId;
  readonly category:PartCategory;
  readonly label:string;
}

export interface ModificationDepartment {
  readonly id:ModificationDepartmentId;
  readonly label:string;
  readonly focus:ModificationFocus;
  readonly systems:readonly ModificationSystemSlot[];
}

export const MODIFICATION_DEPARTMENTS:readonly ModificationDepartment[]=[
  {id:'engine-bay',label:'Engine Bay',focus:'engine',systems:[
    {groupId:'intake',category:'intake',label:'Air Intake'},
    {groupId:'engine',category:'ecu',label:'ECU'},
    {groupId:'engine',category:'engine',label:'Internals'},
  ]},
  {id:'power-adders',label:'Power Adders',focus:'power',systems:[
    {groupId:'boost',category:'turbo',label:'Turbo'},
    {groupId:'boost',category:'supercharger',label:'Supercharger'},
    {groupId:'boost',category:'turbo-accessory',label:'Boost Control'},
    {groupId:'nitrous',category:'nitrous',label:'Nitrous'},
  ]},
  {id:'running-gear',label:'Running Gear',focus:'underbody',systems:[
    {groupId:'drivetrain',category:'clutch',label:'Clutch'},
    {groupId:'drivetrain',category:'transmission',label:'Transmission'},
  ]},
  {id:'chassis',label:'Chassis',focus:'wheels',systems:[
    {groupId:'tyres',category:'tyres',label:'Tyres'},
    {groupId:'tyres',category:'wheels',label:'Wheels'},
    {groupId:'suspension',category:'suspension',label:'Suspension'},
    {groupId:'weight',category:'weight-reduction',label:'Weight'},
  ]},
  {id:'exhaust',label:'Exhaust',focus:'rear',systems:[
    {groupId:'exhaust',category:'exhaust',label:'Exhaust System'},
  ]},
];

export function modificationDepartmentFor(groupId:WorkshopGroupId,category:PartCategory):ModificationDepartment{
  return MODIFICATION_DEPARTMENTS.find(department=>department.systems.some(system=>system.groupId===groupId&&system.category===category))??MODIFICATION_DEPARTMENTS[0]!;
}

export function firstModificationSystem(departmentId:ModificationDepartmentId):ModificationSystemSlot{
  return(MODIFICATION_DEPARTMENTS.find(department=>department.id===departmentId)??MODIFICATION_DEPARTMENTS[0]!).systems[0]!;
}
