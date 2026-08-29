import { useMemo, useState } from 'react';
import { getPart, partList, previewPurchaseAndFit, purchaseAndFitPart, resolveBuild, type Car, type GarageState, type Part, type PartEffects, type PurchaseInstallPlan } from '@nitto/game-core';
import { CategoryArtwork, CategoryCarousel, partBrand, partsForGroup, VehiclePortrait, WORKSHOP_GROUPS, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';
import { PerformancePreview } from './PerformancePreview.js';
import {useEdgePan} from '../useEdgePan.js';

interface InstallReceipt{readonly plan:PurchaseInstallPlan;readonly before:Car;readonly after:Car;}
export function PartsShopScreen({state,initialGroup,onPurchaseAndFit,onReturnGarage,onVisitDyno,onVisitRace}:{state:GarageState;message?:string;initialGroup:WorkshopGroupId|null;onPurchaseAndFit:(id:string)=>Promise<boolean>;onReturnGarage:(group:WorkshopGroupId)=>void;onVisitDyno:(group:WorkshopGroupId)=>void;onVisitRace:()=>void}){
  const [group,setGroup]=useState<WorkshopGroupId|null>(initialGroup);
  const [selectedId,setSelectedId]=useState('');
  const [pending,setPending]=useState<PurchaseInstallPlan|null>(null);
  const [showRequirements,setShowRequirements]=useState(false);
  const [localMessage,setLocalMessage]=useState('');
  const [installing,setInstalling]=useState<PurchaseInstallPlan|null>(null);
  const [receipt,setReceipt]=useState<InstallReceipt|null>(null);
  const productPan=useEdgePan<HTMLDivElement>();
  const parts=useMemo(()=>group?partsForGroup(partList(),group):[],[group]);
  const selected=parts.find(part=>part.id===selectedId)??parts[0];
  const currentCar=useMemo(()=>resolveBuild(state.build),[state.build]);
  const projectedResult=selected?purchaseAndFitPart(state,selected.id):null;
  const projectedCar=projectedResult?.ok?resolveBuild(projectedResult.state.build):null;
  const selectedFitted=selected?state.build.fittedPartIds.includes(selected.id):false;

  const enterGroup=(next:WorkshopGroupId,partId?:string)=>{setGroup(next);const first=partsForGroup(partList(),next)[0];setSelectedId(partId??first?.id??'');setLocalMessage('');setReceipt(null);};
  const requestPurchase=()=>{
    if(!selected)return;
    const missing=selected.requires.filter(id=>!state.build.fittedPartIds.includes(id));
    if(missing.length){setShowRequirements(true);setLocalMessage('');return;}
    const preview=previewPurchaseAndFit(state,selected.id);
    if(!preview.ok){setLocalMessage(preview.reason);return;}
    setPending(preview.plan);setLocalMessage('');
  };
  const proceed=async()=>{if(!pending)return;const plan=pending,before=currentCar,result=purchaseAndFitPart(state,plan.part.id),after=result.ok?resolveBuild(result.state.build):projectedCar;if(!after){setPending(null);setLocalMessage('Unable to prepare this installation.');return;}setPending(null);setInstalling(plan);const [saved]=await Promise.all([onPurchaseAndFit(plan.part.id),new Promise<boolean>(resolve=>setTimeout(()=>resolve(true),950))]);setInstalling(null);if(saved){setReceipt({plan,before,after});setLocalMessage('');}else setLocalMessage('Installation was not completed.');};
  const firstMissing=selected?.requires.find(id=>!state.build.fittedPartIds.includes(id));
  const browseRequirement=()=>{if(!firstMissing)return;const part=getPart(firstMissing),target=groupForPart(part);setShowRequirements(false);enterGroup(target,part.id);};

  return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} shop carLabel={`${currentCar.manufacturer} ${currentCar.displayName}`} {...(group?{onBack:()=>{setGroup(null);setSelectedId('');setLocalMessage('');setReceipt(null);}}:{})}>
    {!group?<section className="speedshop-home">
      <header className="speedshop-title"><span>1320 Motorsport</span><h2>Speedshop</h2><p>Select a performance department.</p></header>
      <SpeedshopCarContext state={state} car={currentCar} onGarage={()=>onReturnGarage('intake')}/>
      <CategoryCarousel onSelect={enterGroup}/>
      <div className="speedshop-balance">Account balance <strong>${state.cash.toLocaleString()}</strong></div>
    </section>:
    <section className="product-browser" key={group}>
      <header className="speedshop-title speedshop-title--compact"><span>Speedshop Department</span><h2>{WORKSHOP_GROUPS.find(item=>item.id===group)?.label}</h2><p>Select a component, review fitment, then purchase and install.</p></header>
      <SpeedshopCarContext state={state} car={currentCar} onGarage={()=>onReturnGarage(group)}/>
      <div className="product-carousel edge-pan" role="listbox" aria-label={`${group} products. Move the pointer toward either edge to browse.`} {...productPan}>
        {parts.map(part=>{const isSelected=part.id===selected?.id;const owned=state.ownedPartIds.includes(part.id);const fitted=state.build.fittedPartIds.includes(part.id);return <button key={part.id} data-sound="select" type="button" role="option" aria-selected={isSelected} className={`product-card${isSelected?' product-card--active':''}`} onClick={()=>{setSelectedId(part.id);setLocalMessage('');}}>
          <span className="product-card__price">{fitted?'Fitted':owned?'Owned':`Price: $${part.price.toLocaleString()}`}</span>
          <strong className="product-card__brand">{partBrand(part)}</strong>
          <span className="product-card__name">{part.displayName}</span>
          <CategoryArtwork groupId={group} label={part.displayName} part={part}/>
        </button>})}
      </div>
      {selected&&<div className="product-selection product-selection--rich">
        <div className="product-selection__copy"><span>Selected component</span><strong>{partBrand(selected)} · {selected.displayName}</strong><p>{partDescription(selected)}</p><small>{selected.requires.length?`Requires ${selected.requires.map(id=>getPart(id).displayName).join(', ')}`:`Direct fit for the selected ${currentCar.displayName}.`}</small>{selected.requires.length>0&&<ul className="inline-fitment-plan">{selected.requires.map(id=>{const required=getPart(id),fitted=state.build.fittedPartIds.includes(id),owned=state.ownedPartIds.includes(id);return <li key={id} className={fitted?'ready':owned?'owned':'missing'}><b>{required.displayName}</b><em>{fitted?'Fitted':owned?'Stored':'Missing'}</em></li>;})}</ul>}</div>
        <div className="product-selection__effect">{effectSummary(selected.effects)}</div>
        <button type="button" data-sound="purchase" className="workshop-action" disabled={state.build.fittedPartIds.includes(selected.id)} onClick={requestPurchase}>{state.build.fittedPartIds.includes(selected.id)?'Installed':state.ownedPartIds.includes(selected.id)?'Install Component':'Purchase & Install'}</button>
        {selectedFitted?<div className="installed-build-note"><strong>Active build component</strong><span>Choose another part to compare an actual performance change.</span></div>:<PerformancePreview current={currentCar} next={projectedCar}/>}
      </div>}
      <p className={`workshop-message${localMessage?' workshop-message--active':''}`} aria-live="polite">{localMessage||'Your selected car, owned inventory and compatibility rules remain active throughout this shop visit.'}</p>
    </section>}
    {pending&&<div className="purchase-overlay" role="presentation"><section className="purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
      <header>Part Purchase</header>
      <div className="purchase-dialog__body"><span className="purchase-dialog__alert" aria-hidden="true">!</span><div><h2 id="purchase-title">{pending.replacedPartIds.length?'Replace part?':'Confirm purchase?'}</h2><p>{pending.price?<>Purchase and install <strong>{pending.part.displayName}</strong> for <strong>${pending.price.toLocaleString()}</strong>?</>:<>Install the owned <strong>{pending.part.displayName}</strong>?</>}</p>{pending.replacedPartIds.length>0&&<div className="purchase-conflicts"><span>Conflicting parts to be removed:</span><ul>{pending.replacedPartIds.map(id=><li key={id}>{getPart(id).displayName}</li>)}</ul></div>}</div></div>
      <footer><button type="button" onClick={()=>setPending(null)}>Cancel</button><button type="button" data-sound="purchase" className="primary" onClick={()=>void proceed()}>Proceed</button></footer>
    </section></div>}
    {showRequirements&&selected&&<div className="purchase-overlay" role="presentation"><section className="purchase-dialog requirement-dialog" role="dialog" aria-modal="true" aria-labelledby="requirements-title">
      <header>Required Hardware</header>
      <div className="purchase-dialog__body"><span className="purchase-dialog__alert" aria-hidden="true">!</span><div><h2 id="requirements-title">Complete the installation first</h2><p><strong>{selected.displayName}</strong> needs the following hardware fitted to your selected car:</p><ul className="requirement-list">{selected.requires.map(id=>{const requirement=getPart(id);const fitted=state.build.fittedPartIds.includes(id);const owned=state.ownedPartIds.includes(id);return <li key={id} className={fitted?'ready':owned?'owned':'missing'}><strong>{requirement.displayName}</strong><span>{fitted?'Installed':owned?'Owned · install in Garage':'Purchase and install'}</span></li>;})}</ul></div></div>
      <footer><button type="button" onClick={()=>setShowRequirements(false)}>Return</button>{firstMissing&&<button type="button" className="primary" onClick={()=>state.ownedPartIds.includes(firstMissing)?onReturnGarage(groupForPart(getPart(firstMissing))):browseRequirement()}>{state.ownedPartIds.includes(firstMissing)?'Install From Storage':'Find Required Part'}</button>}</footer>
    </section></div>}
    {installing&&<div className="purchase-overlay install-overlay" role="status" aria-live="polite"><section className="install-sequence"><header>1320 Performance Works</header><div className="install-sequence__bay"><VehiclePortrait carId={state.build.carId} appearance={state.appearance}/><CategoryArtwork groupId={groupForPart(installing.part)} label={installing.part.displayName} part={installing.part}/><span className="install-sequence__tools" aria-hidden="true">✦</span></div><h2>Installing {installing.part.displayName}</h2><p>{installing.replacedPartIds.length?`${installing.replacedPartIds.length} conflicting component${installing.replacedPartIds.length===1?' is':'s are'} moving to storage.`:'Preparing and fitting the new component.'}</p><div className="install-progress"><i/></div></section></div>}
    {receipt&&<div className="purchase-overlay install-overlay"><section className="install-result" role="dialog" aria-modal="true" aria-labelledby="install-result-title"><header>Installation Complete</header><div className="install-result__body"><span>Build updated</span><h2 id="install-result-title">{receipt.plan.part.displayName}</h2><p>Installed on your {currentCar.manufacturer} {currentCar.displayName}.{receipt.plan.replacedPartIds.length?` ${receipt.plan.replacedPartIds.map(id=>getPart(id).displayName).join(', ')} moved to storage.`:''}</p><PerformancePreview current={receipt.before} next={receipt.after}/></div><footer><button type="button" onClick={()=>setReceipt(null)}>Continue Building</button><button type="button" onClick={()=>onReturnGarage(groupForPart(receipt.plan.part))}>View in Garage</button><button type="button" onClick={()=>onVisitDyno(groupForPart(receipt.plan.part))}>Run Dyno</button><button type="button" className="primary" onClick={onVisitRace}>Test at Track</button></footer></section></div>}
  </WorkshopFrame></div>;
}

