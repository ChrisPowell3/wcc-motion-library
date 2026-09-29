import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {SwipeCarousel} from '../src/pieces/swipe-carousel/SwipeCarousel';

const preferences = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => preferences.reduced}));
const items = Array.from({length: 4}, (_, i) => ({id: String(i), image: 'data:image/svg+xml,<svg/>', alt: `Image ${i}`, title: `Card ${i}`, text: 'Description', cta: {label: `Visit ${i}`, href: `#${i}`}}));
let intersect: (visible: boolean) => void;
const region = () => screen.getByRole('region');
const viewport = () => screen.getByLabelText('Drag or swipe cards');
const active = (index: number) => expect(screen.getByRole('button', {name: `Go to card ${index + 1}`}).getAttribute('aria-current')).toBe('true');
const tick = () => act(() => vi.advanceTimersByTime(4500));
beforeEach(() => {
  preferences.reduced = false;
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) { intersect = visible => this.callback([{isIntersecting: visible, target: this.target} as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    target!: Element;
    observe(target: Element) { this.target = target; }
    disconnect() {} unobserve() {}
  });
  vi.stubGlobal('ResizeObserver', class {observe() {} disconnect() {}});
  vi.stubGlobal('PointerEvent', class extends MouseEvent {readonly pointerId = 1; readonly pointerType = 'touch';});
});
afterEach(() => {cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();});

