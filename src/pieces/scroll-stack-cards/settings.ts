import {cleanDials} from '../../dials';
import {designMotion} from '../../tokens';
import {clampNumber, dialSmoothing} from '../hover-tilt/behavior';
import type {ScrollStackCardsProps} from './ScrollStackCards';
export function resolveScrollStackCards(props: Omit<ScrollStackCardsProps, 'children'>) {
  const dials = cleanDials('scroll-stack-cards', props.dials); const base = designMotion.stack;
  const size = dials.size === 'small' ? .5 : dials.size === 'large' ? 1.5 : 1;
  return {
    scale: clampNumber(props.scale, 1 - (1 - base.scale) * size, .8, 1),
    smoothing: clampNumber(props.smoothing, dialSmoothing(base.smoothing, dials.speed), .01, 1),
    top: clampNumber(props.top, base.top, 0, 300),
    gap: clampNumber(props.gap, base.gap, 0, 160),
  };
}
export function stackProgress(top: number, nextTop: number, height: number) {
  return height > 0 ? Math.max(0, Math.min(1, 1 - (nextTop - top) / height)) : 0;
}
