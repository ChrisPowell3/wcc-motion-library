import { cleanDials } from '../../dials.js';
import { batchMotion } from '../../tokens.js';
import { clampNumber, speedFactor } from '../hover-tilt/behavior.js';
export function resolveHoverLift(props) {
    const dials = cleanDials('hover-lift', props.dials);
    return {
        lift: clampNumber(props.lift, batchMotion.hover.buttonLift * (dials.size === 'small' ? .5 : dials.size === 'large' ? 2 : 1), 0, 20),
        duration: clampNumber(props.duration, batchMotion.hover.duration * speedFactor(dials.speed), 0, 3),
    };
}
