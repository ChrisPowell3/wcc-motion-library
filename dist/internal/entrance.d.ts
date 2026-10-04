import type { MotionDials, Plays } from '../dials';
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
export declare function resolveEntrance(props: EntranceOptions, dials: MotionDials): {
    plays: "once" | "always" | "scrub";
    once: boolean;
    scrubRange: number;
    smoothing: number;
};
type ScrubSettings = Pick<ReturnType<typeof resolveEntrance>, 'scrubRange' | 'smoothing'> & {
    margin?: string;
    threshold?: number;
    startInset?: number;
};
/** Stationary anchors only. The shared viewport service batches reads before writes. */
export declare function observeEntranceScrub(element: Element, update: (progress: number) => void, settings: ScrubSettings): () => void;
export {};
