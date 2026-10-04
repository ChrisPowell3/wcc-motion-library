import { resolveEntrance } from '../../internal/entrance';
import { cleanDials } from '../../dials';
import { durations, ease, settleEase, springyEase, blurStrength } from '../../tokens';
const clamp = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
/** Resolve word dials before explicit props; preserve the original image preset. */
export function resolveRevealDials(props) {
    const dials = cleanDials('scroll-reveal-rise', props.dials);
    const as = props.as ?? 'block';
    const image = as === 'image';
    const trigger = props.trigger ?? (dials.start === 'load' ? 'load' : 'scroll');
    const presetDistance = image ? 64 : 24;
    const size = dials.size === 'small' ? presetDistance / 2 : dials.size === 'large' ? Math.min(120, presetDistance * 2) : presetDistance;
    const speed = dials.speed === 'slow' ? 'slow' : dials.speed === 'fast' ? 'fast' : dials.speed === 'normal' ? 'base' : image ? 'slow' : 'base';
    const bounce = dials.bounce ?? (image ? 'none' : 'soft');
    const opacity = dials.fade === 'none' ? 1 : dials.fade === 'full' ? 0 : dials.fade === 'soft' ? 0.5 : image ? 0 : 0.5;
    const startInset = props.margin !== undefined || !dials.start || dials.start === 'load' ? undefined
        : dials.start === 'late' ? 0.4 : dials.start === 'middle' ? 0.25 : 0.1;
    return {
        as,
        distance: clamp(props.distance, size, 8, 120),
        duration: typeof props.duration === 'number' ? clamp(props.duration, durations[speed], 0, 5) : props.duration ?? speed,
        blur: image && trigger === 'scroll' ? 0 : clamp(props.blur, blurStrength[(dials.blur ?? 'none')], 0, 10),
        trigger,
        stagger: clamp(props.stagger, dials.cascade === 'together' ? 0 : durations.fast * 1000 / 2, 0, 300),
        // Only an explicit opacity is clamped: the no-fade dial must remain opaque.
        startOpacity: clamp(props.startOpacity, opacity, 0, 0.6),
        ...resolveEntrance(props, dials),
        margin: props.margin ?? '0px 0px -10% 0px',
        startInset,
        axis: dials.direction === 'left' || dials.direction === 'right' ? 'x' : 'y',
        offsetSign: dials.direction === 'left' || dials.direction === 'down' ? -1 : 1,
        bounceEase: bounce === 'springy' ? springyEase : bounce === 'soft' ? settleEase : ease,
        delay: clamp(props.delay, (dials.delay === 'long' ? durations.slow : dials.delay === 'short' ? durations.fast : 0) * 1000, 0, 5000) / 1000,
    };
}
