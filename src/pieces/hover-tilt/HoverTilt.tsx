'use client';

import {useLayoutEffect, useRef, type CSSProperties, type ReactNode} from 'react';
import type {MotionDials} from '../../dials';
import {batchMotion} from '../../tokens';
import {subscribeFrame} from '../../internal/frame';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {useFinePointer} from './behavior';
import {resolveHoverTilt, tiltTarget} from './settings';

export interface HoverTiltProps {
  children: ReactNode;
  dials?: MotionDials;
  /** Maximum rotation per axis, 0–15 degrees. Default 6. */
  maxTilt?: number;
  /** Upward travel on hover, 0–24 px. Default 8. */
  lift?: number;
  /** Perspective distance, 400–2000 px. Default 1000. */
  perspective?: number;
  /** Per-reference-frame following factor, .01–1. Default .1. */
  smoothing?: number;
  className?: string;
  style?: CSSProperties;
}

export function HoverTilt({children, className, style, ...props}: HoverTiltProps) {
  const anchor = useRef<HTMLDivElement>(null); const content = useRef<HTMLDivElement>(null);
  const target = useRef({x: 0, y: 0, lift: 0}); const current = useRef({x: 0, y: 0, lift: 0});
  const cancel = useRef<(() => void) | undefined>(undefined);
  const reduced = useReducedMotionPreference(); const fine = useFinePointer();
  const {maxTilt, lift, perspective, smoothing} = resolveHoverTilt(props);
  const enabled = fine && !reduced;
  const stop = () => {cancel.current?.(); cancel.current = undefined;};
  useLayoutEffect(() => {
    stop(); target.current = {x: 0, y: 0, lift: 0}; current.current = {...target.current};
    if (content.current) content.current.style.transform = 'none';
    return stop;
  }, [enabled, maxTilt, lift, perspective, smoothing]);
  const wake = () => {
    if (cancel.current || !enabled) return;
    cancel.current = subscribeFrame((_time, delta) => {
      const element = content.current;
      if (!element) {cancel.current = undefined; return false;}
      const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
      const next = (from: number, to: number) => Math.abs(to - from) < .001 ? to : from + (to - from) * amount;
      const value = current.current = {x: next(current.current.x, target.current.x), y: next(current.current.y, target.current.y), lift: next(current.current.lift, target.current.lift)};
      const rounded = (number: number) => Number(number.toFixed(3));
      element.style.transform = value.x === 0 && value.y === 0 && value.lift === 0 ? 'none'
        : `perspective(${perspective}px) rotateX(${rounded(value.y)}deg) rotateY(${rounded(value.x)}deg) translateY(${-rounded(value.lift)}px)`;
      const moving = value.x !== target.current.x || value.y !== target.current.y || value.lift !== target.current.lift;
      if (!moving) cancel.current = undefined;
      return moving;
    });
  };
  return <div ref={anchor} className={className} style={{minWidth: 0, ...style}}
    onPointerMove={event => {
      if (!enabled || event.pointerType === 'touch' || !anchor.current) return;
      target.current = {...tiltTarget(anchor.current.getBoundingClientRect(), event.clientX, event.clientY, maxTilt), lift}; wake();
    }}
    onPointerLeave={() => {target.current = {x: 0, y: 0, lift: 0}; wake();}}
    onPointerCancel={() => {target.current = {x: 0, y: 0, lift: 0}; wake();}}>
    <div ref={content} style={{minWidth: 0, transform: 'none'}}>{children}</div>
  </div>;
}
