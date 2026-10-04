'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from 'react';
import { batchMotion } from '../../tokens';
import { useReducedMotionPreference } from '../../useReducedMotionPreference';
import { observeViewport } from '../../internal/viewport';
import { focusTargets, resolveScrollFocus } from './settings';
export function ScrollFocus({ children, as: Tag = 'span', className, style, ...props }) {
    const anchor = useRef(null);
    const content = useRef(null);
    const reduced = useReducedMotionPreference();
    const { blur, distance, startOpacity, smoothing, enter, exit, exitFocus } = resolveScrollFocus(props);
    useLayoutEffect(() => {
        const element = anchor.current;
        const text = content.current;
        if (!element || !text)
            return;
        const rest = () => { text.style.filter = 'none'; text.style.opacity = '1'; text.style.transform = 'none'; };
        rest();
        if (reduced || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
            return;
        let current;
        const stop = observeViewport(element, (rect, height, delta) => {
            const target = focusTargets(rect, height, enter, exit, exitFocus);
            const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
            const follow = (from, to) => Math.abs(to - from) < .001 ? to : from + (to - from) * amount;
            current = current ? { focus: follow(current.focus, target.focus), entry: follow(current.entry, target.entry) } : target;
            const blurPx = Number(((1 - current.focus) * blur).toFixed(3));
            const y = Number(((1 - current.entry) * distance).toFixed(3));
            text.style.filter = blurPx === 0 ? 'none' : `blur(${blurPx}px)`;
            text.style.opacity = String(Number((startOpacity + (1 - startOpacity) * current.focus).toFixed(6)));
            text.style.transform = y === 0 ? 'none' : `translateY(${y}px)`;
            return current.focus !== target.focus || current.entry !== target.entry;
        });
        return () => { stop(); rest(); };
    }, [reduced, blur, distance, startOpacity, smoothing, enter, exit, exitFocus]);
    return _jsx(Tag, { ref: node => { anchor.current = node; }, className: className, style: { display: 'block', ...style }, children: _jsx("span", { ref: content, style: { display: 'block', filter: 'none', opacity: 1, transform: 'none' }, children: typeof children === 'string' ? children : '' }) });
}
