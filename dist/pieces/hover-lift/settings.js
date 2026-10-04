import { cleanDials } from '../../dials';
import { batchMotion } from '../../tokens';
import { clampNumber, speedFactor } from '../hover-tilt/behavior';
export function resolveHoverLift(props) {
    const dials = cleanDials('hover-lift', props.dials);
    return {
        lift: clampNumber(props.lift, batchMotion.hover.buttonLift * (dials.size === 'small' ? .5 : dials.size === 'large' ? 2 : 1), 0, 20),
        duration: clampNumber(props.duration, batchMotion.hover.duration * speedFactor(dials.speed), 0, 3),
    };
}
