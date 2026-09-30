/** The command center's shared, word-only motion vocabulary. */
export const SHARED_DIALS = Object.freeze({
  speed: Object.freeze(['slow', 'normal', 'fast'] as const),
  size: Object.freeze(['small', 'medium', 'large'] as const),
  bounce: Object.freeze(['none', 'soft', 'springy'] as const),
  plays: Object.freeze(['once', 'always'] as const),
  delay: Object.freeze(['none', 'short', 'long'] as const),
  cascade: Object.freeze(['together', 'cascade'] as const),
  direction: Object.freeze(['up', 'down', 'left', 'right'] as const),
  fade: Object.freeze(['none', 'soft', 'full'] as const),
  start: Object.freeze(['early', 'middle', 'late', 'load'] as const),
  blur: Object.freeze(['none', 'soft', 'strong'] as const),
});

/** Additional dial ids used by specialized pieces; shared by specialized pieces. */
export const PIECE_DIALS = Object.freeze({
  autoplay: Object.freeze(['off', 'on'] as const),
  loop: Object.freeze(['off', 'on'] as const),
  sideCards: Object.freeze(['normal', 'smaller', 'dimmer'] as const),
  flick: Object.freeze(['soft', 'normal', 'strong'] as const),
});

export type DialId = keyof typeof SHARED_DIALS | keyof typeof PIECE_DIALS;
export type MotionDials = Partial<Record<DialId, string>>;

const vocabulary: Readonly<Record<DialId, readonly string[]>> = {...SHARED_DIALS, ...PIECE_DIALS};
const support: Readonly<Record<string, readonly DialId[]>> = {
  'scroll-reveal-rise': Object.keys(SHARED_DIALS) as (keyof typeof SHARED_DIALS)[],
  'swipe-carousel': ['speed', 'size', 'bounce', 'autoplay', 'loop', 'sideCards', 'flick'],
  'scroll-focus': ['speed', 'size', 'blur'],
  'count-up': ['speed', 'delay', 'plays'],
  'star-pop': ['speed', 'bounce', 'delay'],
  'marquee': ['speed', 'direction', 'size'],
  'float': ['speed', 'size'],
  'hover-tilt': ['size', 'speed'],
  'hover-lift': ['size', 'speed'],
  'image-hover-zoom': ['size', 'speed'],
  'accordion': ['speed', 'cascade'],
  'cta-pills': ['speed', 'size', 'blur', 'delay'],
  'image-load-blur-in': ['speed', 'size', 'blur', 'delay'],
  'parallax-drift': ['speed', 'size', 'direction'],
  'cursor-proximity-fade': ['size', 'delay'],
  'fullscreen-viewer': ['speed', 'size', 'loop', 'fade'],
  'pinned-scroll-story': ['speed', 'size', 'blur', 'fade'],
  'scroll-stack-cards': ['speed', 'size'],
  'cursor-follow-image': ['speed', 'size'],
};

/**
 * Keep only this piece's known dial ids with exact known string values.
 * Unknown pieces and malformed inputs produce {}. Never mutates input, adds
 * defaults or throws, even for unreadable properties in external settings.
 */
export function cleanDials(pieceId: string, input: unknown): MotionDials {
  const result: MotionDials = {};
  try {
    if (!Object.hasOwn(support, pieceId) || input === null || typeof input !== 'object' || Array.isArray(input)) return result;
    for (const id of support[pieceId]) {
      try {
        if (!Object.hasOwn(input, id)) continue;
        const value = (input as Record<string, unknown>)[id];
        if (typeof value === 'string' && vocabulary[id].includes(value)
          && !(pieceId === 'marquee' && id === 'direction' && value !== 'left' && value !== 'right')
          && !(pieceId === 'parallax-drift' && id === 'direction' && value !== 'up' && value !== 'down')) result[id] = value;
      } catch { /* One unreadable property does not discard other valid dials. */ }
    }
  } catch { /* Proxies and malformed external settings fail closed. */ }
  return result;
}
