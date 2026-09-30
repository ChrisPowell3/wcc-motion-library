'use client';

import {useLayoutEffect, useRef, type CSSProperties, type ReactNode} from 'react';
import type {MotionDials} from '../../dials';
import {batchMotion} from '../../tokens';
import {observeViewport} from '../../internal/viewport';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {resolveParallaxDrift} from './settings';

export interface ParallaxDriftProps {
  children: ReactNode;
  dials?: MotionDials;
  /** Maximum displacement, 0–300 px. Default 70. */
  distance?: number;
  /** Displacement per page scroll pixel, 0–1. Default .08. */
  factor?: number;
  /** Per-reference-frame following factor, .01–1. Default .14. */
  smoothing?: number;
  /** Direction of displacement while scrolling down. Default down. */
  direction?: 'up' | 'down';
  className?: string;
  style?: CSSProperties;
}

export function ParallaxDrift({children, className, style, ...props}: ParallaxDriftProps) {
  const anchor = useRef<HTMLDivElement>(null); const content = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();
  const {distance, factor, smoothing, direction} = resolveParallaxDrift(props);
  useLayoutEffect(() => {
    const element = content.current; const wrapper = anchor.current;
    if (!element || !wrapper) return;
    element.style.transform = 'none';
    if (reduced || distance === 0 || factor === 0) return;
    let current = 0;
    return observeViewport(wrapper, (_rect, _height, delta) => {
      const target = Math.max(0, Math.min(distance, window.scrollY * factor)) * (direction === 'up' ? -1 : 1);
      const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
      current = Math.abs(target - current) < .001 ? target : current + (target - current) * amount;
      element.style.transform = current === 0 ? 'none' : `translate3d(0,${Number(current.toFixed(3))}px,0)`;
      return current !== target;
    });
  }, [reduced, distance, factor, smoothing, direction]);
  return <div ref={anchor} className={className} style={{minWidth: 0, ...style}}>
    <div ref={content} style={{minWidth: 0, transform: 'none'}}>{children}</div>
  </div>;
}
