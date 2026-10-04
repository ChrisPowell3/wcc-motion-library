import { cleanDials } from '../../dials';
import { designMotion } from '../../tokens';
import { clampNumber, dialSmoothing } from '../hover-tilt/behavior';
export function resolveParallaxDrift(props) {
    const dials = cleanDials('parallax-drift', props.dials);
    const base = designMotion.parallax;
    return {
        distance: clampNumber(props.distance, base.distance * (dials.size === 'small' ? .5 : dials.size === 'large' ? 1.5 : 1), 0, 300),
        factor: clampNumber(props.factor, base.factor, 0, 1),
        smoothing: clampNumber(props.smoothing, dialSmoothing(base.smoothing, dials.speed), .01, 1),
        direction: props.direction === 'up' || props.direction === 'down' ? props.direction : dials.direction === 'up' ? 'up' : 'down',
    };
}
