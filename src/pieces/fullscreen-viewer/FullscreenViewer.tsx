'use client';

import {useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode} from 'react';
import {motion, useAnimationControls} from 'motion/react';
import {cleanDials, type MotionDials} from '../../dials.js';
import {designMotion, durations, ease} from '../../tokens.js';
import {useReducedMotionPreference} from '../../useReducedMotionPreference.js';
import {lockPageScroll} from './scroll-lock.js';

export interface FullscreenViewerItem {
  /** Stable id. Duplicate ids are ignored after their first occurrence. */
  id: string;
  /** Plain-text name used by the thumbnail, current-item announcement and dot. */
  label: string;
  /** Noninteractive content inside a native button. Supply alt text for images. */
  thumbnail: ReactNode;
  /** Any content; images must have alt text. Links and form fields are supported. */
  content: ReactNode;
}
export interface FullscreenViewerProps {
  items: readonly FullscreenViewerItem[];
  /** Supported: speed, size, loop, fade. */
  dials?: MotionDials;
  /** Wrap at either end. Default true; overrides loop dial. */
  loop?: boolean;
  /** Content entrance seconds, 0–3. Default .6; overrides speed. */
  duration?: number;
  /** Overlay entrance seconds, 0–3. Default .5; overrides speed. */
  overlayDuration?: number;
  /** Entrance rise in pixels, 0–120. Default 24; overrides size. */
  distance?: number;
  /** Entrance scale, .8–1. Default .97; overrides size. */
  startScale?: number;
  /** Content fade: none, soft or full. Default full; overrides fade dial. */
  fade?: 'none' | 'soft' | 'full';
  /** Accessible modal name. Default "Fullscreen viewer". */
  ariaLabel?: string;
  /** Content width in pixels, 280–1920. Default 1100. */
  maxWidth?: number;
  /** Thumbnail gap in pixels, 0–80. Default 16. */
  gap?: number;
  /** Horizontal touch travel needed to navigate, 16–200px. Default 48. */
  swipeThreshold?: number;
  className?: string;
  style?: CSSProperties;
}
const clamp = (value: number | undefined, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const controlStyle: CSSProperties = {width: 44, height: 44, flexShrink: 0, border: '1px solid #ffffff66', borderRadius: '50%', background: '#ffffff14', color: 'inherit', font: 'inherit', fontSize: 24, cursor: 'pointer', outlineOffset: 4};
const editable = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), audio, video, [role="slider"]'));

