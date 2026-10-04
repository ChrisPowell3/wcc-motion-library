'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { cleanDials } from '../../dials.js';
import { designMotion, durations, ease } from '../../tokens.js';
import { useReducedMotionPreference } from '../../useReducedMotionPreference.js';
import { lockPageScroll } from './scroll-lock.js';
const clamp = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const controlStyle = { width: 44, height: 44, flexShrink: 0, border: '1px solid #ffffff66', borderRadius: '50%', background: '#ffffff14', color: 'inherit', font: 'inherit', fontSize: 24, cursor: 'pointer', outlineOffset: 4 };
const editable = (target) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), audio, video, [role="slider"]'));
/** Native top-layer viewer: the browser makes the rest of the page inert. */
export function FullscreenViewer({ items, dials, loop, duration, overlayDuration, distance, startScale, fade, ariaLabel = 'Fullscreen viewer', maxWidth, gap, swipeThreshold, className, style }) {
    const settings = cleanDials('fullscreen-viewer', dials);
    const speed = settings.speed === 'slow' ? durations.slow / durations.base : settings.speed === 'fast' ? durations.fast / durations.base : 1;
    const size = settings.size === 'small' ? .5 : settings.size === 'large' ? 1.5 : 1;
    const seconds = clamp(duration, designMotion.viewer.duration * speed, 0, 3);
    const overlaySeconds = clamp(overlayDuration, designMotion.viewer.overlayDuration * speed, 0, 3);
    const rise = clamp(distance, designMotion.viewer.distance * size, 0, 120);
    const scale = clamp(startScale, 1 - (1 - designMotion.viewer.scale) * size, .8, 1);
    const fadeMode = fade ?? settings.fade ?? 'full';
    const initialOpacity = fadeMode === 'none' ? 1 : fadeMode === 'full' ? 0 : .5;
    const wrap = loop ?? settings.loop !== 'off';
    const reduced = useReducedMotionPreference();
    const contentAnimation = useAnimationControls();
    const overlayAnimation = useAnimationControls();
    const uniqueItems = items.filter((item, index) => items.findIndex(candidate => candidate.id === item.id) === index);
    const [activeId, setActiveId] = useState(null);
    const activeIndex = uniqueItems.findIndex(item => item.id === activeId);
    const activeItem = uniqueItems[activeIndex];
    const isOpen = Boolean(activeItem);
    const modal = useRef(null);
    const closeButton = useRef(null);
    const trigger = useRef(null);
    const pointer = useRef(null);
    const instance = useId();
    useEffect(() => {
        if (!isOpen) {
            setActiveId(null);
            return;
        }
        const node = modal.current;
        const release = lockPageScroll(node.ownerDocument);
        node.showModal();
        closeButton.current?.focus({ preventScroll: true });
        return () => {
            node.close();
            release();
            if (trigger.current?.isConnected)
                trigger.current.focus({ preventScroll: true });
        };
    }, [isOpen]);
    // Content may own the focus when navigation removes it. Keep focus in the modal.
    useEffect(() => {
        const node = modal.current;
        if (isOpen && node && !node.contains(node.ownerDocument.activeElement))
            closeButton.current?.focus({ preventScroll: true });
    }, [activeId, isOpen]);
    useEffect(() => {
        if (!isOpen)
            return;
        const contentEnd = { opacity: 1, y: 0, scale: 1 };
        if (reduced) {
            contentAnimation.stop();
            overlayAnimation.stop();
            contentAnimation.set(contentEnd);
            overlayAnimation.set({ opacity: 1 });
        }
        else {
            void contentAnimation.start({ ...contentEnd, transition: { duration: seconds, ease } });
            void overlayAnimation.start({ opacity: 1, transition: { duration: overlaySeconds, ease } });
        }
        return () => { contentAnimation.stop(); overlayAnimation.stop(); };
    }, [activeId, isOpen, reduced, seconds, overlaySeconds, contentAnimation, overlayAnimation]);
    function navigate(offset) {
        if (uniqueItems.length < 2)
            return;
        const index = wrap ? (activeIndex + offset + uniqueItems.length) % uniqueItems.length : Math.max(0, Math.min(uniqueItems.length - 1, activeIndex + offset));
        setActiveId(uniqueItems[index].id);
    }
    function keyboard(event) {
        if (event.target instanceof Element && event.target.closest('dialog') !== event.currentTarget)
            return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setActiveId(null);
            return;
        }
        if (event.key === 'Tab') {
            const focusable = [...event.currentTarget.querySelectorAll('button, a[href], input, select, textarea, [tabindex], [contenteditable="true"]')]
                .filter(node => node.tabIndex >= 0 && !node.matches(':disabled') && !node.closest('[hidden], [inert], [aria-hidden="true"]') && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden');
            const first = focusable[0], last = focusable.at(-1);
            const focused = event.currentTarget.ownerDocument.activeElement;
            if (first && last && (event.shiftKey && focused === first || !event.shiftKey && focused === last || !event.currentTarget.contains(focused))) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            }
            return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || editable(event.target))
            return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            navigate(event.key === 'ArrowLeft' ? -1 : 1);
        }
    }
    return _jsxs("div", { className: className, style: { display: 'flex', flexWrap: 'wrap', gap: clamp(gap, 16, 0, 80), minWidth: 0, ...style }, children: [uniqueItems.map(item => _jsx("button", { type: "button", "aria-label": `Open ${item.label}`, "aria-haspopup": "dialog", "aria-controls": instance, onClick: event => { trigger.current = event.currentTarget; setActiveId(item.id); }, style: { display: 'block', maxWidth: '100%', padding: 0, border: 0, background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer', outlineOffset: 4 }, children: item.thumbnail }, item.id)), activeItem && _jsx("dialog", { ref: modal, id: instance, "aria-label": ariaLabel, "aria-modal": "true", onKeyDown: keyboard, onCancel: event => { event.preventDefault(); event.stopPropagation(); setActiveId(null); }, onClose: event => { event.stopPropagation(); setActiveId(null); }, style: { position: 'fixed', inset: 0, width: '100%', height: '100dvh', maxWidth: 'none', maxHeight: 'none', margin: 0, padding: 0, border: 0, background: 'transparent', color: '#fff', overflow: 'hidden' }, children: _jsxs(motion.div, { initial: { opacity: reduced || overlaySeconds === 0 ? 1 : 0 }, animate: overlayAnimation, onClick: event => { if (event.target === event.currentTarget)
                        setActiveId(null); }, style: { boxSizing: 'border-box', width: '100%', height: '100%', padding: 'clamp(12px, 3vw, 32px)', background: 'rgba(12,18,28,.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, overflowY: 'auto', overscrollBehavior: 'contain' }, children: [_jsxs("div", { style: { width: '100%', maxWidth: clamp(maxWidth, 1100, 280, 1920), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }, children: [_jsxs("p", { "aria-live": "polite", "aria-atomic": "true", style: { margin: 0, minWidth: 0 }, children: [activeItem.label, " ", _jsxs("span", { style: { opacity: .65 }, children: ["\u00B7 ", activeIndex + 1, " / ", uniqueItems.length] })] }), _jsx("button", { ref: closeButton, type: "button", "aria-label": "Close viewer", onClick: () => setActiveId(null), style: controlStyle, children: "\u00D7" })] }), _jsx(motion.div, { initial: reduced || seconds === 0 ? false : { opacity: initialOpacity, y: rise, scale }, animate: contentAnimation, onPointerDown: event => {
                                if (!(event.target instanceof Element) || event.target.closest('dialog') !== modal.current)
                                    return;
                                if (event.pointerType === 'touch' && !editable(event.target))
                                    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
                            }, onPointerCancel: event => {
                                if (event.target instanceof Element && event.target.closest('dialog') === modal.current)
                                    pointer.current = null;
                            }, onPointerUp: event => {
                                if (!(event.target instanceof Element) || event.target.closest('dialog') !== modal.current)
                                    return;
                                const start = pointer.current;
                                pointer.current = null;
                                if (!start || start.id !== event.pointerId)
                                    return;
                                const dx = event.clientX - start.x, dy = event.clientY - start.y;
                                if (Math.abs(dx) >= clamp(swipeThreshold, 48, 16, 200) && Math.abs(dx) > Math.abs(dy))
                                    navigate(dx < 0 ? 1 : -1);
                            }, style: { width: '100%', maxWidth: clamp(maxWidth, 1100, 280, 1920), minHeight: 0, flex: '1 1 auto', overflow: 'auto', touchAction: 'pan-y', marginBlock: 'auto' }, children: activeItem.content }, activeItem.id), _jsxs("div", { style: { width: '100%', maxWidth: clamp(maxWidth, 1100, 280, 1920), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }, children: [_jsx("button", { type: "button", "aria-label": "Previous item", disabled: uniqueItems.length < 2 || !wrap && activeIndex === 0, onClick: () => navigate(-1), style: { ...controlStyle, opacity: uniqueItems.length < 2 || !wrap && activeIndex === 0 ? .35 : 1 }, children: "\u2039" }), _jsx("div", { "aria-label": "Choose item", style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }, children: uniqueItems.map(item => _jsx("button", { type: "button", "aria-label": `Show ${item.label}`, "aria-current": item.id === activeId ? 'true' : undefined, onClick: () => setActiveId(item.id), style: { width: 44, height: 44, padding: 0, border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', outlineOffset: 2, display: 'grid', placeItems: 'center' }, children: _jsx("span", { "aria-hidden": "true", style: { width: item.id === activeId ? 24 : 7, height: 7, borderRadius: 4, background: 'currentColor', opacity: item.id === activeId ? 1 : .4 } }) }, item.id)) }), _jsx("button", { type: "button", "aria-label": "Next item", disabled: uniqueItems.length < 2 || !wrap && activeIndex === uniqueItems.length - 1, onClick: () => navigate(1), style: { ...controlStyle, opacity: uniqueItems.length < 2 || !wrap && activeIndex === uniqueItems.length - 1 ? .35 : 1 }, children: "\u203A" })] })] }) })] });
}
