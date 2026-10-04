import {cleanDials, type MotionDials} from '../../dials.js';
import {blurStrength, designMotion, durations} from '../../tokens.js';
export interface PinnedScrollStorySettings {dials?: MotionDials; duration?: number; distance?: number; blur?: number; startOpacity?: number; trackPerSlide?: number; top?: number; align?: 'start' | 'center';}
const bounded = (value: number | undefined, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export function resolvePinnedScrollStory(props: PinnedScrollStorySettings) {
  const dials = cleanDials('pinned-scroll-story', props.dials);
  const base = designMotion.story;
  return {
    duration: bounded(props.duration, base.duration * (dials.speed === 'slow' ? durations.slow / durations.base : dials.speed === 'fast' ? durations.fast / durations.base : 1), 0, 3),
    distance: bounded(props.distance, base.distance * (dials.size === 'small' ? .5 : dials.size === 'large' ? 2 : 1), 0, 120),
    blur: bounded(props.blur, dials.blur ? blurStrength[dials.blur as keyof typeof blurStrength] : base.blur, 0, 10),
    startOpacity: bounded(props.startOpacity, dials.fade === 'none' ? 1 : dials.fade === 'soft' ? .5 : 0, 0, 1),
    trackPerSlide: bounded(props.trackPerSlide, base.trackPerSlide, .2, 2),
    top: bounded(props.top, 0, 0, 240),
    align: props.align === 'start' || props.align === 'center' ? props.align : dials.align === 'center' ? 'center' : 'start',
  };
}
/** The last index owns the final interval, including progress exactly one. */
export function storyProgress(top: number, span: number, count: number) {
  const progress = span > 0 && Number.isFinite(top) && Number.isFinite(span) ? Math.max(0, Math.min(1, -top / span)) : 0;
  return {progress, index: count > 0 ? Math.min(count - 1, Math.floor(progress * count)) : 0};
}
