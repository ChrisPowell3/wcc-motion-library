import { type CSSProperties } from 'react';
import type { MotionDials } from '../../dials';
export interface ScrollFocusProps {
    /** Plain text only. Images and interactive descendants are deliberately excluded. */
    children: string;
    /** Text semantics. Default span, displayed as a block. */
    as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    dials?: MotionDials;
    /** Maximum blur, 0–10 px. Default 8. */
    blur?: number;
    /** Entry travel, 0–60 px. Default 14. */
    distance?: number;
    /** Entry opacity, 0–1. Default .2. */
    startOpacity?: number;
    /** Per-reference-frame following factor, .01–1. Default .14. */
    smoothing?: number;
    /** Fraction of viewport height used for entry, .1–1. Default .4. */
    enter?: number;
    /** Fraction of viewport height used for exit, .05–1. Default .22. */
    exit?: number;
    /** Remaining focus after leaving the top, 0–1. Default .35. */
    exitFocus?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function ScrollFocus({ children, as: Tag, className, style, ...props }: ScrollFocusProps): import("react").JSX.Element;
