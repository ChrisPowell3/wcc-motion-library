import { cleanDials } from '../../dials';
import { durations, ease, flick, springs } from '../../tokens';
import { safeNumber } from './physics';
/** Resolved once per render; explicit established props override preset values. */
export function resolveCarouselSettings({ dials, gap, sideScale, dimColor }) {
    const clean = cleanDials('swipe-carousel', dials);
    const duration = clean.speed === 'slow' ? durations.slow : clean.speed === 'fast' ? durations.fast : durations.base;
    const settle = clean.bounce === 'none' ? { type: 'tween', duration: durations.base, ease } : clean.bounce === 'springy' ? springs.snap : springs.settle;
    const multiplier = clean.flick === 'soft' ? .5 : clean.flick === 'strong' ? 1.5 : 1;
    return {
        spacing: safeNumber(gap ?? (clean.size === 'small' ? .4 : clean.size === 'large' ? .75 : .55), .55, .3, 1.1),
        sideScale: safeNumber(sideScale ?? (clean.sideCards === 'smaller' ? .65 : .8), .8, .6, 1),
        dimColor: dimColor ?? 'transparent',
        dimmer: clean.sideCards === 'dimmer',
        speed: durations.base / duration,
        settle,
        fan: clean.bounce === 'none' || clean.bounce === 'springy' ? settle : springs.float,
        autoplay: clean.autoplay === 'on',
        loop: clean.loop === 'on',
        flickPower: flick.power * multiplier,
        flickMaxItems: flick.maxItems * multiplier,
    };
}