describe('carousel dials behavior', () => {
  it('wraps arrow keys at both edges without duplicating cards', () => {
    preferences.reduced = true;
    render(<SwipeCarousel items={items} startIndex={0} dials={{loop: 'on'}}/>);
    fireEvent.keyDown(region(), {key: 'ArrowLeft'}); active(3);
    fireEvent.keyDown(region(), {key: 'ArrowRight'}); active(0);
    expect(screen.getAllByRole('group')).toHaveLength(4);
  });
  it.each(['transparent', '#fff'])('conceals the circular seam without duplicate slides (%s)', dimColor => {
    preferences.reduced = true;
    render(<SwipeCarousel items={items} startIndex={0} dimColor={dimColor} dials={{loop: 'on'}}/>);
    const cards = screen.getAllByRole('group');
    expect(cards).toHaveLength(4);
    expect(Number(cards[0].style.opacity)).toBe(1);
    expect(Number(cards[2].style.opacity)).toBe(0);
  });
  it('wraps horizontal wheel movement past either edge', () => {
    preferences.reduced = true;
    render(<SwipeCarousel items={items} startIndex={0} dials={{loop: 'on'}}/>);
    fireEvent.wheel(viewport(), {deltaX: -210});
    act(() => vi.advanceTimersByTime(180)); active(3);
    fireEvent.wheel(viewport(), {deltaX: 210});
    act(() => vi.advanceTimersByTime(180)); active(0);
  });
  it('wraps a drag released beyond the first card', () => {
    preferences.reduced = true;
    render(<SwipeCarousel items={items} startIndex={0} dials={{loop: 'on', flick: 'soft'}}/>);
    fireEvent.pointerDown(viewport(), {clientX: 100, clientY: 0});
    fireEvent.pointerMove(viewport(), {clientX: 310, clientY: 0});
    act(() => vi.advanceTimersByTime(200));
    fireEvent.pointerUp(viewport(), {clientX: 310, clientY: 0}); active(3);
  });
  it('keeps active content visible in server HTML before the entrance is prepared', () => {
    const html = renderToString(<SwipeCarousel items={items} startIndex={0}/>);
    const host = document.createElement('div'); host.innerHTML = html;
    const link = host.querySelector('a')!;
    expect(link.closest('[aria-hidden="true"], [inert]')).toBeNull();
    expect(link.parentElement?.style.opacity).toBe('1');
  });
  it('hydrates visible active content without mismatches when the client prefers reduced motion', async () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(<SwipeCarousel items={items} startIndex={0} dials={{autoplay: 'on'}}/>);
    document.body.append(host);
    preferences.reduced = true;
    const errors = vi.spyOn(console, 'error');
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {root = hydrateRoot(host, <SwipeCarousel items={items} startIndex={0} dials={{autoplay: 'on'}}/>);});
    try {
      expect(errors).not.toHaveBeenCalled();
      expect(host.querySelector('a')?.closest('[inert]')).toBeNull();
    } finally {act(() => root.unmount()); host.remove();}
  });
  it('applies smaller and dimmer treatments while explicit scale and color win', () => {
    preferences.reduced = true;
    const {rerender} = render(<SwipeCarousel items={items} startIndex={0} dials={{sideCards: 'smaller'}} sideScale={.9}/>);
    expect(screen.getAllByRole('group')[1].style.transform).toContain('scale(0.9)');
    rerender(<SwipeCarousel items={items} startIndex={0} dials={{sideCards: 'dimmer'}} dimColor="#ffffff"/>);
    const overlay = screen.getAllByRole('group')[1].querySelector<HTMLElement>('[data-swipe-carousel-dim]')!;
    expect(overlay.style.background).toBe('rgb(255, 255, 255)');
    expect(overlay.style.opacity).toBe('0.35');
  });
  it('reacts to a live media preference change and removes its autoplay interval', () => {
    let reduced = false;
    let notify!: () => void;
    const remove = vi.fn();
    vi.stubGlobal('matchMedia', () => ({get matches() {return reduced;}, addEventListener: (_: string, listener: () => void) => {notify = listener;}, removeEventListener: remove}));
    const {unmount} = render(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    act(() => intersect(true));
    const clear = vi.spyOn(globalThis, 'clearInterval');
    act(() => {reduced = true; notify();});
    expect(clear).toHaveBeenCalled(); tick(); active(0);
    fireEvent.keyDown(region(), {key: 'ArrowRight'}); active(1);
    act(() => {reduced = false; notify();}); tick(); active(2);
    clear.mockClear(); unmount(); expect(clear).toHaveBeenCalled(); expect(remove).toHaveBeenCalled();
  });
  it('autoplays at the house cadence and wraps only with loop enabled', () => {
    render(<SwipeCarousel items={items} startIndex={3} fanOnView={false} dials={{autoplay: 'on', loop: 'on'}}/>);
    act(() => intersect(true)); tick(); active(0);
    tick(); active(1);
    expect(screen.getByRole('button', {name: 'Pause autoplay'})).toBeTruthy();
  });
  it('pauses on hover and resumes after leaving', () => {
    render(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    act(() => intersect(true)); fireEvent.mouseEnter(region()); tick(); active(0);
    fireEvent.mouseLeave(region()); tick(); active(1);
  });
  it('pauses while focus is anywhere in the region and when manually paused', () => {
    render(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    act(() => intersect(true)); act(() => screen.getByRole('link', {name: 'Visit 0'}).focus()); tick(); active(0);
    act(() => (document.activeElement as HTMLElement).blur());
    fireEvent.click(screen.getByRole('button', {name: 'Pause autoplay'})); tick(); active(0);
    fireEvent.click(screen.getByRole('button', {name: 'Resume autoplay'})); tick(); active(1);
  });
  it.each(['pointerUp', 'pointerCancel'] as const)('pauses from touch down until %s even without movement', event => {
    render(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    act(() => intersect(true)); fireEvent.pointerDown(viewport(), {clientX: 100}); tick(); active(0);
    fireEvent[event](viewport()); tick(); active(1);
  });
  it('releases an autoplay hold when a control press ends outside the carousel', () => {
    render(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    act(() => intersect(true));
    fireEvent.pointerDown(screen.getByRole('button', {name: 'Go to card 1'})); tick(); active(0);
    fireEvent.pointerUp(document.body); tick(); active(1);
  });
  it('pauses while hidden or outside the viewport, and clears timers on unmount', () => {
    const {unmount} = render(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    act(() => intersect(true));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange')); tick(); active(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    act(() => intersect(false)); tick(); active(0);
    act(() => intersect(true)); tick(); active(1);
    unmount(); const timers = vi.getTimerCount(); tick(); expect(vi.getTimerCount()).toBeLessThanOrEqual(timers);
  });
  it('turning reduced motion on stops autoplay and leaves manual controls functional', () => {
    const {rerender} = render(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    act(() => intersect(true)); preferences.reduced = true;
    rerender(<SwipeCarousel items={items} startIndex={0} fanOnView={false} dials={{autoplay: 'on'}}/>);
    tick(); active(0);
    fireEvent.keyDown(region(), {key: 'ArrowRight'}); active(1);
  });
  it.each([0, 1])('loop and autoplay safely handle %i cards', count => {
    render(<SwipeCarousel items={items.slice(0, count)} dials={{loop: 'on', autoplay: 'on'}}/>);
    act(() => intersect(true)); tick(); fireEvent.keyDown(region(), {key: 'ArrowRight'});
    expect(screen.queryAllByRole('group').length).toBe(count);
  });
});
