import {durations} from '../../tokens';

export const bounded = (value: number | undefined, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export const speedRatio = (speed: string | undefined) =>
  (speed === 'slow' ? durations.slow : speed === 'fast' ? durations.fast : durations.base) / durations.base;
export const dialDelay = (delay: string | undefined, base: number) => delay === 'none' ? 0 : delay === 'long' ? base + durations.slow : base;
export const dialSize = (size: string | undefined) => size === 'small' ? .5 : size === 'large' ? 1.5 : 1;
export const deviceReduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
