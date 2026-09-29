import {describe, expect, it} from 'vitest';
import {resolveCarouselSettings} from '../src/pieces/swipe-carousel/dials';
import {durations, flick, springs} from '../src/tokens';

describe('carousel dial settings', () => {
  it('preserves defaults and ignores unsupported or malformed dials', () => {
    const baseline = resolveCarouselSettings({});
    expect(baseline).toMatchObject({spacing: .55, sideScale: .8, dimColor: 'transparent', dimmer: false, speed: 1, autoplay: false, loop: false, flickPower: flick.power, flickMaxItems: flick.maxItems, settle: springs.settle, fan: springs.float});
    expect(resolveCarouselSettings({dials: {direction: 'left', stagger: 'on', trigger: 'load', speed: 'wrong', size: null} as never})).toEqual(baseline);
  });
  it.each([['slow', durations.slow], ['normal', durations.base], ['fast', durations.fast]] as const)('maps %s speed to shared timing', (speed, duration) => {
    expect(resolveCarouselSettings({dials: {speed}}).speed).toBe(durations.base / duration);
  });
  it.each([['small', .4], ['medium', .55], ['large', .75]] as const)('maps %s size to spacing', (size, spacing) => {
    expect(resolveCarouselSettings({dials: {size}}).spacing).toBe(spacing);
    expect(resolveCarouselSettings({dials: {size}, gap: .9}).spacing).toBe(.9);
  });
  it('maps bounce to distinct token transitions while preserving the original fan if omitted', () => {
    expect(resolveCarouselSettings({dials: {bounce: 'none'}}).settle).toMatchObject({type: 'tween', duration: durations.base});
    expect(resolveCarouselSettings({dials: {bounce: 'soft'}})).toMatchObject({settle: springs.settle, fan: springs.float});
    expect(resolveCarouselSettings({dials: {bounce: 'springy'}})).toMatchObject({settle: springs.snap, fan: springs.snap});
  });
  it('maps all side treatments and preserves explicit scale/color', () => {
    expect(resolveCarouselSettings({dials: {sideCards: 'normal'}})).toMatchObject({sideScale: .8, dimmer: false});
    expect(resolveCarouselSettings({dials: {sideCards: 'smaller'}})).toMatchObject({sideScale: .65, dimmer: false});
    expect(resolveCarouselSettings({dials: {sideCards: 'dimmer'}})).toMatchObject({sideScale: .8, dimmer: true});
    expect(resolveCarouselSettings({dials: {sideCards: 'smaller'}, sideScale: .95}).sideScale).toBe(.95);
    expect(resolveCarouselSettings({dials: {sideCards: 'dimmer'}, dimColor: '#fff'})).toMatchObject({dimmer: true, dimColor: '#fff'});
  });
  it.each([['soft', .5], ['normal', 1], ['strong', 1.5]] as const)('maps %s flick to bounded house physics', (feel, multiplier) => {
    expect(resolveCarouselSettings({dials: {flick: feel}})).toMatchObject({flickPower: flick.power * multiplier, flickMaxItems: flick.maxItems * multiplier});
  });
  it.each(['off', 'on'] as const)('maps autoplay and loop %s independently', value => {
    expect(resolveCarouselSettings({dials: {autoplay: value, loop: value}})).toMatchObject({autoplay: value === 'on', loop: value === 'on'});
  });
});
