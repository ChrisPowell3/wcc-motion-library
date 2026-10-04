'use client';
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Children, useLayoutEffect, useMemo, useRef } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { cleanDials } from '../../dials';
import { batchMotion, blurStrength } from '../../tokens';
import { resolveEntrance, observeEntranceScrub } from '../../internal/entrance';
import { observeVisibility } from '../../internal/observe';
import { useReducedMotionPreference } from '../../useReducedMotionPreference';
import { bounded, deviceReduced, dialDelay, dialSize, speedRatio } from '../float/helpers';
import { createIdleTrack } from '../float/idle';
export function resolveCtaPillsSettings(props) {
    const dials = cleanDials('cta-pills', props.dials), base = batchMotion.pills, ratio = speedRatio(dials.speed), size = dialSize(dials.size);
    const blur = dials.blur === 'none' ? blurStrength.none : dials.blur === 'strong' ? blurStrength.strong : blurStrength.soft;
    return {
        ...resolveEntrance(props, dials),
        duration: bounded(props.duration, base.duration * ratio, 0, 5),
        delay: bounded(props.delay, dialDelay(dials.delay, base.delay), 0, 5),
        stagger: bounded(props.stagger, base.stagger, 0, 1),
        distance: bounded(props.distance, base.distance * size, 0, 64),
        scale: bounded(props.scale, base.scale, .5, 1),
        blur: bounded(props.blur, blur, 0, 10),
        bob: bounded(props.bob, base.bob * size, 0, 20),
        floatDuration: bounded(props.floatDuration, base.floatDuration * ratio, .2, 20),
        floatStep: bounded(props.floatStep, base.floatStep * ratio, 0, 3),
        floatDelay: bounded(props.floatDelay, base.floatDelay, 0, 10),
        floatDelayStep: bounded(props.floatDelayStep, base.floatDelayStep, 0, 3),
        threshold: bounded(props.threshold, .25, 0, 1), margin: props.margin ?? '0px',
    };
}
function Pill({ children, index, settings, reduced, className, style }) {
    const node = useRef(null), played = useRef(false), focused = useRef(false), finishNow = useRef(() => { });
    const y = useMotionValue(0), scale = useMotionValue(1), opacity = useMotionValue(1), blur = useMotionValue(0), bob = useMotionValue(0);
    const filter = useTransform(blur, value => value > 0 ? `blur(${Math.min(10, value)}px)` : 'none');
    useLayoutEffect(() => {
        const element = node.current;
        if (!element)
            return;
        const doc = element.ownerDocument;
        let visible = false, active = true;
        let idle;
        const stopEntrance = () => { y.stop(); scale.stop(); opacity.stop(); blur.stop(); };
        const finishEntrance = () => { stopEntrance(); y.set(0); scale.set(1); opacity.set(1); blur.set(0); };
        const stop = () => { stopEntrance(); idle?.stop(); bob.stop(); };
        const finish = () => { stop(); finishEntrance(); bob.set(0); played.current = true; };
        finishNow.current = finish;
        if (reduced || deviceReduced()) {
            finish();
            return stop;
        }
        if (settings.plays === 'scrub') {
            // Scrub owns the complete entrance; no independent bob can obscure reversal.
            bob.set(0);
            const release = observeEntranceScrub(element, progress => {
                const p = focused.current ? 1 : progress;
                y.set(settings.distance * (1 - p));
                scale.set(settings.scale + (1 - settings.scale) * p);
                opacity.set(p);
                blur.set(settings.blur * (1 - p));
            }, settings);
            return () => { release(); stop(); finishNow.current = () => { }; };
        }
        const wasPlayed = settings.once && played.current;
        if (!settings.once)
            played.current = false;
        if (wasPlayed || focused.current)
            finishEntrance();
        else {
            y.set(settings.distance);
            scale.set(settings.scale);
            opacity.set(0);
            blur.set(settings.blur);
        }
        const update = () => {
            if (!active || focused.current)
                return;
            if (visible && !played.current) {
                played.current = true;
                const entrance = { type: 'tween', duration: settings.duration,
                    delay: settings.delay + index * settings.stagger, ease: batchMotion.pills.ease };
                animate(y, 0, entrance);
                animate(scale, 1, entrance);
                animate(opacity, 1, entrance);
                animate(blur, 0, { ...entrance, onComplete: () => blur.set(0) });
            }
            if (visible && !doc.hidden && !idle) {
                idle = createIdleTrack(settings.floatDuration + index * settings.floatStep, wasPlayed ? 0 : settings.floatDelay + index * settings.floatDelayStep, progress => bob.set(-settings.bob * progress));
            }
            if (idle) {
                if (visible && !doc.hidden)
                    idle.play();
                else
                    idle.pause();
            }
        };
        const release = observeVisibility(element, next => {
            visible = next;
            if (!visible && !settings.once && !focused.current) {
                stop();
                idle = undefined;
                bob.set(0);
                played.current = false;
                y.set(settings.distance);
                scale.set(settings.scale);
                opacity.set(0);
                blur.set(settings.blur);
            }
            update();
        }, { threshold: settings.threshold, rootMargin: settings.margin });
        doc.addEventListener('visibilitychange', update);
        return () => { active = false; release(); doc.removeEventListener('visibilitychange', update); stop(); finishNow.current = () => { }; };
    }, [index, settings, reduced, y, scale, opacity, blur, bob]);
    return _jsx("div", { ref: node, className: className, style: { display: 'inline-block', ...style }, onFocusCapture: () => { focused.current = true; finishNow.current(); }, onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget))
            focused.current = false; }, children: _jsx(motion.div, { initial: false, style: { display: 'inline-block', y: reduced ? 0 : y, scale: reduced ? 1 : scale, opacity: reduced ? 1 : opacity, filter: reduced ? 'none' : filter }, children: _jsx(motion.div, { initial: false, style: { y: reduced ? 0 : bob }, children: children }) }) });
}
/** A soft pill entrance followed by an independent, shallow idle float. */
export function CtaPills({ children, className, style, ...props }) {
    const reduced = useReducedMotionPreference();
    // Inline dial objects are common in JSX; only semantic values may restart motion.
    const dials = cleanDials('cta-pills', props.dials);
    const settings = useMemo(() => resolveCtaPillsSettings({ ...props, dials }), [props.plays, props.once, props.scrubRange, props.smoothing, dials.plays, dials.speed, dials.size, dials.blur, dials.delay, props.duration, props.delay, props.stagger, props.distance, props.scale, props.blur, props.bob, props.floatDuration, props.floatStep, props.floatDelay, props.floatDelayStep, props.threshold, props.margin]);
    return _jsx(_Fragment, { children: Children.toArray(children).map((child, index) => _jsx(Pill, { index: index, settings: settings, reduced: reduced, className: className, style: style, children: child }, typeof child === 'object' && 'key' in child ? child.key : index)) });
}
