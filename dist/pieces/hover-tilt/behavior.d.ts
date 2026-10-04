export declare const clampNumber: (value: number | undefined, fallback: number, min: number, max: number) => number;
export declare const speedFactor: (speed: string | undefined) => number;
export declare const dialSmoothing: (base: number, speed: string | undefined) => number;
/** Stay still until a hover-capable fine pointer is known to exist. */
export declare function useFinePointer(): boolean;
