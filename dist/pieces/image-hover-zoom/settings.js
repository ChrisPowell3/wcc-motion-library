import { cleanDials } from '../../dials.js';
import { batchMotion } from '../../tokens.js';
import { clampNumber, speedFactor } from '../hover-tilt/behavior.js';
export function resolveImageHoverZoom(props) {
    const dials = cleanDials('image-hover-zoom', props.dials);
    return {
        scale: clampNumber(props.scale, 1 + (batchMotion.hover.zoom - 1) * (dials.size === 'small' ? .5 : dials.size === 'large' ? 2 : 1), 1, 1.2),
        duration: clampNumber(props.duration, batchMotion.hover.zoomDuration * speedFactor(dials.speed), 0, 3),
    };
}
