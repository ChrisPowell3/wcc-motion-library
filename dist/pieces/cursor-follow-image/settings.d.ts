import type { CursorFollowImageProps } from './CursorFollowImage.js';
export declare function resolveCursorFollowImage(props: Omit<CursorFollowImageProps, 'children'>): {
    maxX: number;
    maxY: number;
    scale: number;
    falloff: number;
    strength: number;
    smoothing: number;
};
export declare function cursorTarget(rect: Pick<DOMRectReadOnly, 'width' | 'height' | 'left' | 'top'>, x: number, y: number, settings: ReturnType<typeof resolveCursorFollowImage>): {
    x: number;
    y: number;
};
