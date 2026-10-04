import { type ReactNode } from 'react';
import type { MotionDials } from '../../dials.js';
import { type EntranceOptions } from '../../internal/entrance.js';
export interface ScrollRevealRiseProps extends EntranceOptions {
    /** Shared word dials; see catalog for values. Explicit props override matching dials.
     * Initially visible content uses an 8px/fast entrance with opacity at least 0.8
     * and the actual viewport trigger. The selected delay still applies.
     */
    dials?: MotionDials;
    /** Required content. Direct children reveal separately; a fragment is one item. */
    children: ReactNode | ReactNode[];
    /** Motion preset, not an HTML tag. Default: block. */
    as?: 'block' | 'image' | 'button';
    /** Travel in px, clamped to 8–120. Default: 24; image: 64. */
    distance?: number;
    /** House duration name or seconds (0–5). Default: base; image: slow. */
    duration?: 'fast' | 'base' | 'slow' | number;
    /** Initial delay in milliseconds, 0–5000. Default: 0. */
    delay?: number;
    /** Entrance blur in px, 0–10. Default: 0. Ends at filter: none. */
    blur?: number;
    /** Explicit trigger overrides start dial. Default: scroll. */
    trigger?: 'scroll' | 'load';
    /** Sibling delay in ms, clamped to 0–300. Default: 90. */
    stagger?: number;
    /** Initial opacity, clamped to 0–0.6. Default: 0.5; image: 0. */
    startOpacity?: number;
    /** Play once per mounted child. Default: undefined (scrub). */
    once?: boolean;
    /** IntersectionObserver root margin, px or %. Default: 0px 0px -10% 0px. */
    margin?: string;
}
/** Follows native scrolling through the shared passive viewport observer. */
export declare function ScrollRevealRise({ children, ...props }: ScrollRevealRiseProps): import("react").JSX.Element;
