import { resolveBuild,type CpuDifficulty } from '../garage.js';
import { drive,goodDrivePlan } from '../testing/drive.js';
import { stockTune } from '../types/tune.js';
import type { TimingSlip } from '../types/sim.js';

export interface CpuOpponent {readonly difficulty:CpuDifficulty;readonly name:string;readonly subtitle:string;readonly prize:number;}
export const CPU_OPPONENTS:Readonly<Record<CpuDifficulty,CpuOpponent>>={
  easy:{difficulty:'easy',name:'Mia Torres',subtitle:'Street Rookie',prize:450},
  medium:{difficulty:'medium',name:'Darren Cole',subtitle:'Weekend Racer',prize:900},
  hard:{difficulty:'hard',name:'Akira Sato',subtitle:'1320 Veteran',prize:1800},
};
const BUILDS:Readonly<Record<CpuDifficulty,readonly string[]>>={easy:[],medium:['panel-filter','sports-muffler','ecu-reflash','street-tyres'],hard:['cold-air-intake','sports-muffler','cat-back','race-header','standalone-ecu','performance-cams','sports-clutch','street-turbo','turbo-manifold','intercooler','drag-radials','race-nitrous']};
function random01(seed:number):number{let x=seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;}
export function runCpuOpponent(difficulty:CpuDifficulty,seed:number):TimingSlip{
  const car=resolveBuild({carId:'civic-si',fittedPartIds:BUILDS[difficulty]});const base=goodDrivePlan(seed);const jitter=random01(seed)-.5;
  const plan=difficulty==='easy'?{...base,reactionSeconds:.32+jitter*.24,neutralRevRpm:3200,shiftRpm:6900,launchThrottle:.82}:difficulty==='medium'?{...base,reactionSeconds:.16+jitter*.14,neutralRevRpm:4800,shiftRpm:7700,launchThrottle:.94}: {...base,reactionSeconds:.07+jitter*.08,neutralRevRpm:5700,shiftRpm:8050,launchThrottle:1,nitrousFromGear:2};
  return drive(car,stockTune(car),plan).slip;
}

export function raceTotal(slip:TimingSlip):number{return slip.foul||slip.incomplete?Infinity:Math.max(0,slip.reactionTime)+slip.quarterMileEt;}
export function playerBeatCpu(player:TimingSlip,cpu:TimingSlip):boolean{return raceTotal(player)<raceTotal(cpu);}
