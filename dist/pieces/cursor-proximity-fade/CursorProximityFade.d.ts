import { type CSSProperties, type ReactNode } from 'react';
import { type MotionDials } from '../../dials';
export interface CursorProximityFadeProps {
    children: ReactNode;
    dials?: MotionDials;
    /** Proximity radius in px, 0–2000. Default 260. */
    radius?: number;
    /** Idle delay in seconds, 0–60. Default 4.5. */
    idleDelay?: number;
    /** Hide at this page scroll offset in px, 0–2000. Default 60. */
    scrollLimit?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function resolveProximitySettings(props: Omit<CursorProximityFadeProps, 'children'>): {
    radius: number;
    idleDelay: number;
    scrollLimit: number;
};
/** A proximity cue that remains available to keyboard and touch users. */
export declare function CursorProximityFade({ children, className, style, ...props }: CursorProximityFadeProps): import("react").JSX.Element;
