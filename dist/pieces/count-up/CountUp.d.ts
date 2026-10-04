import { type CSSProperties } from 'react';
import { type MotionDials } from '../../dials.js';
import { type EntranceOptions } from '../../internal/entrance.js';
export interface CountUpProps extends EntranceOptions {
    children: string | readonly string[];
    dials?: MotionDials;
    /** Seconds, 0–10. Default 2.2. */
    duration?: number;
    /** Seconds, 0–5. Default .5. */
    delay?: number;
    /** Sibling delay seconds, 0–1; repeats every four values. Default .18. */
    stagger?: number;
    once?: boolean;
    /** Visible fraction, 0–1. Default .12. */
    threshold?: number;
    margin?: string;
    className?: string;
    style?: CSSProperties;
}
export declare function resolveCountUpSettings(props: Omit<CountUpProps, 'children'>): {
    threshold: number;
    margin: string;
    plays: "once" | "always" | "scrub";
    once: boolean;
    scrubRange: number;
    smoothing: number;
    duration: number;
    delay: number;
    stagger: number;
};
/** Count the magnitude while retaining its exact authored prefix, suffix and precision. */
export declare function countText(final: string, progress: number): string;
/** Each authored number stays accessible as its final value throughout the count. */
export declare function CountUp({ children, className, style, ...props }: CountUpProps): import("react").JSX.Element;
