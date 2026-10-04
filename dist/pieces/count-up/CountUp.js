'use client';
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate, useMotionValue } from 'motion/react';
import { cleanDials } from '../../dials';
import { batchMotion } from '../../tokens';
import { resolveEntrance, observeEntranceScrub } from '../../internal/entrance';
import { observeVisibility } from '../../internal/observe';
import { useReducedMotionPreference } from '../../useReducedMotionPreference';
import { bounded, deviceReduced, dialDelay, speedRatio } from '../float/helpers';
export function resolveCountUpSettings(props) {
    const dials = cleanDials('count-up', props.dials), base = batchMotion.count;
    return {
        duration: bounded(props.duration, base.duration * speedRatio(dials.speed), 0, 10),
        delay: bounded(props.delay, dialDelay(dials.delay, base.delay), 0, 5),
        stagger: bounded(props.stagger, base.stagger, 0, 1),
        ...resolveEntrance(props, dials),
        threshold: bounded(props.threshold, .12, 0, 1), margin: props.margin ?? '0px 0px -6% 0px',
    };
}
/** Count the magnitude while retaining its exact authored prefix, suffix and precision. */
export function countText(final, progress) {
    if (progress >= 1)
        return final;
    const parts = final.match(/^([^\d]*)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?([^\d]*)$/);
    if (!parts)
        return final;
    const number = Number(parts[2].replaceAll(',', '') + (parts[3] ?? ''));
    if (!Number.isFinite(number))
        return final;
    const digits = parts[3]?.length ? parts[3].length - 1 : 0;
    if (digits > 100)
        return final;
    let [integer, decimal] = (number * Math.max(0, Math.min(1, progress))).toFixed(digits).split('.');
    if (parts[2].includes(','))
        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts[1] + integer + (decimal === undefined ? '' : `.${decimal}`) + parts[4];
}
function Count({ value, index, settings, reduced, className, style }) {
    const node = useRef(null), played = useRef(false);
    const progress = useMotionValue(1);
    const [display, setDisplay] = useState(value);
    useLayoutEffect(() => {
        const element = node.current;
        if (!element)
            return;
        const update = () => setDisplay(countText(value, progress.get()));
        const off = progress.on('change', update);
        const finish = () => { progress.stop(); progress.set(1); setDisplay(value); };
        if (reduced || deviceReduced() || (settings.once && played.current) || countText(value, 0) === value) {
            finish();
            return () => { off(); progress.stop(); };
        }
        if (settings.plays === 'scrub') {
            const release = observeEntranceScrub(element, value => progress.set(value), settings);
            return () => { release(); off(); progress.stop(); };
        }
        progress.set(0);
        update();
        let inside = false;
        const release = observeVisibility(element, visible => {
            if (!visible) {
                inside = false;
                if (!settings.once) {
                    progress.stop();
                    progress.set(0);
                    update();
                }
                return;
            }
            if (inside || (settings.once && played.current))
                return;
            inside = true;
            played.current = true;
            animate(progress, 1, { type: 'tween', duration: settings.duration,
                delay: settings.delay + (index % batchMotion.count.group) * settings.stagger,
                ease: batchMotion.count.ease, onComplete: () => setDisplay(value) });
        }, { threshold: settings.threshold, rootMargin: settings.margin });
        return () => { release(); off(); progress.stop(); };
    }, [value, index, settings, reduced, progress]);
    return _jsx("span", { ref: node, role: "group", "aria-label": value, className: className, style: { display: 'inline-block', ...style }, children: _jsx("span", { "aria-hidden": "true", children: display }) });
}
/** Each authored number stays accessible as its final value throughout the count. */
export function CountUp({ children, className, style, ...props }) {
    const reduced = useReducedMotionPreference();
    // Inline dial objects are common in JSX; only semantic values may restart motion.
    const dials = cleanDials('count-up', props.dials);
    const settings = useMemo(() => resolveCountUpSettings({ ...props, dials }), [props.plays, props.scrubRange, props.smoothing, dials.speed, dials.delay, dials.plays, props.duration, props.delay, props.stagger, props.once, props.threshold, props.margin]);
    const values = typeof children === 'string' ? [children] : children;
    return _jsx(_Fragment, { children: values.map((value, index) => _jsx(Count, { value: value, index: index, settings: settings, reduced: reduced, className: className, style: style }, `${index}:${value}`)) });
}
