import { useMemo, useState } from 'react';
import { getPart, partList, previewPurchaseAndFit, purchaseAndFitPart, resolveBuild, type GarageState, type Part, type PartEffects, type PurchaseInstallPlan } from '@nitto/game-core';
import { CategoryArtwork, CategoryCarousel, edgeScroll, partBrand, partsForGroup, WORKSHOP_GROUPS, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';
import { PerformancePreview } from './PerformancePreview.js';

export function PartsShopScreen({state,message,onPurchaseAndFit}:{state:GarageState;message:string;onPurchaseAndFit:(id:string)=>void}){
  const [group,setGroup]=useState<WorkshopGroupId|null>(null);
  const [selectedId,setSelectedId]=useState('');
  const [pending,setPending]=useState<PurchaseInstallPlan|null>(null);
  const [showRequirements,setShowRequirements]=useState(false);
  const [localMessage,setLocalMessage]=useState('');
  const parts=useMemo(()=>group?partsForGroup(partList(),group):[],[group]);
  const selected=parts.find(part=>part.id===selectedId)??parts[0];
  const currentCar=useMemo(()=>resolveBuild(state.build),[state.build]);
  const projectedResult=selected?purchaseAndFitPart(state,selected.id):null;
  const projectedCar=projectedResult?.ok?resolveBuild(projectedResult.state.build):null;

  const enterGroup=(next:WorkshopGroupId)=>{setGroup(next);const first=partsForGroup(partList(),next)[0];setSelectedId(first?.id??'');setLocalMessage('');};
  const requestPurchase=()=>{
    if(!selected)return;
    const missing=selected.requires.filter(id=>!state.build.fittedPartIds.includes(id));
    if(missing.length){setShowRequirements(true);setLocalMessage('');return;}
    const preview=previewPurchaseAndFit(state,selected.id);
    if(!preview.ok){setLocalMessage(preview.reason);return;}
    setPending(preview.plan);setLocalMessage('');
  };
  const proceed=()=>{if(!pending)return;onPurchaseAndFit(pending.part.id);setPending(null);};

  return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} shop {...(group?{onBack:()=>{setGroup(null);setSelectedId('');setLocalMessage('');}}:{})}>
    {!group?<section className="speedshop-home">
      <header className="speedshop-title"><span>1320 Motorsport</span><h2>Speedshop</h2><p>Select a performance department.</p></header>
      <CategoryCarousel onSelect={enterGroup}/>
      <div className="speedshop-balance">Account balance <strong>${state.cash.toLocaleString()}</strong></div>
    </section>:
    <section className="product-browser" key={group}>
      <header className="speedshop-title speedshop-title--compact"><span>Speedshop Department</span><h2>{WORKSHOP_GROUPS.find(item=>item.id===group)?.label}</h2><p>Select a component, review fitment, then purchase and install.</p></header>
      <div className="product-carousel" role="listbox" aria-label={`${group} products`} onPointerMove={edgeScroll}>
        {parts.map(part=>{const isSelected=part.id===selected?.id;const owned=state.ownedPartIds.includes(part.id);const fitted=state.build.fittedPartIds.includes(part.id);return <button key={part.id} data-sound="select" type="button" role="option" aria-selected={isSelected} className={`product-card${isSelected?' product-card--active':''}`} onClick={()=>{setSelectedId(part.id);setLocalMessage('');}}>
          <span className="product-card__price">{fitted?'Fitted':owned?'Owned':`Price: $${part.price.toLocaleString()}`}</span>
          <strong className="product-card__brand">{partBrand(part)}</strong>
          <span className="product-card__name">{part.displayName}</span>
          <CategoryArtwork groupId={group} label={part.displayName} part={part}/>
        </button>})}
      </div>
      {selected&&<div className="product-selection product-selection--rich">
        <div className="product-selection__copy"><span>Selected component</span><strong>{partBrand(selected)} · {selected.displayName}</strong><p>{partDescription(selected)}</p><small>{selected.requires.length?`Requires ${selected.requires.map(id=>getPart(id).displayName).join(', ')}`:'Direct fit for the selected Civic.'}</small></div>
        <div className="product-selection__effect">{effectSummary(selected.effects)}</div>
        <button type="button" data-sound="purchase" className="workshop-action" disabled={state.build.fittedPartIds.includes(selected.id)} onClick={requestPurchase}>{state.build.fittedPartIds.includes(selected.id)?'Installed':state.ownedPartIds.includes(selected.id)?'Install Component':'Purchase & Install'}</button>
        <PerformancePreview current={currentCar} next={projectedCar}/>
      </div>}
      <p className={`workshop-message${localMessage||message?' workshop-message--active':''}`} aria-live="polite">{localMessage||message||'Purchases are installed immediately. Conflicting hardware will be shown before you confirm.'}</p>
    </section>}
    {pending&&<div className="purchase-overlay" role="presentation"><section className="purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
      <header>Part Purchase</header>
      <div className="purchase-dialog__body"><span className="purchase-dialog__alert" aria-hidden="true">!</span><div><h2 id="purchase-title">{pending.replacedPartIds.length?'Replace part?':'Confirm purchase?'}</h2><p>{pending.price?<>Purchase and install <strong>{pending.part.displayName}</strong> for <strong>${pending.price.toLocaleString()}</strong>?</>:<>Install the owned <strong>{pending.part.displayName}</strong>?</>}</p>{pending.replacedPartIds.length>0&&<div className="purchase-conflicts"><span>Conflicting parts to be removed:</span><ul>{pending.replacedPartIds.map(id=><li key={id}>{getPart(id).displayName}</li>)}</ul></div>}</div></div>
      <footer><button type="button" onClick={()=>setPending(null)}>Cancel</button><button type="button" data-sound="purchase" className="primary" onClick={proceed}>Proceed</button></footer>
    </section></div>}
    {showRequirements&&selected&&<div className="purchase-overlay" role="presentation"><section className="purchase-dialog requirement-dialog" role="dialog" aria-modal="true" aria-labelledby="requirements-title">
      <header>Required Hardware</header>
      <div className="purchase-dialog__body"><span className="purchase-dialog__alert" aria-hidden="true">!</span><div><h2 id="requirements-title">Complete the installation first</h2><p><strong>{selected.displayName}</strong> needs the following hardware fitted to your selected car:</p><ul className="requirement-list">{selected.requires.map(id=>{const requirement=getPart(id);const fitted=state.build.fittedPartIds.includes(id);const owned=state.ownedPartIds.includes(id);return <li key={id} className={fitted?'ready':owned?'owned':'missing'}><strong>{requirement.displayName}</strong><span>{fitted?'Installed':owned?'Owned · install in Garage':'Purchase and install'}</span></li>;})}</ul></div></div>
      <footer><button type="button" className="primary" onClick={()=>setShowRequirements(false)}>Return to Shop</button></footer>
    </section></div>}
  </WorkshopFrame></div>;
}

