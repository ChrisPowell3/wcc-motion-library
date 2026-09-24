import {describe, expect, it} from 'vitest';
import {landingIndex, resist} from '../src/pieces/swipe-carousel/physics';

describe('swipe physics', () => {
  it('snaps a slow drag to the nearest card', () => {
    expect(landingIndex(-1.6, 0, 200, 8)).toBe(2);
  });
  it('projects release speed farther, caps momentum at four cards, and clamps bounds', () => {
    expect(landingIndex(-1, -2000, 200, 10)).toBe(3);
    expect(landingIndex(-1, -20000, 200, 10)).toBe(5);
    expect(landingIndex(-1, 20000, 200, 10)).toBe(0);
    expect(landingIndex(-8, -20000, 200, 10)).toBe(9);
  });
  it('keeps in-range dragging exact and softens both edges symmetrically', () => {
    expect(resist(-1.25, 6)).toBe(-1.25);
    expect(resist(1, 6)).toBeGreaterThan(0);
    expect(resist(1, 6)).toBeLessThan(1);
    expect(resist(-6, 6) + 5).toBeCloseTo(-resist(1, 6));
  });
});
