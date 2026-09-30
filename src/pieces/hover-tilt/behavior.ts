import {useEffect, useState} from 'react';
import {durations} from '../../tokens';

export const clampNumber = (value: number | undefined, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export const speedFactor = (speed: string | undefined) =>
  speed === 'fast' ? durations.fast / durations.base : speed === 'slow' ? durations.slow / durations.base : 1;
export const dialSmoothing = (base: number, speed: string | undefined) => {
  const factor = speedFactor(speed);
  return factor === 1 ? base : 1 - Math.pow(1 - base, 1 / factor);
};

/** Stay still until a hover-capable fine pointer is known to exist. */
export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFine(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return fine;
}
