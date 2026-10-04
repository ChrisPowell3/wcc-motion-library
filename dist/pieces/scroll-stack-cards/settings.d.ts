import type { ScrollStackCardsProps } from './ScrollStackCards';
export declare function resolveScrollStackCards(props: Omit<ScrollStackCardsProps, 'children'>): {
    plays: "once" | "always" | "scrub";
    scale: number;
    smoothing: number;
    top: number;
    gap: number;
};
export declare function stackProgress(top: number, nextTop: number, height: number): number;
