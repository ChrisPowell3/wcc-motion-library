import type { MarqueeProps } from './Marquee';
/** Resolve preset values first, then valid explicit props. No browser state. */
export declare function resolveMarqueeSettings({ dials, duration, gap, direction }: Omit<MarqueeProps, 'children'>): {
    seconds: number;
    spacing: number;
    travel: "left" | "right";
};
