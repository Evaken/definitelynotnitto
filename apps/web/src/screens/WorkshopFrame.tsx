import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { DECAL_CATALOG,stockAppearance,type Appearance,type DecalPlacement,type Part,type PartCategory } from '@nitto/game-core';
import { useWorkshopAudio,type WorkshopSound } from './useWorkshopAudio.js';
import { vehiclePortraitUrl } from '../vehicleArt.js';
import {useEdgePan} from '../useEdgePan.js';

export const WORKSHOP_GROUPS = [
  { id: 'intake', label: 'Intake', shortLabel: 'IN', categories: ['intake'] },
  { id: 'exhaust', label: 'Exhaust', shortLabel: 'EX', categories: ['exhaust'] },
  { id: 'engine', label: 'Engine', shortLabel: 'EN', categories: ['ecu', 'engine'] },
  { id: 'boost', label: 'Forced Induction', shortLabel: 'FI', categories: ['turbo', 'supercharger', 'turbo-accessory'] },
  { id: 'drivetrain', label: 'Drivetrain', shortLabel: 'DR', categories: ['clutch', 'transmission'] },
  { id: 'tyres', label: 'Tyres', shortLabel: 'TY', categories: ['tyres', 'wheels'] },
  { id: 'suspension', label: 'Suspension', shortLabel: 'SU', categories: ['suspension'] },
  { id: 'weight', label: 'Weight Reduction', shortLabel: 'WR', categories: ['weight-reduction'] },
  { id: 'nitrous', label: 'Nitrous Oxide', shortLabel: 'N₂', categories: ['nitrous'] },
] as const satisfies readonly { id: string; label: string; shortLabel: string; categories: readonly PartCategory[]; lockedStage?: string }[];

export type WorkshopGroupId = (typeof WORKSHOP_GROUPS)[number]['id'];

const CATEGORY_LABELS: Record<PartCategory, string> = {
  intake: 'Air Intake', exhaust: 'Exhaust Systems', ecu: 'Electronics', engine: 'Internal Engine',
  turbo: 'Turbo Systems', supercharger: 'Supercharger Systems', 'turbo-accessory': 'Boost Accessories',
  nitrous: 'Nitrous Systems', clutch: 'Clutch', transmission: 'Transmission', tyres: 'Tyres',
  suspension: 'Suspension', 'weight-reduction': 'Weight Reduction', wheels: 'Wheels', cosmetic: 'Appearance',
};

export function categoryLabel(category: PartCategory): string { return CATEGORY_LABELS[category]; }

export function categoriesForGroup(groupId: WorkshopGroupId): readonly PartCategory[] {
  return WORKSHOP_GROUPS.find(group => group.id === groupId)?.categories ?? WORKSHOP_GROUPS[0].categories;
}

export function partsForGroup(parts: readonly Part[], groupId: WorkshopGroupId): Part[] {
  const group = WORKSHOP_GROUPS.find((candidate) => candidate.id === groupId) ?? WORKSHOP_GROUPS[0];
  return parts.filter((part) => (group.categories as readonly PartCategory[]).includes(part.category));
}

