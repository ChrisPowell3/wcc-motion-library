import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ParallaxDrift} from '../src/pieces/parallax-drift/ParallaxDrift';
import {resolveParallaxDrift} from '../src/pieces/parallax-drift/settings';
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
let reduced: EventTarget & {matches: boolean}; let frames: Map<number, FrameRequestCallback>; let id = 0; let time = 0;
function tick(count = 1) {act(() => {for (let i = 0; i < count; i++) {time += 1000 / 60; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time));}});}
beforeEach(() => {frames = new Map(); time = 0; reduced = Object.assign(new EventTarget(), {matches: false}); vi.stubGlobal('matchMedia', () => reduced); vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {frames.set(++id, fn); return id;}); vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key)); vi.stubGlobal('scrollY', 100);});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
describe('ParallaxDrift', () => {
  it('resolves every supported dial and explicit zero wins', () => {
    expect(resolveParallaxDrift({})).toEqual({distance: 70, factor: .08, smoothing: .14, direction: 'down'});
    for (const [size, distance] of [['small',35],['medium',70],['large',105]] as const) expect(resolveParallaxDrift({dials:{size}}).distance).toBe(distance);
    expect(resolveParallaxDrift({dials:{speed:'slow'}}).smoothing).toBeLessThan(.14);
    expect(resolveParallaxDrift({dials:{speed:'normal'}}).smoothing).toBe(.14);
    expect(resolveParallaxDrift({dials:{speed:'fast'}}).smoothing).toBeGreaterThan(.14);
    expect(resolveParallaxDrift({dials:{direction:'up'}}).direction).toBe('up');
    expect(resolveParallaxDrift({dials:{direction:'down'}}).direction).toBe('down');
    expect(resolveParallaxDrift({dials:{direction:'left',blur:'strong'}})).toEqual(resolveParallaxDrift({}));
    expect(resolveParallaxDrift({distance:0,factor:0,smoothing:1,direction:'down',dials:{size:'large',speed:'slow',direction:'up'}})).toEqual({distance:0,factor:0,smoothing:1,direction:'down'});
    expect(resolveParallaxDrift({distance:Infinity,factor:-5,smoothing:20})).toMatchObject({distance:70,factor:0,smoothing:1});
  });
  it('renders fully readable server content and native keyboard controls', () => {
    expect(renderToString(<ParallaxDrift><button>Read</button></ParallaxDrift>)).toContain('transform:none');
    render(<ParallaxDrift><button>Read</button></ParallaxDrift>); screen.getByRole('button').focus(); expect(document.activeElement).toBe(screen.getByRole('button'));
  });
  it('follows page scroll, caps distance, reverses and preserves equivalent dials', () => {
    const view = render(<ParallaxDrift dials={{speed:'normal'}}><span>Media</span></ParallaxDrift>); const content = screen.getByText('Media').parentElement!;
    tick(); expect(content.style.transform).toBe('translate3d(0,1.12px,0)');
    view.rerender(<ParallaxDrift dials={{speed:'normal'}}><span>Media</span></ParallaxDrift>); tick(); expect(content.style.transform).toBe('translate3d(0,2.083px,0)');
    vi.stubGlobal('scrollY', 10000); fireEvent.scroll(window); tick(160); expect(content.style.transform).toBe('translate3d(0,70px,0)');
    view.rerender(<ParallaxDrift direction="up" smoothing={1}><span>Media</span></ParallaxDrift>); tick(); expect(content.style.transform).toBe('translate3d(0,-70px,0)');
    vi.stubGlobal('scrollY', -100); fireEvent.scroll(window); tick(); expect(content.style.transform).toBe('none');
    const wheel = new Event('wheel',{bubbles:true,cancelable:true}); content.dispatchEvent(wheel); expect(wheel.defaultPrevented).toBe(false);
  });
  it('returns to rest on live reduced motion and releases pending frames', () => {
    const view=render(<ParallaxDrift>Media</ParallaxDrift>); tick(); const content=screen.getByText('Media');
    act(()=>{reduced.matches=true;reduced.dispatchEvent(new Event('change'));}); expect(content.style.transform).toBe('none'); expect(frames.size).toBe(0);
    act(()=>{reduced.matches=false;reduced.dispatchEvent(new Event('change'));}); tick(); expect(content.style.transform).not.toBe('none'); view.unmount(); expect(frames.size).toBe(0);
  });
});


it.each(['scrub', 'always', 'once'])('keeps parallax continuously linked with plays=%s', plays => {
  render(<ParallaxDrift dials={{plays}} smoothing={1}><span>Linked</span></ParallaxDrift>);
  const layer = screen.getByText('Linked').parentElement!;
  for (const value of [500, 0, 500]) {vi.stubGlobal('scrollY', value); fireEvent.scroll(window); tick(); expect(layer.style.transform).toBe(value ? 'translate3d(0,40px,0)' : 'none');}
  act(() => {reduced.matches = true; reduced.dispatchEvent(new Event('change'));});
  expect(layer.style.transform).toBe('none'); expect(frames.size).toBe(0);
});
