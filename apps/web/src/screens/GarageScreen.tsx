import { useMemo, useState } from 'react';
import { averageQuarterMileEt, getPart, kwToHp, partList, peakTorque, powerKwAtRpm, type GarageState, type Car, type TimingSlip } from '@nitto/game-core';
import { CarBay, partsForGroup, WORKSHOP_GROUPS, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';

export function GarageScreen({state,car,history,onRemove}:{state:GarageState;car:Car;history:readonly TimingSlip[];onRemove:(id:string)=>void}){
  const [view,setView]=useState<'overview'|'setup'>('overview');
  const [group,setGroup]=useState<WorkshopGroupId>('intake');
  const groupParts=useMemo(()=>partsForGroup(partList(),group),[group]);
  const fitted=groupParts.filter(part=>state.build.fittedPartIds.includes(part.id));
  const completed=history.filter(slip=>!slip.incomplete);
  const averageEt=averageQuarterMileEt(history);
  const bestEt=completed.length?Math.min(...completed.map(slip=>slip.quarterMileEt)):null;
  let peakHp=0;
  for(let rpm=car.engine.idleRpm;rpm<=car.engine.redlineRpm;rpm+=100)peakHp=Math.max(peakHp,kwToHp(powerKwAtRpm(car.engine.curve,rpm)));
  const torque=peakTorque(car.engine.curve);

  if(view==='overview')return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash}>
    <section className="garage-overview">
      <header><span>Your Garage</span><h2>Select your ride</h2><p>Choose a vehicle to race or enter Vehicle Setup.</p></header>
      <article className="garage-ride-card">
        <div className="garage-ride-card__title"><span>Honda</span><strong>Civic <i>Si</i></strong></div>
        <div className="garage-ride-card__body">
          <button type="button" className="vehicle-setup-button" onClick={()=>setView('setup')}>Vehicle Setup</button>
          <CarBay title={`${car.year} ${car.displayName}`} subtitle={`${car.engine.code} · ${state.build.fittedPartIds.length} upgrades installed`} badge=""/>
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

  return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} showDepartments onBack={()=>setView('overview')}>
    <nav className="setup-category-strip" aria-label="Installed-part categories">
      {WORKSHOP_GROUPS.filter(item=>!('lockedStage' in item)).map(item=><button key={item.id} type="button" aria-pressed={group===item.id} className={group===item.id?'active':''} onClick={()=>setGroup(item.id)}>{item.label}</button>)}
    </nav>
    <div className="workshop__stage">
      <div className="workshop__visual">
        <CarBay title={`${car.year} ${car.manufacturer} ${car.displayName}`} subtitle={`${car.engine.code} · ${car.drivetrain} · ${state.build.fittedPartIds.length ? `${state.build.fittedPartIds.length} upgrade${state.build.fittedPartIds.length===1?'':'s'} fitted` : 'factory specification'}`} badge={WORKSHOP_GROUPS.find(item=>item.id===group)?.label.toUpperCase()??'MODIFICATIONS'} highlight={group}/>
        <dl className="workshop-stats"><div><dt>Power</dt><dd>{Math.round(peakHp)}<small> hp</small></dd></div><div><dt>Torque</dt><dd>{Math.round(torque.torqueNm)}<small> Nm</small></dd></div><div><dt>Weight</dt><dd>{Math.round(car.chassis.massKg)}<small> kg</small></dd></div><div><dt>Grip</dt><dd>{car.tyres.peakGrip.toFixed(2)}<small> μ</small></dd></div></dl>
      </div>
      <section className="workshop__inventory">
        <header><span>Installed Components</span><small>{fitted.length} in this category</small></header>
        {fitted.length===0?<div className="empty-slot"><strong>Factory equipment fitted</strong><span>Purchase components in the Speedshop, then return here to manage the build.</span></div>:
          <ul className="component-list">{fitted.map(part=><li key={part.id}><div><strong>{part.displayName}</strong><span>{part.category.replaceAll('-',' ')}</span></div><span className="component-list__status">Installed</span><button type="button" onClick={()=>onRemove(part.id)}>Remove</button></li>)}</ul>}
        <div className="workshop__tip">Select a system above to inspect its installed components.</div>
      </section>
    </div>
  </WorkshopFrame></div>;
}
