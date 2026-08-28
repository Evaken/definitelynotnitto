import type { ReactNode } from 'react';
import type { Part, PartCategory } from '@nitto/game-core';

export const WORKSHOP_GROUPS = [
  { id: 'intake', label: 'Intake', shortLabel: 'IN', categories: ['intake'] },
  { id: 'exhaust', label: 'Exhaust', shortLabel: 'EX', categories: ['exhaust'] },
  { id: 'engine', label: 'Engine', shortLabel: 'EN', categories: ['ecu', 'engine'] },
  { id: 'boost', label: 'Forced Induction', shortLabel: 'FI', categories: ['turbo', 'supercharger', 'turbo-accessory'] },
  { id: 'drivetrain', label: 'Drivetrain', shortLabel: 'DR', categories: ['clutch', 'transmission'] },
  { id: 'tyres', label: 'Tyres', shortLabel: 'TY', categories: ['tyres', 'wheels'] },
  { id: 'suspension', label: 'Suspension', shortLabel: 'SU', categories: ['suspension'] },
  { id: 'weight', label: 'Weight Reduction', shortLabel: 'WR', categories: ['weight-reduction'] },
  { id: 'nitrous', label: 'Nitrous Oxide', shortLabel: 'N₂', categories: ['nitrous'], lockedStage: 'Stage 5' },
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

export function WorkshopFrame({ cash, children, showDepartments = false, onBack, shop = false }: {
  cash: number;
  children: ReactNode;
  showDepartments?: boolean;
  onBack?: () => void;
  shop?: boolean;
}) {
  return (
    <div className="workshop">
      <div className="workshop__brandbar">
        <div><strong>1320</strong><span>{shop ? 'MOTORSPORT SPEEDSHOP' : 'PERFORMANCE WORKS'}</span></div>
        <div className="workshop__account"><span>MEMBER GARAGE</span><strong>${cash.toLocaleString()}</strong></div>
      </div>
      {(showDepartments || onBack) && <div className="workshop__toolbar">
        {onBack && <button className="workshop-back" type="button" onClick={onBack}><span aria-hidden="true">◀</span> Back</button>}
        {showDepartments && <nav className="workshop__modes" aria-label="Garage departments">
          <button className="workshop-tab workshop-tab--active" type="button">Modifications</button>
          <button className="workshop-tab" type="button" disabled title="Stage 4">Tune &amp; Dyno <small>Stage 4</small></button>
          <button className="workshop-tab" type="button" disabled title="Stage 8">Paint Shop <small>Stage 8</small></button>
          <button className="workshop-tab" type="button" disabled title="Stage 5">Maintenance <small>Stage 5</small></button>
        </nav>}
      </div>}
      {children}
      <footer className="workshop-status">
        <div><span>Selected car</span><strong>Honda Civic Si Hatchback</strong></div>
        <div><span>Account</span><strong>${cash.toLocaleString()}</strong></div>
        <div><span>Challenges</span><strong>Offline · Stage 6</strong></div>
      </footer>
    </div>
  );
}

export function CategoryArtwork({ groupId, label }: { groupId: WorkshopGroupId; label: string }) {
  return <span className={`category-art category-art--${groupId}`} aria-label={`${label} illustration`}><i/><b/></span>;
}

export function CategoryCarousel({ activeGroup, onSelect, showAll = true }: {
  activeGroup?: WorkshopGroupId;
  onSelect: (group: WorkshopGroupId) => void;
  showAll?: boolean;
}) {
  const groups = showAll ? WORKSHOP_GROUPS : WORKSHOP_GROUPS.filter(group => !('lockedStage' in group));
  return <div className="category-carousel" aria-label="Modification categories">
    {groups.map(group => {
      const locked = 'lockedStage' in group;
      return <button key={group.id} type="button"
        className={`category-card${activeGroup===group.id?' category-card--active':''}`}
        aria-pressed={activeGroup===group.id} disabled={locked} onClick={()=>onSelect(group.id)}>
        <span className="category-card__name">{group.label}</span>
        <CategoryArtwork groupId={group.id} label={group.label}/>
        {locked && <span className="category-card__lock">Locked · {group.lockedStage}</span>}
      </button>;
    })}
  </div>;
}

export function CarBay({ title, subtitle, badge, highlight }: { title: string; subtitle: string; badge: string; highlight?: WorkshopGroupId }) {
  return (
    <div className={`car-bay${highlight ? ` car-bay--${highlight}` : ''}`} aria-label={`${title}, ${subtitle}`}>
      <div className="car-bay__scanlines" />
      <div className="car-bay__badge">{badge}</div>
      <div className="car-silhouette car-silhouette--xray">
        <span className="car-silhouette__glass" />
        <span className="car-silhouette__engine" />
        <span className="car-silhouette__pipe" />
        <span className="car-silhouette__lamp car-silhouette__lamp--left" />
        <span className="car-silhouette__lamp car-silhouette__lamp--right" />
        <span className="car-silhouette__wheel car-silhouette__wheel--left" />
        <span className="car-silhouette__wheel car-silhouette__wheel--right" />
      </div>
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
