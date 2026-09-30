import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {Marquee} from '../src/pieces/marquee/Marquee';

// Install before Motion loads too: paused Motion drivers must not bypass this
// clock by retaining a captured copy of the browser's real requestAnimationFrame.
const frames = vi.hoisted(() => {
  const pending = new Map<number, FrameRequestCallback>();
  let serial = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {pending.set(++serial, callback); return serial;});
  vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id));
  return {pending};
});
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});

it('sleeps its frame driver while offscreen, hovered, hidden, reduced or unmounted, retaining its paused phase', () => {
  let visibility!: (visible: boolean) => void;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({width: 200, height: 40, top: 0, left: 0, right: 200, bottom: 40, x: 0, y: 0, toJSON() {}});
  vi.stubGlobal('ResizeObserver', class {observe() {} disconnect() {}});
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {visibility = visible => this.callback([{target, isIntersecting: visible} as IntersectionObserverEntry], this as unknown as IntersectionObserver);}
    unobserve() {} disconnect() {}
  });
  const media = Object.assign(new EventTarget(), {matches: false});
  vi.stubGlobal('matchMedia', () => media);
  let time = 0;
  const frame = () => act(() => {
    time += 20;
    const pending = [...frames.pending.entries()];
    for (const [id, callback] of pending) {frames.pending.delete(id); callback(time);}
  });
  const view = render(<Marquee duration={5}><span>Content</span></Marquee>);
  const track = view.container.querySelector<HTMLElement>('[data-marquee-track]')!;
  const x = () => Number(track.style.transform.match(/translateX\(([-\d.]+)px\)/)?.[1] ?? 0);
  // Flush one-time React/Motion setup work; no continuous idle driver may remain.
  frame(); frame(); frame();
  expect(frames.pending.size).toBe(0);
  act(() => visibility(true));
  frame(); frame();
  expect(x()).toBeLessThan(0);
  fireEvent.mouseEnter(screen.getByRole('region'));
  const hovered = x();
  frame(); frame();
  expect(frames.pending.size).toBe(0);
  expect(x()).toBe(hovered);
  fireEvent.mouseLeave(screen.getByRole('region'));
  frame();
  expect(x()).toBeLessThan(hovered);
  act(() => visibility(false));
  frame(); frame();
  expect(frames.pending.size).toBe(0);
  act(() => visibility(true)); frame();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  frame(); frame();
  expect(frames.pending.size).toBe(0);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  fireEvent(document, new Event('visibilitychange')); frame();
  expect(x()).toBeLessThan(hovered);
  act(() => {media.matches = true; media.dispatchEvent(new Event('change'));});
  expect(track.style.transform).toBe('none');
  frame(); frame();
  expect(track.style.transform).toBe('none');
  expect(frames.pending.size).toBe(0);
  act(() => {media.matches = false; media.dispatchEvent(new Event('change'));}); frame();
  view.unmount(); frame(); frame();
  expect(frames.pending.size).toBe(0);
});
