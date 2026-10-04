import { flick } from '../../tokens.js';
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const safeNumber = (value, fallback, min, max) => clamp(Number.isFinite(value) ? value : fallback, min, max);
/** Position is measured in card-center steps; velocity is pixels per second. */
export function landingIndex(position, velocity, step, count, options = {}) {
    if (count < 2)
        return 0;
    const maxItems = options.maxItems ?? flick.maxItems;
    const momentum = clamp(-velocity * (options.power ?? flick.power) / step, -maxItems, maxItems);
    const target = Math.round(-position + momentum);
    return options.loop ? target : clamp(target, 0, Math.max(0, count - 1));
}
/** Stable modulo for negative indices and empty lists. */
export const wrap = (index, count) => count > 0 ? ((index % count) + count) % count : 0;
/** Nearest visual copy, rendered by the original semantic card only. */
export const cardOffset = (offset, count, loop) => loop && count > 1 ? wrap(offset + count / 2, count) - count / 2 : offset;
/** One-to-one inside the bounds; an asymptotic half-step cushion beyond them. */
export function resist(position, count) {
    const boundary = clamp(position, -Math.max(0, count - 1), 0);
    const excess = position - boundary;
    return boundary + excess / (1 + Math.abs(excess) * 2);
}
