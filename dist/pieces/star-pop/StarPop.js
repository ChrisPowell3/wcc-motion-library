'use client';
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Children, useLayoutEffect, useMemo, useRef } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { cleanDials } from '../../dials';
import { batchMotion, ease, settleEase } from '../../tokens';
import { resolveEntrance, observeEntranceScrub } from '../../internal/entrance';
import { observeVisibility } from '../../internal/observe';
import { useReducedMotionPreference } from '../../useReducedMotionPreference';
import { bounded, deviceReduced, dialDelay, speedRatio } from '../float/helpers';
export function resolveStarPopSettings(props) {
    const dials = cleanDials('star-pop', props.dials), base = batchMotion.star;
    const bounce = props.bounce ?? dials.bounce ?? 'springy';
    return {
        ...resolveEntrance(props, dials),
        duration: bounded(props.duration, base.duration * speedRatio(dials.speed), 0, 5),
        delay: bounded(props.delay, dialDelay(dials.delay, base.delay), 0, 5),
        stagger: bounded(props.stagger, base.stagger, 0, 1),
        peakScale: bounce === 'none' ? 1 : bounce === 'soft' ? 1.08 : 1.25,
        startRotate: bounce === 'none' ? 0 : bounce === 'soft' ? -20 : -40,
        peakRotate: bounce === 'none' ? 0 : bounce === 'soft' ? 3 : 8,
        ease: bounce === 'none' ? ease : bounce === 'soft' ? settleEase : base.ease,
        threshold: bounded(props.threshold, .25, 0, 1), margin: props.margin ?? '0px',
    };
}
function Star({ children, index, settings, reduced, className, style }) {
    const node = useRef(null), played = useRef(false), focused = useRef(false), finishNow = useRef(() => { });
    const scale = useMotionValue(1), rotate = useMotionValue(0), opacity = useMotionValue(1);
    useLayoutEffect(() => {
        const element = node.current;
        if (!element)
            return;
        const stop = () => { scale.stop(); rotate.stop(); opacity.stop(); };
        const finish = () => { stop(); scale.set(1); rotate.set(0); opacity.set(1); played.current = true; };
        finishNow.current = finish;
        if (reduced || deviceReduced() || (settings.once && played.current)) {
            finish();
            return stop;
        }
        if (settings.plays === 'scrub') {
            const release = observeEntranceScrub(element, progress => {
                const p = focused.current ? 1 : progress;
                scale.set(p);
                rotate.set(settings.startRotate * (1 - p));
                opacity.set(p);
            }, settings);
            return () => { release(); stop(); finishNow.current = () => { }; };
        }
        const prepare = () => { stop(); scale.set(0); rotate.set(settings.startRotate); opacity.set(0); };
        if (focused.current)
            finish();
        else
            prepare();
        let inside = false;
        const release = observeVisibility(element, visible => {
            if (!visible) {
                inside = false;
                if (!settings.once && !focused.current)
                    prepare();
                return;
            }
            if (inside || focused.current || (settings.once && played.current))
                return;
            inside = true;
            played.current = true;
            const options = { type: 'tween', duration: settings.duration,
                delay: settings.delay + index * settings.stagger, times: [0, batchMotion.star.peak, 1], ease: settings.ease };
            animate(scale, [0, settings.peakScale, 1], options);
            animate(rotate, [settings.startRotate, settings.peakRotate, 0], options);
            animate(opacity, [0, 1, 1], options);
        }, { threshold: settings.threshold, rootMargin: settings.margin });
        return () => { release(); stop(); finishNow.current = () => { }; };
    }, [index, settings, reduced, scale, rotate, opacity]);
    return _jsx("div", { ref: node, className: className, style: { display: 'inline-block', ...style }, onFocusCapture: () => { focused.current = true; finishNow.current(); }, onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget))
            focused.current = false; }, children: _jsx(motion.div, { initial: false, style: { display: 'inline-block', transformOrigin: '50% 50%', scale: reduced ? 1 : scale, rotate: reduced ? 0 : rotate, opacity: reduced ? 1 : opacity }, children: children }) });
}
export function StarPop({ children, className, style, ...props }) {
    const reduced = useReducedMotionPreference();
    // Inline dial objects are common in JSX; only semantic values may restart motion.
    const dials = cleanDials('star-pop', props.dials);
    const settings = useMemo(() => resolveStarPopSettings({ ...props, dials }), [props.plays, props.once, props.scrubRange, props.smoothing, dials.plays, dials.speed, dials.bounce, dials.delay, props.duration, props.delay, props.stagger, props.bounce, props.threshold, props.margin]);
    return _jsx(_Fragment, { children: Children.toArray(children).map((child, index) => _jsx(Star, { index: index, settings: settings, reduced: reduced, className: className, style: style, children: child }, typeof child === 'object' && 'key' in child ? child.key : index)) });
}
