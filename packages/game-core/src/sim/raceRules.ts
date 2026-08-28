import type { TimingSlip } from '../types/sim.js';

export type RaceMode='heads-up'|'bracket';
export interface RaceEntry {readonly slip:TimingSlip;readonly dialIn?:number;}
export interface RaceDecision {readonly winner:'left'|'right'|'tie';readonly reason:'foul'|'finish'|'breakout'|'double-breakout'|'dead-heat';readonly leftTotal:number;readonly rightTotal:number;}
const invalid=(slip:TimingSlip)=>slip.foul||slip.incomplete;
const total=(slip:TimingSlip)=>Math.max(0,slip.reactionTime)+slip.quarterMileEt;
export function adjudicateRace(left:RaceEntry,right:RaceEntry,mode:RaceMode):RaceDecision{
  if(invalid(left.slip)!==invalid(right.slip))return{winner:invalid(left.slip)?'right':'left',reason:'foul',leftTotal:total(left.slip),rightTotal:total(right.slip)};
  if(invalid(left.slip)&&invalid(right.slip))return{winner:'tie',reason:'dead-heat',leftTotal:Infinity,rightTotal:Infinity};
  if(mode==='heads-up')return finish(total(left.slip),total(right.slip),'finish');
  const ld=left.dialIn??left.slip.quarterMileEt,rd=right.dialIn??right.slip.quarterMileEt;const lb=left.slip.quarterMileEt<ld,rb=right.slip.quarterMileEt<rd;
  if(lb!==rb)return{winner:lb?'right':'left',reason:'breakout',leftTotal:total(left.slip),rightTotal:total(right.slip)};
  if(lb&&rb){const leftBreak=ld-left.slip.quarterMileEt,rightBreak=rd-right.slip.quarterMileEt;return finish(leftBreak,rightBreak,'double-breakout');}
  const leftPackage=Math.max(0,left.slip.reactionTime)+Math.abs(left.slip.quarterMileEt-ld);const rightPackage=Math.max(0,right.slip.reactionTime)+Math.abs(right.slip.quarterMileEt-rd);return finish(leftPackage,rightPackage,'finish');
}
function finish(leftTotal:number,rightTotal:number,reason:RaceDecision['reason']):RaceDecision{const delta=leftTotal-rightTotal;return{winner:Math.abs(delta)<.0005?'tie':delta<0?'left':'right',reason:Math.abs(delta)<.0005?'dead-heat':reason,leftTotal,rightTotal};}
