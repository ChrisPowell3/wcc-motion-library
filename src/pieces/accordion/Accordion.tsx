'use client';

import {useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode} from 'react';
import {cleanDials, type MotionDials} from '../../dials.js';
import {batchMotion, durations} from '../../tokens.js';
import {useReducedMotionPreference} from '../../useReducedMotionPreference.js';

export interface AccordionItem {
  /** Stable, unique item id. Duplicate ids are ignored after their first item. */
  id: string;
  /** Header content; do not put interactive elements inside this button label. */
  heading: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  /** Supports speed and cascade. Unsupported settings are ignored. */
  dials?: MotionDials;
  /** Allow several open panels. Default false; overrides the cascade dial. */
  multiple?: boolean;
  /** Initial open item ids; defaults to []. Unknown and repeated ids are ignored. */
  defaultOpenIds?: readonly string[];
  /** Panel duration in seconds, 0–2. Default .5; overrides speed. */
  duration?: number;
  /** Called after a user toggles a header, with the resulting open ids. */
  onChange?: (openIds: string[]) => void;
}

/** A disclosure group with an explicitly authorized animated grid-row height. */
export function Accordion({items, dials, multiple, defaultOpenIds = [], duration, onChange}: AccordionProps) {
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
  const [openIds, setOpenIds] = useState<string[]>(() => [...new Set(defaultOpenIds)].filter(id => validIds.has(id)));
  const validOpen = openIds.filter(id => validIds.has(id));
  const open = many ? validOpen : validOpen.slice(0, 1);
  const openKey = JSON.stringify(open);
  // Changing items or switching to one-panel mode must not resurrect old panels.
  useEffect(() => {setOpenIds(current => JSON.stringify(current) === openKey ? current : JSON.parse(openKey) as string[]);}, [openKey]);
  const instance = useId();
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const last = uniqueItems.length - 1;
    const next = event.key === 'ArrowDown' ? (index + 1) % uniqueItems.length
      : event.key === 'ArrowUp' ? (index + last) % uniqueItems.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? last : undefined;
    if (next === undefined) return;
    event.preventDefault();
    buttons.current.get(uniqueItems[next].id)?.focus();
  }

  return <div style={{width: '100%', minWidth: 0}}>
    {uniqueItems.map((item, index) => {
      const expanded = open.includes(item.id);
      const headerId = `${instance}-header-${index}`;
      const panelId = `${instance}-panel-${index}`;
      return <div key={item.id} style={{borderBottom: '1px solid currentColor'}}>
        <h3 style={{margin: 0, font: 'inherit'}}>
          <button type="button" id={headerId} ref={node => {if (node) buttons.current.set(item.id, node); else buttons.current.delete(item.id);}}
            aria-expanded={expanded} aria-controls={panelId} onKeyDown={event => navigate(event, index)}
            onClick={() => {
              const next = expanded ? open.filter(id => id !== item.id) : many ? [...open, item.id] : [item.id];
              setOpenIds(next); onChange?.([...next]);
            }}
            style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', padding: '24px 4px', border: 0, background: 'transparent', color: 'inherit', textAlign: 'left', font: 'inherit', fontWeight: 600, cursor: 'pointer', outlineOffset: 4}}>
            <span style={{minWidth: 0}}>{item.heading}</span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none"
              style={{flexShrink: 0, transform: `rotate(${expanded ? 45 : 0}deg)`, transition: animate ? `transform ${batchMotion.accordion.iconDuration * ratio}s ${ease}` : 'none'}}>
              <path d="M9 2V16M2 9H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </h3>
        <div id={panelId} role="region" aria-labelledby={headerId} aria-hidden={!expanded} inert={!expanded}
          style={{display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: animate ? `grid-template-rows ${seconds}s ${ease}` : 'none'}}>
          <div style={{minHeight: 0, overflow: 'hidden'}}>
            <div data-accordion-content="" style={{padding: '0 4px 24px', opacity: expanded ? 1 : 0, transition: animate ? `opacity ${batchMotion.accordion.opacityDuration * ratio}s ${batchMotion.accordion.opacityEase}` : 'none'}}>{item.content}</div>
          </div>
        </div>
      </div>;
    })}
  </div>;
}
