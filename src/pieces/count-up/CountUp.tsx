'use client';

import {useLayoutEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {animate, useMotionValue} from 'motion/react';
import {cleanDials, type MotionDials} from '../../dials';
import {batchMotion} from '../../tokens';
import {resolveEntrance, observeEntranceScrub, type EntranceOptions} from '../../internal/entrance';
import {observeVisibility} from '../../internal/observe';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {bounded, deviceReduced, dialDelay, speedRatio} from '../float/helpers';

export interface CountUpProps extends EntranceOptions {
  children: string | readonly string[];
  dials?: MotionDials;
  /** Seconds, 0–10. Default 2.2. */
  duration?: number;
  /** Seconds, 0–5. Default .5. */
  delay?: number;
  /** Sibling delay seconds, 0–1; repeats every four values. Default .18. */
  stagger?: number;
  once?: boolean;
  /** Visible fraction, 0–1. Default .12. */
  threshold?: number;
  margin?: string;
  className?: string;
  style?: CSSProperties;
}
export function resolveCountUpSettings(props: Omit<CountUpProps, 'children'>) {
  const dials = cleanDials('count-up', props.dials), base = batchMotion.count;
  return {
    duration: bounded(props.duration, base.duration * speedRatio(dials.speed), 0, 10),
    delay: bounded(props.delay, dialDelay(dials.delay, base.delay), 0, 5),
    stagger: bounded(props.stagger, base.stagger, 0, 1),
    ...resolveEntrance(props, dials),
    threshold: bounded(props.threshold, .12, 0, 1), margin: props.margin ?? '0px 0px -6% 0px',
  };
}

/** Count the magnitude while retaining its exact authored prefix, suffix and precision. */
export function countText(final: string, progress: number) {
  if (progress >= 1) return final;
  const parts = final.match(/^([^\d]*)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?([^\d]*)$/);
  if (!parts) return final;
  const number = Number(parts[2].replaceAll(',', '') + (parts[3] ?? ''));
  if (!Number.isFinite(number)) return final;
  const digits = parts[3]?.length ? parts[3].length - 1 : 0;
  if (digits > 100) return final;
  let [integer, decimal] = (number * Math.max(0, Math.min(1, progress))).toFixed(digits).split('.');
  if (parts[2].includes(',')) integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts[1] + integer + (decimal === undefined ? '' : `.${decimal}`) + parts[4];
}

function Count({value, index, settings, reduced, className, style}: {
  value: string; index: number; settings: ReturnType<typeof resolveCountUpSettings>; reduced: boolean; className?: string; style?: CSSProperties;
}) {
  const node = useRef<HTMLSpanElement>(null), played = useRef(false);
  const progress = useMotionValue(1);
  const [display, setDisplay] = useState(value);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const update = () => setDisplay(countText(value, progress.get()));
    const off = progress.on('change', update);
    const finish = () => {progress.stop(); progress.set(1); setDisplay(value);};
    if (reduced || deviceReduced() || (settings.once && played.current) || countText(value, 0) === value) {
      finish(); return () => {off(); progress.stop();};
    }
    if (settings.plays === 'scrub') {
      const release = observeEntranceScrub(element, value => progress.set(value), settings);
      return () => {release(); off(); progress.stop();};
    }
    progress.set(0); update();
    let inside = false;
    const release = observeVisibility(element, visible => {
      if (!visible) {
        inside = false;
        if (!settings.once) {progress.stop(); progress.set(0); update();}
        return;
      }
      if (inside || (settings.once && played.current)) return;
      inside = true; played.current = true;
      animate(progress, 1, {type: 'tween', duration: settings.duration,
        delay: settings.delay + (index % batchMotion.count.group) * settings.stagger,
        ease: batchMotion.count.ease, onComplete: () => setDisplay(value)});
    }, {threshold: settings.threshold, rootMargin: settings.margin});
    return () => {release(); off(); progress.stop();};
  }, [value, index, settings, reduced, progress]);
  return <span ref={node} role="group" aria-label={value} className={className} style={{display: 'inline-block', ...style}}><span aria-hidden="true">{display}</span></span>;
}

/** Each authored number stays accessible as its final value throughout the count. */
export function CountUp({children, className, style, ...props}: CountUpProps) {
  const reduced = useReducedMotionPreference();
  // Inline dial objects are common in JSX; only semantic values may restart motion.
  const dials = cleanDials('count-up', props.dials);
  const settings = useMemo(() => resolveCountUpSettings({...props, dials}), [props.plays, props.scrubRange, props.smoothing, dials.speed, dials.delay, dials.plays, props.duration, props.delay, props.stagger, props.once, props.threshold, props.margin]);
  const values = typeof children === 'string' ? [children] : children;
  return <>{values.map((value, index) => <Count key={`${index}:${value}`} value={value} index={index} settings={settings} reduced={reduced} className={className} style={style}/>)}</>;
}
