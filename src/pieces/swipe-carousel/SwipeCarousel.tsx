'use client';

import {useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent} from 'react';
import {animate, motion, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue} from 'motion/react';
import {durations, ease, springs} from '../../tokens';
import {clamp, landingIndex, resist, safeNumber} from './physics';
import {focusRing, styles} from './styles';

export interface SwipeCarouselItem {
  /** Stable, unique card identifier. */
  id: string;
  image: string;
  alt: string;
  title: string;
  text: string;
  cta?: {label: string; href: string};
}
export interface SwipeCarouselProps {
  items: readonly SwipeCarouselItem[];
  /** Accessible name for the carousel region. Defaults to "Image carousel". */
  label?: string;
  /** Zero-based; defaults to Math.floor(items.length / 2), clamped to available cards. */
  startIndex?: number;
  /** CSS width, capped to the available viewport. */
  cardWidth?: string;
  /** Distance between card centers as a share of card width: 0.3–1.1. */
  gap?: number;
  /** Neighbor scale: 0.6–1. */
  sideScale?: number;
  fanOnView?: boolean;
  showDots?: boolean;
  onChange?: (index: number) => void;
}

type Gesture = {id: number; startX: number; startY: number; origin: number; lastX: number; lastTime: number; velocity: number; axis: 'pending' | 'x' | 'y'};

function Card({item, index, count, active, ready, eager, position, spread, step, sideScale, cardWidth, reduced, imagesReady, keyboardFocus, measure}: {
  item: SwipeCarouselItem; index: number; count: number; active: boolean; ready: boolean; eager: boolean;
  position: MotionValue<number>; spread: MotionValue<number>; step: MotionValue<number>;
  sideScale: number; cardWidth: string; reduced: boolean; imagesReady: boolean; keyboardFocus: boolean; measure?: React.Ref<HTMLDivElement>;
}) {
  const distance = useTransform(() => Math.abs(index + position.get()));
  const x = useTransform(() => (index + position.get()) * step.get() * spread.get());
  const scale = useTransform(() => 1 - Math.min(distance.get(), 1) * (1 - sideScale));
  const opacity = useTransform(distance, [0, 1, 2, 3], [1, .9, .6, .3]);
  // Discrete stacking changes at half-card crossings, without tweening z-index.
  // Use the live distance so dragging, wheels, and spring travel share the same order.
  const zIndex = useTransform(() => count + 1 - Math.round(distance.get()));
  const [focused, setFocused] = useState(false);
  return <motion.div ref={measure} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}
    style={{...styles.card, width: cardWidth, maxWidth: 'calc(100% - 32px)', x, scale, opacity, zIndex}}>
    <img src={eager || imagesReady ? item.image : undefined} alt={item.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} style={styles.image}/>
    <motion.div aria-hidden={!active || !ready} inert={!active || !ready} initial={false}
      animate={{opacity: active && ready ? 1 : 0}}
      transition={{duration: reduced || !active || !ready ? 0 : durations.base, ease}}
      style={{...styles.content, pointerEvents: active && ready ? 'auto' : 'none'}}>
      <h3 style={styles.title}>{item.title}</h3>
      <p style={styles.text}>{item.text}</p>
      {item.cta && <a href={item.cta.href} tabIndex={active && ready ? 0 : -1} draggable={false}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{...styles.cta, ...(focused && keyboardFocus ? focusRing : {outline: 'none'})}}>{item.cta.label}</a>}
    </motion.div>
  </motion.div>;
}

