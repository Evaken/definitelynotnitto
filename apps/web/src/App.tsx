import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CPU_OPPONENTS, applyAppearance, applyPassStress, applyTune, buyCar, fitPart, playerBeatCpu, purchaseAndFitPart, removePart, repairCar, resolveBuild, runCpuOpponent, selectCar, settleCpuRace, type CpuDifficulty, type GarageResult, type GarageState, type TimingSlip } from '@nitto/game-core';
import { NavBar } from './nav/NavBar.js';
import type { ScreenId } from './nav/screens.js';
import { PlaceholderScreen } from './screens/PlaceholderScreen.js';
import { RaceTrackScreen } from './screens/RaceTrackScreen.js';
import { GarageScreen } from './screens/GarageScreen.js';
import { PartsShopScreen } from './screens/PartsShopScreen.js';
import { loadWorkshopState,saveWorkshopState } from './workshopSave.js';
import { MainScreen } from './screens/MainScreen.js';
import { ShowroomScreen } from './screens/ShowroomScreen.js';

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
  const car=useMemo(()=>resolveBuild(garage.build,garage.condition),[garage.build,garage.condition]);
  const apply=(result:GarageResult,success:string)=>{if(result.ok){setGarage(result.state);setRaceHistory([]);setShopMessage(success);}else setShopMessage(result.reason);};
  const updateRaceHistory=useCallback((history:readonly TimingSlip[])=>setRaceHistory(history),[]);
  const recordStress=useCallback((stress:number)=>{pendingStress.current+=Math.max(0,stress);},[]);
  const navigate=useCallback((next:ScreenId)=>{if(screen==='track'&&next!=='track'&&pendingStress.current>0){const stress=pendingStress.current;pendingStress.current=0;setGarage(previous=>applyPassStress(previous,stress));}setScreen(next);},[screen]);
  const startCpuRace=useCallback((difficulty:CpuDifficulty)=>{const opponent=CPU_OPPONENTS[difficulty];setCpuRace({difficulty,name:opponent.name,slip:runCpuOpponent(difficulty,Math.floor(Math.random()*0x7fffffff)),settled:false});setRaceHistory([]);setScreen('track');},[]);
  const completeCpuRace=useCallback((slip:TimingSlip)=>{setCpuRace(current=>{if(!current||current.settled)return current;const won=playerBeatCpu(slip,current.slip);setGarage(previous=>settleCpuRace(previous,current.difficulty,won));return{...current,settled:true,won};});},[]);
  useEffect(()=>saveWorkshopState(garage),[garage]);

  return (
    <div className="shell">
      <header className="shell__masthead">
        <h1 className="shell__title">Nitto 1320 Challenge</h1>
        <span className="shell__stage">Stage 8 &middot; Multi-Car Garage</span>
      </header>

      <NavBar active={screen} onNavigate={navigate} />

      <div className="shell__brand" aria-label="Nitto 1320 Challenge">
        <span>NITTO<br/><small>EXTREME PERFORMANCE</small></span>
        <strong>1320 <i>CHALLENGE</i></strong>
        <em>Version 0.8</em>
      </div>

      {screen==='main'?<MainScreen state={garage} onRace={startCpuRace}/>:screen === 'track' ? <RaceTrackScreen car={car} tune={garage.tune} appearance={garage.appearance} fittedPartCount={garage.build.fittedPartIds.length} initialHistory={raceHistory} onHistoryChange={updateRaceHistory} onPassStress={recordStress} {...(cpuRace?{opponent:cpuRace,onCompleted:completeCpuRace}:{})}/>:screen==='garage'?<GarageScreen state={garage} car={car} history={raceHistory} message={shopMessage} onVisitShop={()=>setScreen('parts')} onFit={id=>apply(fitPart(garage,id),'Component installed.')} onRemove={id=>apply(removePart(garage,id),'Component moved to storage.')} onTune={tune=>apply(applyTune(garage,tune),'Transmission setup saved.')} onRepair={()=>apply(repairCar(garage),'Repairs complete. Vehicle condition restored.')} onAppearance={appearance=>apply(applyAppearance(garage,appearance),'Appearance saved.')}/>:screen==='parts'?<PartsShopScreen state={garage} message={shopMessage} onPurchaseAndFit={id=>apply(purchaseAndFitPart(garage,id),'Purchase complete. Component installed.')}/>:screen==='showroom'?<ShowroomScreen state={garage} message={shopMessage} onBuy={id=>apply(buyCar(garage,id),'Vehicle purchased and delivered to your garage.')} onSelect={id=>apply(selectCar(garage,id),'Selected vehicle changed.')}/>: (
        <PlaceholderScreen screen={screen} summary={PLACEHOLDER_SUMMARIES[screen] ?? ''} />
      )}
    </div>
  );
}
