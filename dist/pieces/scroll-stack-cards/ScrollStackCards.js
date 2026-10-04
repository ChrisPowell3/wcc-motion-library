'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Children, useLayoutEffect, useRef } from 'react';
import { batchMotion } from '../../tokens.js';
import { observeViewport } from '../../internal/viewport.js';
import { useReducedMotionPreference } from '../../useReducedMotionPreference.js';
import { resolveScrollStackCards, stackProgress } from './settings.js';
export function ScrollStackCards({ children, className, style, ...props }) {
    const cards = Children.toArray(children);
    const anchors = useRef([]);
    const contents = useRef([]);
    const reduced = useReducedMotionPreference();
    const { plays, scale, smoothing, top, gap } = resolveScrollStackCards(props);
    // React can rewrite an index-based z-index during keyed reorders without a
    // new focus event. Reapply the focus elevation after every committed layout.
    useLayoutEffect(() => {
        anchors.current.slice(0, cards.length).forEach((element, index) => {
            if (element)
                element.style.zIndex = String(element.contains(element.ownerDocument.activeElement) ? cards.length : index);
        });
    });
    // Stable child keys detect replacement/reordering without interrupting equal inline dials.
    const identity = cards.map((card, index) => typeof card === 'object' && card !== null && 'key' in card ? String(card.key) : String(index)).join('|');
    useLayoutEffect(() => {
        const wrappers = anchors.current.slice(0, cards.length).filter((node) => node !== null);
        const layers = contents.current.slice(0, cards.length);
        wrappers.forEach((element, i) => { element.style.position = 'relative'; element.style.top = ''; if (layers[i])
            layers[i].style.transform = 'none'; });
        if (reduced || wrappers.length < 2)
            return;
        const rects = [];
        const progress = wrappers.map(() => 0);
        const peaks = wrappers.map(() => 0);
        let stops = [];
        let sticky = false;
        const connect = () => {
            stops.forEach(stop => stop());
            stops = wrappers.map((wrapper, i) => observeViewport(wrapper, (rect, viewportHeight, delta) => {
                rects[i] = rect;
                // The shared observer reads every stationary wrapper before invoking any callback.
                // The last callback has the complete snapshot and can safely write all layers.
                if (i !== wrappers.length - 1)
                    return false;
                const fits = rects.every(value => value.height > 0 && value.height <= viewportHeight - top);
                const changed = fits !== sticky;
                sticky = fits;
                const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
                let moving = changed;
                wrappers.forEach((element, index) => {
                    element.style.position = fits ? 'sticky' : 'relative';
                    element.style.top = fits ? `${top}px` : '';
                    let target = fits && index < wrappers.length - 1 ? stackProgress(rects[index].top, rects[index + 1].top, rects[index].height) : 0;
                    if (plays !== 'scrub') {
                        const outside = rects[index].bottom <= 0 || rects[index].top >= viewportHeight;
                        if (!fits || (plays === 'always' && outside)) {
                            peaks[index] = 0;
                            progress[index] = 0;
                            target = 0;
                        }
                        else {
                            peaks[index] = Math.max(peaks[index], target);
                            target = peaks[index];
                        }
                    }
                    progress[index] = !fits || Math.abs(target - progress[index]) < .0001 ? target : progress[index] + (target - progress[index]) * amount;
                    const layer = layers[index];
                    if (layer)
                        layer.style.transform = progress[index] === 0 || scale === 1 ? 'none' : `scale(${Number((1 - (1 - scale) * progress[index]).toFixed(4))})`;
                    moving = moving || target !== progress[index];
                });
                return moving;
            }));
        };
        connect();
        // Re-measure when fonts, images or application content change card dimensions.
        const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(connect);
        wrappers.forEach(wrapper => observer?.observe(wrapper));
        return () => { observer?.disconnect(); stops.forEach(stop => stop()); };
    }, [plays, reduced, scale, smoothing, top, gap, cards.length, identity]);
    return _jsx("div", { className: className, style: { minWidth: 0, ...style, display: 'flex', flexDirection: 'column', gap }, children: cards.map((card, index) => _jsx("div", { ref: node => { anchors.current[index] = node; }, "data-stack-card": index, style: { minWidth: 0, position: 'relative', zIndex: index }, onFocusCapture: event => { event.currentTarget.style.zIndex = String(cards.length); }, onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget))
                event.currentTarget.style.zIndex = String(index); }, children: _jsx("div", { ref: node => { contents.current[index] = node; }, style: { minWidth: 0, transform: 'none', transformOrigin: '50% 0' }, children: card }) }, typeof card === 'object' && card !== null && 'key' in card ? card.key : index)) });
}
