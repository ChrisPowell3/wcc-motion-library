type Callback = (time: number, deltaMs: number) => boolean;
/** Return true to keep following; false sleeps until the caller subscribes again. */
export declare function subscribeFrame(callback: Callback): () => void;
export {};
