'use client';

import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';
import type {MotionDials} from '../../dials';
import {ease} from '../../tokens';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {useFinePointer} from '../hover-tilt/behavior';
import {resolveHoverLift} from './settings';

export interface HoverLiftProps {
  /** Supply a native button/link for interactive content; no extra tab stop is added. */
  children: ReactNode;
  dials?: MotionDials;
  /** Upward travel, 0–20 px. Default 3. */
  lift?: number;
  /** Transition time, 0–3 seconds. Default .5. */
  duration?: number;
  className?: string;
  style?: CSSProperties;
}
export function HoverLift({children, className, style, ...props}: HoverLiftProps) {
  const reduced = useReducedMotionPreference(); const fine = useFinePointer();
  const [hovered, setHovered] = useState(false); const [focused, setFocused] = useState(false);
  const enabled = fine && !reduced;
  const {lift, duration} = resolveHoverLift(props);
  useEffect(() => {if (!enabled) setHovered(false);}, [enabled]);
  return <div className={className} style={{display: 'inline-block', ...style}}
    onPointerEnter={event => {if (enabled && event.pointerType !== 'touch') setHovered(true);}}
    onPointerLeave={() => setHovered(false)} onPointerCancel={() => setHovered(false)}
    onFocusCapture={event => setFocused(event.target.matches(':focus-visible'))}
    onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);}}>
    <div style={{transform: enabled && (hovered || focused) && lift > 0 ? `translateY(${-lift}px)` : 'none',
      transition: enabled ? `transform ${duration}s cubic-bezier(${ease.join(',')})` : 'none'}}>{children}</div>
  </div>;
}
