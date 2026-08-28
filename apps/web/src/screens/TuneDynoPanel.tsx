import { useEffect, useMemo, useState } from 'react';
import { TUNING, runDyno, stockTune, type Car, type DynoResult, type Tune } from '@nitto/game-core';

export function TuneDynoPanel({car,tune,message,onApply}:{car:Car;tune:Tune;message:string;onApply:(tune:Tune)=>void}){
  const [draft,setDraft]=useState<Tune>(tune);
  const [current,setCurrent]=useState<DynoResult|null>(null);
  const [previous,setPrevious]=useState<DynoResult|null>(null);
  useEffect(()=>setDraft(tune),[tune]);
  const changed=JSON.stringify(draft)!==JSON.stringify(tune);
  const setGear=(index:number,value:number)=>setDraft(old=>({ ...old,gearRatios:old.gearRatios.map((ratio,i)=>i===index?value:ratio)}));
  const run=()=>{setPrevious(current);setCurrent(runDyno(car));};
  const maxSpeed=useMemo(()=>draft.gearRatios.map(ratio=>car.engine.redlineRpm*2*Math.PI/60*car.tyres.radiusM/(ratio*draft.finalDrive)*2.236936),[car,draft]);
  return <div className="tune-dyno">
    <section className="tune-console">
      <header><span>Transmission Setup</span><h2>Gear Ratio Control</h2><p>Short ratios accelerate harder but run out of road sooner. A bad setup can lose a race.</p></header>
      <div className="gear-stack">
        {draft.gearRatios.map((ratio,index)=><label key={index}><b>{index+1}</b><span>Gear {index+1}</span><input aria-label={`Gear ${index+1} ratio`} type="range" min={TUNING.gearRatioMin.value} max={TUNING.gearRatioMax.value} step={TUNING.ratioStep.value} value={ratio} onChange={event=>setGear(index,Number(event.target.value))}/><output>{ratio.toFixed(2)}</output><small>{Math.round(maxSpeed[index]??0)} mph</small></label>)}
        <label className="gear-stack__final"><b>F</b><span>Final drive</span><input aria-label="Final drive ratio" type="range" min={TUNING.finalDriveMin.value} max={TUNING.finalDriveMax.value} step={TUNING.ratioStep.value} value={draft.finalDrive} onChange={event=>setDraft(old=>({...old,finalDrive:Number(event.target.value)}))}/><output>{draft.finalDrive.toFixed(2)}</output><small>All gears</small></label>
      </div>
      <div className="tune-actions"><button type="button" className="workshop-action workshop-action--secondary" onClick={()=>setDraft(stockTune(car))}>Factory Ratios</button><button type="button" className="workshop-action" disabled={!changed} onClick={()=>onApply(draft)}>Save Setup</button></div>
      <p className={`workshop-message${message?' workshop-message--active':''}`}>{message||'Top speed figures are calculated at the engine redline.'}</p>
    </section>
    <section className="dyno-console">
      <header><span>Chassis Dynamometer</span><h2>Power Run</h2><button type="button" className="dyno-run" data-sound="engine" onClick={run}>Run Dyno</button></header>
      {current?<><DynoGraph current={current} previous={previous}/><div className="dyno-readout"><Metric label="Peak power" value={`${Math.round(current.peakHorsepower)} hp`} rpm={current.peakHorsepowerRpm}/><Metric label="Peak torque" value={`${Math.round(current.peakTorqueNm)} Nm`} rpm={current.peakTorqueRpm}/>{previous&&<Metric label="Power change" value={`${signed(current.peakHorsepower-previous.peakHorsepower)} hp`} rpm={null}/>}</div></>:<div className="dyno-idle"><div className="dyno-idle__rollers"><i/><i/></div><strong>Dyno standing by</strong><span>Run the fitted build to record its power and torque curves.</span></div>}
      <p className="dyno-note">The dyno measures the fitted engine build. Gear ratios affect the pass, not engine output.</p>
    </section>
  </div>;
}

function Metric({label,value,rpm}:{label:string;value:string;rpm:number|null}){return <div><span>{label}</span><strong>{value}</strong>{rpm!==null&&<small>@ {rpm.toLocaleString()} rpm</small>}</div>;}
function signed(value:number){const rounded=Math.round(value);return `${rounded>=0?'+':''}${rounded}`;}

function DynoGraph({current,previous}:{current:DynoResult;previous:DynoResult|null}){
  const width=620,height=250,pad=34;
  const all=[...current.points,...(previous?.points??[])];const maxRpm=Math.max(...all.map(point=>point.rpm));const minRpm=Math.min(...all.map(point=>point.rpm));const maxValue=Math.max(...all.flatMap(point=>[point.horsepower,point.torqueNm]),1)*1.08;
  const path=(result:DynoResult,key:'horsepower'|'torqueNm')=>result.points.map((point,index)=>`${index?'L':'M'} ${pad+(point.rpm-minRpm)/(maxRpm-minRpm)*(width-pad*2)} ${height-pad-point[key]/maxValue*(height-pad*2)}`).join(' ');
  return <div className="dyno-graph"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Horsepower and torque curves"><g className="dyno-grid">{[0,.25,.5,.75,1].map(n=><line key={n} x1={pad} y1={pad+n*(height-pad*2)} x2={width-pad} y2={pad+n*(height-pad*2)}/>)}</g>{previous&&<><path className="dyno-previous dyno-hp" d={path(previous,'horsepower')}/><path className="dyno-previous dyno-torque" d={path(previous,'torqueNm')}/></>}<path className="dyno-hp" d={path(current,'horsepower')}/><path className="dyno-torque" d={path(current,'torqueNm')}/><text x={pad} y={height-8}>{minRpm} rpm</text><text textAnchor="end" x={width-pad} y={height-8}>{maxRpm} rpm</text></svg><div className="dyno-legend"><span className="hp">HP</span><span className="torque">Torque</span>{previous&&<span className="previous">Previous run</span>}</div></div>;
}
