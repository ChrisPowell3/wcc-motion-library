type Options = {
    threshold?: number;
    rootMargin?: string;
};
/** One native observer per viewport configuration, shared by all pieces. */
export declare function observeVisibility(element: Element, callback: (visible: boolean) => void, options?: Options): () => void;
export {};
