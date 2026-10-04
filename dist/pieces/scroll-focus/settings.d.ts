import type { ScrollFocusProps } from './ScrollFocus';
export declare function resolveScrollFocus(props: Omit<ScrollFocusProps, 'children'>): {
    blur: number;
    distance: number;
    startOpacity: number;
    smoothing: number;
    enter: number;
    exit: number;
    exitFocus: number;
};
/** Independent entry progress and focus: leaving the top softens text without moving it back down. */
export declare function focusTargets(rect: Pick<DOMRectReadOnly, 'top' | 'bottom'>, height: number, enter: number, exit: number, exitFocus: number): {
    entry: number;
    focus: number;
};
