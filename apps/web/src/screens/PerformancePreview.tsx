import { kwToHp,peakTorque,powerKwAtRpm,type Car } from '@nitto/game-core';

export interface PerformanceMetrics{readonly hp:number;readonly torqueNm:number;readonly massKg:number;readonly grip:number;}

export function performanceMetrics(car:Car):PerformanceMetrics{
  let hp=0;for(let rpm=car.engine.idleRpm;rpm<=car.engine.redlineRpm;rpm+=100)hp=Math.max(hp,kwToHp(powerKwAtRpm(car.engine.curve,rpm)));
  return{hp:Math.round(hp),torqueNm:Math.round(peakTorque(car.engine.curve).torqueNm),massKg:Math.round(car.chassis.massKg),grip:car.tyres.peakGrip};
}

function curvePath(car:Car,maxPower:number):string{
  const points=car.engine.curve.map((point,index)=>{const x=index/Math.max(1,car.engine.curve.length-1)*180;const power=kwToHp(powerKwAtRpm(car.engine.curve,point.rpm));const y=64-power/maxPower*54;return`${index?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;});
  return points.join(' ');
}

export function PerformancePreview({current,next}:{current:Car;next:Car|null}){
  const before=performanceMetrics(current);const after=next?performanceMetrics(next):before;
  const maxPower=Math.max(before.hp,after.hp)*1.08;
  const metrics:[string,string,string,string][]=[
    ['Power',`${before.hp} hp`,`${after.hp} hp`,`${after.hp-before.hp>=0?'+':''}${after.hp-before.hp}`],
    ['Torque',`${before.torqueNm} Nm`,`${after.torqueNm} Nm`,`${after.torqueNm-before.torqueNm>=0?'+':''}${after.torqueNm-before.torqueNm}`],
    ['Weight',`${before.massKg} kg`,`${after.massKg} kg`,`${after.massKg-before.massKg>=0?'+':''}${after.massKg-before.massKg}`],
    ['Grip',before.grip.toFixed(2),after.grip.toFixed(2),`${after.grip-before.grip>=0?'+':''}${(after.grip-before.grip).toFixed(2)}`],
  ];
  return <section className="performance-preview" aria-label="Performance comparison">
    <div className="performance-preview__graph"><span>Power curve preview</span><svg viewBox="0 0 180 68" role="img" aria-label="Current and projected power curves"><path className="before" d={curvePath(current,maxPower)}/>{next&&<path className="after" d={curvePath(next,maxPower)}/>}</svg><small><i/>Current {next&&<><b/>Projected</>}</small></div>
    <div className="performance-preview__metrics">{metrics.map(([label,oldValue,newValue,delta])=><div key={label}><span>{label}</span><del>{oldValue}</del><strong>{newValue}</strong><em className={delta.startsWith('-')&&label!=='Weight'?'negative':''}>{delta}</em></div>)}</div>
  </section>;
}
