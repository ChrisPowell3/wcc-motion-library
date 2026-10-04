/** A reversible idle clock whose pause actually unsubscribes from frame work. */
export declare function createIdleTrack(duration: number, delay: number, update: (progress: number) => void): {
    play(): void;
    pause: () => void;
    stop: () => void;
};