/** Native top-layer viewer: the browser makes the rest of the page inert. */
export function FullscreenViewer({items, dials, loop, duration, overlayDuration, distance, startScale, fade, ariaLabel = 'Fullscreen viewer', maxWidth, gap, swipeThreshold, className, style}: FullscreenViewerProps) {
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = uniqueItems.findIndex(item => item.id === activeId);
  const activeItem = uniqueItems[activeIndex];
  const isOpen = Boolean(activeItem);
  const modal = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const pointer = useRef<{id: number; x: number; y: number} | null>(null);
  const instance = useId();

  useEffect(() => {
    if (!isOpen) {setActiveId(null); return;}
    const node = modal.current!;
    const release = lockPageScroll(node.ownerDocument);
    node.showModal();
    closeButton.current?.focus({preventScroll: true});
    return () => {
      node.close();
      release();
      if (trigger.current?.isConnected) trigger.current.focus({preventScroll: true});
    };
  }, [isOpen]);
  // Content may own the focus when navigation removes it. Keep focus in the modal.
  useEffect(() => {
    const node = modal.current;
    if (isOpen && node && !node.contains(node.ownerDocument.activeElement)) closeButton.current?.focus({preventScroll: true});
  }, [activeId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const contentEnd = {opacity: 1, y: 0, scale: 1};
    if (reduced) {
      contentAnimation.stop(); overlayAnimation.stop();
      contentAnimation.set(contentEnd); overlayAnimation.set({opacity: 1});
    } else {
      void contentAnimation.start({...contentEnd, transition: {duration: seconds, ease}});
      void overlayAnimation.start({opacity: 1, transition: {duration: overlaySeconds, ease}});
    }
    return () => {contentAnimation.stop(); overlayAnimation.stop();};
  }, [activeId, isOpen, reduced, seconds, overlaySeconds, contentAnimation, overlayAnimation]);

  function navigate(offset: number) {
    if (uniqueItems.length < 2) return;
    const index = wrap ? (activeIndex + offset + uniqueItems.length) % uniqueItems.length : Math.max(0, Math.min(uniqueItems.length - 1, activeIndex + offset));
    setActiveId(uniqueItems[index].id);
  }
  function keyboard(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.target instanceof Element && event.target.closest('dialog') !== event.currentTarget) return;
    if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); setActiveId(null); return;}
    if (event.key === 'Tab') {
      const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex], [contenteditable="true"]')]
        .filter(node => node.tabIndex >= 0 && !node.matches(':disabled') && !node.closest('[hidden], [inert], [aria-hidden="true"]') && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden');
      const first = focusable[0], last = focusable.at(-1);
      const focused = event.currentTarget.ownerDocument.activeElement;
      if (first && last && (event.shiftKey && focused === first || !event.shiftKey && focused === last || !event.currentTarget.contains(focused))) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || editable(event.target)) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1);}
  }

  return <div className={className} style={{display: 'flex', flexWrap: 'wrap', gap: clamp(gap, 16, 0, 80), minWidth: 0, ...style}}>
    {uniqueItems.map(item => <button key={item.id} type="button" aria-label={`Open ${item.label}`} aria-haspopup="dialog" aria-controls={instance}
      onClick={event => {trigger.current = event.currentTarget; setActiveId(item.id);}}
      style={{display: 'block', maxWidth: '100%', padding: 0, border: 0, background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer', outlineOffset: 4}}>{item.thumbnail}</button>)}
    {activeItem && <dialog ref={modal} id={instance} aria-label={ariaLabel} aria-modal="true" onKeyDown={keyboard}
      onCancel={event => {event.preventDefault(); event.stopPropagation(); setActiveId(null);}} onClose={event => {event.stopPropagation(); setActiveId(null);}}
      style={{position: 'fixed', inset: 0, width: '100%', height: '100dvh', maxWidth: 'none', maxHeight: 'none', margin: 0, padding: 0, border: 0, background: 'transparent', color: '#fff', overflow: 'hidden'}}>
      <motion.div initial={{opacity: reduced || overlaySeconds === 0 ? 1 : 0}} animate={overlayAnimation}
        onClick={event => {if (event.target === event.currentTarget) setActiveId(null);}}
        style={{boxSizing: 'border-box', width: '100%', height: '100%', padding: 'clamp(12px, 3vw, 32px)', background: 'rgba(12,18,28,.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, overflowY: 'auto', overscrollBehavior: 'contain'}}>
        <div style={{width: '100%', maxWidth: clamp(maxWidth, 1100, 280, 1920), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16}}>
          <p aria-live="polite" aria-atomic="true" style={{margin: 0, minWidth: 0}}>{activeItem.label} <span style={{opacity: .65}}>· {activeIndex + 1} / {uniqueItems.length}</span></p>
          <button ref={closeButton} type="button" aria-label="Close viewer" onClick={() => setActiveId(null)} style={controlStyle}>×</button>
        </div>
        <motion.div key={activeItem.id} initial={reduced || seconds === 0 ? false : {opacity: initialOpacity, y: rise, scale}} animate={contentAnimation}
          onPointerDown={event => {
            if (!(event.target instanceof Element) || event.target.closest('dialog') !== modal.current) return;
            if (event.pointerType === 'touch' && !editable(event.target)) pointer.current = {id: event.pointerId, x: event.clientX, y: event.clientY};
          }}
          onPointerCancel={event => {
            if (event.target instanceof Element && event.target.closest('dialog') === modal.current) pointer.current = null;
          }}
          onPointerUp={event => {
            if (!(event.target instanceof Element) || event.target.closest('dialog') !== modal.current) return;
            const start = pointer.current; pointer.current = null;
            if (!start || start.id !== event.pointerId) return;
            const dx = event.clientX - start.x, dy = event.clientY - start.y;
            if (Math.abs(dx) >= clamp(swipeThreshold, 48, 16, 200) && Math.abs(dx) > Math.abs(dy)) navigate(dx < 0 ? 1 : -1);
          }}
          style={{width: '100%', maxWidth: clamp(maxWidth, 1100, 280, 1920), minHeight: 0, flex: '1 1 auto', overflow: 'auto', touchAction: 'pan-y', marginBlock: 'auto'}}>{activeItem.content}</motion.div>
        <div style={{width: '100%', maxWidth: clamp(maxWidth, 1100, 280, 1920), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12}}>
          <button type="button" aria-label="Previous item" disabled={uniqueItems.length < 2 || !wrap && activeIndex === 0} onClick={() => navigate(-1)} style={{...controlStyle, opacity: uniqueItems.length < 2 || !wrap && activeIndex === 0 ? .35 : 1}}>‹</button>
          <div aria-label="Choose item" style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>{uniqueItems.map(item => <button key={item.id} type="button" aria-label={`Show ${item.label}`} aria-current={item.id === activeId ? 'true' : undefined} onClick={() => setActiveId(item.id)}
            style={{width: 44, height: 44, padding: 0, border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', outlineOffset: 2, display: 'grid', placeItems: 'center'}}><span aria-hidden="true" style={{width: item.id === activeId ? 24 : 7, height: 7, borderRadius: 4, background: 'currentColor', opacity: item.id === activeId ? 1 : .4}}/></button>)}</div>
          <button type="button" aria-label="Next item" disabled={uniqueItems.length < 2 || !wrap && activeIndex === uniqueItems.length - 1} onClick={() => navigate(1)} style={{...controlStyle, opacity: uniqueItems.length < 2 || !wrap && activeIndex === uniqueItems.length - 1 ? .35 : 1}}>›</button>
        </div>
      </motion.div>
    </dialog>}
  </div>;
}
