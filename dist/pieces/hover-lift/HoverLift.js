'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ease } from '../../tokens';
import { useReducedMotionPreference } from '../../useReducedMotionPreference';
import { useFinePointer } from '../hover-tilt/behavior';
import { resolveHoverLift } from './settings';
export function HoverLift({ children, className, style, ...props }) {
    const reduced = useReducedMotionPreference();
    const fine = useFinePointer();
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const enabled = fine && !reduced;
    const { lift, duration } = resolveHoverLift(props);
    useEffect(() => { if (!enabled)
        setHovered(false); }, [enabled]);
    return _jsx("div", { className: className, style: { display: 'inline-block', ...style }, onPointerEnter: event => { if (enabled && event.pointerType !== 'touch')
            setHovered(true); }, onPointerLeave: () => setHovered(false), onPointerCancel: () => setHovered(false), onFocusCapture: event => setFocused(event.target.matches(':focus-visible')), onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false); }, children: _jsx("div", { style: { transform: enabled && (hovered || focused) && lift > 0 ? `translateY(${-lift}px)` : 'none',
                transition: enabled ? `transform ${duration}s cubic-bezier(${ease.join(',')})` : 'none' }, children: children }) });
}