function effectSummary(effects:PartEffects):string{
  const lines:string[]=[];
  if(effects.torqueMultiplier)lines.push(`Power +${Math.round((effects.torqueMultiplier-1)*100)}%`);
  if(effects.peakBoostBar)lines.push(`Boost +${effects.peakBoostBar.toFixed(2)} bar`);
  if(effects.clutchCapacityNm)lines.push(`Capacity ${effects.clutchCapacityNm} Nm`);
  if(effects.massDeltaKg)lines.push(`Weight ${effects.massDeltaKg>0?'+':''}${effects.massDeltaKg} kg`);
  if(effects.tyreGripMultiplier)lines.push(`Grip +${Math.round((effects.tyreGripMultiplier-1)*100)}%`);
  if(effects.drivelineEfficiencyDelta)lines.push(`Driveline +${Math.round(effects.drivelineEfficiencyDelta*100)}%`);
  return lines.join(' · ')||'Supporting hardware';
}

function partDescription(part:Part):string{
  const descriptions:Partial<Record<Part['category'],string>>={
    intake:'Improves airflow and sharpens throttle response without sacrificing street manners.',exhaust:'Reduces restriction with a tuned performance path and a deeper competition note.',
    ecu:'Revises fuel and ignition control to extract more from the installed hardware.',engine:'Competition engine hardware designed for sustained high-rpm operation.',
    turbo:'Exhaust-driven boost for the strongest top-end charge and trap-speed gain.',supercharger:'Immediate belt-driven response for a harder launch and broad mid-range torque.',
    'turbo-accessory':'Supporting charge hardware engineered to keep boost stable and repeatable.',clutch:'Higher-capacity driveline hardware for clean launches under increased torque.',
    transmission:'Shortens the path between driver input and tyre force.',tyres:'A softer compound and reinforced carcass improve launch traction.',
    suspension:'Controls weight transfer so more grip reaches the driven tyres.',wheels:'Lightweight wheel construction reduces rotating mass.',
    'weight-reduction':'Removes non-essential mass to improve every split on the track.',
  };
  return descriptions[part.category]??'Track-developed supporting hardware for the selected build.';
}
