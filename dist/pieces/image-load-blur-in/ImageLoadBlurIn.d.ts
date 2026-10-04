import { type CSSProperties } from 'react';
import { type MotionDials } from '../../dials.js';
export interface ImageLoadBlurInProps {
    src: string;
    /** Use an empty string for a decorative background image. */
    alt: string;
    srcSet?: string;
    sizes?: string;
    dials?: MotionDials;
    /** Seconds, 0–5. Default 1.8. */
    duration?: number;
    /** Initial scale, 1–1.2. Default 1.05. */
    startScale?: number;
    /** Entrance blur, 0–10px. Default 6. */
    blur?: number;
    /** Seconds, 0–5. Default 0. */
    delay?: number;
    /** Static wrapper aspect ratio. Default 16 / 9. */
    aspectRatio?: CSSProperties['aspectRatio'];
    objectFit?: 'cover' | 'contain';
    objectPosition?: string;
    className?: string;
    style?: CSSProperties;
}
export declare function resolveImageLoadSettings(props: Omit<ImageLoadBlurInProps, 'src' | 'alt'>): {
    duration: number;
    startScale: number;
    blur: number;
    delay: number;
};
/** A sharp, semantic server image that gently resolves once its source loads. */
export declare function ImageLoadBlurIn({ src, alt, srcSet, sizes, aspectRatio, objectFit, objectPosition, className, style, ...props }: ImageLoadBlurInProps): import("react").JSX.Element;
