'use client';

import {Children, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {animate, motion, useMotionValue} from 'motion/react';
import {durations, ease} from '../../tokens';
import type {MotionDials} from '../../dials';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {resolveRevealDials} from './dials';
import {styles} from './styles';

export interface ScrollRevealRiseProps {
  /** Shared word dials; see catalog for values. Explicit props override matching dials.
   * Initially visible content uses an 8px/fast entrance with opacity at least 0.8
   * and the actual viewport trigger. The selected delay still applies.
   */
  dials?: MotionDials;
  /** Required content. Direct children reveal separately; a fragment is one item. */
  children: ReactNode | ReactNode[];
  /** Motion preset, not an HTML tag. Default: block. */
  as?: 'block' | 'image' | 'button';
  /** Travel in px, clamped to 8–120. Default: 24; image: 64. */
  distance?: number;
  /** Token duration. Default: base; image: slow. */
  duration?: 'fast' | 'base' | 'slow';
  /** Sibling delay in ms, clamped to 0–300. Default: 90. */
  stagger?: number;
  /** Initial opacity, clamped to 0–0.6. Default: 0.5; image: 0. */
  startOpacity?: number;
  /** Play once per mounted child. Default: true. */
  once?: boolean;
  /** IntersectionObserver root margin, px or %. Default: 0px 0px -10% 0px. */
  margin?: string;
}

type ItemProps = Omit<ReturnType<typeof resolveRevealDials>, 'stagger'> & {
  children: ReactNode;
  siblingDelay: number;
  reduced: boolean;
};

function RevealItem({children, as, distance, duration, startOpacity, once, margin, startInset, delay, siblingDelay, axis, offsetSign, bounceEase, reduced}: ItemProps) {
  const anchor = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const focused = useRef(false);
  const revealNow = useRef<() => void>(() => {});
  const [focusVisible, setFocusVisible] = useState(false);
  // Server markup and the first hydration render are always readable, including
  // for reduced-motion viewers and clients where JavaScript never runs.
  const offset = useMotionValue(0);
  const opacity = useMotionValue(1);

  useLayoutEffect(() => {
    const element = anchor.current;
    if (!element) return;
    let observer: IntersectionObserver | undefined;
    let active = true;
    const stop = () => { offset.stop(); opacity.stop(); };
    const final = () => {
      stop(); shown.current = true;
      offset.set(0); opacity.set(1);
      if (once) observer?.disconnect();
    };
    revealNow.current = final;
    // Check the actual preference here too, before the passive subscription runs.
    if (reduced || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || (once && shown.current)) {
      final();
      return stop;
    }
    if (typeof IntersectionObserver === 'undefined') {
      final();
      return stop;
    }
    const rect = element.getBoundingClientRect();
    let initial = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
    const prepare = () => {
      stop();
      // Autofocus runs during commit, and props can change while a descendant
      // remains focused. Neither case may put the active control back in hiding.
      if (focused.current) {
        shown.current = true;
        offset.set(0); opacity.set(1);
        return;
      }
      offset.set(offsetSign * (initial ? Math.min(distance, 8) : distance));
      opacity.set(initial ? Math.max(startOpacity, 0.8) : startOpacity);
    };
    prepare();
    let inside = false;
    let observerGeneration = 0;
    const connectObserver = () => {
      observer?.disconnect();
      if (once && shown.current) return;
      const generation = ++observerGeneration;
      // Native percentage margins use width, which can collapse a short wide
      // viewport. Word dials instead inset a fraction of the viewport height.
      const rootMargin = initial ? '0px' : startInset === undefined ? margin
        : `0px 0px -${window.innerHeight * startInset}px 0px`;
      try {
        observer = new IntersectionObserver(entries => {
          if (!active || generation !== observerGeneration) return;
          for (const entry of entries) {
            if (entry.target !== element) continue;
            if (!entry.isIntersecting) {
              inside = false;
              // Reset offscreen without a downward exit animation. Focused content
              // stays visible, even if focus has scrolled past the observer margin.
              if (!once && !focused.current) { initial = false; prepare(); }
              continue;
            }
            if (inside || (once && shown.current) || focused.current) continue;
            inside = true;
            shown.current = true;
            const seconds = initial ? durations.fast : durations[duration];
            const wait = delay + (initial ? Math.min(siblingDelay, durations.fast) : siblingDelay);
            animate(offset, 0, {type: 'tween', duration: seconds, delay: wait, ease: initial ? ease : bounceEase});
            animate(opacity, 1, {type: 'tween', duration: seconds, delay: wait, ease});
            initial = false;
            if (once) observer?.disconnect();
          }
        // Already-visible content includes the narrow strip below a negative
        // bottom margin. Observe the actual viewport for those mounted items.
        }, {rootMargin, threshold: 0});
        observer.observe(element);
      } catch {
        // Invalid user-provided root margins must never leave content hidden.
        final();
      }
    };
    connectObserver();
    if (startInset !== undefined) window.addEventListener('resize', connectObserver);
    return () => {
      active = false;
      window.removeEventListener('resize', connectObserver);
      observer?.disconnect();
      stop();
      revealNow.current = () => {};
    };
  }, [distance, duration, startOpacity, once, margin, startInset, delay, siblingDelay, offsetSign, bounceEase, reduced, offset, opacity]);

  return <div ref={anchor} style={{...styles.anchor, ...(axis === 'x' ? {overflowX: 'clip', overflowY: 'visible'} as const : {}), ...(as === 'button' ? styles.button : {}), ...(focusVisible ? styles.focus : {})}}
    onFocusCapture={event => {
      focused.current = true;
      revealNow.current();
      setFocusVisible(event.target.matches(':focus-visible'));
    }}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        focused.current = false;
        setFocusVisible(false);
      }
    }}>
    <motion.div initial={false} style={{...styles.content, x: axis === 'x' ? offset : 0, y: axis === 'y' ? offset : 0, opacity}}>{children}</motion.div>
  </div>;
}

/** Observes native scrolling without subscribing to scroll, wheel or touch. */
export function ScrollRevealRise({children, ...props}: ScrollRevealRiseProps) {
  const reduced = useReducedMotionPreference();
  const {stagger, ...settings} = resolveRevealDials(props);
  // A fragment avoids a group box: item anchors can participate in the owner's
  // grid/flex layout. Stable React keys preserve each item's one-time reveal.
  return <>{Children.toArray(children).map((child, index) => <RevealItem
    key={typeof child === 'object' && child !== null && 'key' in child ? child.key : index}
    {...settings} siblingDelay={Math.min(Math.min(index, 9) * stagger / 1000, durations.entrance)}
    reduced={reduced}>{child}</RevealItem>)}</>;
}
