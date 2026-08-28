import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CPU_OPPONENTS, applyAppearance, applyPassStress, applyTune, buyCar, fitPart, playerBeatCpu, purchaseAndFitPart, removePart, repairCar, resolveBuild, runCpuOpponent, selectCar, settleCpuRace, type Appearance, type CpuDifficulty, type GarageResult, type GarageState, type InputTimeline, type TimingSlip, type Tune } from '@nitto/game-core';
import { NavBar } from './nav/NavBar.js';
import type { ScreenId } from './nav/screens.js';
import { PlaceholderScreen } from './screens/PlaceholderScreen.js';
import { RaceTrackScreen } from './screens/RaceTrackScreen.js';
import { GarageScreen } from './screens/GarageScreen.js';
import { PartsShopScreen } from './screens/PartsShopScreen.js';
import { loadWorkshopState,saveWorkshopState } from './workshopSave.js';
import { MainScreen } from './screens/MainScreen.js';
import { ShowroomScreen } from './screens/ShowroomScreen.js';
import { AccountPanel } from './screens/AccountPanel.js';
import { api,type OnlineProfile } from './onlineApi.js';
import { ChallengeScreen } from './screens/ChallengeScreen.js';
import { TeamScreen } from './screens/TeamScreen.js';

/**
 * The game shell: a bounded canvas with the original's seven tabs.
 *
 * Only the Race Track is built through Stage 2. The rest are honest placeholders
 * naming the stage that fills them in (PROJECT_SPEC 11.4 -- later stages must
 * not be scaffolded early).
 */

const PLACEHOLDER_SUMMARIES: Partial<Record<ScreenId, string>> = {
  main: 'Player summary, cash, record and news.',
  challenge: 'Incoming, outgoing and completed asynchronous challenges.',
  garage: 'Owned cars, installed parts, specifications and best times.',
  parts: 'Buy and fit individual parts. Compatibility and exclusions enforced here.',
  showroom: 'Browse and buy the car roster.',
  team: 'Create or join a team, team funds, and team races.',
  community: 'Period community features are not yet recovered.',
};

