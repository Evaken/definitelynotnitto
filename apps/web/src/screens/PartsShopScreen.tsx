import { useEffect, useMemo, useState } from 'react';
import { getPart, partList, type GarageState } from '@nitto/game-core';
import { CarBay, partsForGroup, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';

export function PartsShopScreen({state,message,onBuy,onFit}:{state:GarageState;message:string;onBuy:(id:string)=>void;onFit:(id:string)=>void}){
 const [group,setGroup]=useState<WorkshopGroupId>('engine');
 const parts=useMemo(()=>partsForGroup(partList(),group),[group]);
 const [selectedId,setSelectedId]=useState(parts[0]?.id??'');
 useEffect(()=>{setSelectedId(parts[0]?.id??'');},[group,parts]);
 const selected=parts.find(part=>part.id===selectedId)??parts[0];
 const owned=selected ? state.ownedPartIds.includes(selected.id) : false;
 const fitted=selected ? state.build.fittedPartIds.includes(selected.id) : false;
 const requirement=selected?.requires.map(id=>getPart(id).displayName).join(', ');
 return <div className="screen screen--workshop"><WorkshopFrame activeGroup={group} onGroupChange={setGroup} cash={state.cash}>
   <div className="workshop__stage workshop__stage--shop">
     <div className="workshop__visual">
       <CarBay title="Honda Civic Si" subtitle={`${group.replaceAll('-',' ')} components · ${state.build.fittedPartIds.length} total upgrades fitted`} badge="SPEEDSHOP" />
       {selected&&<article className="part-detail">
         <span className="part-detail__eyebrow">Selected component</span>
         <h2>{selected.displayName}</h2>
         <div className="part-detail__price">${selected.price.toLocaleString()}</div>
         <p>{requirement?`Installation requires ${requirement}.`:'Direct-fit component for your Civic Si.'}</p>
         <p className="part-detail__note">{selected.calibrationNote}</p>
         {!owned?<button className="workshop-action" type="button" onClick={()=>onBuy(selected.id)}>Purchase Component</button>:!fitted?<button className="workshop-action" type="button" onClick={()=>onFit(selected.id)}>Install Component</button>:<div className="installed-banner">Installed on vehicle</div>}
       </article>}
     </div>
     <section className="workshop__inventory workshop__inventory--catalog">
       <header><span>Available Components</span><small>{parts.length} products</small></header>
       <div className="catalog-list" role="listbox" aria-label="Available parts">
         {parts.map(part=>{const isOwned=state.ownedPartIds.includes(part.id),isFitted=state.build.fittedPartIds.includes(part.id);return <button key={part.id} type="button" role="option" aria-selected={part.id===selected?.id} className={`catalog-item${part.id===selected?.id?' catalog-item--selected':''}`} onClick={()=>setSelectedId(part.id)}><span className="catalog-item__icon">{part.category.slice(0,2).toUpperCase()}</span><span><strong>{part.displayName}</strong><small>{part.category.replaceAll('-',' ')}</small></span><span className="catalog-item__price">{isFitted?'FITTED':isOwned?'OWNED':`$${part.price.toLocaleString()}`}</span></button>})}
       </div>
       <p className={`workshop-message${message?' workshop-message--active':''}`} aria-live="polite">{message||'Choose a component to view price and fitment information.'}</p>
     </section>
   </div>
 </WorkshopFrame></div>;
}
