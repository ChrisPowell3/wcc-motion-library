import type { ParallaxDriftProps } from './ParallaxDrift';
export declare function resolveParallaxDrift(props: Omit<ParallaxDriftProps, 'children'>): {
    distance: number;
    factor: number;
    smoothing: number;
    direction: "up" | "down";
};
