import type { ScrollRevealRiseProps } from './ScrollRevealRise.js';
/** Resolve word dials before explicit props; preserve the original image preset. */
export declare function resolveRevealDials(props: Omit<ScrollRevealRiseProps, 'children'>): {
    margin: string;
    startInset: number | undefined;
    axis: "x" | "y";
    offsetSign: number;
    bounceEase: readonly [0.22, 1, 0.36, 1] | ((progress: number) => number);
    delay: number;
    plays: "once" | "always" | "scrub";
    once: boolean;
    scrubRange: number;
    smoothing: number;
    as: "block" | "image" | "button";
    distance: number;
    duration: number | "slow" | "fast" | "base";
    blur: number;
    trigger: "load" | "scroll";
    stagger: number;
    startOpacity: number;
};
