import { durations } from '../../tokens';
export const bounded = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export const speedRatio = (speed) => (speed === 'slow' ? durations.slow : speed === 'fast' ? durations.fast : durations.base) / durations.base;
export const dialDelay = (delay, base) => delay === 'none' ? 0 : delay === 'long' ? base + durations.slow : base;
export const dialSize = (size) => size === 'small' ? .5 : size === 'large' ? 1.5 : 1;
export const deviceReduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
