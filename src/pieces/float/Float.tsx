'use client';

import {Children, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode} from 'react';
import {motion, useMotionValue} from 'motion/react';
import {cleanDials, type MotionDials} from '../../dials.js';
import {batchMotion} from '../../tokens.js';
import {observeVisibility} from '../../internal/observe.js';
import {useReducedMotionPreference} from '../../useReducedMotionPreference.js';
import {bounded, deviceReduced, dialSize, speedRatio} from './helpers.js';
import {createIdleTrack} from './idle.js';

export interface FloatProps {
  children: ReactNode;
  dials?: MotionDials;
  distance?: number;
  duration?: number;
  durationStep?: number;
  phase?: number;
  /** Optional rotation in degrees, 0–5. Default 0; .6 recreates the small credential sway. */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}
export function resolveFloatSettings(props: Omit<FloatProps, 'children'>) {
  const dials = cleanDials('float', props.dials), base = batchMotion.float, ratio = speedRatio(dials.speed);
  return {
    duration: bounded(props.duration, base.duration * ratio, .2, 20),
    durationStep: bounded(props.durationStep, base.durationStep * ratio, 0, 3),
    phase: bounded(props.phase, base.phase * ratio, 0, 5),
    distance: bounded(props.distance, base.distance * dialSize(dials.size), 0, 40),
    rotate: bounded(props.rotate, 0, 0, 5),
  };
}
function FloatingItem({children, index, settings, reduced, className, style}: {
  children: ReactNode; index: number; settings: ReturnType<typeof resolveFloatSettings>; reduced: boolean; className?: string; style?: CSSProperties;
}) {
  const node = useRef<HTMLDivElement>(null), focused = useRef(false), finishNow = useRef(() => {});
  const y = useMotionValue(0), rotate = useMotionValue(0);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const doc = element.ownerDocument;
    let visible = false, active = true;
    let runs: Array<{play(): void; pause(): void; stop(): void}> = [];
    const stop = () => {runs.forEach(run => run.stop()); runs = []; y.stop(); rotate.stop();};
    const finish = () => {stop(); y.set(0); rotate.set(0);};
    finishNow.current = finish;
    if (reduced || deviceReduced() || focused.current) {finish(); return stop;}
    const update = () => {
      if (!active || focused.current) return;
      if (visible && !doc.hidden && !runs.length) {
        const angle = (index % 2 ? 1 : -1) * settings.rotate;
        runs.push(createIdleTrack(settings.duration + (index % 3) * settings.durationStep, -index * settings.phase, progress => {
          y.set(-settings.distance * progress);
          if (settings.rotate) rotate.set(angle * (1 - 2 * progress));
        }));
      }
      runs.forEach(run => visible && !doc.hidden ? run.play() : run.pause());
    };
    const release = observeVisibility(element, next => {visible = next; update();}, {threshold: 0, rootMargin: '0px'});
    doc.addEventListener('visibilitychange', update);
    return () => {active = false; release(); doc.removeEventListener('visibilitychange', update); stop(); finishNow.current = () => {};};
  }, [index, settings, reduced, y, rotate]);
  return <motion.div ref={node} initial={false} className={className}
    onFocusCapture={() => {focused.current = true; finishNow.current();}}
    style={{display: 'inline-block', ...style, y: reduced ? 0 : y, rotate: reduced ? 0 : rotate}}>{children}</motion.div>;
}
/** A gentle idle loop that suspends all work outside the viewport or hidden tab. */
export function Float({children, className, style, ...props}: FloatProps) {
  const reduced = useReducedMotionPreference();
  // Inline dial objects are common in JSX; only semantic values may restart motion.
  const dials = cleanDials('float', props.dials);
  const settings = useMemo(() => resolveFloatSettings({...props, dials}), [dials.speed, dials.size, props.distance, props.duration, props.durationStep, props.phase, props.rotate]);
  return <>{Children.toArray(children).map((child, index) => <FloatingItem key={typeof child === 'object' && 'key' in child ? child.key : index} index={index} settings={settings} reduced={reduced} className={className} style={style}>{child}</FloatingItem>)}</>;
}
