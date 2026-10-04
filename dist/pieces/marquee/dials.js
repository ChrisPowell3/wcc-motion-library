import { cleanDials } from '../../dials';
import { batchMotion, durations } from '../../tokens';
const bounded = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
/** Resolve preset values first, then valid explicit props. No browser state. */
export function resolveMarqueeSettings({ dials, duration, gap, direction }) {
    const settings = cleanDials('marquee', dials);
    const speed = settings.speed === 'slow' ? durations.slow / durations.base : settings.speed === 'fast' ? durations.fast / durations.base : 1;
    return {
        seconds: bounded(duration, batchMotion.marquee.duration * speed, 5, 120),
        spacing: bounded(gap, batchMotion.marquee.gap * (settings.size === 'small' ? 0.5 : settings.size === 'large' ? 2 : 1), 0, 120),
        travel: direction ?? (settings.direction === 'right' ? 'right' : 'left'),
    };
}
