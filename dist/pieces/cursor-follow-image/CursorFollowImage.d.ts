import { type CSSProperties, type ReactNode } from 'react';
import type { MotionDials } from '../../dials.js';
export interface CursorFollowImageProps {
    /** Supply an image with meaningful alt text (or alt="" for decorative media). */
    children: ReactNode;
    dials?: MotionDials;
    /** Horizontal travel limit, 0–100 px. Default 26. */
    maxX?: number;
    /** Vertical travel limit, 0–100 px. Default 22. */
    maxY?: number;
    /** Scale while the pointer is inside, 1–1.2. Default 1.03. */
    scale?: number;
    /** Distance where the pull stops growing, 1–2000 px. Default 420. */
    falloff?: number;
    /** Pointer displacement multiplier, 0–1. Default .06. */
    strength?: number;
    /** Per-reference-frame following factor, .01–1. Default .08. */
    smoothing?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function CursorFollowImage({ children, className, style, ...props }: CursorFollowImageProps): import("react").JSX.Element;
