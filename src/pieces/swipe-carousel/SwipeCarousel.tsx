'use client';

import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent, type PointerEvent} from 'react';
import {animate, motion, useInView, useMotionValue, useTransform, type MotionValue} from 'motion/react';
import {autoplayTiming, durations, ease} from '../../tokens';
import type {MotionDials} from '../../dials';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {resolveCarouselSettings} from './dials';
import {cardOffset, clamp, landingIndex, resist, safeNumber, wrap} from './physics';
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
export interface SwipeCarouselCardState {
  index: number;
  count: number;
  /** Selected center card (the destination while settling). */
  active: boolean;
  /** True only for the active card after the fan or settling spring completes. */
  ready: boolean;
  /** Gate custom image sources with this flag to preserve deferred loading. */
  loadImage: boolean;
}

/** Decoration only; movement, dimensions and stacking remain owned by the frame. */
export type SwipeCarouselCardStyle = Pick<CSSProperties, 'borderRadius' | 'background' | 'boxShadow'>;
type CardRenderer<T> = (item: T, state: SwipeCarouselCardState) => ReactNode;

interface SwipeCarouselOptions<T extends {id: string}> {
  items: readonly T[];
  /** Shared motion presets; explicit layout props take precedence. */
  dials?: MotionDials;
  /** CSS aspect ratio, or "auto" for content-driven custom card height. */
  cardAspect?: string;
  /** Optional radius, background and shadow overrides; omitted values keep the house look. */
  cardStyle?: SwipeCarouselCardStyle;
  /** Overlay color for opaque side cards; transparent preserves legacy frame fading. */
  dimColor?: string;
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

/** Custom item shapes require a renderer; existing image items use the default card. */
export type SwipeCarouselProps<T extends {id: string} = SwipeCarouselItem> = SwipeCarouselOptions<T> &
  ([T] extends [SwipeCarouselItem] ? {renderCard?: CardRenderer<T>} : {renderCard: CardRenderer<T>});

type Gesture = {id: number; startX: number; startY: number; origin: number; lastX: number; lastTime: number; velocity: number; axis: 'pending' | 'x' | 'y'};

function Card<T extends {id: string}>({item, index, count, active, ready, eager, position, spread, step, sideScale, cardWidth, reduced, imagesReady, keyboardFocus, cardAspect, cardStyle, dimColor, dimmer, loop, speed, renderCard, measure}: {
  item: T; index: number; count: number; active: boolean; ready: boolean; eager: boolean;
  cardAspect: string; dimColor: string; dimmer: boolean; loop: boolean; speed: number; cardStyle?: SwipeCarouselCardStyle; renderCard?: CardRenderer<T>;
  position: MotionValue<number>; spread: MotionValue<number>; step: MotionValue<number>;
  sideScale: number; cardWidth: string; reduced: boolean; imagesReady: boolean; keyboardFocus: boolean; measure?: React.Ref<HTMLDivElement>;
}) {
  const offset = useTransform(() => cardOffset(index + position.get(), count, loop));
  const distance = useTransform(() => Math.abs(offset.get()));
  const x = useTransform(() => offset.get() * step.get() * spread.get());
  const scale = useTransform(() => 1 - Math.min(distance.get(), 1) * (1 - sideScale));
  const opacity = useTransform(distance, [0, 1, 2, 3], dimmer ? [1, .65, .35, .15] : [1, .9, .6, .3]);
  const dimOpacity = useTransform(distance, [0, 1, 2, 3], dimmer ? [0, .35, .65, .85] : [0, .1, .4, .7]);
  const useDimOverlay = dimColor !== 'transparent';
  const frameOpacity = useTransform(() => {
    // The original card crosses the circular seam only while transparent.
    // This keeps one semantic slide per item, even with very short lists.
    const seam = loop && count > 1 ? clamp((count / 2 - distance.get()) * 2, 0, 1) : 1;
    return (useDimOverlay ? 1 : opacity.get()) * seam;
  });
  // Discrete stacking changes at half-card crossings, without tweening z-index.
  // Use the live distance so dragging, wheels, and spring travel share the same order.
  const zIndex = useTransform(() => count + 1 - Math.round(distance.get()));
  const [focused, setFocused] = useState(false);
  // The public props require renderCard for shapes without the built-in fields.
  const defaultItem = item as T & SwipeCarouselItem;
  return <motion.div ref={measure} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}
    style={{...styles.card,
      borderRadius: cardStyle?.borderRadius ?? styles.card.borderRadius,
      background: cardStyle?.background ?? styles.card.background,
      boxShadow: cardStyle?.boxShadow ?? styles.card.boxShadow,
      aspectRatio: cardAspect, width: cardWidth, maxWidth: 'calc(100% - 32px)', x, scale, opacity: frameOpacity, zIndex}}>
    {renderCard ? <div inert={!active || !ready} style={{height: cardAspect === 'auto' ? undefined : '100%', isolation: useDimOverlay ? 'isolate' : undefined}}>
      {renderCard(item, {index, count, active, ready: active && ready, loadImage: eager || imagesReady})}
    </div> : <>
    <img src={eager || imagesReady ? defaultItem.image : undefined} alt={defaultItem.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} style={styles.image}/>
    <motion.div aria-hidden={!active || !ready} inert={!active || !ready} initial={false}
      animate={{opacity: active && ready ? 1 : 0}}
      transition={{duration: reduced || !active || !ready ? 0 : durations.base / speed, ease}}
      style={{...styles.content, pointerEvents: active && ready ? 'auto' : 'none'}}>
      <h3 style={styles.title}>{defaultItem.title}</h3>
      <p style={styles.text}>{defaultItem.text}</p>
      {defaultItem.cta && <a href={defaultItem.cta.href} tabIndex={active && ready ? 0 : -1} draggable={false}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{...styles.cta, ...(focused && keyboardFocus ? focusRing : {outline: 'none'})}}>{defaultItem.cta.label}</a>}
    </motion.div>
    </>}
    {useDimOverlay && <motion.div data-swipe-carousel-dim="" aria-hidden="true"
      style={{position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: dimColor, opacity: dimOpacity}}/>}
  </motion.div>;
}

