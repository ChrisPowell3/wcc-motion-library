export declare const clamp: (value: number, min: number, max: number) => number;
export declare const safeNumber: (value: number, fallback: number, min: number, max: number) => number;
/** Position is measured in card-center steps; velocity is pixels per second. */
export declare function landingIndex(position: number, velocity: number, step: number, count: number, options?: {
    power?: number;
    maxItems?: number;
    loop?: boolean;
}): number;
/** Stable modulo for negative indices and empty lists. */
export declare const wrap: (index: number, count: number) => number;
/** Nearest visual copy, rendered by the original semantic card only. */
export declare const cardOffset: (offset: number, count: number, loop: boolean) => number;
/** One-to-one inside the bounds; an asymptotic half-step cushion beyond them. */
export declare function resist(position: number, count: number): number;
