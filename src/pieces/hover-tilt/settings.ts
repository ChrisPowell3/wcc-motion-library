import {cleanDials} from '../../dials.js';
import {batchMotion} from '../../tokens.js';
import {clampNumber, dialSmoothing} from './behavior.js';
import type {HoverTiltProps} from './HoverTilt.js';
export function resolveHoverTilt(props: Omit<HoverTiltProps, 'children'>) {
  const dials = cleanDials('hover-tilt', props.dials); const base = batchMotion.hover;
  return {
    maxTilt: clampNumber(props.maxTilt, dials.size === 'small' ? base.tilt / 2 : dials.size === 'large' ? 10 : base.tilt, 0, 15),
    lift: clampNumber(props.lift, base.lift * (dials.size === 'small' ? .5 : dials.size === 'large' ? 1.5 : 1), 0, 24),
    perspective: clampNumber(props.perspective, base.perspective, 400, 2000),
    smoothing: clampNumber(props.smoothing, dialSmoothing(base.smoothing, dials.speed), .01, 1),
  };
}
export function tiltTarget(rect: Pick<DOMRectReadOnly, 'width' | 'height' | 'left' | 'top'>, x: number, y: number, max: number) {
  if (!(rect.width > 0) || !(rect.height > 0)) return {x: 0, y: 0};
  const horizontal = Math.max(-1, Math.min(1, (x - rect.left) / rect.width * 2 - 1));
  const vertical = Math.max(-1, Math.min(1, 1 - (y - rect.top) / rect.height * 2));
  return {x: horizontal * max, y: vertical * max};
}