/** A centered, finite carousel with direct manipulation and token-based motion. */
export function SwipeCarousel({items, label = 'Image carousel', startIndex, cardWidth = 'clamp(220px, 70vw, 360px)', gap = .55,
  sideScale = .8, fanOnView = true, showDots = true, onChange}: SwipeCarouselProps) {
  const count = items.length;
  const initial = Math.round(safeNumber(startIndex ?? Math.floor(count / 2), Math.floor(count / 2), 0, Math.max(0, count - 1)));
  const reduced = !!useReducedMotion();
  const spacing = safeNumber(gap, .55, .3, 1.1);
  const neighborScale = safeNumber(sideScale, .8, .6, 1);
  const [index, setIndex] = useState(initial);
  const activeIndex = clamp(index, 0, Math.max(0, count - 1));
  const selected = useRef(initial);
  const [ready, setReady] = useState(reduced || !fanOnView);
  const [imagesReady, setImagesReady] = useState(reduced || !fanOnView);
  const [focused, setFocused] = useState<string | null>(null);
  const [keyboardFocus, setKeyboardFocus] = useState(true);
  const region = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ownerDocument = region.current?.ownerDocument;
    if (!ownerDocument) return;
    const keyboardInput = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey && !event.ctrlKey && !event.metaKey) setKeyboardFocus(true);
    };
    const pointerInput = () => setKeyboardFocus(false);
    // Capture inputs outside the carousel too: Tab into the region must restore
    // its ring even when the previous interaction was a pointer drag.
    ownerDocument.addEventListener('keydown', keyboardInput, true);
    ownerDocument.addEventListener('pointerdown', pointerInput, true);
    return () => {
      ownerDocument.removeEventListener('keydown', keyboardInput, true);
      ownerDocument.removeEventListener('pointerdown', pointerInput, true);
    };
  }, []);
  const inView = useInView(region, {once: true, amount: .25});
  const position = useMotionValue(-initial);
  const spread = useMotionValue(reduced || !fanOnView ? 1 : 0);
  const step = useMotionValue(360 * spacing);
  const played = useRef(reduced || !fanOnView);
  const motionRun = useRef<{stop(): void} | null>(null);
  const fanRun = useRef<{stop(): void} | null>(null);
  const generation = useRef(0);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelPosition = useRef<number | null>(null);
  const change = useRef(onChange);
  useEffect(() => { change.current = onChange; }, [onChange]);

  const stop = useCallback(() => {
    generation.current++;
    motionRun.current?.stop();
    fanRun.current?.stop();
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelPosition.current = null;
  }, []);

  const begin = useCallback(() => {
    stop();
    played.current = true;
    spread.set(1);
    setImagesReady(true);
    setReady(false);
  }, [stop, spread]);

  const goTo = useCallback((next: number) => {
    begin();
    const target = clamp(Math.round(next), 0, Math.max(0, count - 1));
    if (selected.current !== target) {
      selected.current = target;
      setIndex(target);
      change.current?.(target);
    }
    const run = generation.current;
    if (reduced) {
      position.set(-target);
      setReady(true);
    } else {
      const animation = animate(position, -target, springs.settle);
      motionRun.current = animation;
      animation.then(() => { if (generation.current === run) setReady(true); });
    }
  }, [begin, count, position, reduced]);

  useEffect(() => {
    const node = measure.current;
    if (!node) return;
    const update = () => {
      const width = node.getBoundingClientRect().width;
      // offsetWidth is untransformed; getBoundingClientRect also supports test/SSR fallbacks.
      step.set((node.offsetWidth || width || 360) * spacing);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [spacing, cardWidth, count, items[0]?.id, step]);

  useEffect(() => {
    if (reduced || !fanOnView) {
      stop(); played.current = true; spread.set(1); position.set(-selected.current); setReady(true); setImagesReady(true);
    } else if (inView && !played.current) {
      played.current = true;
      const run = generation.current;
      const animation = animate(spread, 1, springs.float);
      fanRun.current = animation;
      animation.then(() => { if (run === generation.current) { setReady(true); setImagesReady(true); } });
    }
  }, [inView, reduced, fanOnView, position, spread, stop]);

  const previousCount = useRef(count);
  useEffect(() => {
    if (previousCount.current !== count) {
      previousCount.current = count;
      gesture.current = null;
      goTo(Math.min(selected.current, Math.max(0, count - 1)));
    }
  }, [count, goTo]);
  useEffect(() => () => { stop(); }, [stop]);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (count < 2 || gesture.current || event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (wheelPosition.current === null) {
        begin();
        wheelPosition.current = position.get();
      }
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientWidth : 1;
      wheelPosition.current -= event.deltaX * unit / step.get();
      position.set(resist(wheelPosition.current, count));
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      // Trackpads already provide inertial deltas; settle after the stream stops.
      wheelTimer.current = setTimeout(() => goTo(-position.get()), durations.fast * 1000);
    };
    node.addEventListener('wheel', onWheel, {passive: false});
    return () => {
      node.removeEventListener('wheel', onWheel);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelPosition.current = null;
    };
  }, [begin, count, goTo, position, step]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (count < 2 || event.button !== 0 || gesture.current) return;
    suppressClick.current = false;
    // Capture the original target to preserve ordinary CTA taps and receive releases
    // outside the carousel even before a gesture commits to a horizontal drag.
    (event.target as Element).setPointerCapture?.(event.pointerId);
    gesture.current = {id: event.pointerId, startX: event.clientX, startY: event.clientY,
      origin: position.get(), lastX: event.clientX, lastTime: event.timeStamp, velocity: 0, axis: 'pending'};
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId || drag.axis === 'y') return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (drag.axis === 'pending') {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 4) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') return;
      begin();
      region.current?.focus({preventScroll: true});
      suppressClick.current = true;
    }
    const elapsed = event.timeStamp - drag.lastTime;
    if (elapsed > 0) drag.velocity = (event.clientX - drag.lastX) / elapsed * 1000;
    drag.lastX = event.clientX; drag.lastTime = event.timeStamp;
    position.set(resist(drag.origin + dx / step.get(), count));
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null;
    if (drag.axis === 'x') {
      const velocity = event.timeStamp - drag.lastTime > durations.fast * 1000 ? 0 : drag.velocity;
      goTo(cancelled ? selected.current : landingIndex(position.get(), velocity, step.get(), count));
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }
  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (!count || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    let next: number;
    if (event.key === 'ArrowRight') next = selected.current + 1;
    else if (event.key === 'ArrowLeft') next = selected.current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    // A departing CTA becomes inert; keep keyboard focus on the carousel.
    if ((event.target as HTMLElement).closest('a')) region.current?.focus({preventScroll: true});
    goTo(next);
  }

  return <section ref={region} role="region" aria-roledescription="carousel" aria-label={label}
    tabIndex={0} onKeyDown={keyDown} onFocus={event => { if (event.target === event.currentTarget) setFocused('region'); }}
    onBlur={event => { if (event.target === event.currentTarget) setFocused(null); }}
    style={{...styles.region, ...(focused === 'region' && keyboardFocus ? focusRing : {outline: 'none'})}}>
    <div ref={viewport} aria-label="Drag or swipe cards" style={{...styles.viewport, cursor: count > 1 ? 'grab' : 'default'}}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => pointerEnd(event)}
      onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)}
      onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      {items.map((item, i) => <Card key={item.id} item={item} index={i} count={count} active={i === activeIndex}
        ready={ready} eager={Math.abs(i - activeIndex) <= 1} position={position} spread={spread} step={step}
        sideScale={neighborScale} cardWidth={cardWidth} reduced={reduced} imagesReady={imagesReady} keyboardFocus={keyboardFocus} measure={i === 0 ? measure : undefined}/>)}
    </div>
    {showDots && <div style={styles.dots}>
      {items.map((item, i) => <button key={item.id} type="button" aria-label={`Go to card ${i + 1}`}
        aria-current={i === activeIndex ? 'true' : undefined} onClick={() => goTo(i)}
        onFocus={() => setFocused(item.id)} onBlur={() => setFocused(null)}
        style={{...styles.dot, ...(focused === item.id && keyboardFocus ? focusRing : {outline: 'none'})}}>
        <motion.span aria-hidden="true" initial={false} animate={{scaleX: i === activeIndex ? 3 : 1, opacity: i === activeIndex ? 1 : .35}}
          transition={reduced ? {duration: 0} : {duration: durations.base, ease}} style={styles.dotMark}/>
      </button>)}
    </div>}
    <span aria-live="polite" aria-atomic="true" style={styles.srOnly}>{count ? `Card ${activeIndex + 1} of ${count}: ${items[activeIndex].title}` : 'No cards'}</span>
  </section>;
}
