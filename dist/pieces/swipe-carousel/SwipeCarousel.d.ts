import { type CSSProperties, type ReactNode } from 'react';
import type { MotionDials } from '../../dials';
export interface SwipeCarouselItem {
    /** Stable, unique card identifier. */
    id: string;
    image: string;
    alt: string;
    title: string;
    text: string;
    cta?: {
        label: string;
        href: string;
    };
}
export interface SwipeCarouselCardState {
    index: number;
    count: number;
    /** Selected center card (the destination while settling). */
    active: boolean;
    /** True only for the active card after the fan or settling spring completes. */
    ready: boolean;
    /** Gate custom image sources with this flag to preserve deferred loading. */
    loadImage: boolean;
}
/** Decoration only; movement, dimensions and stacking remain owned by the frame. */
export type SwipeCarouselCardStyle = Pick<CSSProperties, 'borderRadius' | 'background' | 'boxShadow'>;
type CardRenderer<T> = (item: T, state: SwipeCarouselCardState) => ReactNode;
interface SwipeCarouselOptions<T extends {
    id: string;
}> {
    items: readonly T[];
    /** Shared motion presets; explicit layout props take precedence. */
    dials?: MotionDials;
    /** CSS aspect ratio, or "auto" for content-driven custom card height. */
    cardAspect?: string;
    /** Optional radius, background and shadow overrides; omitted values keep the house look. */
    cardStyle?: SwipeCarouselCardStyle;
    /** Overlay color for opaque side cards; transparent preserves legacy frame fading. */
    dimColor?: string;
    /** Accessible name for the carousel region. Defaults to "Image carousel". */
    label?: string;
    /** Zero-based; defaults to Math.floor(items.length / 2), clamped to available cards. */
    startIndex?: number;
    /** CSS width, capped to the available viewport. */
    cardWidth?: string;
    /** Distance between card centers as a share of card width: 0.3–1.1. */
    gap?: number;
    /** Neighbor scale: 0.6–1. */
    sideScale?: number;
    fanOnView?: boolean;
    showDots?: boolean;
    onChange?: (index: number) => void;
}
/** Custom item shapes require a renderer; existing image items use the default card. */
export type SwipeCarouselProps<T extends {
    id: string;
} = SwipeCarouselItem> = SwipeCarouselOptions<T> & ([T] extends [SwipeCarouselItem] ? {
    renderCard?: CardRenderer<T>;
} : {
    renderCard: CardRenderer<T>;
});
/** A centered carousel with direct manipulation, optional looping and token-based motion. */
export declare function SwipeCarousel<T extends {
    id: string;
} = SwipeCarouselItem>({ items, dials, renderCard, cardAspect, cardStyle, dimColor, label, startIndex, cardWidth, gap, sideScale, fanOnView, showDots, onChange }: SwipeCarouselProps<T>): import("react").JSX.Element;
export {};
