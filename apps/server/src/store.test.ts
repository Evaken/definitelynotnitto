import {describe,expect,it} from 'vitest';
import {createGarageState} from '@nitto/game-core';
import {migrate} from './store.js';

describe('database schema migration',()=>{
  it('gives legacy cars stable instance ids and expands old appearance fields',()=>{const garage=createGarageState();const legacy={...garage,appearance:{hue:100,saturation:70,brightness:90,graphicsHue:200,wheelStyle:1,rideHeight:-10}} as unknown as typeof garage;delete (legacy as unknown as Record<string,unknown>).selectedVehicleId;delete (legacy as unknown as Record<string,unknown>).nextVehicleSequence;const db=migrate({schemaVersion:1,accounts:[{id:'account-1',username:'Legacy',passwordHash:'x',salt:'y',garage:legacy,createdAt:'now'}],sessions:[],challenges:[],teams:[]});expect(db.schemaVersion).toBe(2);expect(db.accounts[0]!.garage).toMatchObject({selectedVehicleId:'legacy-account-1-selected',nextVehicleSequence:2,appearance:{schemaVersion:1,hue:100,components:{wheels:'wheel-five-spoke'}}});});
});
