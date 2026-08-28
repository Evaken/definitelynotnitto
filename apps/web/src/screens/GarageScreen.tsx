import { useMemo, useState } from 'react';
import { averageQuarterMileEt, fitPart, getPart, kwToHp, partList, peakTorque, powerKwAtRpm, removePart, resolveBuild, type GarageState, type Car, type Part, type PartCategory, type TimingSlip } from '@nitto/game-core';
import { CarBay, categoriesForGroup, categoryLabel, partBrand, partsForGroup, WORKSHOP_GROUPS, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';
import { PerformancePreview } from './PerformancePreview.js';

export function GarageScreen({state,car,history,message,onVisitShop,onFit,onRemove}:{state:GarageState;car:Car;history:readonly TimingSlip[];message:string;onVisitShop:()=>void;onFit:(id:string)=>void;onRemove:(id:string)=>void}){
  const [view,setView]=useState<'overview'|'setup'>('overview');
  const [group,setGroup]=useState<WorkshopGroupId>('intake');
  const [category,setCategory]=useState<PartCategory>('intake');
  const [selectedId,setSelectedId]=useState('');
  const groupParts=useMemo(()=>partsForGroup(partList(),group),[group]);
  const categories=categoriesForGroup(group);
  const owned=groupParts.filter(part=>part.category===category&&state.ownedPartIds.includes(part.id));
  const selected=owned.find(part=>part.id===selectedId)??owned[0];
  const fittedParts=state.build.fittedPartIds.map(getPart);
  const completed=history.filter(slip=>!slip.incomplete);
  const averageEt=averageQuarterMileEt(history);
  const bestEt=completed.length?Math.min(...completed.map(slip=>slip.quarterMileEt)):null;
  let peakHp=0;
  for(let rpm=car.engine.idleRpm;rpm<=car.engine.redlineRpm;rpm+=100)peakHp=Math.max(peakHp,kwToHp(powerKwAtRpm(car.engine.curve,rpm)));
  const torque=peakTorque(car.engine.curve);

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

  if(view==='overview')return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash}>
    <section className="garage-overview">
      <header><span>Your Garage</span><h2>Select your ride</h2><p>Choose a vehicle to race or enter Vehicle Setup.</p></header>
      <article className="garage-ride-card">
        <div className="garage-ride-card__title"><span>Honda</span><strong>Civic <i>Si</i></strong></div>
        <div className="garage-ride-card__body">
          <button type="button" className="vehicle-setup-button" onClick={openSetup}>Vehicle Setup</button>
          <CarBay key="garage-overview-car" title={`${car.year} ${car.displayName}`} subtitle={`${car.engine.code} · ${state.build.fittedPartIds.length} upgrades installed`} badge="" fittedParts={fittedParts}/>
        </div>
        <dl className="garage-records">
          <div><dt>Average ET</dt><dd>{averageEt===null?'--.---':averageEt.toFixed(3)}</dd></div>
          <div><dt>Best ET</dt><dd>{bestEt===null?'--.---':bestEt.toFixed(3)}</dd></div>
          <div><dt>Completed passes</dt><dd>{completed.length}</dd></div>
        </dl>
        <button type="button" className="selected-car-button" disabled>Selected Car</button>
      </article>
    </section>
  </WorkshopFrame></div>;

  const chooseGroup=(next:WorkshopGroupId)=>{setGroup(next);const firstCategory=categoriesForGroup(next)[0]??'intake';setCategory(firstCategory);setSelectedId('');};

  return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} showDepartments onBack={()=>setView('overview')}>
    <nav className="setup-category-strip" aria-label="Installed-part categories">
      {WORKSHOP_GROUPS.filter(item=>!('lockedStage' in item)).map(item=><button key={item.id} data-sound="select" type="button" aria-pressed={group===item.id} className={group===item.id?'active':''} onClick={()=>chooseGroup(item.id)}>{item.label}</button>)}
    </nav>
    <nav className="setup-subcategory-strip" aria-label={`${WORKSHOP_GROUPS.find(item=>item.id===group)?.label} systems`}>
      {categories.map(item=><button key={item} data-sound="select" type="button" className={category===item?'active':''} aria-pressed={category===item} onClick={()=>{setCategory(item);setSelectedId('');}}>{categoryLabel(item)}</button>)}
    </nav>
    <div className="workshop__stage">
      <div className="workshop__visual">
        <CarBay key={group} title={`${car.year} ${car.manufacturer} ${car.displayName}`} subtitle={`${car.engine.code} · ${car.drivetrain} · ${state.build.fittedPartIds.length ? `${state.build.fittedPartIds.length} upgrade${state.build.fittedPartIds.length===1?'':'s'} fitted` : 'factory specification'}`} badge={WORKSHOP_GROUPS.find(item=>item.id===group)?.label.toUpperCase()??'MODIFICATIONS'} highlight={group} fittedParts={fittedParts}/>
        <dl className="workshop-stats"><div><dt>Power</dt><dd>{Math.round(peakHp)}<small> hp</small></dd></div><div><dt>Torque</dt><dd>{Math.round(torque.torqueNm)}<small> Nm</small></dd></div><div><dt>Weight</dt><dd>{Math.round(car.chassis.massKg)}<small> kg</small></dd></div><div><dt>Grip</dt><dd>{car.tyres.peakGrip.toFixed(2)}<small> μ</small></dd></div></dl>
      </div>
      <section className="workshop__inventory garage-components">
        <header><span>{categoryLabel(category)}</span><small>{owned.length} here · {owned.filter(part=>state.build.fittedPartIds.includes(part.id)).length} fitted · {state.ownedPartIds.length} total</small></header>
        <div className="garage-component-browser">
          <div className="garage-component-list" role="listbox" aria-label="Owned components">
            {owned.length===0?<div className="empty-slot"><strong>Nothing owned in {categoryLabel(category)}</strong><span>{state.ownedPartIds.length>0?`You own ${state.ownedPartIds.length} part${state.ownedPartIds.length===1?'':'s'} in other systems — pick another tab above.`:'Factory equipment fitted. Visit the Speedshop to buy a component.'}</span></div>:owned.map(part=>{
              const fitted=state.build.fittedPartIds.includes(part.id);
              return <button key={part.id} type="button" role="option" aria-selected={selected?.id===part.id} className={selected?.id===part.id?'active':''} onClick={()=>setSelectedId(part.id)}><span><strong>{part.displayName}</strong><small>{partBrand(part)}</small></span><b className={fitted?'installed':'stored'}>{fitted?'Installed':'Stored'}</b></button>;
            })}
          </div>
          {selected?<GaragePartDetail key={selected.id} state={state} car={car} part={selected} installed={state.build.fittedPartIds.includes(selected.id)} onFit={onFit} onRemove={onRemove}/>:<FactoryComponent category={category} onVisitShop={onVisitShop}/>}
        </div>
        <p className={`workshop-message${message?' workshop-message--active':''}`} aria-live="polite">{message||'Owned parts remain in storage when removed and can be reinstalled later.'}</p>
      </section>
    </div>
  </WorkshopFrame></div>;
}

