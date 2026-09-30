'use client';

import {useLayoutEffect, useRef, type CSSProperties, type ReactNode} from 'react';
import type {MotionDials} from '../../dials';
import {batchMotion} from '../../tokens';
import {subscribeFrame} from '../../internal/frame';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {useFinePointer} from '../hover-tilt/behavior';
import {cursorTarget, resolveCursorFollowImage} from './settings';

export interface CursorFollowImageProps {
  /** Supply an image with meaningful alt text (or alt="" for decorative media). */
  children: ReactNode;
  dials?: MotionDials;
  /** Horizontal travel limit, 0–100 px. Default 26. */
  maxX?: number;
  /** Vertical travel limit, 0–100 px. Default 22. */
  maxY?: number;
  /** Scale while the pointer is inside, 1–1.2. Default 1.03. */
  scale?: number;
  /** Distance where the pull stops growing, 1–2000 px. Default 420. */
  falloff?: number;
  /** Pointer displacement multiplier, 0–1. Default .06. */
  strength?: number;
  /** Per-reference-frame following factor, .01–1. Default .08. */
  smoothing?: number;
  className?: string;
  style?: CSSProperties;
}

export function CursorFollowImage({children, className, style, ...props}: CursorFollowImageProps) {
  const anchor = useRef<HTMLDivElement>(null); const content = useRef<HTMLDivElement>(null);
  const target = useRef({x: 0, y: 0, scale: 1}); const current = useRef({...target.current});
  const cancel = useRef<(() => void) | undefined>(undefined);
  const reduced = useReducedMotionPreference(); const fine = useFinePointer();
  const settings = resolveCursorFollowImage(props); const {maxX, maxY, scale, falloff, strength, smoothing} = settings;
  const enabled = fine && !reduced;
  useLayoutEffect(() => {
    cancel.current?.(); cancel.current = undefined;
    target.current = {x: 0, y: 0, scale: 1}; current.current = {...target.current};
    if (content.current) content.current.style.transform = 'none';
    return () => {cancel.current?.(); cancel.current = undefined;};
  }, [enabled, maxX, maxY, scale, falloff, strength, smoothing]);
  const wake = () => {
    if (!enabled || cancel.current) return;
    cancel.current = subscribeFrame((_time, delta) => {
      if (!content.current) {cancel.current = undefined; return false;}
      const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
      const follow = (from: number, to: number) => Math.abs(to - from) < .0001 ? to : from + (to - from) * amount;
      const value = current.current = {x: follow(current.current.x, target.current.x), y: follow(current.current.y, target.current.y), scale: follow(current.current.scale, target.current.scale)};
      content.current.style.transform = value.x === 0 && value.y === 0 && value.scale === 1 ? 'none'
        : `translate3d(${Number(value.x.toFixed(3))}px,${Number(value.y.toFixed(3))}px,0) scale(${Number(value.scale.toFixed(4))})`;
      const moving = value.x !== target.current.x || value.y !== target.current.y || value.scale !== target.current.scale;
      if (!moving) cancel.current = undefined;
      return moving;
    });
  };
  const reset = () => {target.current = {x: 0, y: 0, scale: 1}; wake();};
  return <div ref={anchor} className={className} style={{minWidth: 0, ...style}}
    onPointerMove={event => {
      if (!enabled || event.pointerType === 'touch' || !anchor.current) return;
      target.current = {...cursorTarget(anchor.current.getBoundingClientRect(), event.clientX, event.clientY, settings), scale}; wake();
    }} onPointerLeave={reset} onPointerCancel={reset}>
    <div ref={content} style={{minWidth: 0, transform: 'none'}}>{children}</div>
  </div>;
}