export function WorkshopFrame({ cash, children, showDepartments = false, onBack, shop = false, activeDepartment='modifications', onDepartmentChange, carLabel='Honda Civic Si Hatchback' }: {
  cash: number;
  children: ReactNode;
  showDepartments?: boolean;
  onBack?: () => void;
  shop?: boolean;
  activeDepartment?:'modifications'|'tune'|'paint'|'maintenance';
  onDepartmentChange?:(department:'modifications'|'tune'|'paint'|'maintenance')=>void;
  carLabel?:string;
}) {
  const audio=useWorkshopAudio();
  const playButton=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if(!button||button.dataset.sound==='silent'||button.disabled)return;
    audio.play((button.dataset.sound as WorkshopSound|undefined)??'click');
  };
  return (
    <div className="workshop" onPointerDownCapture={playButton}>
      <div className="workshop__brandbar">
        <div><strong>1320</strong><span>{shop ? 'MOTORSPORT SPEEDSHOP' : 'PERFORMANCE WORKS'}</span></div>
        <div className="workshop__account"><button type="button" className="workshop-sound" data-sound="silent" aria-pressed={audio.enabled} onClick={audio.toggle}>{audio.enabled?'Sound on':'Sound off'}</button><span>MEMBER GARAGE</span><strong>${cash.toLocaleString()}</strong></div>
      </div>
      {(showDepartments || onBack) && <div className="workshop__toolbar">
        {onBack && <button className="workshop-back" data-sound="select" type="button" onClick={onBack}><span aria-hidden="true">◀</span> Back</button>}
        {showDepartments && <nav className="workshop__modes" aria-label="Garage departments">
          <button className={`workshop-tab${activeDepartment==='modifications'?' workshop-tab--active':''}`} type="button" onClick={()=>onDepartmentChange?.('modifications')}>Modifications</button>
          <button className={`workshop-tab${activeDepartment==='tune'?' workshop-tab--active':''}`} type="button" onClick={()=>onDepartmentChange?.('tune')}>Tune &amp; Dyno</button>
          <button className={`workshop-tab${activeDepartment==='paint'?' workshop-tab--active':''}`} type="button" onClick={()=>onDepartmentChange?.('paint')}>Paint Shop</button>
          <button className={`workshop-tab${activeDepartment==='maintenance'?' workshop-tab--active':''}`} type="button" onClick={()=>onDepartmentChange?.('maintenance')}>Maintenance</button>
        </nav>}
      </div>}
      {children}
      <footer className="workshop-status">
        <div><span>Selected car</span><strong>{carLabel}</strong></div>
        <div><span>Account</span><strong>${cash.toLocaleString()}</strong></div>
        <div><span>Garage status</span><strong>Build saved</strong></div>
      </footer>
    </div>
  );
}

export function CategoryArtwork({ groupId, label, part }: { groupId: WorkshopGroupId; label: string; part?:Part }) {
  const spritePosition: Partial<Record<WorkshopGroupId,string>> = {
    intake:'0% 0%', exhaust:'33.333% 0%', engine:'66.667% 0%', boost:'100% 0%',
    drivetrain:'0% 100%', tyres:'33.333% 100%', suspension:'66.667% 100%', weight:'100% 100%',
  };
  const position=spritePosition[groupId];
  const variant=part?[...part.id].reduce((sum,letter)=>sum+letter.charCodeAt(0),0)%5:0;
  const tier=part?Math.max(1,Math.min(4,Math.ceil(part.price/1600))):0;
  return <span className={`category-art category-art--${groupId}${position?' category-art--sprite':''}${part?` category-art--variant-${variant}`:''}`} aria-label={`${label} illustration`}
    {...(position?{style:{backgroundImage:`url(${import.meta.env.BASE_URL}assets/speedshop-parts-sheet.webp)`,backgroundPosition:position}}:{})}><i/><b/>{tier>0&&<em className="category-art__tier" aria-hidden="true">{Array.from({length:tier},(_,index)=><span key={index}/>)}</em>}</span>;
}

export function CategoryCarousel({ activeGroup, onSelect, showAll = true }: {
  activeGroup?: WorkshopGroupId;
  onSelect: (group: WorkshopGroupId) => void;
  showAll?: boolean;
}) {
  const groups = showAll ? WORKSHOP_GROUPS : WORKSHOP_GROUPS;
  const edgePan=useEdgePan<HTMLDivElement>();
  return <div className="category-carousel edge-pan" aria-label="Modification categories. Move the pointer toward either edge to browse." {...edgePan}>
    {groups.map(group => {
      return <button key={group.id} type="button"
        className={`category-card${activeGroup===group.id?' category-card--active':''}`}
        aria-pressed={activeGroup===group.id} data-sound="select" onClick={()=>onSelect(group.id)}>
        <span className="category-card__name">{group.label}</span>
        <CategoryArtwork groupId={group.id} label={group.label}/>
      </button>;
    })}
  </div>;
}

