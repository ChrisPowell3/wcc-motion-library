import {cleanDials} from '../../dials.js';
import {batchMotion, blurStrength} from '../../tokens.js';
import {clampNumber, dialSmoothing} from '../hover-tilt/behavior.js';
import type {ScrollFocusProps} from './ScrollFocus.js';
export function resolveScrollFocus(props: Omit<ScrollFocusProps, 'children'>) {
  const dials = cleanDials('scroll-focus', props.dials);
  const base = batchMotion.focus;
  const blur = dials.blur === 'none' ? blurStrength.none : dials.blur === 'soft' ? blurStrength.soft : dials.blur === 'strong' ? blurStrength.strong : base.blur;
  const distance = base.distance * (dials.size === 'small' ? .5 : dials.size === 'large' ? 2 : 1);
  return {
    blur: clampNumber(props.blur, blur, 0, 10),
    distance: clampNumber(props.distance, distance, 0, 60),
    startOpacity: clampNumber(props.startOpacity, base.opacity, 0, 1),
    smoothing: clampNumber(props.smoothing, dialSmoothing(base.smoothing, dials.speed), .01, 1),
    enter: clampNumber(props.enter, base.enter, .1, 1),
    exit: clampNumber(props.exit, base.exit, .05, 1),
    exitFocus: clampNumber(props.exitFocus, base.exitFocus, 0, 1),
  };
}
/** Independent entry progress and focus: leaving the top softens text without moving it back down. */
export function focusTargets(rect: Pick<DOMRectReadOnly, 'top' | 'bottom'>, height: number, enter: number, exit: number, exitFocus: number) {
  if (!(height > 0)) return {entry: 1, focus: 1};
  const entry = Math.min(1, Math.max(0, (height - rect.top) / (height * enter)));
  const exitProgress = Math.min(1, Math.max(0, rect.bottom / (height * exit)));
  return {entry, focus: Math.min(entry, exitFocus + (1 - exitFocus) * exitProgress)};
}
