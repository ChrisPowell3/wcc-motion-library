import {batchMotion, entranceScrub} from '../tokens';
import type {MotionDials, Plays} from '../dials';
import {observeViewport} from './viewport';

export interface EntranceOptions {
  /** Playback mode. Default scrub. Explicit once takes priority. */
  plays?: Plays;
  /** Legacy override: true = once; false = always. Default undefined. */
  once?: boolean;
  /** Scroll distance from trigger to completion, as viewport fraction, .1–1. Default .4. */
  scrubRange?: number;
  /** Following factor per reference frame, .01–1. Default .14 (ScrollFocus house feel). */
  smoothing?: number;
}
const clamp = (value: number | undefined, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export function resolveEntrance(props: EntranceOptions, dials: MotionDials) {
  const plays: Plays = props.once !== undefined ? props.once ? 'once' : 'always'
    : props.plays ?? (dials.plays as Plays | undefined) ?? 'scrub';
  return {plays, once: plays === 'once',
    scrubRange: clamp(props.scrubRange, entranceScrub.range, .1, 1),
    smoothing: clamp(props.smoothing, entranceScrub.smoothing, .01, 1)};
}

type ScrubSettings = Pick<ReturnType<typeof resolveEntrance>, 'scrubRange' | 'smoothing'> & {
  margin?: string; threshold?: number; startInset?: number;
};
/** Stationary anchors only. The shared viewport service batches reads before writes. */
export function observeEntranceScrub(element: Element, update: (progress: number) => void, settings: ScrubSettings) {
  const parts = (settings.margin ?? '0px').trim().split(/\s+/);
  if (parts.length > 4 || parts.some(part => !/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|%)$/.test(part))) {
    update(1); return () => {};
  }
  const bottom = parts[2] ?? parts[0];
  // For two-value margins, the first value is the vertical margin.
  let current: number | undefined;
  return observeViewport(element, (rect, height, delta, metrics) => {
    const margin = settings.startInset !== undefined ? -height * settings.startInset
      : parseFloat(bottom) * (bottom.endsWith('%') ? metrics.width / 100 : 1);
    const trigger = height + margin - Math.min(rect.height, height) * (settings.threshold ?? 0);
    const range = Math.max(1, height * settings.scrubRange);
    const naturalStart = metrics.scrollY + rect.top - trigger;
    // Shift the range earlier at the document end so final-page content can
    // actually finish. Non-scrolling pages stay fully visible. A zero layout
    // height (detached/test document) has no reliable scroll boundary to cap.
    const measured = metrics.scrollHeight >= height;
    const end = measured ? Math.min(naturalStart + range, Math.max(0, metrics.scrollHeight - height)) : naturalStart + range;
    const start = Math.min(naturalStart, end - range);
    const target = measured && metrics.scrollHeight <= height ? 1
      : Math.max(0, Math.min(1, (metrics.scrollY - start) / Math.max(1, end - start)));
    const amount = 1 - Math.pow(1 - settings.smoothing, Math.max(0, delta) / batchMotion.frameMs);
    current = current === undefined || Math.abs(target - current) < .0001 ? target : current + (target - current) * amount;
    update(current);
    return current !== target;
  });
}
