import { type CSSProperties, type ReactNode } from 'react';
import type { MotionDials } from '../../dials.js';
export interface HoverLiftProps {
    /** Supply a native button/link for interactive content; no extra tab stop is added. */
    children: ReactNode;
    dials?: MotionDials;
    /** Upward travel, 0–20 px. Default 3. */
    lift?: number;
    /** Transition time, 0–3 seconds. Default .5. */
    duration?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function HoverLift({ children, className, style, ...props }: HoverLiftProps): import("react").JSX.Element;