function GaragePartDetail({state,car,part,installed,onFit,onRemove}:{state:GarageState;car:Car;part:Part;installed:boolean;onFit:(id:string)=>void;onRemove:(id:string)=>void}){
  const preview=installed?removePart(state,part.id):fitPart(state,part.id);const projected=preview.ok?resolveBuild(preview.state.build):null;
  return <article className="garage-part-detail">
    <span className="part-detail__eyebrow">{partBrand(part)} · {categoryLabel(part.category)}</span>
    <h2>{part.displayName}</h2>
    <p>{effectSummary(part)}</p>
    <small>{part.requires.length?'Supporting hardware must be fitted first.':'Direct fit for the selected Civic.'}</small>
    <PerformancePreview current={car} next={projected}/>
    <div className="garage-part-detail__actions"><button type="button" className="workshop-action workshop-action--secondary" data-sound="engine">Start Engine</button><button type="button" className="workshop-action" data-sound="install" onClick={()=>installed?onRemove(part.id):onFit(part.id)}>{installed?'Uninstall Part':'Install Part'}</button></div>
  </article>;
}

function FactoryComponent({category,onVisitShop}:{category:PartCategory;onVisitShop:()=>void}){
  return <article className="garage-part-detail factory-component"><span className="part-detail__eyebrow">Original Equipment</span><h2>Factory {categoryLabel(category)}</h2><div className="factory-component__diagram"><i/><i/><i/><span>OEM</span></div><p>Stock component currently fitted</p><small>Browse compatible upgrades and compare their projected effect before buying.</small><button type="button" className="workshop-action" data-sound="select" onClick={onVisitShop}>Visit Speedshop</button></article>;
}

function effectSummary(part:Part):string{
  const lines:string[]=[];const effects=part.effects;
  if(effects.torqueMultiplier)lines.push(`Power +${Math.round((effects.torqueMultiplier-1)*100)}%`);
  if(effects.peakBoostBar)lines.push(`Boost +${effects.peakBoostBar.toFixed(2)} bar`);
  if(effects.clutchCapacityNm)lines.push(`Clutch ${effects.clutchCapacityNm} Nm`);
  if(effects.massDeltaKg)lines.push(`Weight ${effects.massDeltaKg>0?'+':''}${effects.massDeltaKg} kg`);
  if(effects.tyreGripMultiplier)lines.push(`Grip +${Math.round((effects.tyreGripMultiplier-1)*100)}%`);
  if(effects.drivelineEfficiencyDelta)lines.push(`Driveline +${Math.round(effects.drivelineEfficiencyDelta*100)}%`);
  return lines.join(' · ')||'Supporting hardware';
}
