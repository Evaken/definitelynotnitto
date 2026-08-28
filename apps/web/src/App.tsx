import { useCallback, useEffect, useMemo, useState } from 'react';
import { fitPart, purchaseAndFitPart, removePart, resolveBuild, type GarageResult, type GarageState, type TimingSlip } from '@nitto/game-core';
import { NavBar } from './nav/NavBar.js';
import type { ScreenId } from './nav/screens.js';
import { PlaceholderScreen } from './screens/PlaceholderScreen.js';
import { RaceTrackScreen } from './screens/RaceTrackScreen.js';
import { GarageScreen } from './screens/GarageScreen.js';
import { PartsShopScreen } from './screens/PartsShopScreen.js';
import { loadWorkshopState,saveWorkshopState } from './workshopSave.js';

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
};

export function App() {
  const [screen, setScreen] = useState<ScreenId>('track');
  const [garage,setGarage]=useState<GarageState>(loadWorkshopState);
  const [raceHistory,setRaceHistory]=useState<readonly TimingSlip[]>([]);
  const [shopMessage,setShopMessage]=useState('');
  const car=useMemo(()=>resolveBuild(garage.build),[garage.build]);
  const apply=(result:GarageResult,success:string)=>{if(result.ok){setGarage(result.state);setRaceHistory([]);setShopMessage(success);}else setShopMessage(result.reason);};
  const updateRaceHistory=useCallback((history:readonly TimingSlip[])=>setRaceHistory(history),[]);
  useEffect(()=>saveWorkshopState(garage),[garage]);

  return (
    <div className="shell">
      <header className="shell__masthead">
        <h1 className="shell__title">Nitto 1320 Challenge</h1>
        <span className="shell__stage">Stage 3 &middot; Garage and Parts Shop</span>
      </header>

      <NavBar active={screen} onNavigate={setScreen} />

      {screen === 'track' ? <RaceTrackScreen car={car} fittedPartCount={garage.build.fittedPartIds.length} initialHistory={raceHistory} onHistoryChange={updateRaceHistory}/>:screen==='garage'?<GarageScreen state={garage} car={car} history={raceHistory} message={shopMessage} onVisitShop={()=>setScreen('parts')} onFit={id=>apply(fitPart(garage,id),'Component installed.')} onRemove={id=>apply(removePart(garage,id),'Component moved to storage.')}/>:screen==='parts'?<PartsShopScreen state={garage} message={shopMessage} onPurchaseAndFit={id=>apply(purchaseAndFitPart(garage,id),'Purchase complete. Component installed.')}/>: (
        <PlaceholderScreen screen={screen} summary={PLACEHOLDER_SUMMARIES[screen] ?? ''} />
      )}
    </div>
  );
}
