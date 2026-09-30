import {spring} from 'motion';

// The house feel. Every piece uses these instead of inventing its own
// timing, so all CP sites move the same premium way. Change a value here
// and every piece on every site picks it up.
export const springs = {
  // Settles fast, tiny bounce. Default for snapping into place.
  settle: {type: 'spring', stiffness: 260, damping: 32, mass: 1},
  // Softer and slower. For big objects and hero moments.
  float: {type: 'spring', stiffness: 120, damping: 24, mass: 1.1},
  // Quick and crisp. For hover and press feedback.
  snap: {type: 'spring', stiffness: 520, damping: 38, mass: 0.8},
} as const;

export const durations = {fast: 0.18, base: 0.32, slow: 0.6, entrance: 0.9} as const;

// Smooth ease-out used for anything that is not a spring.
export const ease = [0.22, 1, 0.36, 1] as const;

// A duration-controlled version of settle for short, strictly upward reveals.
// Sample the existing spring over slow, then normalize its endpoint so fast,
// base and slow all finish exactly at rest without inventing new physics.
const settleCurve = spring({...springs.settle, keyframes: [0, 1]});
const settleWindow = durations.slow * 1000;
const settleEnd = settleCurve.next(settleWindow).value;
export const settleEase = (progress: number) =>
  progress >= 1 ? 1 : Math.min(1, settleCurve.next(Math.max(0, progress) * settleWindow).value / settleEnd);

// The springy dial uses the house snap spring's slight overshoot, normalized to
// the chosen duration just like settleEase. Existing default motion is unchanged.
const springyCurve = spring({...springs.snap, keyframes: [0, 1]});
const springyEnd = springyCurve.next(settleWindow).value;
export const springyEase = (progress: number) =>
  progress >= 1 ? 1 : springyCurve.next(Math.max(0, progress) * settleWindow).value / springyEnd;

// Give readers five entrance beats per card; no independent timer tuning system.
export const autoplayTiming = {interval: durations.entrance * 5} as const;

// How far one flick can travel, as a multiple of its speed.
export const flick = {power: 0.18, maxItems: 4} as const;

export type SpringName = keyof typeof springs;

// Reference-derived house motion. These named tokens retain the owned design's
// exact cadence while keeping every piece generic and independently adjustable.
export const blurStrength = {none: 0, soft: 6, strong: 10} as const;
export const batchMotion = {
  frameMs: 1000 / 60,
  idleEase: [0.42, 0, 0.58, 1] as const,
  blurRise: {duration: 1.1, stagger: .07, heroStagger: .11, heroDelay: .35, distance: 16},
  focus: {blur: 8, distance: 14, opacity: .2, enter: .4, exit: .22, exitFocus: .35, smoothing: .14},
  count: {duration: 2.2, delay: .5, stagger: .18, group: 4, ease: (progress: number) => progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)},
  star: {duration: .6, delay: .25, stagger: .11, peak: .6, ease: [.34, 1.56, .64, 1] as const},
  float: {duration: 3.6, durationStep: .7, phase: .9, distance: 10, rotation: .6},
  hover: {duration: .5, zoomDuration: 1, smoothing: .1, perspective: 1000, tilt: 6, lift: 8, buttonLift: 3, zoom: 1.03},
  accordion: {duration: .5, iconDuration: .45, opacityDuration: .4, opacityEase: 'ease' as const, ease: [.16, 1, .3, 1] as const},
  marquee: {duration: 30, gap: 28, ease: 'linear' as const},
  pills: {duration: .9, delay: .2, stagger: .14, ease: [.34, 1.4, .64, 1] as const, floatDuration: 2.8, floatStep: .4, floatDelay: 1.2, floatDelayStep: .3, distance: 16, scale: .9, blur: 6, bob: 4},
} as const;

// Owned 2026 design study: load, pointer, dialog and scroll choreography.
export const designMotion = {
  imageLoad: {duration: 1.8, scale: 1.05, blur: 6},
  parallax: {distance: 70, factor: .08, smoothing: .14},
  proximity: {radius: 260, idle: 4.5, scrollLimit: 60},
  viewer: {overlayDuration: .5, duration: .6, distance: 24, scale: .97},
  story: {duration: .9, distance: 40, blur: 10, trackPerSlide: .6},
  stack: {scale: .95, smoothing: .14, top: 96, gap: 24},
  cursorFollow: {maxX: 26, maxY: 22, scale: 1.03, falloff: 420, strength: .06, smoothing: .08},
} as const;