/** A centered carousel with direct manipulation, optional looping and token-based motion. */
export function SwipeCarousel<T extends {id: string} = SwipeCarouselItem>({items, dials, renderCard, cardAspect = '3 / 4', cardStyle, dimColor, label = 'Image carousel', startIndex, cardWidth = 'clamp(220px, 70vw, 360px)', gap,
  sideScale, fanOnView = true, showDots = true, onChange}: SwipeCarouselProps<T>) {
  const count = items.length;
  const initial = Math.round(safeNumber(startIndex ?? Math.floor(count / 2), Math.floor(count / 2), 0, Math.max(0, count - 1)));
  const reduced = useReducedMotionPreference();
  const settings = useMemo(() => resolveCarouselSettings({dials, gap, sideScale, dimColor}), [dials, gap, sideScale, dimColor]);
  const {spacing, sideScale: neighborScale, loop, autoplay, speed} = settings;
  const [index, setIndex] = useState(initial);
  const activeIndex = clamp(index, 0, Math.max(0, count - 1));
  const selected = useRef(initial);
  const intendedDestination = useRef(initial);
  const [ready, setReady] = useState(true);
  const [imagesReady, setImagesReady] = useState(!fanOnView);
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
  const inView = useInView(region, {amount: .25});
  const position = useMotionValue(-initial);
  const spread = useMotionValue(1);
  const step = useMotionValue(360 * spacing);
  const played = useRef(reduced || !fanOnView);
  const motionRun = useRef<{stop(): void} | null>(null);
  const fanRun = useRef<{stop(): void} | null>(null);
  const generation = useRef(0);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelPosition = useRef<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pointerHeld, setPointerHeld] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const doc = region.current?.ownerDocument;
    if (!pointerHeld || !doc) return;
    // Buttons do not capture their pointer: a release outside the region must
    // still release the autoplay hold.
    const release = () => setPointerHeld(false);
    doc.addEventListener('pointerup', release);
    doc.addEventListener('pointercancel', release);
    return () => {
      doc.removeEventListener('pointerup', release);
      doc.removeEventListener('pointercancel', release);
    };
  }, [pointerHeld]);
  const change = useRef(onChange);
  useLayoutEffect(() => {
    // SSR and the first hydration render expose the active content. Prepare the
    // optional entrance before the browser paints, never in the server markup.
    if (!played.current && !reduced && fanOnView) { spread.set(0); setReady(false); }
  }, [fanOnView, reduced, spread]);
  useEffect(() => {
    const doc = region.current?.ownerDocument;
    if (!doc) return;
    const update = () => setHidden(doc.hidden);
    update(); doc.addEventListener('visibilitychange', update);
    return () => doc.removeEventListener('visibilitychange', update);
  }, []);
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

  const previousLoop = useRef(loop);
  useLayoutEffect(() => {
    if (previousLoop.current === loop) return;
    previousLoop.current = loop;
    stop();
    gesture.current = null;
    played.current = true;
    intendedDestination.current = selected.current;
    position.set(-selected.current);
    spread.set(1);
    setReady(true);
    setImagesReady(true);
  }, [loop, stop, position, spread]);

  const goTo = useCallback((next: number, direction: -1 | 0 | 1 = 0) => {
    begin();
    const requested = Math.round(next);
    const target = loop ? wrap(requested, count) : clamp(requested, 0, Math.max(0, count - 1));
    // Directional steps continue from the pending unwrapped destination. A
    // quick reversal at either seam returns along the same path, not a full lap.
    // Dots and gesture releases choose the nearest copy to their live position.
    const destination = loop && count > 1
      ? direction ? intendedDestination.current + direction
        : target + Math.round((-position.get() - target) / count) * count
      : target;
    intendedDestination.current = destination;
    if (selected.current !== target) {
      selected.current = target;
      setIndex(target);
      change.current?.(target);
    }
    const run = generation.current;
    if (reduced) {
      intendedDestination.current = target;
      position.set(-target);
      setReady(true);
    } else {
      const animation = animate(position, -destination, settings.settle);
      animation.speed = speed;
      motionRun.current = animation;
      animation.then(() => {
        if (generation.current === run) {
          intendedDestination.current = target;
          if (loop) position.set(-target);
          setReady(true);
        }
      });
    }
  }, [begin, count, position, reduced, loop, settings.settle, speed]);

  useEffect(() => {
    if (!autoplay || paused || hovered || focusWithin || pointerHeld || hidden || reduced || !inView || count < 2 || (!loop && activeIndex === count - 1)) return;
    const timer = setInterval(() => goTo(selected.current + 1, 1), autoplayTiming.interval * 1000);
    return () => clearInterval(timer);
  }, [autoplay, paused, hovered, focusWithin, pointerHeld, hidden, reduced, inView, count, loop, activeIndex, goTo]);

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
      stop(); played.current = true; intendedDestination.current = selected.current; spread.set(1); position.set(-selected.current); setReady(true); setImagesReady(true);
    } else if (inView && !played.current) {
      played.current = true;
      const run = generation.current;
      const animation = animate(spread, 1, settings.fan);
      animation.speed = speed;
      fanRun.current = animation;
      animation.then(() => { if (run === generation.current) { setReady(true); setImagesReady(true); } });
    }
  }, [inView, reduced, fanOnView, position, spread, stop, settings.fan, speed]);

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
      position.set(loop ? wheelPosition.current : resist(wheelPosition.current, count));
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
  }, [begin, count, goTo, position, step, loop]);

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
    const next = drag.origin + dx / step.get();
    position.set(loop ? next : resist(next, count));
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null;
    if (drag.axis === 'x') {
      const velocity = event.timeStamp - drag.lastTime > durations.fast * 1000 ? 0 : drag.velocity;
      goTo(cancelled ? selected.current : landingIndex(position.get(), velocity, step.get(), count, {loop, power: settings.flickPower, maxItems: settings.flickMaxItems}));
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
    // Departing card content becomes inert; keep keyboard focus on the carousel.
    if ((event.target as HTMLElement).closest('[aria-roledescription="slide"]')) region.current?.focus({preventScroll: true});
    goTo(next, event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0);
  }

  return <section ref={region} role="region" aria-roledescription="carousel" aria-label={label}
    tabIndex={0} onKeyDown={keyDown}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocusWithin(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false); }}
    onPointerDownCapture={() => setPointerHeld(true)} onPointerUpCapture={() => setPointerHeld(false)}
    onPointerCancelCapture={() => setPointerHeld(false)} onLostPointerCaptureCapture={() => setPointerHeld(false)}
    onFocus={event => { if (event.target === event.currentTarget) setFocused('region'); }}
    onBlur={event => { if (event.target === event.currentTarget) setFocused(null); }}
    style={{...styles.region, ...(focused === 'region' && keyboardFocus ? focusRing : {outline: 'none'})}}>
    <div ref={viewport} aria-label="Drag or swipe cards" style={{...styles.viewport, cursor: count > 1 ? 'grab' : 'default'}}
      onDragStartCapture={event => { if (renderCard) event.preventDefault(); }}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => pointerEnd(event)}
      onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)}
      onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      {items.map((item, i) => <Card key={item.id} item={item} index={i} count={count} active={i === activeIndex}
        cardAspect={cardAspect} cardStyle={cardStyle} dimColor={settings.dimColor} dimmer={settings.dimmer} loop={loop} speed={speed} renderCard={renderCard}
        ready={ready} eager={Math.abs(i - activeIndex) <= 1} position={position} spread={spread} step={step}
        sideScale={neighborScale} cardWidth={cardWidth} reduced={reduced} imagesReady={imagesReady} keyboardFocus={keyboardFocus} measure={i === 0 ? measure : undefined}/>)}
    </div>
    {showDots && <div style={styles.dots}>
      {items.map((item, i) => <button key={item.id} type="button" aria-label={`Go to card ${i + 1}`}
        aria-current={i === activeIndex ? 'true' : undefined} onClick={() => goTo(i)}
        onFocus={() => setFocused(item.id)} onBlur={() => setFocused(null)}
        style={{...styles.dot, ...(focused === item.id && keyboardFocus ? focusRing : {outline: 'none'})}}>
        <motion.span aria-hidden="true" initial={false} animate={{scaleX: i === activeIndex ? 3 : 1, opacity: i === activeIndex ? 1 : .35}}
          transition={reduced ? {duration: 0} : {duration: durations.base / speed, ease}} style={styles.dotMark}/>
      </button>)}
    </div>}
    {autoplay && <button type="button" onClick={() => setPaused(value => !value)}
      onFocus={() => setFocused('autoplay')} onBlur={() => setFocused(null)}
      style={{display: 'block', margin: '12px auto', padding: '8px 14px', color: 'inherit', background: 'transparent', border: '1px solid currentColor', borderRadius: 6, cursor: 'pointer', ...(focused === 'autoplay' && keyboardFocus ? focusRing : {outline: 'none'})}}>
      {paused ? 'Resume autoplay' : 'Pause autoplay'}
    </button>}
    <span aria-live={autoplay && !paused && !(mounted && reduced) && !focusWithin ? 'off' : 'polite'} aria-atomic="true" style={styles.srOnly}>{count ? `Card ${activeIndex + 1} of ${count}${'title' in items[activeIndex] && typeof items[activeIndex].title === 'string' ? `: ${items[activeIndex].title}` : ''}` : 'No cards'}</span>
  </section>;
}
