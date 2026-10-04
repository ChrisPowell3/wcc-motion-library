import { cleanDials } from '../../dials';
import { designMotion } from '../../tokens';
import { clampNumber, dialSmoothing } from '../hover-tilt/behavior';
export function resolveCursorFollowImage(props) {
    const dials = cleanDials('cursor-follow-image', props.dials);
    const base = designMotion.cursorFollow;
    const size = dials.size === 'small' ? .5 : dials.size === 'large' ? 1.5 : 1;
    return {
        maxX: clampNumber(props.maxX, base.maxX * size, 0, 100),
        maxY: clampNumber(props.maxY, base.maxY * size, 0, 100),
        scale: clampNumber(props.scale, Number((1 + (base.scale - 1) * size).toFixed(4)), 1, 1.2),
        falloff: clampNumber(props.falloff, base.falloff, 1, 2000),
        strength: clampNumber(props.strength, base.strength, 0, 1),
        smoothing: clampNumber(props.smoothing, dialSmoothing(base.smoothing, dials.speed), .01, 1),
    };
}
export function cursorTarget(rect, x, y, settings) {
    if (!(rect.width > 0) || !(rect.height > 0))
        return { x: 0, y: 0 };
    const dx = x - rect.left - rect.width / 2;
    const dy = y - rect.top - rect.height / 2;
    const pull = settings.strength * Math.min(1, settings.falloff / (Math.hypot(dx, dy) || 1));
    return { x: Math.max(-settings.maxX, Math.min(settings.maxX, dx * pull)), y: Math.max(-settings.maxY, Math.min(settings.maxY, dy * pull)) };
}
