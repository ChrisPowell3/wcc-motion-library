'use client';
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Children, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { durations, ease } from '../../tokens';
import { useReducedMotionPreference } from '../../useReducedMotionPreference';
import { resolveRevealDials } from './dials';
import { observeEntranceScrub } from '../../internal/entrance';
import { styles } from './styles';
function RevealItem({ children, as, distance, duration, blur, trigger, startOpacity, once, margin, startInset, delay, siblingDelay, axis, offsetSign, bounceEase, plays, scrubRange, smoothing, reduced }) {
    const anchor = useRef(null);
    const shown = useRef(false);
    const focused = useRef(false);
    const revealNow = useRef(() => { });
    const [focusVisible, setFocusVisible] = useState(false);
    // Server markup and the first hydration render are always readable, including
    // for reduced-motion viewers and clients where JavaScript never runs.
    const offset = useMotionValue(0);
    const opacity = useMotionValue(1);
    const blurValue = useMotionValue(0);
    const filter = useTransform(blurValue, value => value <= 0 ? 'none' : `blur(${value}px)`);
    useLayoutEffect(() => {
        const element = anchor.current;
        if (!element)
            return;
        let observer;
        let active = true;
        const stop = () => { offset.stop(); opacity.stop(); blurValue.stop(); };
        const final = () => {
            stop();
            shown.current = true;
            offset.set(0);
            opacity.set(1);
            blurValue.set(0);
            if (once)
                observer?.disconnect();
        };
        revealNow.current = final;
        // Check the actual preference here too, before the passive subscription runs.
        if (reduced || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || (once && shown.current)) {
            final();
            return stop;
        }
        if (plays === 'scrub' && trigger !== 'load') {
            const release = observeEntranceScrub(element, progress => {
                const p = focused.current ? 1 : progress;
                offset.set(offsetSign * distance * (1 - p));
                opacity.set(startOpacity + (1 - startOpacity) * p);
                blurValue.set(blur * (1 - p));
            }, { margin, startInset, scrubRange, smoothing });
            return () => { release(); stop(); revealNow.current = () => { }; };
        }
        if (trigger !== 'load' && typeof IntersectionObserver === 'undefined') {
            final();
            return stop;
        }
        const rect = element.getBoundingClientRect();
        let initial = trigger !== 'load' && blur === 0 && rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
        const prepare = () => {
            stop();
            // Autofocus runs during commit, and props can change while a descendant
            // remains focused. Neither case may put the active control back in hiding.
            if (focused.current) {
                shown.current = true;
                offset.set(0);
                opacity.set(1);
                blurValue.set(0);
                return;
            }
            offset.set(offsetSign * (initial ? Math.min(distance, 8) : distance));
            opacity.set(initial ? Math.max(startOpacity, 0.8) : startOpacity);
            blurValue.set(blur);
        };
        prepare();
        const play = () => {
            shown.current = true;
            const seconds = initial ? durations.fast : typeof duration === 'number' ? duration : durations[duration];
            const wait = delay + (initial ? Math.min(siblingDelay, durations.fast) : siblingDelay);
            animate(offset, 0, { type: 'tween', duration: seconds, delay: wait, ease: initial ? ease : bounceEase });
            animate(opacity, 1, { type: 'tween', duration: seconds, delay: wait, ease });
            if (blur > 0)
                animate(blurValue, 0, { type: 'tween', duration: seconds, delay: wait, ease });
        };
        if (trigger === 'load') {
            // Defer playback until commit settles, so StrictMode's setup/cleanup
            // rehearsal cannot consume a one-time load entrance before it paints.
            queueMicrotask(() => { if (active && !focused.current)
                play(); });
            return () => { active = false; stop(); revealNow.current = () => { }; };
        }
        let inside = false;
        let observerGeneration = 0;
        const connectObserver = () => {
            observer?.disconnect();
            if (once && shown.current)
                return;
            const generation = ++observerGeneration;
            // Native percentage margins use width, which can collapse a short wide
            // viewport. Word dials instead inset a fraction of the viewport height.
            const rootMargin = initial ? '0px' : startInset === undefined ? margin
                : `0px 0px -${window.innerHeight * startInset}px 0px`;
            try {
                observer = new IntersectionObserver(entries => {
                    if (!active || generation !== observerGeneration)
                        return;
                    for (const entry of entries) {
                        if (entry.target !== element)
                            continue;
                        if (!entry.isIntersecting) {
                            inside = false;
                            // Reset offscreen without a downward exit animation. Focused content
                            // stays visible, even if focus has scrolled past the observer margin.
                            if (!once && !focused.current) {
                                initial = false;
                                prepare();
                            }
                            continue;
                        }
                        if (inside || (once && shown.current) || focused.current)
                            continue;
                        inside = true;
                        shown.current = true;
                        play();
                        initial = false;
                        if (once)
                            observer?.disconnect();
                    }
                    // Already-visible content includes the narrow strip below a negative
                    // bottom margin. Observe the actual viewport for those mounted items.
                }, { rootMargin, threshold: 0 });
                observer.observe(element);
            }
            catch {
                // Invalid user-provided root margins must never leave content hidden.
                final();
            }
        };
        connectObserver();
        if (startInset !== undefined)
            window.addEventListener('resize', connectObserver);
        return () => {
            active = false;
            window.removeEventListener('resize', connectObserver);
            observer?.disconnect();
            stop();
            revealNow.current = () => { };
        };
    }, [plays, scrubRange, smoothing, distance, duration, blur, trigger, blurValue, startOpacity, once, margin, startInset, delay, siblingDelay, offsetSign, bounceEase, reduced, offset, opacity]);
    return _jsx("div", { ref: anchor, style: { ...styles.anchor, ...(axis === 'x' ? { overflowX: 'clip', overflowY: 'visible' } : {}), ...(as === 'button' ? styles.button : {}), ...(focusVisible ? styles.focus : {}) }, onFocusCapture: event => {
            focused.current = true;
            revealNow.current();
            setFocusVisible(event.target.matches(':focus-visible'));
        }, onBlurCapture: event => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                focused.current = false;
                setFocusVisible(false);
            }
        }, children: _jsx(motion.div, { initial: false, style: { ...styles.content, x: axis === 'x' ? offset : 0, y: axis === 'y' ? offset : 0, opacity, filter }, children: children }) });
}
/** Follows native scrolling through the shared passive viewport observer. */
export function ScrollRevealRise({ children, ...props }) {
    const reduced = useReducedMotionPreference();
    const { stagger, ...settings } = resolveRevealDials(props);
    // A fragment avoids a group box: item anchors can participate in the owner's
    // grid/flex layout. Stable React keys preserve each item's one-time reveal.
    return _jsx(_Fragment, { children: Children.toArray(children).map((child, index) => _jsx(RevealItem, { ...settings, siblingDelay: Math.min(Math.min(index, 9) * stagger / 1000, durations.entrance), reduced: reduced, children: child }, typeof child === 'object' && child !== null && 'key' in child ? child.key : index)) });
}
