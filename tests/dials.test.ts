import {describe, expect, it} from 'vitest';
import * as library from '../src';

const shared = {
  speed: ['slow', 'normal', 'fast'], size: ['small', 'medium', 'large'], bounce: ['none', 'soft', 'springy'],
  plays: ['once', 'always'], delay: ['none', 'short', 'long'], cascade: ['together', 'cascade'],
  direction: ['up', 'down', 'left', 'right'], fade: ['none', 'soft', 'full'], start: ['early', 'middle', 'late'],
};
const piece = {autoplay: ['off', 'on'], loop: ['off', 'on'], sideCards: ['normal', 'smaller', 'dimmer'], flick: ['soft', 'normal', 'strong']};

describe('shared motion dials', () => {
  it('exports the exact frozen vocabulary including frozen value arrays', () => {
    expect(library.SHARED_DIALS).toEqual(shared);
    expect(library.PIECE_DIALS).toEqual(piece);
    for (const vocabulary of [library.SHARED_DIALS, library.PIECE_DIALS]) {
      expect(Object.isFrozen(vocabulary)).toBe(true);
      Object.values(vocabulary).forEach(values => expect(Object.isFrozen(values)).toBe(true));
    }
  });
  it('keeps every supported value and drops every unsupported dial for each piece', () => {
    for (const [id, values] of Object.entries({...shared, ...piece})) {
      for (const value of values) {
        expect(library.cleanDials('scroll-reveal-rise', {[id]: value})).toEqual(id in shared ? {[id]: value} : {});
        expect(library.cleanDials('swipe-carousel', {[id]: value})).toEqual(['speed', 'size', 'bounce', ...Object.keys(piece)].includes(id) ? {[id]: value} : {});
      }
    }
  });
  it('drops unknown keys, invalid values, raw numbers and inherited properties without mutating input', () => {
    const input = Object.assign(Object.create({size: 'large'}), {speed: 'fast', bounce: 'elastic', delay: 300, random: 'fast', fade: 'FULL'});
    expect(library.cleanDials('scroll-reveal-rise', input)).toEqual({speed: 'fast'});
    expect(input.delay).toBe(300);
    expect(input.bounce).toBe('elastic');
    expect(library.cleanDials('toString', input)).toEqual({});
    expect(library.cleanDials('future-piece', input)).toEqual({});
  });
  it.each([undefined, null, true, 2, 'fast', ['fast'], () => 'fast'])('silently rejects invalid input %s', input => {
    expect(library.cleanDials('swipe-carousel', input)).toEqual({});
  });
  it('never throws for getters or proxies and still keeps independently valid values', () => {
    const input = {get speed() { throw new Error('bad getter'); }, size: 'large'};
    expect(library.cleanDials('scroll-reveal-rise', input)).toEqual({size: 'large'});
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    expect(library.cleanDials('scroll-reveal-rise', revoked.proxy)).toEqual({});
    expect(library.cleanDials('swipe-carousel', new Proxy({}, {getOwnPropertyDescriptor() {throw new Error('trap');}}))).toEqual({});
  });
});
