import {describe, expect, it} from 'vitest';
import {resolveRevealDials} from '../src/pieces/scroll-reveal-rise/dials';
import {ease, settleEase, springyEase} from '../src/tokens';

describe('reveal dial resolution', () => {
  it('preserves the existing distinct block and image presets', () => {
    expect(resolveRevealDials({})).toMatchObject({as: 'block', distance: 24, duration: 'base', stagger: 90, startOpacity: 0.5, once: true, margin: '0px 0px -10% 0px', axis: 'y', offsetSign: 1, delay: 0, bounceEase: settleEase});
    expect(resolveRevealDials({as: 'image'})).toMatchObject({distance: 64, duration: 'slow', startOpacity: 0, bounceEase: ease});
    expect(resolveRevealDials({as: 'button'})).toMatchObject({distance: 24, duration: 'base', startOpacity: 0.5, bounceEase: settleEase});
  });
  it.each([['slow', 'slow'], ['normal', 'base'], ['fast', 'fast']])('resolves speed %s', (speed, duration) => {
    expect(resolveRevealDials({dials: {speed}}).duration).toBe(duration);
  });
  it.each([['small', 12, 32], ['medium', 24, 64], ['large', 48, 120]] as const)('resolves size %s for each preset', (size, block, image) => {
    expect(resolveRevealDials({dials: {size}}).distance).toBe(block);
    expect(resolveRevealDials({as: 'image', dials: {size}}).distance).toBe(image);
  });
  it.each([['none', ease], ['soft', settleEase], ['springy', springyEase]] as const)('resolves bounce %s', (bounce, expected) => {
    expect(resolveRevealDials({dials: {bounce}}).bounceEase).toBe(expected);
  });
  it.each([['once', true], ['always', false]] as const)('resolves plays %s', (plays, once) => {
    expect(resolveRevealDials({dials: {plays}}).once).toBe(once);
  });
  it.each([['none', 0], ['short', 0.18], ['long', 0.6]] as const)('resolves delay %s', (delay, seconds) => {
    expect(resolveRevealDials({dials: {delay}}).delay).toBe(seconds);
  });
  it.each([['together', 0], ['cascade', 90]] as const)('resolves cascade %s', (cascade, stagger) => {
    expect(resolveRevealDials({dials: {cascade}}).stagger).toBe(stagger);
  });
  it.each([['up', 'y', 1], ['down', 'y', -1], ['left', 'x', -1], ['right', 'x', 1]] as const)('resolves direction %s', (direction, axis, offsetSign) => {
    expect(resolveRevealDials({dials: {direction}})).toMatchObject({axis, offsetSign});
  });
  it.each([['none', 1], ['soft', 0.5], ['full', 0]] as const)('resolves fade %s', (fade, opacity) => {
    expect(resolveRevealDials({dials: {fade}}).startOpacity).toBe(opacity);
  });
  it.each([['early', 0.1], ['middle', 0.25], ['late', 0.4]] as const)('resolves start %s', (start, inset) => {
    expect(resolveRevealDials({dials: {start}}).startInset).toBe(inset);
    expect(resolveRevealDials({dials: {start}, margin: '0px'}).startInset).toBeUndefined();
  });
  it('gives explicit props priority, including false and zero, with existing clamps', () => {
    expect(resolveRevealDials({distance: 0, duration: 'fast', stagger: 0, startOpacity: 0, once: false, margin: '0px', dials: {size: 'large', speed: 'slow', cascade: 'cascade', fade: 'none', plays: 'once', start: 'late'}})).toMatchObject({distance: 8, duration: 'fast', stagger: 0, startOpacity: 0, once: false, margin: '0px'});
    expect(resolveRevealDials({startOpacity: 1, dials: {fade: 'none'}}).startOpacity).toBe(0.6);
    expect(resolveRevealDials({distance: Infinity, startOpacity: NaN, stagger: -10})).toMatchObject({distance: 24, startOpacity: 0.5, stagger: 0});
  });
  it('ignores unsupported and malformed dial inputs', () => {
    expect(resolveRevealDials({dials: {speed: 'warp', fade: 'invisible', autoplay: 'on'}})).toEqual(resolveRevealDials({}));
  });
});
