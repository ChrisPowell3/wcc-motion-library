import { type CSSProperties, type ReactNode } from 'react';
import { type MotionDials } from '../../dials';
import { type EntranceOptions } from '../../internal/entrance';
export interface CtaPillsProps extends EntranceOptions {
    children: ReactNode;
    dials?: MotionDials;
    duration?: number;
    delay?: number;
    stagger?: number;
    distance?: number;
    scale?: number;
    blur?: number;
    bob?: number;
    floatDuration?: number;
    floatStep?: number;
    floatDelay?: number;
    floatDelayStep?: number;
    threshold?: number;
    margin?: string;
    className?: string;
    style?: CSSProperties;
}
export declare function resolveCtaPillsSettings(props: Omit<CtaPillsProps, 'children'>): {
    duration: number;
    delay: number;
    stagger: number;
    distance: number;
    scale: number;
    blur: number;
    bob: number;
    floatDuration: number;
    floatStep: number;
    floatDelay: number;
    floatDelayStep: number;
    threshold: number;
    margin: string;
    plays: "once" | "always" | "scrub";
    once: boolean;
    scrubRange: number;
    smoothing: number;
};
/** A soft pill entrance followed by an independent, shallow idle float. */
export declare function CtaPills({ children, className, style, ...props }: CtaPillsProps): import("react").JSX.Element;
