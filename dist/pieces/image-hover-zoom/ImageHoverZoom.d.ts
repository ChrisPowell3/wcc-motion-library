import { type CSSProperties, type ReactNode } from 'react';
import type { MotionDials } from '../../dials';
export interface ImageHoverZoomProps {
    /** Supply images with their own alt text (including alt="" for decorative images). */
    children: ReactNode;
    dials?: MotionDials;
    /** Hover scale, 1–1.2. Default 1.03. */
    scale?: number;
    /** Transition time, 0–3 seconds. Default 1. */
    duration?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function ImageHoverZoom({ children, className, style, ...props }: ImageHoverZoomProps): import("react").JSX.Element;
