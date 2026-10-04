import { type CSSProperties, type ReactNode } from 'react';
import { type MotionDials } from '../../dials';
export interface FloatProps {
    children: ReactNode;
    dials?: MotionDials;
    distance?: number;
    duration?: number;
    durationStep?: number;
    phase?: number;
    /** Optional rotation in degrees, 0–5. Default 0; .6 recreates the small credential sway. */
    rotate?: number;
    className?: string;
    style?: CSSProperties;
}
export declare function resolveFloatSettings(props: Omit<FloatProps, 'children'>): {
    duration: number;
    durationStep: number;
    phase: number;
    distance: number;
    rotate: number;
};
/** A gentle idle loop that suspends all work outside the viewport or hidden tab. */
export declare function Float({ children, className, style, ...props }: FloatProps): import("react").JSX.Element;
