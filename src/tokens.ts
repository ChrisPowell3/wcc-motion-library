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

// How far one flick can travel, as a multiple of its speed.
export const flick = {power: 0.18, maxItems: 4} as const;

export type SpringName = keyof typeof springs;
