import { useMemo, useState } from 'react';
import { averageQuarterMileEt, fitPart, getCar, getPart, kwToHp, partList, peakTorque, powerKwAtRpm, removePart, repairCost, resolveBuild, type Appearance, type GarageState, type OwnedCarState, type Car, type Part, type PartCategory, type TimingSlip, type Tune } from '@nitto/game-core';
import { CarBay, categoriesForGroup, categoryLabel, partBrand, partsForGroup, VehiclePortrait, WORKSHOP_GROUPS, WorkshopFrame, type WorkshopGroupId } from './WorkshopFrame.js';
import { PerformancePreview } from './PerformancePreview.js';
import { TuneDynoPanel } from './TuneDynoPanel.js';

export function GarageScreen({state,car,history,message,onVisitShop,onFit,onRemove,onTune,onRepair,onAppearance,onSelect}:{state:GarageState;car:Car;history:readonly TimingSlip[];message:string;onVisitShop:()=>void;onFit:(id:string)=>void;onRemove:(id:string)=>void;onTune:(tune:Tune)=>void;onRepair:()=>void;onAppearance:(appearance:Appearance)=>void;onSelect:(id:string)=>void}){
  const [view,setView]=useState<'overview'|'setup'|'tune'|'paint'|'maintenance'>('overview');
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
  const activeCar:OwnedCarState={build:state.build,ownedPartIds:state.ownedPartIds,tune:state.tune,condition:state.condition,appearance:state.appearance};
  const garageCars=state.ownedCars.length?[state.ownedCars[0]!,activeCar,...state.ownedCars.slice(1)]:[activeCar];

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

  const carLabel=`${car.manufacturer} ${car.displayName}`;
  if(view==='overview')return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} carLabel={carLabel}>
    <section className="garage-overview">
      <header><span>Your Garage</span><h2>Garage Vehicles</h2><p>Select a garaged vehicle or enter Vehicle Setup for the active car.</p></header>
      <div className="garage-carousel" aria-label="Owned vehicles">
        {garageCars.map(item=>{
          const itemCar=getCar(item.build.carId);const isSelected=item.build.carId===state.build.carId;
          const average=isSelected?averageEt:null;const bracket=isSelected?bestEt:null;
          return <article key={item.build.carId} className={`garage-vehicle-card${isSelected?' garage-vehicle-card--selected':''}`} aria-current={isSelected?'true':undefined}>
            <header><span>{itemCar.manufacturer}</span><strong>{itemCar.displayName}</strong></header>
            <button type="button" className="vehicle-setup-button" onClick={()=>isSelected?openSetup():onSelect(item.build.carId)}>Vehicle Setup</button>
            <dl className="garage-records">
              <div><dt>Average ET</dt><dd>{average===null?'--.---':average.toFixed(3)}</dd></div>
              <div><dt>Bracket ET</dt><dd>{bracket===null?'--.---':bracket.toFixed(3)}</dd></div>
            </dl>
            <VehiclePortrait carId={item.build.carId} appearance={item.appearance} className="garage-vehicle-card__portrait"/>
            <small>{itemCar.year} {itemCar.displayName} · {item.build.fittedPartIds.length} upgrade{item.build.fittedPartIds.length===1?'':'s'} installed</small>
            <button type="button" className="selected-car-button" disabled={isSelected} onClick={()=>onSelect(item.build.carId)}>{isSelected?'Selected Car':'Garaged'}</button>
          </article>;
        })}
      </div>
    </section>
  </WorkshopFrame></div>;

  const chooseGroup=(next:WorkshopGroupId)=>{setGroup(next);const firstCategory=categoriesForGroup(next)[0]??'intake';setCategory(firstCategory);setSelectedId('');};

  const changeDepartment=(department:'modifications'|'tune'|'paint'|'maintenance')=>setView(department==='modifications'?'setup':department);
  if(view==='tune')return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} carLabel={carLabel} showDepartments activeDepartment="tune" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}><TuneDynoPanel car={car} tune={state.tune} message={message} onApply={onTune}/></WorkshopFrame></div>;
  if(view==='paint')return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} carLabel={carLabel} showDepartments activeDepartment="paint" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}><PaintShop car={car} appearance={state.appearance} fittedParts={fittedParts} message={message} onApply={onAppearance}/></WorkshopFrame></div>;
  if(view==='maintenance')return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} showDepartments activeDepartment="maintenance" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}><section className="maintenance-bay"><header><span>Vehicle Maintenance</span><h2>Workshop Inspection</h2></header><CarBay carId={car.id} title={`${car.year} ${car.displayName}`} subtitle="Mechanical inspection" badge="MAINTENANCE" fittedParts={fittedParts} appearance={state.appearance}/><div className="condition-card"><div className="condition-dial" style={{'--condition':`${state.condition*3.6}deg`} as React.CSSProperties}><strong>{state.condition.toFixed(1)}%</strong><span>Condition</span></div><div><h3>{state.condition>85?'Race ready':state.condition>55?'Service recommended':'Critical wear'}</h3><p>Over-revving, sustained boost and nitrous use add stress. Damage reduces engine output until repaired.</p><dl><div><dt>Power retained</dt><dd>{Math.round(70+state.condition*.3)}%</dd></div><div><dt>Repair estimate</dt><dd>${repairCost(state).toLocaleString()}</dd></div></dl><button type="button" className="workshop-action" disabled={repairCost(state)===0||state.cash<repairCost(state)} onClick={onRepair}>Authorise Repairs</button></div></div><p className={`workshop-message${message?' workshop-message--active':''}`}>{message||'Inspection results update after every completed pass.'}</p></section></WorkshopFrame></div>;

  return <div className="screen screen--workshop"><WorkshopFrame cash={state.cash} carLabel={carLabel} showDepartments activeDepartment="modifications" onDepartmentChange={changeDepartment} onBack={()=>setView('overview')}>
    <nav className="setup-category-strip" aria-label="Installed-part categories">
      {WORKSHOP_GROUPS.filter(item=>!('lockedStage' in item)).map(item=><button key={item.id} data-sound="select" type="button" aria-pressed={group===item.id} className={group===item.id?'active':''} onClick={()=>chooseGroup(item.id)}>{item.label}</button>)}
    </nav>
    <nav className="setup-subcategory-strip" aria-label={`${WORKSHOP_GROUPS.find(item=>item.id===group)?.label} systems`}>
      {categories.map(item=><button key={item} data-sound="select" type="button" className={category===item?'active':''} aria-pressed={category===item} onClick={()=>{setCategory(item);setSelectedId('');}}>{categoryLabel(item)}</button>)}
    </nav>
    <div className="workshop__stage">
      <div className="workshop__visual">
        <CarBay key={group} carId={car.id} title={`${car.year} ${car.manufacturer} ${car.displayName}`} subtitle={`${car.engine.code} · ${car.drivetrain} · ${state.build.fittedPartIds.length ? `${state.build.fittedPartIds.length} upgrade${state.build.fittedPartIds.length===1?'':'s'} fitted` : 'factory specification'}`} badge={WORKSHOP_GROUPS.find(item=>item.id===group)?.label.toUpperCase()??'MODIFICATIONS'} fittedParts={fittedParts} appearance={state.appearance}/>
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

