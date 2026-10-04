import { type CSSProperties, type ReactNode } from 'react';
import { type MotionDials } from '../../dials.js';
export interface FullscreenViewerItem {
    /** Stable id. Duplicate ids are ignored after their first occurrence. */
    id: string;
    /** Plain-text name used by the thumbnail, current-item announcement and dot. */
    label: string;
    /** Noninteractive content inside a native button. Supply alt text for images. */
    thumbnail: ReactNode;
    /** Any content; images must have alt text. Links and form fields are supported. */
    content: ReactNode;
}
export interface FullscreenViewerProps {
    items: readonly FullscreenViewerItem[];
    /** Supported: speed, size, loop, fade. */
    dials?: MotionDials;
    /** Wrap at either end. Default true; overrides loop dial. */
    loop?: boolean;
    /** Content entrance seconds, 0–3. Default .6; overrides speed. */
    duration?: number;
    /** Overlay entrance seconds, 0–3. Default .5; overrides speed. */
    overlayDuration?: number;
    /** Entrance rise in pixels, 0–120. Default 24; overrides size. */
    distance?: number;
    /** Entrance scale, .8–1. Default .97; overrides size. */
    startScale?: number;
    /** Content fade: none, soft or full. Default full; overrides fade dial. */
    fade?: 'none' | 'soft' | 'full';
    /** Accessible modal name. Default "Fullscreen viewer". */
    ariaLabel?: string;
    /** Content width in pixels, 280–1920. Default 1100. */
    maxWidth?: number;
    /** Thumbnail gap in pixels, 0–80. Default 16. */
    gap?: number;
    /** Horizontal touch travel needed to navigate, 16–200px. Default 48. */
    swipeThreshold?: number;
    className?: string;
    style?: CSSProperties;
}
/** Native top-layer viewer: the browser makes the rest of the page inert. */
export declare function FullscreenViewer({ items, dials, loop, duration, overlayDuration, distance, startScale, fade, ariaLabel, maxWidth, gap, swipeThreshold, className, style }: FullscreenViewerProps): import("react").JSX.Element;