function SpeedshopCarContext({state,car,onGarage}:{state:GarageState;car:Car;onGarage:()=>void}){return <aside className="speedshop-car-context" aria-label={`Currently modifying ${car.manufacturer} ${car.displayName}`}><div className="speedshop-car-context__portrait"><VehiclePortrait carId={state.build.carId} appearance={state.appearance}/></div><div><span>Currently modifying</span><strong>{car.manufacturer} {car.displayName}</strong><small>{state.build.fittedPartIds.length} fitted upgrade{state.build.fittedPartIds.length===1?'':'s'} · {state.ownedPartIds.length-state.build.fittedPartIds.length} stored</small></div><button type="button" onClick={onGarage}>Garage Setup</button></aside>;}

function groupForPart(part:Part):WorkshopGroupId{return WORKSHOP_GROUPS.find(item=>(item.categories as readonly Part['category'][]).includes(part.category))?.id??'intake';}

function effectSummary(effects:PartEffects):string{
  const lines:string[]=[];
  if(effects.torqueMultiplier)lines.push(`Power +${Math.round((effects.torqueMultiplier-1)*100)}%`);
  if(effects.peakBoostBar)lines.push(`Boost +${effects.peakBoostBar.toFixed(2)} bar`);
  if(effects.clutchHoldsTorqueRatio)lines.push(`Holds ${Math.round(effects.clutchHoldsTorqueRatio*100)}% of peak torque`);
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
