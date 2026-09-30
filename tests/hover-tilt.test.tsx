import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {HoverTilt} from '../src/pieces/hover-tilt/HoverTilt';
import {resolveHoverTilt, tiltTarget} from '../src/pieces/hover-tilt/settings';
const frames = vi.hoisted(() => ({callback: undefined as undefined | ((time: number, delta: number) => boolean)}));
vi.mock('../src/internal/frame', () => ({subscribeFrame: (callback: typeof frames.callback) => {frames.callback = callback; return () => {frames.callback = undefined;};}}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
let fine: EventTarget & {matches: boolean}; let reduced: EventTarget & {matches: boolean};
const rect = {top: 0, bottom: 100, left: 0, right: 200, width: 200, height: 100, x: 0, y: 0, toJSON() {}};
function tick(count = 1) { act(() => {for (let i = 0; i < count; i++) if (frames.callback?.(i * 1000 / 60, 1000 / 60) === false) frames.callback = undefined;}); }
function pointer(element: Element, type: string, pointerType: string, x = 200, y = 0) {fireEvent(element, Object.assign(new Event(type, {bubbles: true}), {pointerType, clientX: x, clientY: y}));}
beforeEach(() => {frames.callback = undefined; fine = Object.assign(new EventTarget(), {matches: true}); reduced = Object.assign(new EventTarget(), {matches: false}); vi.stubGlobal('matchMedia', (q: string) => q.includes('reduced') ? reduced : fine); vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect);});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
describe('HoverTilt', () => {
  it('normalizes pointer geometry against a stationary box and bounds extreme positions', () => {
    expect(tiltTarget(rect, 100, 50, 6)).toEqual({x: 0, y: 0});
    expect(tiltTarget(rect, 200, 0, 6)).toEqual({x: 6, y: 6});
    expect(tiltTarget(rect, -1000, 1000, 6)).toEqual({x: -6, y: -6});
    expect(tiltTarget({...rect, width: 0, height: 0}, 100, 100, 6)).toEqual({x: 0, y: 0});
  });
  it('uses house defaults, maps size and speed, and lets explicit zero win', () => {
    expect(resolveHoverTilt({})).toMatchObject({maxTilt: 6, lift: 8, perspective: 1000, smoothing: .1});
    for (const [size, maxTilt, lift] of [['small', 3, 4], ['medium', 6, 8], ['large', 10, 12]] as const) expect(resolveHoverTilt({dials: {size}})).toMatchObject({maxTilt, lift});
    expect(resolveHoverTilt({dials: {speed: 'slow'}}).smoothing).toBeLessThan(.1);
    expect(resolveHoverTilt({dials: {speed: 'normal'}}).smoothing).toBe(.1);
    expect(resolveHoverTilt({dials: {speed: 'fast'}}).smoothing).toBeGreaterThan(.1);
    expect(resolveHoverTilt({maxTilt: 0, lift: 0, smoothing: 1, dials: {size: 'large', speed: 'slow'}})).toMatchObject({maxTilt: 0, lift: 0, smoothing: 1});
  });
  it('renders at rest on the server and keeps descendant controls semantic', () => {
    const html = renderToString(<HoverTilt><button>Open</button></HoverTilt>); expect(html).toContain('transform:none'); expect(html).not.toContain('tabindex'); expect(html).not.toContain('aria-hidden');
  });
  it('smooths mouse tilt, returns to exact rest, and leaves native clicks and wheel alone', () => {
    const click = vi.fn(); render(<HoverTilt><button onClick={click}>Open</button></HoverTilt>);
    const child = screen.getByRole('button'); const content = child.parentElement!; const anchor = content.parentElement!;
    pointer(anchor, 'pointermove', 'mouse'); tick();
    expect(content.style.transform).toContain('rotateX(0.6deg)'); expect(content.style.transform).toContain('rotateY(0.6deg)');
    tick(160); expect(content.style.transform).toContain('rotateX(6deg)'); expect(content.style.transform).toContain('translateY(-8px)');
    pointer(anchor, 'pointerout', 'mouse'); tick(160); expect(content.style.transform).toBe('none');
    fireEvent.click(child); expect(click).toHaveBeenCalledOnce();
    const wheel = new Event('wheel', {bubbles: true, cancelable: true}); anchor.dispatchEvent(wheel); expect(wheel.defaultPrevented).toBe(false);
  });
  it('ignores touch and coarse pointers, including live capability changes', () => {
    render(<HoverTilt><button>Open</button></HoverTilt>); const anchor = screen.getByRole('button').parentElement!.parentElement!;
    pointer(anchor, 'pointermove', 'touch'); expect(frames.callback).toBeUndefined();
    act(() => {fine.matches = false; fine.dispatchEvent(new Event('change'));});
    pointer(anchor, 'pointermove', 'mouse'); expect(frames.callback).toBeUndefined();
  });
  it('cancels active motion on reduced preference and unmount', () => {
    const view = render(<HoverTilt><button>Open</button></HoverTilt>); const content = screen.getByRole('button').parentElement!;
    pointer(content.parentElement!, 'pointermove', 'mouse'); tick();
    act(() => {reduced.matches = true; reduced.dispatchEvent(new Event('change'));});
    expect(content.style.transform).toBe('none'); expect(frames.callback).toBeUndefined();
    view.unmount(); expect(frames.callback).toBeUndefined();
  });
});
