import type { HoverTiltProps } from './HoverTilt';
export declare function resolveHoverTilt(props: Omit<HoverTiltProps, 'children'>): {
    maxTilt: number;
    lift: number;
    perspective: number;
    smoothing: number;
};
export declare function tiltTarget(rect: Pick<DOMRectReadOnly, 'width' | 'height' | 'left' | 'top'>, x: number, y: number, max: number): {
    x: number;
    y: number;
};
