import {describe,expect,it} from 'vitest';
import {buyCar,carUnlockReason,createGarageState} from '../../garage.js';
import {drive,goodDrivePlan} from '../../testing/drive.js';
import {stockTune} from '../../types/tune.js';
import {getCar,SPECIAL_ROSTER} from './index.js';

describe('Stage 13 special-car progression',()=>{
  it('keeps three exceptional cars behind career milestones',()=>{expect(SPECIAL_ROSTER).toHaveLength(3);const state=createGarageState('civic-si',1_000_000);expect(carUnlockReason(state,'mopar-drag')).toContain('25 career wins');expect(buyCar(state,'mopar-drag')).toMatchObject({ok:false});const veteran={...state,record:{wins:25,losses:0,races:25}};expect(buyCar(veteran,'mopar-drag')).toMatchObject({ok:true});});
  it('preserves a clear performance gap over the normal road-car roster',()=>{const civic=getCar('civic-si'),mopar=getCar('mopar-drag'),funny=getCar('funny-car');const pass=(car:typeof civic)=>drive(car,stockTune(car),{...goodDrivePlan(13),shiftRpm:car.engine.redlineRpm-150,neutralRevRpm:Math.min(6500,car.engine.redlineRpm-1000)}).slip.quarterMileEt;expect(pass(mopar)).toBeLessThan(pass(civic)-2);expect(pass(funny)).toBeLessThan(pass(mopar)-1);});
});
