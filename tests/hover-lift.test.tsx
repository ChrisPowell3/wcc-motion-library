import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {HoverLift} from '../src/pieces/hover-lift/HoverLift';
import {resolveHoverLift} from '../src/pieces/hover-lift/settings';
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
let fine: EventTarget & {matches: boolean}; let reduced: EventTarget & {matches: boolean};
function pointer(element: Element, type: string, pointerType: string) {fireEvent(element, Object.assign(new Event(type, {bubbles: true}), {pointerType}));}
beforeEach(() => {fine = Object.assign(new EventTarget(), {matches: true}); reduced = Object.assign(new EventTarget(), {matches: false}); vi.stubGlobal('matchMedia', (q: string) => q.includes('reduced') ? reduced : fine);});
afterEach(() => {cleanup(); vi.unstubAllGlobals();});
describe('HoverLift', () => {
  it('maps all size/speed values and preserves explicit zero duration and lift', () => {
    expect(resolveHoverLift({})).toMatchObject({lift: 3, duration: .5});
    for (const [size, lift] of [['small', 1.5], ['medium', 3], ['large', 6]] as const) expect(resolveHoverLift({dials: {size}}).lift).toBe(lift);
    for (const [speed, duration] of [['slow', .9375], ['normal', .5], ['fast', .28125]] as const) expect(resolveHoverLift({dials: {speed}}).duration).toBeCloseTo(duration);
    expect(resolveHoverLift({lift: 0, duration: 0, dials: {size: 'large', speed: 'slow'}})).toMatchObject({lift: 0, duration: 0});
    expect(resolveHoverLift({lift: -3, duration: Infinity})).toMatchObject({lift: 0, duration: .5});
  });
  it('renders server controls at rest with no extra tab stop', () => {
    const html = renderToString(<HoverLift><a href="/next">Next</a></HoverLift>); expect(html).toContain('transform:none'); expect(html).toContain('href="/next"'); expect(html).not.toContain('tabindex');
  });
  it('lifts on fine pointer hover and keyboard focus while preserving activation', () => {
    const click = vi.fn(); render(<HoverLift><button onClick={click}>Continue</button></HoverLift>);
    const button = screen.getByRole('button'); const frame = button.parentElement!;
    pointer(frame, 'pointerover', 'mouse'); expect(frame.style.transform).toBe('translateY(-3px)'); expect(frame.style.transition).toBe('transform 0.5s cubic-bezier(0.22,1,0.36,1)');
    pointer(frame, 'pointerout', 'mouse'); expect(frame.style.transform).toBe('none');
    act(() => button.focus()); expect(frame.style.transform).toBe('translateY(-3px)'); expect(document.activeElement).toBe(button);
    fireEvent.click(button); expect(click).toHaveBeenCalledOnce();
    act(() => button.blur()); expect(frame.style.transform).toBe('none');
  });
  it('keeps the hover hit area stationary while moving its content', () => {
    const view = render(<HoverLift><button>Continue</button></HoverLift>);
    const anchor = view.container.firstElementChild as HTMLElement;
    pointer(anchor, 'pointerover', 'mouse');
    expect(anchor.style.transform).toBe('');
    expect(screen.getByRole('button').parentElement!.style.transform).toBe('translateY(-3px)');
  });
  it('does not hover on touch or coarse pointers and resets live preferences', () => {
    render(<HoverLift><button>Continue</button></HoverLift>); const frame = screen.getByRole('button').parentElement!;
    pointer(frame, 'pointerover', 'touch'); expect(frame.style.transform).toBe('none');
    pointer(frame, 'pointerover', 'mouse'); expect(frame.style.transform).toBe('translateY(-3px)');
    act(() => {fine.matches = false; fine.dispatchEvent(new Event('change'));}); expect(frame.style.transform).toBe('none'); expect(frame.style.transition).toBe('none');
    act(() => {fine.matches = true; fine.dispatchEvent(new Event('change'));});
    pointer(frame, 'pointerover', 'mouse');
    act(() => {reduced.matches = true; reduced.dispatchEvent(new Event('change'));}); expect(frame.style.transform).toBe('none'); expect(frame.style.transition).toBe('none');
  });
  it('keeps reduced-motion keyboard focus still and supports empty children', () => {
    reduced.matches = true; const view = render(<HoverLift><button>Continue</button></HoverLift>); const button = screen.getByRole('button');
    act(() => button.focus()); expect(button.parentElement!.style.transform).toBe('none');
    view.rerender(<HoverLift>{null}</HoverLift>); expect(view.container.textContent).toBe('');
  });
});
