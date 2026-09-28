'use client';

import {Children, useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {animate, motion, useMotionValue, useReducedMotion} from 'motion/react';
import {durations, ease, settleEase} from '../../tokens';
import {styles} from './styles';

export interface ScrollRevealRiseProps {
  /** Required content. Direct children reveal separately; a fragment is one item. */
  children: ReactNode | ReactNode[];
  /** Motion preset, not an HTML tag. Default: block. */
  as?: 'block' | 'image' | 'button';
  /** Rise in px, clamped to 8–120. Default: 24; image: 64. */
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

const clamp = (value: number | undefined, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

// Motion's hook reads the initial preference. Subscribe as well so changing the
// OS setting cancels an entrance already running (including its stagger delay).
function useLiveReducedMotion() {
  const reduced = useReducedMotion();
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setLive(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return live ?? reduced ?? false;
}

type ItemProps = Required<Pick<ScrollRevealRiseProps, 'as' | 'distance' | 'duration' | 'startOpacity' | 'once' | 'margin'>> & {
  children: ReactNode;
  delay: number;
  reduced: boolean;
};

function RevealItem({children, as, distance, duration, startOpacity, once, margin, delay, reduced}: ItemProps) {
  const anchor = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const focused = useRef(false);
  const revealNow = useRef<() => void>(() => {});
  const [focusVisible, setFocusVisible] = useState(false);
  // Server markup and the first hydration render are always readable, including
  // for reduced-motion viewers and clients where JavaScript never runs.
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);

  useLayoutEffect(() => {
    const element = anchor.current;
    if (!element) return;
    let observer: IntersectionObserver | undefined;
    let active = true;
    const stop = () => { y.stop(); opacity.stop(); };
    const final = () => {
      stop(); shown.current = true;
      y.set(0); opacity.set(1);
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
        y.set(0); opacity.set(1);
        return;
      }
      y.set(initial ? Math.min(distance, 8) : distance);
      opacity.set(initial ? Math.max(startOpacity, 0.8) : startOpacity);
    };
    prepare();
    let inside = false;
    try {
      observer = new IntersectionObserver(entries => {
        if (!active) return;
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
          const wait = initial ? Math.min(delay, durations.fast) : delay;
          animate(y, 0, {type: 'tween', duration: seconds, delay: wait, ease: initial || as === 'image' ? ease : settleEase});
          animate(opacity, 1, {type: 'tween', duration: seconds, delay: wait, ease});
          initial = false;
          if (once) observer?.disconnect();
        }
      // Already-visible content includes the narrow strip below a negative
      // bottom margin. Observe the actual viewport for those mounted items.
      }, {rootMargin: initial ? '0px' : margin, threshold: 0});
      observer.observe(element);
    } catch {
      // Invalid user-provided root margins must never leave content hidden.
      final();
    }
    return () => {
      active = false;
      observer?.disconnect();
      stop();
      revealNow.current = () => {};
    };
  }, [as, distance, duration, startOpacity, once, margin, delay, reduced, y, opacity]);

  return <div ref={anchor} style={{...styles.anchor, ...(as === 'button' ? styles.button : {}), ...(focusVisible ? styles.focus : {})}}
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
    <motion.div initial={false} style={{...styles.content, y, opacity}}>{children}</motion.div>
  </div>;
}

/** Observes native scrolling without subscribing to scroll, wheel or touch. */
export function ScrollRevealRise({children, as = 'block', distance, duration, stagger, startOpacity, once = true, margin = '0px 0px -10% 0px'}: ScrollRevealRiseProps) {
  const reduced = useLiveReducedMotion();
  const rise = clamp(distance, as === 'image' ? 64 : 24, 8, 120);
  const opacity = clamp(startOpacity, as === 'image' ? 0 : 0.5, 0, 0.6);
  const beat = clamp(stagger, durations.fast * 1000 / 2, 0, 300) / 1000;
  const speed = duration ?? (as === 'image' ? 'slow' : 'base');
  // A fragment avoids a group box: item anchors can participate in the owner's
  // grid/flex layout. Stable React keys preserve each item's one-time reveal.
  return <>{Children.toArray(children).map((child, index) => <RevealItem
    key={typeof child === 'object' && child !== null && 'key' in child ? child.key : index}
    as={as} distance={rise} duration={speed} startOpacity={opacity} once={once} margin={margin}
    delay={Math.min(Math.min(index, 9) * beat, durations.entrance)} reduced={reduced}>{child}</RevealItem>)}</>;
}