function PaintShop({car,appearance,fittedParts,message,onApply}:{car:Car;appearance:Appearance;fittedParts:readonly Part[];message:string;onApply:(appearance:Appearance)=>void}){
  const [draft,setDraft]=useState(appearance);const slider=(key:keyof Appearance,label:string,min:number,max:number)=><label><span>{label}</span><input type="range" min={min} max={max} step="1" value={draft[key]} onChange={event=>setDraft(old=>({...old,[key]:Number(event.target.value)}))}/><output>{draft[key]}</output></label>;
  return <section className="paint-shop"><header><span>Custom Finish Studio</span><h2>Paint &amp; Appearance</h2></header><div className="paint-shop__body"><div className="paint-preview"><CarBay carId={car.id} title={`${car.year} ${car.manufacturer} ${car.displayName}`} subtitle={`Wheel design ${draft.wheelStyle+1} · ride ${draft.rideHeight} mm`} badge="PAINT BOOTH" fittedParts={fittedParts} appearance={draft}/><div className="paint-swatches">{[0,28,55,120,195,245,310].map(hue=><button key={hue} type="button" aria-label={`Paint hue ${hue}`} style={{background:`hsl(${hue} 78% 52%)`}} onClick={()=>setDraft(old=>({...old,hue}))}/>)}</div></div><div className="paint-controls">{slider('hue','Body hue',0,360)}{slider('saturation','Saturation',0,100)}{slider('brightness','Brightness',35,115)}{slider('graphicsHue','Graphics hue',0,360)}{slider('rideHeight','Ride height',-35,25)}<fieldset><legend>Wheel design</legend>{[0,1,2,3].map(style=><button key={style} className={draft.wheelStyle===style?'active':''} onClick={()=>setDraft(old=>({...old,wheelStyle:style}))}><i/>Style {style+1}</button>)}</fieldset><button type="button" className="workshop-action" onClick={()=>onApply(draft)}>Save Appearance</button></div></div><p className={`workshop-message${message?' workshop-message--active':''}`}>{message||'Cosmetic settings do not change vehicle performance.'}</p></section>;
}

function effectSummary(part:Part):string{
  const lines:string[]=[];const effects=part.effects;
  if(effects.torqueMultiplier)lines.push(`Power +${Math.round((effects.torqueMultiplier-1)*100)}%`);
  if(effects.peakBoostBar)lines.push(`Boost +${effects.peakBoostBar.toFixed(2)} bar`);
  if(effects.clutchCapacityNm)lines.push(`Clutch ${effects.clutchCapacityNm} Nm`);
  if(effects.massDeltaKg)lines.push(`Weight ${effects.massDeltaKg>0?'+':''}${effects.massDeltaKg} kg`);
  if(effects.tyreGripMultiplier)lines.push(`Grip +${Math.round((effects.tyreGripMultiplier-1)*100)}%`);
  if(effects.drivelineEfficiencyDelta)lines.push(`Driveline +${Math.round(effects.drivelineEfficiencyDelta*100)}%`);
  if(effects.nitrousPowerKw)lines.push(`Nitrous +${Math.round(effects.nitrousPowerKw*1.341)} hp`);
  return lines.join(' · ')||'Supporting hardware';
}
