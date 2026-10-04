import { type CSSProperties, type ReactNode } from 'react';
import type { EntranceOptions } from '../../internal/entrance.js';
import type { MotionDials } from '../../dials.js';
export interface ScrollStackCardsProps extends Pick<EntranceOptions, 'plays' | 'once'> {
    /** Each direct child is one card. Supply the card's own appearance and content. */
    children: ReactNode;
    dials?: MotionDials;
    /** Smallest outgoing card scale, .8–1. Default .95. */
    scale?: number;
    /** Per-reference-frame following factor, .01–1. Default .14. */
    smoothing?: number;
    /** Sticky inset, 0–300 px. Default 96. */
    top?: number;
    /** Space between cards in document flow, 0–160 px. Default 24. */
    gap?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function ScrollStackCards({ children, className, style, ...props }: ScrollStackCardsProps): import("react").JSX.Element;
