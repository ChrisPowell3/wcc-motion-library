import { type CSSProperties, type ReactNode } from 'react';
import type { MotionDials } from '../../dials';
export interface HoverTiltProps {
    children: ReactNode;
    dials?: MotionDials;
    /** Maximum rotation per axis, 0–15 degrees. Default 6. */
    maxTilt?: number;
    /** Upward travel on hover, 0–24 px. Default 8. */
    lift?: number;
    /** Perspective distance, 400–2000 px. Default 1000. */
    perspective?: number;
    /** Per-reference-frame following factor, .01–1. Default .1. */
    smoothing?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function HoverTilt({ children, className, style, ...props }: HoverTiltProps): import("react").JSX.Element;
