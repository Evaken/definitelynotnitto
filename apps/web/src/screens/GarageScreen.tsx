import { useEffect,useMemo,useRef,useState } from 'react';
import { averageQuarterMileEt,factoryPaintAppearance, getCar, getPart, kwToHp, partList, peakTorque, powerKwAtRpm, repairCost, resolveBuild, type Appearance, type GarageState, type OwnedCarState, type Car, type Part, type PartCategory, type TimingSlip, type Tune } from '@nitto/game-core';
import { CarBay, categoriesForGroup, categoryLabel, partBrand, partsForGroup, VehiclePortrait, WORKSHOP_GROUPS, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';
import { TuneDynoPanel } from './TuneDynoPanel.js';
import {useEdgePan} from '../useEdgePan.js';
import {garageBrowseDirection,garageGlideProgress,nextGarageIndex,type GarageBrowseDirection} from '../garageCarousel.js';

type GarageView='overview'|'setup'|'tune'|'paint'|'maintenance';
export function GarageScreen({state,car,history,message,onVisitShop,onVisitShowroom,onFit,onRemove,onTune,onRepair,onAppearance,onSelect,initialView='overview',initialGroup='intake'}:{state:GarageState;car:Car;history:readonly TimingSlip[];message:string;onVisitShop:(group:WorkshopGroupId)=>void;onVisitShowroom:()=>void;onFit:(id:string)=>void;onRemove:(id:string)=>void;onTune:(tune:Tune)=>void;onRepair:()=>void;onAppearance:(appearance:Appearance)=>void;onSelect:(id:string)=>void;initialView?:GarageView;initialGroup?:WorkshopGroupId}){
  const [view,setView]=useState<GarageView>(initialView);
  const [group,setGroup]=useState<WorkshopGroupId>(initialGroup);
  const [category,setCategory]=useState<PartCategory>(categoriesForGroup(initialGroup)[0]??'intake');
  const [selectedId,setSelectedId]=useState('');
  const groupParts=useMemo(()=>partsForGroup(partList(),group),[group]);
  const categories=categoriesForGroup(group);
  const owned=groupParts.filter(part=>part.category===category&&state.ownedPartIds.includes(part.id));
  const fittedHere=owned.filter(part=>state.build.fittedPartIds.includes(part.id));
  const selected=owned.find(part=>part.id===selectedId)??owned[0];
  const fittedParts=state.build.fittedPartIds.map(getPart);
  let peakHp=0;
  for(let rpm=car.engine.idleRpm;rpm<=car.engine.redlineRpm;rpm+=100)peakHp=Math.max(peakHp,kwToHp(powerKwAtRpm(car.engine.curve,rpm)));
  const torque=peakTorque(car.engine.curve);
  const garageCars=useMemo<readonly OwnedCarState[]>(()=>{
    if(!state.hasSelectedCar)return[];
    const active:OwnedCarState={vehicleId:state.selectedVehicleId??'selected',build:state.build,ownedPartIds:state.ownedPartIds,tune:state.tune,condition:state.condition,appearance:state.appearance};
    return[active,...state.ownedCars].sort((a,b)=>a.vehicleId.localeCompare(b.vehicleId,undefined,{numeric:true,sensitivity:'base'}));
  },[state]);
  const actionMessage=message==='Selected vehicle changed.'?'':message;
  const [pendingSetup,setPendingSetup]=useState<string|null>(null);
  const [focusedVehicleId,setFocusedVehicleId]=useState(state.selectedVehicleId??garageCars[0]?.vehicleId??'');
  const [browseIntent,setBrowseIntent]=useState<GarageBrowseDirection>(0);
  const garageCarousel=useRef<HTMLDivElement|null>(null),garageScrollFrame=useRef<number|null>(null),browseIntentRef=useRef<GarageBrowseDirection>(0),browseRepeat=useRef<number|null>(null);
  const categoryPan=useEdgePan<HTMLElement>(),subcategoryPan=useEdgePan<HTMLElement>();
  const focusedIndex=Math.max(0,garageCars.findIndex(item=>item.vehicleId===focusedVehicleId));
  const focusedVehicle=garageCars[focusedIndex]??garageCars[0];
  const focusedCar=focusedVehicle?getCar(focusedVehicle.build.carId):car;
  const focusedBuild=focusedVehicle?resolveBuild(focusedVehicle.build,focusedVehicle.condition):car;
  const focusedIsSelected=focusedVehicle?.vehicleId===state.selectedVehicleId;
  const focusedCompleted=focusedIsSelected?history.filter(slip=>!slip.incomplete):[];
  const focusedAverage=focusedIsSelected?averageQuarterMileEt(history):null;
  const focusedBest=focusedCompleted.length?Math.min(...focusedCompleted.map(slip=>slip.quarterMileEt)):null;
  let focusedPeakHp=0;
  for(let rpm=focusedBuild.engine.idleRpm;rpm<=focusedBuild.engine.redlineRpm;rpm+=100)focusedPeakHp=Math.max(focusedPeakHp,kwToHp(powerKwAtRpm(focusedBuild.engine.curve,rpm)));

  const browseGarage=(direction:-1|1)=>setFocusedVehicleId(current=>{
    const currentIndex=Math.max(0,garageCars.findIndex(item=>item.vehicleId===current));
    return garageCars[nextGarageIndex(currentIndex,garageCars.length,direction)]?.vehicleId??current;
  });
  const setBrowseDirection=(direction:GarageBrowseDirection)=>{
    if(browseIntentRef.current===direction)return;
    browseIntentRef.current=direction;setBrowseIntent(direction);
    if(direction!==0)browseGarage(direction);
  };
  const onGaragePointerMove=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(event.pointerType==='touch')return;const bounds=event.currentTarget.getBoundingClientRect();
    setBrowseDirection(garageBrowseDirection(event.clientX-bounds.left,bounds.width));
  };
  const onGarageKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();browseGarage(event.key==='ArrowLeft'?-1:1);}
    if(event.key==='Home'){event.preventDefault();setFocusedVehicleId(garageCars[0]?.vehicleId??'');}
    if(event.key==='End'){event.preventDefault();setFocusedVehicleId(garageCars.at(-1)?.vehicleId??'');}
  };

  /**
   * Open Vehicle Setup on a system the player owns something in.
   *
   * It always opened on Intake, so a player who had bought only a turbo landed
   * on a tab reading "0 owned" and reasonably concluded nothing had been fitted.
   */
  const openSetup=()=>{
    for(const item of WORKSHOP_GROUPS){
      if('lockedStage' in item)continue;
      const ownedHere=partsForGroup(partList(),item.id).filter(part=>state.ownedPartIds.includes(part.id));
      if(ownedHere.length){setGroup(item.id);setCategory(ownedHere[0]!.category);setSelectedId('');break;}
    }
    setView('setup');
  };
  useEffect(()=>{if(!pendingSetup||state.selectedVehicleId!==pendingSetup)return;setPendingSetup(null);openSetup();},[pendingSetup,state.selectedVehicleId]);
  useEffect(()=>{if(!garageCars.some(item=>item.vehicleId===focusedVehicleId))setFocusedVehicleId(state.selectedVehicleId??garageCars[0]?.vehicleId??'');},[focusedVehicleId,garageCars,state.selectedVehicleId]);
  useEffect(()=>{if(browseIntent===0)return;const delay=window.setTimeout(()=>{browseGarage(browseIntent);const repeat=window.setInterval(()=>browseGarage(browseIntent),1300);browseRepeat.current=repeat;},950);return()=>{window.clearTimeout(delay);if(browseRepeat.current!==null){window.clearInterval(browseRepeat.current);browseRepeat.current=null;}};},[browseIntent,garageCars]);
  useEffect(()=>{if(view!=='overview')return;const begin=requestAnimationFrame(()=>{
    const node=garageCarousel.current,focusedCard=node?.querySelector<HTMLElement>('[data-focused="true"]');if(!node||!focusedCard)return;
    if(garageScrollFrame.current!==null)cancelAnimationFrame(garageScrollFrame.current);
    const start=node.scrollLeft,target=focusedCard.offsetLeft-(node.clientWidth-focusedCard.clientWidth)/2,distance=target-start,started=performance.now(),duration=1050;
    const move=(now:number)=>{const progress=Math.min(1,(now-started)/duration),eased=garageGlideProgress(progress);node.scrollLeft=start+distance*eased;if(progress<1)garageScrollFrame.current=requestAnimationFrame(move);else{node.scrollLeft=target;garageScrollFrame.current=null;}};
    garageScrollFrame.current=requestAnimationFrame(move);
  });return()=>{cancelAnimationFrame(begin);if(garageScrollFrame.current!==null){cancelAnimationFrame(garageScrollFrame.current);garageScrollFrame.current=null;}};},[focusedVehicleId,view,garageCars.length]);

  const carLabel=`${car.manufacturer} ${car.displayName}`;
  if(!state.hasSelectedCar)return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash}><section className="garage-overview garage-overview--empty"><header><span>Your Garage</span><h2>No Vehicles Owned</h2><p>Your first purchase becomes the selected car. Keep buying cars and switch between every build stored here.</p></header><div className="empty-garage-bay"><strong>0 CARS GARAGED</strong><p>Every car keeps its own parts, tune, paint, wheels, ride height and condition.</p><button type="button" onClick={onVisitShowroom}>Visit Car Showroom</button></div></section></WorkshopFrame></div>;
  if(view==='overview'&&focusedVehicle)return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} carLabel={carLabel}>
    <section className="garage-overview garage-overview--cars garage-overview--focused">
      <div className="garage-gallery-chrome" aria-hidden="true"/>
      <div className="garage-bay-spotlight" aria-hidden="true"/>
      <div ref={garageCarousel} className="garage-carousel garage-focus-carousel" role="listbox" tabIndex={0} aria-label="Owned vehicles. Move the pointer toward either edge or use the arrow keys to browse." onPointerMove={onGaragePointerMove} onPointerLeave={()=>setBrowseDirection(0)} onPointerCancel={()=>setBrowseDirection(0)} onBlur={()=>setBrowseDirection(0)} onKeyDown={onGarageKeyDown}>
        {garageCars.map((item,index)=>{
          const itemCar=getCar(item.build.carId),isSelected=item.vehicleId===state.selectedVehicleId,isFocused=item.vehicleId===focusedVehicle.vehicleId,distance=index-focusedIndex;
          return <article key={item.vehicleId} role="option" aria-selected={isFocused} data-focused={isFocused} data-selected={isSelected} data-distance={Math.max(-2,Math.min(2,distance))} className={`garage-vehicle-card${isFocused?' garage-vehicle-card--focused':''}${isSelected?' garage-vehicle-card--selected':''}`}>
            <button type="button" data-sound="select" className="garage-vehicle-card__focus-hit" aria-label={`Focus ${itemCar.manufacturer} ${itemCar.displayName}, bay ${index+1}`} onClick={()=>setFocusedVehicleId(item.vehicleId)}/>
            <header><span>{itemCar.manufacturer}</span><strong>{itemCar.displayName}</strong></header>
            <VehiclePortrait carId={item.build.carId} appearance={item.appearance} className="garage-vehicle-card__portrait"/>
            <span className="garage-bay-number">Bay {String(index+1).padStart(2,'0')}</span>
            {isSelected&&<span className="garage-current-ribbon">Current Car</span>}
          </article>;
        })}
      </div>
      <button type="button" data-sound="select" className="garage-browse garage-browse--previous" aria-label="Previous garage bay" disabled={focusedIndex===0} onClick={()=>browseGarage(-1)}>◀</button>
      <button type="button" data-sound="select" className="garage-browse garage-browse--next" aria-label="Next garage bay" disabled={focusedIndex===garageCars.length-1} onClick={()=>browseGarage(1)}>▶</button>
      <div className="garage-bay-occlusion" aria-hidden="true"><i/><i/></div>
      <section key={focusedVehicle.vehicleId} className="garage-focus-console" aria-label={`Focused vehicle: ${focusedCar.manufacturer} ${focusedCar.displayName}`}>
        <header><span>Bay {focusedIndex+1} of {garageCars.length} · {focusedCar.year}</span><strong>{focusedCar.manufacturer} {focusedCar.displayName}</strong><small>Vehicle ID {focusedVehicle.vehicleId.toUpperCase()}</small></header>
        <dl>
          <div><dt>Power</dt><dd>{Math.round(focusedPeakHp)} HP</dd></div>
          <div><dt>Condition</dt><dd>{focusedVehicle.condition.toFixed(0)}%</dd></div>
          <div><dt>Modified</dt><dd>{focusedVehicle.build.fittedPartIds.length}</dd></div>
          <div><dt>Best ET</dt><dd>{focusedBest===null?'--.---':focusedBest.toFixed(3)}</dd></div>
          <div><dt>Average</dt><dd>{focusedAverage===null?'--.---':focusedAverage.toFixed(3)}</dd></div>
        </dl>
        <div className="garage-focus-actions">
          <button type="button" data-sound="select" onClick={()=>{if(focusedIsSelected)openSetup();else{setPendingSetup(focusedVehicle.vehicleId);onSelect(focusedVehicle.vehicleId);}}}>Vehicle Setup</button>
          <button type="button" data-sound="select" className="primary" disabled={focusedIsSelected} onClick={()=>onSelect(focusedVehicle.vehicleId)}>{focusedIsSelected?'Current Car':'Select Car'}</button>
          <button type="button" data-sound="select" onClick={onVisitShowroom}>+ Add Vehicle</button>
        </div>
      </section>
      {garageCars.length>1&&<p className="garage-pan-instruction">Move pointer toward either edge · Arrow keys browse · Select from the centre bay</p>}
    </section>
  </WorkshopFrame></div>;

  const chooseGroup=(next:WorkshopGroupId)=>{setGroup(next);const firstCategory=categoriesForGroup(next)[0]??'intake';setCategory(firstCategory);setSelectedId('');};

  const changeDepartment=(department:'modifications'|'tune'|'paint'|'maintenance')=>setView(department==='modifications'?'setup':department);
  if(view==='tune')return <div className="screen screen--workshop screen--garage-department"><WorkshopFrame cash={state.cash} carLabel={carLabel} showDepartments activeDepartment="tune" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}><TuneDynoPanel car={car} tune={state.tune} message={message} onApply={onTune}/></WorkshopFrame></div>;
  if(view==='paint')return <div className="screen screen--workshop screen--garage-department"><WorkshopFrame cash={state.cash} carLabel={carLabel} showDepartments activeDepartment="paint" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}><PaintShop car={car} appearance={state.appearance} message={message} onApply={onAppearance}/></WorkshopFrame></div>;
  if(view==='maintenance')return <div className="screen screen--workshop screen--garage-department"><WorkshopFrame cash={state.cash} showDepartments activeDepartment="maintenance" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}><section className="maintenance-bay"><header><span>Vehicle Maintenance</span><h2>Workshop Inspection</h2></header><CarBay carId={car.id} title={`${car.year} ${car.displayName}`} subtitle="Mechanical inspection" badge="MAINTENANCE" fittedParts={fittedParts} appearance={state.appearance}/><div className="condition-card"><div className="condition-dial" style={{'--condition':`${state.condition*3.6}deg`} as React.CSSProperties}><strong>{state.condition.toFixed(1)}%</strong><span>Condition</span></div><div><h3>{state.condition>85?'Race ready':state.condition>55?'Service recommended':'Critical wear'}</h3><p>Over-revving, sustained boost and nitrous use add stress. Damage reduces engine output until repaired.</p><dl><div><dt>Power retained</dt><dd>{Math.round(70+state.condition*.3)}%</dd></div><div><dt>Repair estimate</dt><dd>${repairCost(state).toLocaleString()}</dd></div></dl><button type="button" className="workshop-action" disabled={repairCost(state)===0||state.cash<repairCost(state)} onClick={onRepair}>Authorise Repairs</button></div></div><p className={`workshop-message${message?' workshop-message--active':''}`}>{message||'Inspection results update after every completed pass.'}</p></section></WorkshopFrame></div>;

  return <div className="screen screen--workshop screen--garage-department screen--garage-setup"><WorkshopFrame cash={state.cash} carLabel={carLabel} showDepartments activeDepartment="modifications" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}>
    <nav className="setup-category-strip edge-pan" aria-label="Installed-part categories" {...categoryPan}>
      {WORKSHOP_GROUPS.filter(item=>!('lockedStage' in item)).map(item=><button key={item.id} data-sound="select" type="button" aria-pressed={group===item.id} className={group===item.id?'active':''} onClick={()=>chooseGroup(item.id)}>{item.label}</button>)}
    </nav>
    <div className="workshop__stage workshop__stage--simple">
      <div className="workshop__visual workshop__visual--hoist">
        <CarBay key={group} carId={car.id} title={`${car.manufacturer} ${car.displayName}`} subtitle={`${Math.round(peakHp)} HP · ${Math.round(torque.torqueNm)} NM · ${Math.round(car.chassis.massKg)} KG · ${state.build.fittedPartIds.length?`${state.build.fittedPartIds.length} MODIFIED`:'STOCK'}`} badge="" fittedParts={fittedParts} appearance={state.appearance}/>
        <div className="garage-hoist-foreground" aria-hidden="true"><i/><i/><b/><b/></div>
      </div>
      <section className="workshop__inventory workshop__inventory--simple garage-components">
        <header><span>{WORKSHOP_GROUPS.find(item=>item.id===group)?.label}</span><small>{categoryLabel(category)}</small></header>
        {categories.length>1&&<nav className="setup-subcategory-strip setup-subcategory-strip--drawer edge-pan" aria-label={`${WORKSHOP_GROUPS.find(item=>item.id===group)?.label} systems`} {...subcategoryPan}>
          {categories.map(item=><button key={item} data-sound="select" type="button" className={category===item?'active':''} aria-pressed={category===item} onClick={()=>{setCategory(item);setSelectedId('');}}>{categoryLabel(item)}</button>)}
        </nav>}
        {owned.length===0?<FactoryComponent category={category} onVisitShop={()=>onVisitShop(group)}/>:<>
          {owned.length>1&&<div className="garage-component-list garage-component-list--simple" role="listbox" aria-label="Owned components">
            {owned.map(part=>{
              const fitted=state.build.fittedPartIds.includes(part.id);
              return <button key={part.id} type="button" role="option" aria-selected={selected?.id===part.id} className={selected?.id===part.id?'active':''} onClick={()=>setSelectedId(part.id)}><span><strong>{part.displayName}</strong><small>{partBrand(part)}</small></span><b className={fitted?'installed':'stored'}>{fitted?'Installed':'Stored'}</b></button>;
            })}
          </div>}
          {selected&&<GaragePartDetail key={selected.id} part={selected} installed={state.build.fittedPartIds.includes(selected.id)} onFit={onFit} onRemove={onRemove}/>}
          <button type="button" className="garage-shop-link" onClick={()=>onVisitShop(group)}>Speedshop</button>
        </>}
        {actionMessage&&<p className="workshop-message workshop-message--active" aria-live="polite">{actionMessage}</p>}
      </section>
    </div>
  </WorkshopFrame></div>;
}

