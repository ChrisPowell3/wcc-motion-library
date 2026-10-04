/** The command center's shared, word-only motion vocabulary. */
export declare const SHARED_DIALS: Readonly<{
    speed: readonly ["slow", "normal", "fast"];
    size: readonly ["small", "medium", "large"];
    bounce: readonly ["none", "soft", "springy"];
    plays: readonly ["once", "always", "scrub"];
    delay: readonly ["none", "short", "long"];
    cascade: readonly ["together", "cascade"];
    direction: readonly ["up", "down", "left", "right"];
    fade: readonly ["none", "soft", "full"];
    start: readonly ["early", "middle", "late", "load"];
    blur: readonly ["none", "soft", "strong"];
    align: readonly ["start", "center"];
}>;
/** Additional dial ids used by specialized pieces; shared by specialized pieces. */
export declare const PIECE_DIALS: Readonly<{
    autoplay: readonly ["off", "on"];
    loop: readonly ["off", "on"];
    sideCards: readonly ["normal", "smaller", "dimmer"];
    flick: readonly ["soft", "normal", "strong"];
}>;
export type Plays = (typeof SHARED_DIALS.plays)[number];
export type DialId = keyof typeof SHARED_DIALS | keyof typeof PIECE_DIALS;
export type MotionDials = Partial<Record<DialId, string>>;
/**
 * Keep only this piece's known dial ids with exact known string values.
 * Unknown pieces and malformed inputs produce {}. Never mutates input, adds
 * defaults or throws, even for unreadable properties in external settings.
 */
export declare function cleanDials(pieceId: string, input: unknown): MotionDials;
