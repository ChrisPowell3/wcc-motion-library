import { type MotionDials } from '../../dials';
/** Resolved once per render; explicit established props override preset values. */
export declare function resolveCarouselSettings({ dials, gap, sideScale, dimColor }: {
    dials?: MotionDials;
    gap?: number;
    sideScale?: number;
    dimColor?: string;
}): {
    spacing: number;
    sideScale: number;
    dimColor: string;
    dimmer: boolean;
    speed: number;
    settle: {
        readonly type: "spring";
        readonly stiffness: 260;
        readonly damping: 32;
        readonly mass: 1;
    } | {
        readonly type: "spring";
        readonly stiffness: 520;
        readonly damping: 38;
        readonly mass: 0.8;
    } | {
        type: "tween";
        duration: 0.32;
        ease: readonly [0.22, 1, 0.36, 1];
    };
    fan: {
        readonly type: "spring";
        readonly stiffness: 260;
        readonly damping: 32;
        readonly mass: 1;
    } | {
        readonly type: "spring";
        readonly stiffness: 120;
        readonly damping: 24;
        readonly mass: 1.1;
    } | {
        readonly type: "spring";
        readonly stiffness: 520;
        readonly damping: 38;
        readonly mass: 0.8;
    } | {
        type: "tween";
        duration: 0.32;
        ease: readonly [0.22, 1, 0.36, 1];
    };
    autoplay: boolean;
    loop: boolean;
    flickPower: number;
    flickMaxItems: number;
};
