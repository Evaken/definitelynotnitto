import { useMemo, useState } from 'react';
import { getPart, kwToHp, partList, peakTorque, powerKwAtRpm, type GarageState, type Car } from '@nitto/game-core';
import { CarBay, partsForGroup, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';

export function GarageScreen({state,car,onRemove}:{state:GarageState;car:Car;onRemove:(id:string)=>void}){
  const [group,setGroup]=useState<WorkshopGroupId>('engine');
  const groupParts=useMemo(()=>partsForGroup(partList(),group),[group]);
  let peakHp=0;
  for(let rpm=car.engine.idleRpm;rpm<=car.engine.redlineRpm;rpm+=100)peakHp=Math.max(peakHp,kwToHp(powerKwAtRpm(car.engine.curve,rpm)));
  const torque=peakTorque(car.engine.curve);
  const fitted=groupParts.filter(part=>state.build.fittedPartIds.includes(part.id));
  return <div className="screen screen--workshop"><WorkshopFrame activeGroup={group} onGroupChange={setGroup} cash={state.cash}>
    <div className="workshop__stage">
      <div className="workshop__visual">
        <CarBay title={`${car.year} ${car.manufacturer} ${car.displayName}`} subtitle={`${car.engine.code} · ${car.drivetrain} · ${state.build.fittedPartIds.length ? `${state.build.fittedPartIds.length} upgrade${state.build.fittedPartIds.length===1?'':'s'} fitted` : 'factory specification'}`} badge="YOUR CAR" />
        <dl className="workshop-stats"><div><dt>Power</dt><dd>{Math.round(peakHp)}<small> hp</small></dd></div><div><dt>Torque</dt><dd>{Math.round(torque.torqueNm)}<small> Nm</small></dd></div><div><dt>Weight</dt><dd>{Math.round(car.chassis.massKg)}<small> kg</small></dd></div><div><dt>Grip</dt><dd>{car.tyres.peakGrip.toFixed(2)}<small> μ</small></dd></div></dl>
      </div>
      <section className="workshop__inventory">
        <header><span>Installed Components</span><small>{fitted.length} in this category</small></header>
        {fitted.length===0?<div className="empty-slot"><strong>Factory equipment fitted</strong><span>Buy components in the Parts Shop, then return here to manage the build.</span></div>:
          <ul className="component-list">{fitted.map(part=><li key={part.id}><div><strong>{part.displayName}</strong><span>{part.category.replaceAll('-',' ')}</span></div><span className="component-list__status">Installed</span><button type="button" onClick={()=>onRemove(part.id)}>Remove</button></li>)}</ul>}
        <div className="workshop__tip">Select a category above to inspect that section of the car.</div>
      </section>
    </div>
  </WorkshopFrame></div>;
}
