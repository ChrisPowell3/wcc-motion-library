'use client';

import {Children, useLayoutEffect, useRef, type CSSProperties, type ReactNode} from 'react';
import type {EntranceOptions} from '../../internal/entrance';
import type {MotionDials} from '../../dials';
import {batchMotion} from '../../tokens';
import {observeViewport} from '../../internal/viewport';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {resolveScrollStackCards, stackProgress} from './settings';

export interface ScrollStackCardsProps extends Pick<EntranceOptions, 'plays' | 'once'> {
  /** Each direct child is one card. Supply the card's own appearance and content. */
  children: ReactNode;
  dials?: MotionDials;
  /** Smallest outgoing card scale, .8–1. Default .95. */
  scale?: number;
  /** Per-reference-frame following factor, .01–1. Default .14. */
  smoothing?: number;
  /** Sticky inset, 0–300 px. Default 96. */
  top?: number;
  /** Space between cards in document flow, 0–160 px. Default 24. */
  gap?: number;
  className?: string;
  style?: CSSProperties;
}

export function ScrollStackCards({children, className, style, ...props}: ScrollStackCardsProps) {
  const cards = Children.toArray(children);
  const anchors = useRef<Array<HTMLDivElement | null>>([]); const contents = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = useReducedMotionPreference(); const {plays, scale, smoothing, top, gap} = resolveScrollStackCards(props);
  // React can rewrite an index-based z-index during keyed reorders without a
  // new focus event. Reapply the focus elevation after every committed layout.
  useLayoutEffect(() => {
    anchors.current.slice(0, cards.length).forEach((element, index) => {
      if (element) element.style.zIndex = String(element.contains(element.ownerDocument.activeElement) ? cards.length : index);
    });
  });
  // Stable child keys detect replacement/reordering without interrupting equal inline dials.
  const identity = cards.map((card, index) => typeof card === 'object' && card !== null && 'key' in card ? String(card.key) : String(index)).join('|');
  useLayoutEffect(() => {
    const wrappers = anchors.current.slice(0, cards.length).filter((node): node is HTMLDivElement => node !== null);
    const layers = contents.current.slice(0, cards.length);
    wrappers.forEach((element, i) => {element.style.position = 'relative'; element.style.top = ''; if (layers[i]) layers[i]!.style.transform = 'none';});
    if (reduced || wrappers.length < 2) return;
    const rects: DOMRectReadOnly[] = []; const progress = wrappers.map(() => 0); const peaks = wrappers.map(() => 0);
    let stops: Array<() => void> = []; let sticky = false;
    const connect = () => {
      stops.forEach(stop => stop());
      stops = wrappers.map((wrapper, i) => observeViewport(wrapper, (rect, viewportHeight, delta) => {
        rects[i] = rect;
        // The shared observer reads every stationary wrapper before invoking any callback.
        // The last callback has the complete snapshot and can safely write all layers.
        if (i !== wrappers.length - 1) return false;
        const fits = rects.every(value => value.height > 0 && value.height <= viewportHeight - top);
        const changed = fits !== sticky; sticky = fits;
        const amount = 1 - Math.pow(1 - smoothing, Math.max(0, delta) / batchMotion.frameMs);
        let moving = changed;
        wrappers.forEach((element, index) => {
          element.style.position = fits ? 'sticky' : 'relative';
          element.style.top = fits ? `${top}px` : '';
          let target = fits && index < wrappers.length - 1 ? stackProgress(rects[index].top, rects[index + 1].top, rects[index].height) : 0;
          if (plays !== 'scrub') {
            const outside = rects[index].bottom <= 0 || rects[index].top >= viewportHeight;
            if (!fits || (plays === 'always' && outside)) {
              peaks[index] = 0; progress[index] = 0; target = 0;
            } else {
              peaks[index] = Math.max(peaks[index], target); target = peaks[index];
            }
          }
          progress[index] = !fits || Math.abs(target - progress[index]) < .0001 ? target : progress[index] + (target - progress[index]) * amount;
          const layer = layers[index];
          if (layer) layer.style.transform = progress[index] === 0 || scale === 1 ? 'none' : `scale(${Number((1 - (1 - scale) * progress[index]).toFixed(4))})`;
          moving = moving || target !== progress[index];
        });
        return moving;
      }));
    };
    connect();
    // Re-measure when fonts, images or application content change card dimensions.
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(connect);
    wrappers.forEach(wrapper => observer?.observe(wrapper));
    return () => {observer?.disconnect(); stops.forEach(stop => stop());};
  }, [plays, reduced, scale, smoothing, top, gap, cards.length, identity]);
  return <div className={className} style={{minWidth: 0, ...style, display: 'flex', flexDirection: 'column', gap}}>
    {cards.map((card, index) => <div key={typeof card === 'object' && card !== null && 'key' in card ? card.key : index}
      ref={node => {anchors.current[index] = node;}} data-stack-card={index}
      style={{minWidth: 0, position: 'relative', zIndex: index}}
      onFocusCapture={event => {event.currentTarget.style.zIndex = String(cards.length);}}
      onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.style.zIndex = String(index);}}>
      <div ref={node => {contents.current[index] = node;}} style={{minWidth: 0, transform: 'none', transformOrigin: '50% 0'}}>{card}</div>
    </div>)}
  </div>;
}