export function App() {
  const [screen, setScreen] = useState<ScreenId>('main');
  const [garage,setGarage]=useState<GarageState>(loadWorkshopState);
  const [raceHistory,setRaceHistory]=useState<readonly TimingSlip[]>([]);
  const [shopMessage,setShopMessage]=useState('');
  const pendingStress=useRef(0);
  const [cpuRace,setCpuRace]=useState<{difficulty:CpuDifficulty;name:string;slip:TimingSlip;settled:boolean;won?:boolean}|null>(null);
  const [onlineToken,setOnlineToken]=useState(()=>window.localStorage.getItem('nitto1320.session')??'');
  const [onlineProfile,setOnlineProfile]=useState<OnlineProfile|null>(null);
  const [accountBusy,setAccountBusy]=useState(false);const [accountMessage,setAccountMessage]=useState('');
  const [lastRecordedRun,setLastRecordedRun]=useState<{slip:TimingSlip;timeline:InputTimeline}|null>(null);
  const car=useMemo(()=>resolveBuild(garage.build,garage.condition),[garage.build,garage.condition]);
  const apply=(result:GarageResult,success:string)=>{if(result.ok){setGarage(result.state);setRaceHistory([]);setShopMessage(success);}else setShopMessage(result.reason);};
  const updateRaceHistory=useCallback((history:readonly TimingSlip[])=>setRaceHistory(history),[]);
  const recordStress=useCallback((stress:number)=>{pendingStress.current+=Math.max(0,stress);},[]);
  const navigate=useCallback((next:ScreenId)=>{if(screen==='track'&&next!=='track'&&pendingStress.current>0){const stress=pendingStress.current;pendingStress.current=0;if(!onlineToken)setGarage(previous=>applyPassStress(previous,stress));}setScreen(next);},[onlineToken,screen]);
  const startCpuRace=useCallback((difficulty:CpuDifficulty)=>{const opponent=CPU_OPPONENTS[difficulty];setCpuRace({difficulty,name:opponent.name,slip:runCpuOpponent(difficulty,Math.floor(Math.random()*0x7fffffff)),settled:false});setRaceHistory([]);setScreen('track');},[]);
  const completeCpuRace=useCallback((slip:TimingSlip)=>{if(onlineToken)return;setCpuRace(current=>{if(!current||current.settled)return current;const won=playerBeatCpu(slip,current.slip);setGarage(previous=>settleCpuRace(previous,current.difficulty,won));return{...current,settled:true,won};});},[onlineToken]);
  const recordRun=useCallback((slip:TimingSlip,timeline:InputTimeline)=>{setLastRecordedRun({slip,timeline});if(!onlineToken||!cpuRace||cpuRace.settled)return;void api.cpuRace(onlineToken,cpuRace.difficulty,timeline).then(value=>{const result=value as typeof value&{cpu:TimingSlip};setGarage(result.garage);setCpuRace(current=>current?{...current,slip:result.cpu,settled:true,won:result.won}:current);}).catch(error=>setShopMessage(error instanceof Error?error.message:'Online race failed.'));},[cpuRace,onlineToken]);
  useEffect(()=>{if(!onlineToken)saveWorkshopState(garage);},[garage,onlineToken]);
  useEffect(()=>{if(!onlineToken)return;api.me(onlineToken).then(result=>{const restored=result as typeof result&{raceHistory?:TimingSlip[]};setOnlineProfile(result.profile);setGarage(result.garage);setRaceHistory(restored.raceHistory??[]);}).catch(()=>{window.localStorage.removeItem('nitto1320.session');setOnlineToken('');});},[onlineToken]);
  const authenticate=useCallback(async(mode:'login'|'register',username:string,password:string)=>{setAccountBusy(true);setAccountMessage('');try{const result=await api[mode](username,password);window.localStorage.setItem('nitto1320.session',result.token);setOnlineToken(result.token);setOnlineProfile(result.profile);setGarage(result.garage);setRaceHistory(result.raceHistory??[]);setAccountMessage('Online profile connected.');}catch(error){setAccountMessage(error instanceof Error?error.message:'Connection failed.');}finally{setAccountBusy(false);}},[]);
  const logout=useCallback(()=>{window.localStorage.removeItem('nitto1320.session');setOnlineToken('');setOnlineProfile(null);setGarage(loadWorkshopState());setAccountMessage('Signed out. Offline profile restored.');},[]);
  const accountPanel=<AccountPanel profile={onlineProfile} busy={accountBusy} message={accountMessage} onLogin={(u,p)=>void authenticate('login',u,p)} onRegister={(u,p)=>void authenticate('register',u,p)} onLogout={logout}/>;
  const performGarageAction=(action:{type:string;id?:string;tune?:Tune;appearance?:Appearance},fallback:GarageResult,success:string)=>{if(!onlineToken){apply(fallback,success);return;}setShopMessage('Saving to online garage…');void api.garage(onlineToken,action).then(state=>{setGarage(state);setRaceHistory([]);setShopMessage(success);}).catch(error=>setShopMessage(error instanceof Error?error.message:'Online action failed.'));};
  const fit=(id:string)=>performGarageAction({type:'fit-part',id},fitPart(garage,id),'Component installed.');
  const remove=(id:string)=>performGarageAction({type:'remove-part',id},removePart(garage,id),'Component moved to storage.');
  const tune=(value:Tune)=>performGarageAction({type:'tune',tune:value},applyTune(garage,value),'Transmission setup saved.');
  const repair=()=>performGarageAction({type:'repair'},repairCar(garage),'Repairs complete. Vehicle condition restored.');
  const appearance=(value:Appearance)=>performGarageAction({type:'appearance',appearance:value},applyAppearance(garage,value),'Appearance saved.');
  const purchase=(id:string)=>performGarageAction({type:'purchase-part',id},purchaseAndFitPart(garage,id),'Purchase complete. Component installed.');
  const purchaseCar=(id:string)=>performGarageAction({type:'buy-car',id},buyCar(garage,id),'Vehicle purchased and delivered to your garage.');
  const chooseCar=(id:string)=>performGarageAction({type:'select-car',id},selectCar(garage,id),'Selected vehicle changed.');

  return (
    <div className="shell">
      <header className="shell__masthead">
        <h1 className="shell__title">Nitto 1320 Challenge</h1>
        <span className="shell__stage">Stage 12 &middot; Online Beta</span>
      </header>

      <NavBar active={screen} onNavigate={navigate} />

      <div className="shell__brand" aria-label="Nitto 1320 Challenge">
        <span>NITTO<br/><small>EXTREME PERFORMANCE</small></span>
        <strong>1320 <i>CHALLENGE</i></strong>
        <em>Version 0.12</em>
      </div>

      {screen==='main'?<MainScreen state={garage} onRace={startCpuRace} accountPanel={accountPanel}/>:screen === 'track' ? <RaceTrackScreen car={car} tune={garage.tune} appearance={garage.appearance} fittedPartCount={garage.build.fittedPartIds.length} initialHistory={raceHistory} onHistoryChange={updateRaceHistory} onPassStress={recordStress} onRecorded={recordRun} {...(cpuRace?{opponent:cpuRace,onCompleted:completeCpuRace}:{})}/>:screen==='garage'?<GarageScreen state={garage} car={car} history={raceHistory} message={shopMessage} onVisitShop={()=>setScreen('parts')} onFit={fit} onRemove={remove} onTune={tune} onRepair={repair} onAppearance={appearance}/>:screen==='parts'?<PartsShopScreen state={garage} message={shopMessage} onPurchaseAndFit={purchase}/>:screen==='showroom'?<ShowroomScreen state={garage} message={shopMessage} onBuy={purchaseCar} onSelect={chooseCar}/>:screen==='challenge'?<ChallengeScreen token={onlineToken} profile={onlineProfile} lastRun={lastRecordedRun}/>:screen==='team'?<TeamScreen token={onlineToken} profile={onlineProfile} lastRun={lastRecordedRun}/>: (
        <PlaceholderScreen screen={screen} summary={PLACEHOLDER_SUMMARIES[screen] ?? ''} />
      )}
    </div>
  );
}
