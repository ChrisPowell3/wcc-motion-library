import {flick} from '../../tokens';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const safeNumber = (value: number, fallback: number, min: number, max: number) =>
  clamp(Number.isFinite(value) ? value : fallback, min, max);

/** Position is measured in card-center steps; velocity is pixels per second. */
export function landingIndex(position: number, velocity: number, step: number, count: number) {
  const momentum = clamp(-velocity * flick.power / step, -flick.maxItems, flick.maxItems);
  return clamp(Math.round(-position + momentum), 0, Math.max(0, count - 1));
}

/** One-to-one inside the bounds; an asymptotic half-step cushion beyond them. */
export function resist(position: number, count: number) {
  const boundary = clamp(position, -Math.max(0, count - 1), 0);
  const excess = position - boundary;
  return boundary + excess / (1 + Math.abs(excess) * 2);
}
