import {cleanDials} from '../../dials';
import {batchMotion} from '../../tokens';
import {clampNumber, speedFactor} from '../hover-tilt/behavior';
import type {ImageHoverZoomProps} from './ImageHoverZoom';
export function resolveImageHoverZoom(props: Omit<ImageHoverZoomProps, 'children'>) {
  const dials = cleanDials('image-hover-zoom', props.dials);
  return {
    scale: clampNumber(props.scale, 1 + (batchMotion.hover.zoom - 1) * (dials.size === 'small' ? .5 : dials.size === 'large' ? 2 : 1), 1, 1.2),
    duration: clampNumber(props.duration, batchMotion.hover.zoomDuration * speedFactor(dials.speed), 0, 3),
  };
}
