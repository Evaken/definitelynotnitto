import type { ReactNode } from 'react';
import type { Part, PartCategory } from '@nitto/game-core';

export const WORKSHOP_GROUPS = [
  { id: 'engine', label: 'Engine', categories: ['intake', 'exhaust', 'ecu', 'engine'] },
  { id: 'boost', label: 'Forced Induction', categories: ['turbo', 'supercharger', 'turbo-accessory'] },
  { id: 'drivetrain', label: 'Drivetrain', categories: ['clutch', 'transmission'] },
  { id: 'traction', label: 'Tyres & Suspension', categories: ['tyres', 'suspension', 'wheels'] },
  { id: 'weight', label: 'Weight Reduction', categories: ['weight-reduction'] },
] as const satisfies readonly { id: string; label: string; categories: readonly PartCategory[] }[];

export type WorkshopGroupId = (typeof WORKSHOP_GROUPS)[number]['id'];

export function partsForGroup(parts: readonly Part[], groupId: WorkshopGroupId): Part[] {
  const group = WORKSHOP_GROUPS.find((candidate) => candidate.id === groupId) ?? WORKSHOP_GROUPS[0];
  return parts.filter((part) => (group.categories as readonly PartCategory[]).includes(part.category));
}

export function WorkshopFrame({
  activeGroup,
  onGroupChange,
  cash,
  children,
}: {
  activeGroup: WorkshopGroupId;
  onGroupChange: (group: WorkshopGroupId) => void;
  cash: number;
  children: ReactNode;
}) {
  return (
    <div className="workshop">
      <div className="workshop__brandbar">
        <div><strong>1320</strong><span>PERFORMANCE WORKS</span></div>
        <div className="workshop__account"><span>MEMBER GARAGE</span><strong>${cash.toLocaleString()}</strong></div>
      </div>
      <nav className="workshop__modes" aria-label="Garage departments">
        <button className="workshop-tab workshop-tab--active" type="button">Modifications</button>
        <button className="workshop-tab" type="button" disabled title="Stage 4">Tune &amp; Dyno <small>Stage 4</small></button>
        <button className="workshop-tab" type="button" disabled title="Stage 8">Paint Shop <small>Stage 8</small></button>
        <button className="workshop-tab" type="button" disabled title="Stage 5">Maintenance <small>Stage 5</small></button>
      </nav>
      <nav className="workshop__categories" aria-label="Modification categories">
        {WORKSHOP_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            className={`workshop-category${activeGroup === group.id ? ' workshop-category--active' : ''}`}
            aria-pressed={activeGroup === group.id}
            onClick={() => onGroupChange(group.id)}
          >
            {group.label}
          </button>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function CarBay({ title, subtitle, badge }: { title: string; subtitle: string; badge: string }) {
  return (
    <div className="car-bay" aria-label={`${title}, ${subtitle}`}>
      <div className="car-bay__scanlines" />
      <div className="car-bay__badge">{badge}</div>
      <div className="car-silhouette">
        <span className="car-silhouette__glass" />
        <span className="car-silhouette__lamp car-silhouette__lamp--left" />
        <span className="car-silhouette__lamp car-silhouette__lamp--right" />
        <span className="car-silhouette__wheel car-silhouette__wheel--left" />
        <span className="car-silhouette__wheel car-silhouette__wheel--right" />
      </div>
      <div className="car-bay__identity"><strong>{title}</strong><span>{subtitle}</span></div>
    </div>
  );
}

