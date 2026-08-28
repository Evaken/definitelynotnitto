import type { GarageState,InputTimeline,RaceDecision,RaceMode,TimingSlip } from '@nitto/game-core';
export interface Account {id:string;username:string;passwordHash:string;salt:string;garage:GarageState;raceHistory?:TimingSlip[];createdAt:string;}
export interface Session {token:string;accountId:string;expiresAt:number;}
export interface LockedRun {carId:string;garageSnapshot:GarageState;tune:GarageState['tune'];timeline:InputTimeline;slip:TimingSlip;stress:number;}
export interface Challenge {id:string;challengerId:string;defenderId:string;mode:RaceMode;wager:number;challengerDialIn?:number;defenderDialIn?:number;challengerRun:LockedRun;defenderRun?:LockedRun;status:'incoming'|'completed';decision?:RaceDecision;winnerId?:string;challengerTeamId?:string;defenderTeamId?:string;createdAt:string;completedAt?:string;}
export interface Team {id:string;name:string;leaderId:string;memberIds:string[];applicantIds:string[];invitedIds:string[];bank:number;wins:number;losses:number;transactions:{id:string;accountId:string;amount:number;description:string;at:string}[];}
export interface Database {schemaVersion:number;accounts:Account[];sessions:Session[];challenges:Challenge[];teams:Team[];}
