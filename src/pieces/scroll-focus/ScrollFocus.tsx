'use client';

import {useLayoutEffect, useRef, type CSSProperties} from 'react';
import type {MotionDials} from '../../dials';
import {batchMotion} from '../../tokens';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {observeViewport} from '../../internal/viewport';
import {focusTargets, resolveScrollFocus} from './settings';

export interface ScrollFocusProps {
  /** Plain text only. Images and interactive descendants are deliberately excluded. */
  children: string;
  /** Text semantics. Default span, displayed as a block. */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  dials?: MotionDials;
  /** Maximum blur, 0–10 px. Default 8. */
  blur?: number;
  /** Entry travel, 0–60 px. Default 14. */
  distance?: number;
  /** Entry opacity, 0–1. Default .2. */
  startOpacity?: number;
  /** Per-reference-frame following factor, .01–1. Default .14. */
  smoothing?: number;
  /** Fraction of viewport height used for entry, .1–1. Default .4. */
  enter?: number;
  /** Fraction of viewport height used for exit, .05–1. Default .22. */
  exit?: number;
  /** Remaining focus after leaving the top, 0–1. Default .35. */
  exitFocus?: number;
  className?: string;
  style?: CSSProperties;
}

export function ScrollFocus({children, as: Tag = 'span', className, style, ...props}: ScrollFocusProps) {
  const anchor = useRef<HTMLElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotionPreference();
  const {blur, distance, startOpacity, smoothing, enter, exit, exitFocus} = resolveScrollFocus(props);
  useLayoutEffect(() => {
    const element = anchor.current; const text = content.current;
    if (!element || !text) return;
    const rest = () => {text.style.filter = 'none'; text.style.opacity = '1'; text.style.transform = 'none';};
    rest();
    if (reduced || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let current: {focus: number; entry: number} | undefined;
    const stop = observeViewport(element, (rect, height, delta) => {
      const target = focusTargets(rect, height, enter, exit, exitFocus);
      const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
      const follow = (from: number, to: number) => Math.abs(to - from) < .001 ? to : from + (to - from) * amount;
      current = current ? {focus: follow(current.focus, target.focus), entry: follow(current.entry, target.entry)} : target;
      const blurPx = Number(((1 - current.focus) * blur).toFixed(3));
      const y = Number(((1 - current.entry) * distance).toFixed(3));
      text.style.filter = blurPx === 0 ? 'none' : `blur(${blurPx}px)`;
      text.style.opacity = String(Number((startOpacity + (1 - startOpacity) * current.focus).toFixed(6)));
      text.style.transform = y === 0 ? 'none' : `translateY(${y}px)`;
      return current.focus !== target.focus || current.entry !== target.entry;
    });
    return () => {stop(); rest();};
  }, [reduced, blur, distance, startOpacity, smoothing, enter, exit, exitFocus]);
  return <Tag ref={node => {anchor.current = node;}} className={className} style={{display: 'block', ...style}}>
    <span ref={content} style={{display: 'block', filter: 'none', opacity: 1, transform: 'none'}}>{typeof children === 'string' ? children : ''}</span>
  </Tag>;
}
