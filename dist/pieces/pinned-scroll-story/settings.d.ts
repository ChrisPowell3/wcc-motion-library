import { type MotionDials } from '../../dials.js';
export interface PinnedScrollStorySettings {
    dials?: MotionDials;
    duration?: number;
    distance?: number;
    blur?: number;
    startOpacity?: number;
    trackPerSlide?: number;
    top?: number;
    align?: 'start' | 'center';
}
export declare function resolvePinnedScrollStory(props: PinnedScrollStorySettings): {
    duration: number;
    distance: number;
    blur: number;
    startOpacity: number;
    trackPerSlide: number;
    top: number;
    align: "start" | "center";
};
/** The last index owns the final interval, including progress exactly one. */
export declare function storyProgress(top: number, span: number, count: number): {
    progress: number;
    index: number;
};
