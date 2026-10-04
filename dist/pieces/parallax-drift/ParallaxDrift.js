'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from 'react';
import { batchMotion } from '../../tokens.js';
import { observeViewport } from '../../internal/viewport.js';
import { useReducedMotionPreference } from '../../useReducedMotionPreference.js';
import { resolveParallaxDrift } from './settings.js';
export function ParallaxDrift({ children, className, style, ...props }) {
    const anchor = useRef(null);
    const content = useRef(null);
    const reduced = useReducedMotionPreference();
    const { distance, factor, smoothing, direction } = resolveParallaxDrift(props);
    useLayoutEffect(() => {
        const element = content.current;
        const wrapper = anchor.current;
        if (!element || !wrapper)
            return;
        element.style.transform = 'none';
        if (reduced || distance === 0 || factor === 0)
            return;
        let current = 0;
        return observeViewport(wrapper, (_rect, _height, delta) => {
            const target = Math.max(0, Math.min(distance, window.scrollY * factor)) * (direction === 'up' ? -1 : 1);
            const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
            current = Math.abs(target - current) < .001 ? target : current + (target - current) * amount;
            element.style.transform = current === 0 ? 'none' : `translate3d(0,${Number(current.toFixed(3))}px,0)`;
            return current !== target;
        });
    }, [reduced, distance, factor, smoothing, direction]);
    return _jsx("div", { ref: anchor, className: className, style: { minWidth: 0, ...style }, children: _jsx("div", { ref: content, style: { minWidth: 0, transform: 'none' }, children: children }) });
}
