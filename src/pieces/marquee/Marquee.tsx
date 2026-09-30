'use client';

import {Children, Fragment, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode} from 'react';
import type {MotionDials} from '../../dials';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {observeVisibility} from '../../internal/observe';
import {subscribeFrame} from '../../internal/frame';
import {resolveMarqueeSettings} from './dials';

export interface MarqueeProps {
  children: ReactNode;
  /** Supports speed, size (gap), and left/right direction. */
  dials?: MotionDials;
  /** Seconds per complete original set, 5–120. Default 30; overrides speed. */
  duration?: number;
  /** Space between items and sets in px, 0–120. Default 28; overrides size. */
  gap?: number;
  /** Travel direction. Default left; overrides the direction dial. */
  direction?: 'left' | 'right';
  /** Accessible region name. Default Moving content. */
  label?: string;
  /** Show the manual pause button. Default true. */
  showPauseControl?: boolean;
}

function flatten(children: ReactNode, prefix = ''): {node: ReactNode; key: string}[] {
  return Children.toArray(children).flatMap((child, index) => {
    const key = `${prefix}/${isValidElement(child) ? child.key : index}`;
    return isValidElement<{children?: ReactNode}>(child) && child.type === Fragment
      ? flatten(child.props.children, key) : [{node: child, key}];
  });
}

// Copies are decorative. Strip authored DOM ids rather than duplicating label
// targets. Custom child components must generate their own ids with useId.
function decorative(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{id?: string; children?: ReactNode}>;
    return cloneElement(element, {
      ...(typeof element.type === 'string' ? {id: undefined} : {}),
      ...(element.props.children !== undefined ? {children: decorative(element.props.children)} : {}),
    });
  });
}

/** A continuous strip with one semantic copy and an accessible static mode. */
export function Marquee({children, dials, duration, gap, direction, label = 'Moving content', showPauseControl = true}: MarqueeProps) {
  const {seconds, spacing, travel} = resolveMarqueeSettings({dials, duration, gap, direction});
  const content = flatten(children);
  const reduced = useReducedMotionPreference();
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [geometry, setGeometry] = useState({width: 0, copies: 0});
  const region = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const original = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const phase = useRef(0);
  const staticMode = !mounted || reduced || paused || focusWithin || interactive;
  const stopped = hovered || !visible || hidden;

  useLayoutEffect(() => setMounted(true), []);
  useLayoutEffect(() => {
    const source = original.current;
    if (!source) return;
    // A visual copy of a link must never become an inert dead tap target.
    // Detect the rendered DOM so custom components with native controls work too.
    const inspect = () => setInteractive(!!source.querySelector('a[href],button,input,select,textarea,summary,audio[controls],video[controls],iframe,object,embed,[contenteditable]:not([contenteditable="false"]),[tabindex]:not([tabindex="-1"]),[role="button"],[role="link"]'));
    inspect();
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(inspect);
    observer.observe(source, {subtree: true, childList: true, attributes: true, attributeFilter: ['href', 'tabindex', 'contenteditable', 'role', 'controls']});
    return () => observer.disconnect();
  }, [children]);
  useEffect(() => {
    const node = region.current;
    if (!node) return;
    const doc = node.ownerDocument;
    const update = () => setHidden(doc.hidden);
    update(); doc.addEventListener('visibilitychange', update);
    const unobserve = observeVisibility(node, setVisible);
    return () => {unobserve(); doc.removeEventListener('visibilitychange', update);};
  }, []);

  useLayoutEffect(() => {
    const container = viewport.current;
    const source = original.current;
    if (!container || !source || staticMode || !content.length) return;
    const measure = () => {
      // Both reads happen before the state update; transformed track position
      // does not affect either width. Include the final gap in the loop length.
      const width = source.getBoundingClientRect().width;
      const available = container.getBoundingClientRect().width;
      const copies = width > 0 && available > 0 ? Math.ceil(available / width) : 0;
      setGeometry(current => current.width === width && current.copies === copies ? current : {width, copies});
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(source); observer.observe(container);
    return () => observer.disconnect();
  }, [staticMode, spacing, content.length]);

  useLayoutEffect(() => {
    const node = track.current;
    if (!node) return;
    if (staticMode || geometry.width <= 0 || !geometry.copies) {
      phase.current = 0; node.style.transform = 'none'; return;
    }
    const paint = () => {
      const x = (travel === 'left' ? -phase.current : phase.current - 1) * geometry.width;
      node.style.transform = x === 0 ? 'none' : `translateX(${x}px)`;
    };
    paint();
    if (stopped) return;
    // Linear elapsed progress has no easing curve. Pausing removes the callback,
    // retaining phase without an idle animation driver or deferred DOM writes.
    return subscribeFrame((_time, deltaMs) => {
      phase.current = (phase.current + deltaMs / (seconds * 1000)) % 1;
      paint();
      return true;
    });
  }, [staticMode, stopped, geometry.width, geometry.copies, seconds, travel]);

  const setStyle = {display: 'flex', alignItems: 'center', gap: spacing, flexShrink: 0, paddingRight: staticMode ? 0 : spacing,
    flexWrap: staticMode ? 'wrap' as const : 'nowrap' as const, width: staticMode ? '100%' : 'max-content', minWidth: 0};
  return <section ref={region} role="region" aria-label={label} style={{minWidth: 0, width: '100%'}}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
    <div ref={viewport} style={{overflow: staticMode ? 'visible' : 'clip', minWidth: 0}}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);}}>
      <div ref={track} data-marquee-track="" style={{display: 'flex', width: staticMode ? '100%' : 'max-content', transform: 'none'}}>
        <div ref={original} data-marquee-set="" style={setStyle}>
          {content.map(child => <div key={child.key} style={{flexShrink: 0, maxWidth: staticMode ? '100%' : undefined, overflowWrap: staticMode ? 'anywhere' : undefined}}>{child.node}</div>)}
        </div>
        {!staticMode && Array.from({length: geometry.copies}, (_, copy) => <div data-marquee-copy="" key={copy} aria-hidden="true" inert style={setStyle}>
          {content.map(child => <div key={child.key} style={{flexShrink: 0}}>{decorative(child.node)}</div>)}
        </div>)}
      </div>
    </div>
    {showPauseControl && content.length > 0 && <button type="button" disabled={!mounted || reduced || interactive} aria-pressed={paused}
      onClick={() => setPaused(value => !value)}
      style={{display: 'block', marginTop: 12, padding: '8px 12px', color: 'inherit', background: 'transparent', border: '1px solid currentColor', borderRadius: 6, font: 'inherit', cursor: 'pointer', outlineOffset: 4}}>
      {paused ? 'Resume motion' : 'Pause motion'}
    </button>}
  </section>;
}
