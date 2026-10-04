import { type ReactNode } from 'react';
import type { MotionDials } from '../../dials.js';
export interface MarqueeProps {
    children: ReactNode;
    /** Supports speed, size (gap), and left/right direction. */
    dials?: MotionDials;
    /** Seconds per complete original set, 5–120. Default 30; overrides speed. */
    duration?: number;
    /** Space between items and sets in px, 0–120. Default 28; overrides size. */
    gap?: number;
    /** Travel direction. Default left; overrides the direction dial. */
    direction?: 'left' | 'right';
    /** Accessible region name. Default Moving content. */
    label?: string;
    /** Show the manual pause button. Default true. */
    showPauseControl?: boolean;
}
/** A continuous strip with one semantic copy and an accessible static mode. */
export declare function Marquee({ children, dials, duration, gap, direction, label, showPauseControl }: MarqueeProps): import("react").JSX.Element;
