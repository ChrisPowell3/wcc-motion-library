type ViewportMetrics = {
    scrollY: number;
    scrollHeight: number;
    width: number;
};
type Subscription = {
    element: Element;
    update: (rect: DOMRectReadOnly, viewportHeight: number, deltaMs: number, metrics: ViewportMetrics) => boolean;
};
/** Shared passive viewport observation; no DOM reads happen in scroll handlers. */
export declare function observeViewport(element: Element, update: Subscription['update']): () => void;
export {};
