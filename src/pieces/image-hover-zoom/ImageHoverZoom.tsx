'use client';

import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import type {MotionDials} from '../../dials';
import {ease} from '../../tokens';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {useFinePointer} from '../hover-tilt/behavior';
import {resolveImageHoverZoom} from './settings';

export interface ImageHoverZoomProps {
  /** Supply images with their own alt text (including alt="" for decorative images). */
  children: ReactNode;
  dials?: MotionDials;
  /** Hover scale, 1–1.2. Default 1.03. */
  scale?: number;
  /** Transition time, 0–3 seconds. Default 1. */
  duration?: number;
  className?: string;
  style?: CSSProperties;
}
export function ImageHoverZoom({children, className, style, ...props}: ImageHoverZoomProps) {
  const reduced = useReducedMotionPreference(); const fine = useFinePointer();
  const [hovered, setHovered] = useState(false); const [focused, setFocused] = useState(false);
  const enabled = fine && !reduced;
  const {scale, duration} = resolveImageHoverZoom(props);
  useEffect(() => {if (!enabled) setHovered(false);}, [enabled]);
  return <div className={className} style={{minWidth: 0, ...style, overflow: 'hidden', ...(focused ? {outline: '3px solid currentColor', outlineOffset: 4} : {})}}
    onPointerEnter={event => {if (enabled && event.pointerType !== 'touch') setHovered(true);}}
    onPointerLeave={() => setHovered(false)} onPointerCancel={() => setHovered(false)}
    onFocusCapture={event => setFocused(event.target.matches(':focus-visible'))}
    onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);}}>
    <div style={{minWidth: 0, transform: enabled && hovered && scale !== 1 ? `scale(${scale})` : 'none',
      transition: enabled ? `transform ${duration}s cubic-bezier(${ease.join(',')})` : 'none'}}>{children}</div>
  </div>;
}
