import {act, cleanup, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ScrollFocus} from '../src/pieces/scroll-focus/ScrollFocus';
import {focusTargets, resolveScrollFocus} from '../src/pieces/scroll-focus/settings';
const viewport = vi.hoisted(() => ({callback: undefined as undefined | ((rect: DOMRectReadOnly, height: number, delta: number) => boolean), stopped: false}));
vi.mock('../src/internal/viewport', () => ({observeViewport: (_element: Element, callback: typeof viewport.callback) => { viewport.callback = callback; viewport.stopped = false; return () => {viewport.callback = undefined; viewport.stopped = true;}; }}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
let media: EventTarget & {matches: boolean};
const rect = (top: number, height = 100) => ({top, bottom: top + height, left: 0, right: 400, width: 400, height, x: 0, y: top, toJSON() {}});
function measure(top: number, frames = 1, height = 100) {act(() => {for (let i = 0; i < frames; i++) viewport.callback?.(rect(top, height), 1000, 1000 / 60);});}
beforeEach(() => {media = Object.assign(new EventTarget(), {matches: false}); vi.stubGlobal('matchMedia', () => media); viewport.callback = undefined; viewport.stopped = false;});
afterEach(() => {cleanup(); vi.unstubAllGlobals();});
describe('ScrollFocus', () => {
  it('maps entry over the first 40% and exit over the top 22% without negative geometry', () => {
    expect(focusTargets(rect(1000), 1000, .4, .22, .35)).toEqual({entry: 0, focus: 0});
    expect(focusTargets(rect(800), 1000, .4, .22, .35)).toEqual({entry: .5, focus: .5});
    expect(focusTargets(rect(600), 1000, .4, .22, .35)).toEqual({entry: 1, focus: 1});
    expect(focusTargets(rect(10), 1000, .4, .22, .35).focus).toBeCloseTo(.675);
    expect(focusTargets(rect(-100), 1000, .4, .22, .35)).toEqual({entry: 1, focus: .35});
    expect(focusTargets(rect(0, 0), 0, .4, .22, .35)).toEqual({entry: 1, focus: 1});
  });
  it('keeps the reference defaults and resolves every supported dial', () => {
    expect(resolveScrollFocus({})).toMatchObject({blur: 8, distance: 14, startOpacity: .2, smoothing: .14, enter: .4, exit: .22, exitFocus: .35});
    for (const [blur, expected] of [['none', 0], ['soft', 6], ['strong', 10]] as const) expect(resolveScrollFocus({dials: {blur}}).blur).toBe(expected);
    for (const [size, distance] of [['small', 7], ['medium', 14], ['large', 28]] as const) expect(resolveScrollFocus({dials: {size}}).distance).toBe(distance);
    expect(resolveScrollFocus({dials: {speed: 'slow'}}).smoothing).toBeLessThan(.14);
    expect(resolveScrollFocus({dials: {speed: 'normal'}}).smoothing).toBe(.14);
    expect(resolveScrollFocus({dials: {speed: 'fast'}}).smoothing).toBeGreaterThan(.14);
    expect(resolveScrollFocus({blur: 0, distance: 0, startOpacity: 0, smoothing: 1, dials: {blur: 'strong', size: 'large', speed: 'slow'}})).toMatchObject({blur: 0, distance: 0, startOpacity: 0, smoothing: 1});
    expect(resolveScrollFocus({blur: Infinity, distance: -1})).toMatchObject({blur: 8, distance: 0});
  });
  it('renders semantic text fully readable on the server', () => {
    const html = renderToString(<ScrollFocus as="h2">Keep moving.</ScrollFocus>);
    expect(html).toContain('<h2'); expect(html).toContain('Keep moving.');
    expect(html).toContain('filter:none'); expect(html).toContain('opacity:1'); expect(html).toContain('transform:none');
    expect(html).not.toContain('tabindex'); expect(html).not.toContain('aria-hidden');
  });
  it('tracks entry, clears filter exactly at full focus, then softly exits', () => {
    render(<ScrollFocus as="h2">Keep moving.</ScrollFocus>);
    const text = screen.getByText('Keep moving.');
    measure(1000);
    expect(text.style.filter).toBe('blur(8px)'); expect(text.style.opacity).toBe('0.2'); expect(text.style.transform).toBe('translateY(14px)');
    measure(600); expect(parseFloat(text.style.opacity)).toBeCloseTo(.312);
    measure(600, 160); expect(text.style.filter).toBe('none'); expect(text.style.transform).toBe('none'); expect(text.style.opacity).toBe('1');
    measure(-100, 160); expect(parseFloat(text.style.opacity)).toBeCloseTo(.48); expect(text.style.filter).toBe('blur(5.2px)'); expect(text.style.transform).toBe('none');
  });
  it('preserves native wheel/keyboard events and accepts empty text', () => {
    const view = render(<ScrollFocus>{''}</ScrollFocus>);
    const wheel = new Event('wheel', {bubbles: true, cancelable: true}); view.container.firstChild!.dispatchEvent(wheel); expect(wheel.defaultPrevented).toBe(false);
    expect(view.container.textContent).toBe('');
  });
  it('ignores unsupported settings, cancels on live reduced motion, and cleans up', () => {
    const view = render(<ScrollFocus dials={{plays: 'always', blur: 'strong'}}>Readable</ScrollFocus>);
    measure(1000); expect(screen.getByText('Readable').style.filter).toBe('blur(10px)');
    act(() => {media.matches = true; media.dispatchEvent(new Event('change'));});
    expect(viewport.stopped).toBe(true); expect(screen.getByText('Readable').style.filter).toBe('none'); expect(screen.getByText('Readable').style.opacity).toBe('1');
    view.unmount(); expect(viewport.callback).toBeUndefined();
  });
  it('does not subscribe or blur for an initial reduced-motion preference', () => {
    media.matches = true; render(<ScrollFocus>Readable</ScrollFocus>);
    expect(viewport.callback).toBeUndefined(); expect(screen.getByText('Readable').style.transform).toBe('none');
  });
});
