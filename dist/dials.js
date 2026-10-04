/** The command center's shared, word-only motion vocabulary. */
export const SHARED_DIALS = Object.freeze({
    speed: Object.freeze(['slow', 'normal', 'fast']),
    size: Object.freeze(['small', 'medium', 'large']),
    bounce: Object.freeze(['none', 'soft', 'springy']),
    plays: Object.freeze(['once', 'always', 'scrub']),
    delay: Object.freeze(['none', 'short', 'long']),
    cascade: Object.freeze(['together', 'cascade']),
    direction: Object.freeze(['up', 'down', 'left', 'right']),
    fade: Object.freeze(['none', 'soft', 'full']),
    start: Object.freeze(['early', 'middle', 'late', 'load']),
    blur: Object.freeze(['none', 'soft', 'strong']),
    align: Object.freeze(['start', 'center']),
});
/** Additional dial ids used by specialized pieces; shared by specialized pieces. */
export const PIECE_DIALS = Object.freeze({
    autoplay: Object.freeze(['off', 'on']),
    loop: Object.freeze(['off', 'on']),
    sideCards: Object.freeze(['normal', 'smaller', 'dimmer']),
    flick: Object.freeze(['soft', 'normal', 'strong']),
});
const vocabulary = { ...SHARED_DIALS, ...PIECE_DIALS };
const support = {
    'scroll-reveal-rise': ['speed', 'size', 'bounce', 'plays', 'delay', 'cascade', 'direction', 'fade', 'start', 'blur'],
    'swipe-carousel': ['speed', 'size', 'bounce', 'autoplay', 'loop', 'sideCards', 'flick'],
    'scroll-focus': ['speed', 'size', 'blur'],
    'count-up': ['speed', 'delay', 'plays'],
    'star-pop': ['plays', 'speed', 'bounce', 'delay'],
    'marquee': ['speed', 'direction', 'size'],
    'float': ['speed', 'size'],
    'hover-tilt': ['size', 'speed'],
    'hover-lift': ['size', 'speed'],
    'image-hover-zoom': ['size', 'speed'],
    'accordion': ['speed', 'cascade'],
    'cta-pills': ['plays', 'speed', 'size', 'blur', 'delay'],
    'image-load-blur-in': ['plays', 'speed', 'size', 'blur', 'delay'],
    'parallax-drift': ['plays', 'speed', 'size', 'direction'],
    'cursor-proximity-fade': ['size', 'delay'],
    'fullscreen-viewer': ['speed', 'size', 'loop', 'fade'],
    'pinned-scroll-story': ['speed', 'size', 'blur', 'fade', 'align'],
    'scroll-stack-cards': ['plays', 'speed', 'size'],
    'cursor-follow-image': ['speed', 'size'],
};
/**
 * Keep only this piece's known dial ids with exact known string values.
 * Unknown pieces and malformed inputs produce {}. Never mutates input, adds
 * defaults or throws, even for unreadable properties in external settings.
 */
export function cleanDials(pieceId, input) {
    const result = {};
    try {
        if (!Object.hasOwn(support, pieceId) || input === null || typeof input !== 'object' || Array.isArray(input))
            return result;
        for (const id of support[pieceId]) {
            try {
                if (!Object.hasOwn(input, id))
                    continue;
                const value = input[id];
                if (typeof value === 'string' && vocabulary[id].includes(value)
                    && !(pieceId === 'marquee' && id === 'direction' && value !== 'left' && value !== 'right')
                    && !(pieceId === 'parallax-drift' && id === 'direction' && value !== 'up' && value !== 'down'))
                    result[id] = value;
            }
            catch { /* One unreadable property does not discard other valid dials. */ }
        }
    }
    catch { /* Proxies and malformed external settings fail closed. */ }
    return result;
}
