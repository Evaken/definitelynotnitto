import type { Part } from '../../types/part.js';

/**
 * Part registry.
 *
 * Deliberately empty: the parts shop is Stage 3 work and PROJECT_SPEC 11.4
 * forbids scaffolding later stages.  This exists only so the simulation can
 * already take a `Build` rather than a bare car.
 */
export const PARTS: ReadonlyMap<string, Part> = new Map();

export function getPart(id: string): Part {
  const part = PARTS.get(id);
  if (!part) throw new Error(`Unknown part id: ${id}`);
  return part;
}
