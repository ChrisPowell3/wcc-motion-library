import {flick} from '../../tokens.js';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const safeNumber = (value: number, fallback: number, min: number, max: number) =>
  clamp(Number.isFinite(value) ? value : fallback, min, max);

/** Position is measured in card-center steps; velocity is pixels per second. */
export function landingIndex(position: number, velocity: number, step: number, count: number,
  options: {power?: number; maxItems?: number; loop?: boolean} = {}) {
  if (count < 2) return 0;
  const maxItems = options.maxItems ?? flick.maxItems;
  const momentum = clamp(-velocity * (options.power ?? flick.power) / step, -maxItems, maxItems);
  const target = Math.round(-position + momentum);
  return options.loop ? target : clamp(target, 0, Math.max(0, count - 1));
}

/** Stable modulo for negative indices and empty lists. */
export const wrap = (index: number, count: number) => count > 0 ? ((index % count) + count) % count : 0;

/** Nearest visual copy, rendered by the original semantic card only. */
export const cardOffset = (offset: number, count: number, loop: boolean) =>
  loop && count > 1 ? wrap(offset + count / 2, count) - count / 2 : offset;

/** One-to-one inside the bounds; an asymptotic half-step cushion beyond them. */
export function resist(position: number, count: number) {
  const boundary = clamp(position, -Math.max(0, count - 1), 0);
  const excess = position - boundary;
  return boundary + excess / (1 + Math.abs(excess) * 2);
}
