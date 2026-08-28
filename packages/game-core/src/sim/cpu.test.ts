import { describe,expect,it } from 'vitest';
import { CPU_PRIZES,createGarageState,settleCpuRace } from '../garage.js';
import { playerBeatCpu,raceTotal,runCpuOpponent } from './cpu.js';

describe('Stage 6 CPU racing and economy',()=>{
  it('creates deterministic opponents at three meaningful skill levels',()=>{const easy=runCpuOpponent('easy',42),medium=runCpuOpponent('medium',42),hard=runCpuOpponent('hard',42);expect(runCpuOpponent('hard',42)).toEqual(hard);expect(raceTotal(medium)).toBeLessThan(raceTotal(easy));expect(raceTotal(hard)).toBeLessThan(raceTotal(medium));});
  it('varies CPU reaction behavior by seed',()=>{expect(runCpuOpponent('medium',1).reactionTime).not.toBe(runCpuOpponent('medium',123456).reactionTime);});
  it('counts a red light or incomplete player pass as a loss',()=>{const cpu=runCpuOpponent('easy',7);expect(playerBeatCpu({...cpu,quarterMileEt:1,foul:true},cpu)).toBe(false);expect(playerBeatCpu({...cpu,quarterMileEt:1,incomplete:true},cpu)).toBe(false);});
  it('pays only wins and records both outcomes',()=>{let state=createGarageState();state=settleCpuRace(state,'medium',true);expect(state.cash).toBe(10_000+CPU_PRIZES.medium);expect(state.record).toEqual({wins:1,losses:0,races:1});expect(state.transactions.at(-1)).toMatchObject({kind:'cpu-prize',amount:CPU_PRIZES.medium});const cash=state.cash;state=settleCpuRace(state,'hard',false);expect(state.cash).toBe(cash);expect(state.record).toEqual({wins:1,losses:1,races:2});});
});
