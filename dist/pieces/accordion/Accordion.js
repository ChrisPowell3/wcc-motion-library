'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
import { cleanDials } from '../../dials';
import { batchMotion, durations } from '../../tokens';
import { useReducedMotionPreference } from '../../useReducedMotionPreference';
/** A disclosure group with an explicitly authorized animated grid-row height. */
export function Accordion({ items, dials, multiple, defaultOpenIds = [], duration, onChange }) {
    const settings = cleanDials('accordion', dials);
    const many = multiple ?? settings.cascade === 'together';
    const speed = settings.speed === 'slow' ? durations.slow / durations.base : settings.speed === 'fast' ? durations.fast / durations.base : 1;
    const seconds = typeof duration === 'number' && Number.isFinite(duration)
        ? Math.min(2, Math.max(0, duration)) : batchMotion.accordion.duration * speed;
    const ratio = seconds / batchMotion.accordion.duration;
    const reduced = useReducedMotionPreference();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const animate = mounted && !reduced && seconds > 0;
    const ease = `cubic-bezier(${batchMotion.accordion.ease.join(',')})`;
    const uniqueItems = items.filter((item, index) => items.findIndex(candidate => candidate.id === item.id) === index);
    const validIds = new Set(uniqueItems.map(item => item.id));
    const [openIds, setOpenIds] = useState(() => [...new Set(defaultOpenIds)].filter(id => validIds.has(id)));
    const validOpen = openIds.filter(id => validIds.has(id));
    const open = many ? validOpen : validOpen.slice(0, 1);
    const openKey = JSON.stringify(open);
    // Changing items or switching to one-panel mode must not resurrect old panels.
    useEffect(() => { setOpenIds(current => JSON.stringify(current) === openKey ? current : JSON.parse(openKey)); }, [openKey]);
    const instance = useId();
    const buttons = useRef(new Map());
    function navigate(event, index) {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
            return;
        const last = uniqueItems.length - 1;
        const next = event.key === 'ArrowDown' ? (index + 1) % uniqueItems.length
            : event.key === 'ArrowUp' ? (index + last) % uniqueItems.length
                : event.key === 'Home' ? 0 : event.key === 'End' ? last : undefined;
        if (next === undefined)
            return;
        event.preventDefault();
        buttons.current.get(uniqueItems[next].id)?.focus();
    }
    return _jsx("div", { style: { width: '100%', minWidth: 0 }, children: uniqueItems.map((item, index) => {
            const expanded = open.includes(item.id);
            const headerId = `${instance}-header-${index}`;
            const panelId = `${instance}-panel-${index}`;
            return _jsxs("div", { style: { borderBottom: '1px solid currentColor' }, children: [_jsx("h3", { style: { margin: 0, font: 'inherit' }, children: _jsxs("button", { type: "button", id: headerId, ref: node => { if (node)
                                buttons.current.set(item.id, node);
                            else
                                buttons.current.delete(item.id); }, "aria-expanded": expanded, "aria-controls": panelId, onKeyDown: event => navigate(event, index), onClick: () => {
                                const next = expanded ? open.filter(id => id !== item.id) : many ? [...open, item.id] : [item.id];
                                setOpenIds(next);
                                onChange?.([...next]);
                            }, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', padding: '24px 4px', border: 0, background: 'transparent', color: 'inherit', textAlign: 'left', font: 'inherit', fontWeight: 600, cursor: 'pointer', outlineOffset: 4 }, children: [_jsx("span", { style: { minWidth: 0 }, children: item.heading }), _jsx("svg", { "aria-hidden": "true", width: "18", height: "18", viewBox: "0 0 18 18", fill: "none", style: { flexShrink: 0, transform: `rotate(${expanded ? 45 : 0}deg)`, transition: animate ? `transform ${batchMotion.accordion.iconDuration * ratio}s ${ease}` : 'none' }, children: _jsx("path", { d: "M9 2V16M2 9H16", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })] }) }), _jsx("div", { id: panelId, role: "region", "aria-labelledby": headerId, "aria-hidden": !expanded, inert: !expanded, style: { display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: animate ? `grid-template-rows ${seconds}s ${ease}` : 'none' }, children: _jsx("div", { style: { minHeight: 0, overflow: 'hidden' }, children: _jsx("div", { "data-accordion-content": "", style: { padding: '0 4px 24px', opacity: expanded ? 1 : 0, transition: animate ? `opacity ${batchMotion.accordion.opacityDuration * ratio}s ${batchMotion.accordion.opacityEase}` : 'none' }, children: item.content }) }) })] }, item.id);
        }) });
}
