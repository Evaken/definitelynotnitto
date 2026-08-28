import type { Car } from '../types/car.js';
import { kwToHp, powerKwAtRpm, torqueAtRpm } from './engine.js';

export interface DynoPoint { readonly rpm:number; readonly torqueNm:number; readonly horsepower:number; }
export interface DynoResult {
  readonly points:readonly DynoPoint[];
  readonly peakHorsepower:number;
  readonly peakHorsepowerRpm:number;
  readonly peakTorqueNm:number;
  readonly peakTorqueRpm:number;
}

/** Sample the exact resolved engine curve consumed by the race simulation. */
export function runDyno(car:Car,stepRpm=250):DynoResult{
  const step=Number.isFinite(stepRpm)&&stepRpm>0?stepRpm:250;
  const rpms:number[]=[];
  for(let rpm=car.engine.idleRpm;rpm<car.engine.redlineRpm;rpm+=step)rpms.push(rpm);
  rpms.push(car.engine.redlineRpm);
  const points=rpms.map(rpm=>({rpm,torqueNm:torqueAtRpm(car.engine.curve,rpm),horsepower:kwToHp(powerKwAtRpm(car.engine.curve,rpm))}));
  const hp=points.reduce((best,point)=>point.horsepower>best.horsepower?point:best,points[0]!);
  const torque=points.reduce((best,point)=>point.torqueNm>best.torqueNm?point:best,points[0]!);
  return{points,peakHorsepower:hp.horsepower,peakHorsepowerRpm:hp.rpm,peakTorqueNm:torque.torqueNm,peakTorqueRpm:torque.rpm};
}