export function VehiclePortrait({carId,appearance,className=''}:{carId:string;appearance?:Appearance;className?:string}){
  const src=vehiclePortraitUrl(carId);
  const visual=appearance??{...stockAppearance(),hue:220,saturation:70,brightness:100};
  const showGraphics=visual.graphicsId!=='none';
  const style={
    '--vehicle-art':`url("${src}")`,
    '--graphics-color':`hsl(${visual.graphicsHue} 90% 55%)`,
    '--ride-offset':`${-visual.rideHeight/6}px`,
  } as CSSProperties;
  return <div className={`garage-car-art garage-car-art--${carId} finish--${visual.finishId} graphics--${visual.graphicsId} component--${visual.components.spoiler} component--${visual.components.exhaustTip} component--${visual.components.hood} component--${visual.components.roof} component--${visual.components.headlights} ${className}`} style={style}>
    <img className={`wheel-style-${visual.wheelStyle}`} style={{filter:`drop-shadow(0 18px 13px rgba(0,0,0,.8)) hue-rotate(${visual.hue-220}deg) saturate(${visual.saturation/70}) brightness(${visual.brightness/100})`}} src={src} alt="" draggable={false}/>
    {showGraphics&&<span className="garage-car-art__graphics" aria-hidden="true"/>}
    {visual.wheelStyle>0&&<span className={`appearance-wheels appearance-wheels--${visual.wheelStyle}`} aria-hidden="true"><i/><i/></span>}
    <span className="vehicle-accessory vehicle-accessory--spoiler" aria-hidden="true"/><span className="vehicle-accessory vehicle-accessory--exhaust" aria-hidden="true"/><span className="vehicle-accessory vehicle-accessory--hood" aria-hidden="true"/><span className="vehicle-accessory vehicle-accessory--roof" aria-hidden="true"/><span className="vehicle-accessory vehicle-accessory--lights" aria-hidden="true"/>
    {visual.decals.map(decal=>{const item=DECAL_CATALOG.find(candidate=>candidate.id===decal.decalId);const position=decalPosition(decal.surface,decal.x,decal.y);return item?<span key={decal.instanceId} className={`vehicle-decal vehicle-decal--${decal.surface}`} style={{left:`${position.left}%`,top:`${position.top}%`,transform:`translate(-50%,-50%) rotate(${decal.rotation}deg) scale(${decal.scale})`,color:`hsl(${decal.colorHue} 90% 62%)`}} aria-hidden="true">{item.glyph}</span>:null;})}
  </div>;
}

function decalPosition(surface:DecalPlacement['surface'],x:number,y:number):{left:number;top:number}{
  const surfaces:Record<DecalPlacement['surface'],readonly[number,number,number,number]>={hood:[25,50,42,57],'left-door':[47,67,43,60],'right-door':[47,67,43,60],roof:[43,61,29,42],'rear-quarter':[64,78,39,55]};
  const bounds=surfaces[surface];
  return{left:bounds[0]+x*(bounds[1]-bounds[0]),top:bounds[2]+y*(bounds[3]-bounds[2])};
}

export function CarBay({ title, subtitle, badge, carId, fittedParts=[],appearance,focusGroup }: { title: string; subtitle: string; badge: string; carId:string; fittedParts?:readonly Part[];appearance?:Appearance;focusGroup?:WorkshopGroupId }) {
  const fitted=new Set(fittedParts.map(part=>part.category));
  const fittedClasses=[...fitted].map(category=>`car-bay--fitted-${category}`).concat(fittedParts.map(part=>`car-bay--part-${part.id}`),focusGroup?`car-bay--focus-${focusGroup}`:'').join(' ');
  return (
    <div className={`car-bay ${fittedClasses}`} aria-label={`${title}, ${subtitle}`}>
      <div className="car-bay__scanlines" />
      <div className="car-bay__sweep" />
      <div className="car-bay__scene" aria-hidden="true"><i/><i/><b/></div>
      <div className="car-bay__badge">{badge}</div>
      <VehiclePortrait carId={carId} {...(appearance?{appearance}:{})}/>
      <div className="car-bay__identity"><strong>{title}</strong><span>{subtitle}</span></div>
    </div>
  );
}

export function partBrand(part: Part): string {
  const brands: Partial<Record<PartCategory,string>> = {
    intake:'AEROFLOW', exhaust:'RAVEN', ecu:'FORMULINE', engine:'AXE RACING', turbo:'AUTOROCK',
    supercharger:'AUTOROCK', 'turbo-accessory':'KOSEN', clutch:'DCR', transmission:'BIGBOSS',
    tyres:'NITTO', suspension:'ICHIBAN', 'weight-reduction':'CELLSPED', wheels:'VOLK', nitrous:'ACME',
  };
  return brands[part.category] ?? '1320 MOTORSPORT';
}
