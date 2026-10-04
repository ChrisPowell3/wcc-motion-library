export declare const springs: {
    readonly settle: {
        readonly type: "spring";
        readonly stiffness: 260;
        readonly damping: 32;
        readonly mass: 1;
    };
    readonly float: {
        readonly type: "spring";
        readonly stiffness: 120;
        readonly damping: 24;
        readonly mass: 1.1;
    };
    readonly snap: {
        readonly type: "spring";
        readonly stiffness: 520;
        readonly damping: 38;
        readonly mass: 0.8;
    };
};
export declare const durations: {
    readonly fast: 0.18;
    readonly base: 0.32;
    readonly slow: 0.6;
    readonly entrance: 0.9;
};
export declare const ease: readonly [0.22, 1, 0.36, 1];
export declare const settleEase: (progress: number) => number;
export declare const springyEase: (progress: number) => number;
export declare const autoplayTiming: {
    readonly interval: number;
};
export declare const flick: {
    readonly power: 0.18;
    readonly maxItems: 4;
};
export type SpringName = keyof typeof springs;
export declare const blurStrength: {
    readonly none: 0;
    readonly soft: 6;
    readonly strong: 10;
};
export declare const batchMotion: {
    readonly frameMs: number;
    readonly idleEase: readonly [0.42, 0, 0.58, 1];
    readonly blurRise: {
        readonly duration: 1.1;
        readonly stagger: 0.07;
        readonly heroStagger: 0.11;
        readonly heroDelay: 0.35;
        readonly distance: 16;
    };
    readonly focus: {
        readonly blur: 8;
        readonly distance: 14;
        readonly opacity: 0.2;
        readonly enter: 0.4;
        readonly exit: 0.22;
        readonly exitFocus: 0.35;
        readonly smoothing: 0.14;
    };
    readonly count: {
        readonly duration: 2.2;
        readonly delay: 0.5;
        readonly stagger: 0.18;
        readonly group: 4;
        readonly ease: (progress: number) => number;
    };
    readonly star: {
        readonly duration: 0.6;
        readonly delay: 0.25;
        readonly stagger: 0.11;
        readonly peak: 0.6;
        readonly ease: readonly [0.34, 1.56, 0.64, 1];
    };
    readonly float: {
        readonly duration: 3.6;
        readonly durationStep: 0.7;
        readonly phase: 0.9;
        readonly distance: 10;
        readonly rotation: 0.6;
    };
    readonly hover: {
        readonly duration: 0.5;
        readonly zoomDuration: 1;
        readonly smoothing: 0.1;
        readonly perspective: 1000;
        readonly tilt: 6;
        readonly lift: 8;
        readonly buttonLift: 3;
        readonly zoom: 1.03;
    };
    readonly accordion: {
        readonly duration: 0.5;
        readonly iconDuration: 0.45;
        readonly opacityDuration: 0.4;
        readonly opacityEase: "ease";
        readonly ease: readonly [0.16, 1, 0.3, 1];
    };
    readonly marquee: {
        readonly duration: 30;
        readonly gap: 28;
        readonly ease: "linear";
    };
    readonly pills: {
        readonly duration: 0.9;
        readonly delay: 0.2;
        readonly stagger: 0.14;
        readonly ease: readonly [0.34, 1.4, 0.64, 1];
        readonly floatDuration: 2.8;
        readonly floatStep: 0.4;
        readonly floatDelay: 1.2;
        readonly floatDelayStep: 0.3;
        readonly distance: 16;
        readonly scale: 0.9;
        readonly blur: 6;
        readonly bob: 4;
    };
};
export declare const designMotion: {
    readonly imageLoad: {
        readonly duration: 1.8;
        readonly scale: 1.05;
        readonly blur: 6;
    };
    readonly parallax: {
        readonly distance: 70;
        readonly factor: 0.08;
        readonly smoothing: 0.14;
    };
    readonly proximity: {
        readonly radius: 260;
        readonly idle: 4.5;
        readonly scrollLimit: 60;
    };
    readonly viewer: {
        readonly overlayDuration: 0.5;
        readonly duration: 0.6;
        readonly distance: 24;
        readonly scale: 0.97;
    };
    readonly story: {
        readonly duration: 0.9;
        readonly distance: 40;
        readonly blur: 10;
        readonly trackPerSlide: 0.6;
    };
    readonly stack: {
        readonly scale: 0.95;
        readonly smoothing: 0.14;
        readonly top: 96;
        readonly gap: 24;
    };
    readonly cursorFollow: {
        readonly maxX: 26;
        readonly maxY: 22;
        readonly scale: 1.03;
        readonly falloff: 420;
        readonly strength: 0.06;
        readonly smoothing: 0.08;
    };
};
export declare const entranceScrub: {
    readonly range: 0.4;
    readonly smoothing: 0.14;
};
