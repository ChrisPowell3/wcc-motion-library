import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {observeEntranceScrub, resolveEntrance} from '../src/internal/entrance';
let frames: Map<number, FrameRequestCallback>, id = 0, time = 0;
let top = 1100;
const stops: Array<() => void> = [];
function tick(count = 1) {for (let i = 0; i < count; i++) {time += 1000 / 60; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time));}}
function sample(settings = resolveEntrance({}, {})) {
  const element = document.createElement('div'); let value = 1;
  vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, top, 100, 100));
  stops.push(observeEntranceScrub(element, p => {value = p;}, settings));
  return () => value;
}
beforeEach(() => {
  frames = new Map(); time = 0; top = 1100;
  vi.stubGlobal('innerHeight', 1000); vi.stubGlobal('innerWidth', 1000); vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {frames.set(++id, fn); return id;});
  vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key));
});
afterEach(() => {stops.splice(0).forEach(stop => stop()); vi.restoreAllMocks(); vi.unstubAllGlobals();});
it('shares a passive scroll listener and one frame, smooths reversal, and sleeps at rest', () => {
  const add = vi.spyOn(window, 'addEventListener'); const remove = vi.spyOn(window, 'removeEventListener');
  const value = sample(); sample();
  expect(add.mock.calls.filter(([event]) => event === 'scroll')).toEqual([['scroll', expect.any(Function), {passive: true}]]);
  expect(frames.size).toBe(1); tick(); expect(value()).toBe(0); expect(frames.size).toBe(0);
  top = 500; window.dispatchEvent(new Event('scroll')); tick();
  expect(value()).toBeCloseTo(.14); expect(frames.size).toBe(1); tick(100);
  expect(value()).toBe(1); expect(frames.size).toBe(0);
  top = 1100; window.dispatchEvent(new Event('scroll')); tick(); expect(value()).toBeCloseTo(.86); tick(100);
  expect(value()).toBe(0); expect(frames.size).toBe(0);
  stops.splice(0).forEach(stop => stop()); expect(remove.mock.calls.filter(([event]) => event === 'scroll')).toHaveLength(1);
});
it('finishes bottom-of-document content and reverses over the reachable scroll range', () => {
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000);
  top = 850; vi.stubGlobal('scrollY', 1000);
  const value = sample(resolveEntrance({smoothing: 1}, {})); tick(); expect(value()).toBe(1);
  top = 1050; vi.stubGlobal('scrollY', 800); window.dispatchEvent(new Event('scroll')); tick(); expect(value()).toBeCloseTo(.5);
  top = 1250; vi.stubGlobal('scrollY', 600); window.dispatchEvent(new Event('scroll')); tick(); expect(value()).toBe(0);
});
it('leaves content fully visible on pages without scroll space', () => {
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1000);
  top = 850; const value = sample(); tick(); expect(value()).toBe(1);
});
it('sanitizes range and smoothing and honors explicit prop precedence', () => {
  expect(resolveEntrance({plays: 'always', once: true, smoothing: NaN, scrubRange: 99}, {plays: 'scrub'})).toEqual({plays: 'once', once: true, smoothing: .14, scrubRange: 1});
  expect(resolveEntrance({plays: 'once', once: false, smoothing: 0, scrubRange: 0}, {plays: 'scrub'})).toEqual({plays: 'always', once: false, smoothing: .01, scrubRange: .1});
  expect(resolveEntrance({plays: 'once'}, {plays: 'always'}).plays).toBe('once');
});