function GaragePartDetail({part,installed,onFit,onRemove}:{part:Part;installed:boolean;onFit:(id:string)=>void;onRemove:(id:string)=>void}){
  return <article className="garage-part-detail">
    <span className="part-detail__eyebrow">{installed?'Fitted':'Stored'} · {partBrand(part)}</span>
    <h2>{part.displayName}</h2>
    <p>{effectSummary(part)}</p>
    {part.requires.length>0&&<small>Requires {part.requires.map(id=>getPart(id).displayName).join(', ')}.</small>}
    <div className="garage-part-detail__actions"><button type="button" className="workshop-action" data-sound="install" onClick={()=>installed?onRemove(part.id):onFit(part.id)}>{installed?'Move to Storage':'Install Part'}</button></div>
  </article>;
}

function FactoryComponent({category,onVisitShop}:{category:PartCategory;onVisitShop:()=>void}){
  return <article className="garage-part-detail factory-component factory-component--simple"><span className="part-detail__eyebrow">Fitted</span><h2>Stock {categoryLabel(category)}</h2><p>Factory equipment</p><button type="button" className="workshop-action" data-sound="select" onClick={onVisitShop}>Speedshop</button></article>;
}

function PaintShop({car,appearance,message,onApply}:{car:Car;appearance:Appearance;message:string;onApply:(appearance:Appearance)=>void}){
  const [draft,setDraft]=useState(()=>factoryPaintAppearance(appearance));
  useEffect(()=>setDraft(factoryPaintAppearance(appearance)),[appearance,car.id]);
  const chooseHue=(hue:number)=>setDraft(old=>factoryPaintAppearance({...old,hue}));
  return <section className="paint-shop paint-shop--colour-only"><header><span>Factory Paint Booth</span><h2>Body Colour</h2></header><div className="paint-shop__body"><div className="paint-preview"><CarBay carId={car.id} title={`${car.year} ${car.manufacturer} ${car.displayName}`} subtitle="Factory specification · custom body colour" badge="PAINT BOOTH" appearance={draft}/><div className="paint-swatches">{[0,28,55,120,195,245,310].map(hue=><button key={hue} type="button" aria-label={`Paint hue ${hue}`} aria-pressed={Math.abs(draft.hue-hue)<1} style={{background:`hsl(${hue} 78% 52%)`}} onClick={()=>chooseHue(hue)}/>)}</div></div><div className="paint-controls paint-controls--colour-only"><span>Factory paint system</span><h3>Choose one body colour</h3><p>The car remains completely factory outside its paint: stock bonnet, wheels, lights, glass, exhaust and ride height.</p><label><span>Body colour</span><input type="range" min="0" max="360" step="1" value={draft.hue} onChange={event=>chooseHue(Number(event.target.value))}/><output>{Math.round(draft.hue)}°</output></label><div className="paint-colour-summary"><i style={{background:`hsl(${draft.hue} 78% 52%)`}}/><div><span>Selected colour</span><strong>Hue {Math.round(draft.hue)}°</strong></div></div><button type="button" className="workshop-action" onClick={()=>onApply(factoryPaintAppearance(draft))}>Save Body Colour</button></div></div><p className={`workshop-message${message?' workshop-message--active':''}`}>{message||'Only this car’s body colour is saved. All other appearance settings are factory standard.'}</p></section>;
}

function effectSummary(part:Part):string{
  const lines:string[]=[];const effects=part.effects;
  if(effects.torqueMultiplier)lines.push(`Power +${Math.round((effects.torqueMultiplier-1)*100)}%`);
  if(effects.peakBoostBar)lines.push(`Boost +${effects.peakBoostBar.toFixed(2)} bar`);
  if(effects.clutchHoldsTorqueRatio)lines.push(`Clutch holds ${Math.round(effects.clutchHoldsTorqueRatio*100)}% of peak torque`);
  if(effects.massDeltaKg)lines.push(`Weight ${effects.massDeltaKg>0?'+':''}${effects.massDeltaKg} kg`);
  if(effects.tyreGripMultiplier)lines.push(`Grip +${Math.round((effects.tyreGripMultiplier-1)*100)}%`);
  if(effects.drivelineEfficiencyDelta)lines.push(`Driveline +${Math.round(effects.drivelineEfficiencyDelta*100)}%`);
  if(effects.nitrousPowerKw)lines.push(`Nitrous +${Math.round(effects.nitrousPowerKw*1.341)} hp`);
  return lines.join(' · ')||'Supporting hardware';
}
