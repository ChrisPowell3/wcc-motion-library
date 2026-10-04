import { type CSSProperties, type ReactNode } from 'react';
import { type MotionDials } from '../../dials';
import { type EntranceOptions } from '../../internal/entrance';
export interface StarPopProps extends EntranceOptions {
    children: ReactNode;
    dials?: MotionDials;
    duration?: number;
    delay?: number;
    stagger?: number;
    bounce?: 'none' | 'soft' | 'springy';
    threshold?: number;
    margin?: string;
    className?: string;
    style?: CSSProperties;
}
export declare function resolveStarPopSettings(props: Omit<StarPopProps, 'children'>): {
    duration: number;
    delay: number;
    stagger: number;
    peakScale: number;
    startRotate: number;
    peakRotate: number;
    ease: readonly [0.22, 1, 0.36, 1] | ((progress: number) => number) | readonly [0.34, 1.56, 0.64, 1];
    threshold: number;
    margin: string;
    plays: "once" | "always" | "scrub";
    once: boolean;
    scrubRange: number;
    smoothing: number;
};
export declare function StarPop({ children, className, style, ...props }: StarPopProps): import("react").JSX.Element;
