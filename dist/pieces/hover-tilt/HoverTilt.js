'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from 'react';
import { batchMotion } from '../../tokens.js';
import { subscribeFrame } from '../../internal/frame.js';
import { useReducedMotionPreference } from '../../useReducedMotionPreference.js';
import { useFinePointer } from './behavior.js';
import { resolveHoverTilt, tiltTarget } from './settings.js';
export function HoverTilt({ children, className, style, ...props }) {
    const anchor = useRef(null);
    const content = useRef(null);
    const target = useRef({ x: 0, y: 0, lift: 0 });
    const current = useRef({ x: 0, y: 0, lift: 0 });
    const cancel = useRef(undefined);
    const reduced = useReducedMotionPreference();
    const fine = useFinePointer();
    const { maxTilt, lift, perspective, smoothing } = resolveHoverTilt(props);
    const enabled = fine && !reduced;
    const stop = () => { cancel.current?.(); cancel.current = undefined; };
    useLayoutEffect(() => {
        stop();
        target.current = { x: 0, y: 0, lift: 0 };
        current.current = { ...target.current };
        if (content.current)
            content.current.style.transform = 'none';
        return stop;
    }, [enabled, maxTilt, lift, perspective, smoothing]);
    const wake = () => {
        if (cancel.current || !enabled)
            return;
        cancel.current = subscribeFrame((_time, delta) => {
            const element = content.current;
            if (!element) {
                cancel.current = undefined;
                return false;
            }
            const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
            const next = (from, to) => Math.abs(to - from) < .001 ? to : from + (to - from) * amount;
            const value = current.current = { x: next(current.current.x, target.current.x), y: next(current.current.y, target.current.y), lift: next(current.current.lift, target.current.lift) };
            const rounded = (number) => Number(number.toFixed(3));
            element.style.transform = value.x === 0 && value.y === 0 && value.lift === 0 ? 'none'
                : `perspective(${perspective}px) rotateX(${rounded(value.y)}deg) rotateY(${rounded(value.x)}deg) translateY(${-rounded(value.lift)}px)`;
            const moving = value.x !== target.current.x || value.y !== target.current.y || value.lift !== target.current.lift;
            if (!moving)
                cancel.current = undefined;
            return moving;
        });
    };
    return _jsx("div", { ref: anchor, className: className, style: { minWidth: 0, ...style }, onPointerMove: event => {
            if (!enabled || event.pointerType === 'touch' || !anchor.current)
                return;
            target.current = { ...tiltTarget(anchor.current.getBoundingClientRect(), event.clientX, event.clientY, maxTilt), lift };
            wake();
        }, onPointerLeave: () => { target.current = { x: 0, y: 0, lift: 0 }; wake(); }, onPointerCancel: () => { target.current = { x: 0, y: 0, lift: 0 }; wake(); }, children: _jsx("div", { ref: content, style: { minWidth: 0, transform: 'none' }, children: children }) });
}
