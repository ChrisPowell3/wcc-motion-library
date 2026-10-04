import { type CSSProperties, type ReactNode } from 'react';
import type { MotionDials } from '../../dials';
export interface ParallaxDriftProps {
    children: ReactNode;
    dials?: MotionDials;
    /** Maximum displacement, 0–300 px. Default 70. */
    distance?: number;
    /** Displacement per page scroll pixel, 0–1. Default .08. */
    factor?: number;
    /** Per-reference-frame following factor, .01–1. Default .14. */
    smoothing?: number;
    /** Direction of displacement while scrolling down. Default down. */
    direction?: 'up' | 'down';
    className?: string;
    style?: CSSProperties;
}
export declare function ParallaxDrift({ children, className, style, ...props }: ParallaxDriftProps): import("react").JSX.Element;
