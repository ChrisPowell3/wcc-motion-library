import {StrictMode} from 'react';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import * as library from '../src/index';
import type {SwipeCarouselProps} from '../src/pieces/swipe-carousel/SwipeCarousel';

const preferences = vi.hoisted(() => ({reduced: true}));
vi.mock('motion/react', async importOriginal => ({
  ...await importOriginal<typeof import('motion/react')>(),
  useReducedMotion: () => preferences.reduced,
}));

const items = Array.from({length: 6}, (_, i) => ({
  id: `card-${i}`, image: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>`,
  alt: `Placeholder ${i + 1}`, title: `Title ${i + 1}`, text: `Text ${i + 1}`,
  cta: {label: `Explore ${i + 1}`, href: `#card-${i}`},
}));
const Carousel = (props: Partial<SwipeCarouselProps>) => {
  return <library.SwipeCarousel items={items} {...props}/>;
};
let intersect: (visible: boolean) => void;
beforeEach(() => {
  preferences.reduced = true;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) { intersect = visible => this.callback([{isIntersecting: visible, target: this.target} as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    target!: Element;
    observe(target: Element) { this.target = target; }
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({width: 360, height: 480, x: 0, y: 0, top: 0, left: 0, right: 360, bottom: 480, toJSON() {}});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const region = () => screen.getByRole('region', {name: 'Image carousel'});
const active = (n: number) => expect(screen.getByRole('button', {name: `Go to card ${n}`} ).getAttribute('aria-current')).toBe('true');

describe('SwipeCarousel', () => {
  it('renders every labeled card, starts in the middle, and exposes only its content', () => {
    render(<Carousel/>);
    expect(screen.getAllByRole('group', {name: /of 6/})).toHaveLength(6);
    expect(screen.getAllByRole('img')).toHaveLength(6);
    active(4);
    expect(screen.getAllByRole('link').map(a => a.textContent)).toEqual(['Explore 4']);
  });
  it('uses arrow keys and clamps at both ends', () => {
    render(<Carousel startIndex={0}/>);
    fireEvent.keyDown(region(), {key: 'ArrowLeft'}); active(1);
    fireEvent.keyDown(region(), {key: 'ArrowRight'}); active(2);
    fireEvent.keyDown(region(), {key: 'End'}); active(6);
    fireEvent.keyDown(region(), {key: 'ArrowRight'}); active(6);
    fireEvent.keyDown(region(), {key: 'Home'}); active(1);
  });
  it('dots select cards and onChange fires once per changed index', () => {
    const onChange = vi.fn(); render(<Carousel onChange={onChange}/>);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 2'})); active(2);
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 2'}));
    expect(onChange.mock.calls).toEqual([[1]]);
  });
  it('reduced motion skips the fan and immediately exposes the selected content', async () => {
    render(<Carousel/>);
    expect(screen.getByRole('link', {name: 'Explore 4'})).toBeTruthy();
    fireEvent.keyDown(region(), {key: 'ArrowRight'});
    expect(screen.getByRole('link', {name: 'Explore 5'})).toBeTruthy();
    await waitFor(() => expect(parseFloat(screen.getByRole('group', {name: '1 of 6'}).style.transform.slice(11))).toBeCloseTo(-792));
  });
  it('fans out only after entering view and does not replay on re-entry', async () => {
    preferences.reduced = false;
    render(<Carousel/>);
    expect(screen.queryByRole('link')).toBeNull();
    act(() => intersect(true));
    await waitFor(() => expect(screen.getByRole('link', {name: 'Explore 4'})).toBeTruthy(), {timeout: 4000});
    act(() => intersect(false));
    act(() => intersect(true));
    expect(screen.getByRole('link', {name: 'Explore 4'})).toBeTruthy();
  });
  it.each([1, 2])('%i cards support navigation without invalid selection', count => {
    render(<Carousel items={items.slice(0, count)}/>);
    fireEvent.keyDown(region(), {key: 'ArrowLeft'}); active(1);
    fireEvent.keyDown(region(), {key: 'ArrowRight'}); active(count);
    expect(screen.getAllByRole('group')).toHaveLength(count);
  });
  it('supports empty data and populating an empty list', () => {
    const {rerender} = render(<Carousel items={[]}/>);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    rerender(<Carousel startIndex={99}/>);
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });
  it.each([[-20, 1], [99, 6], [Number.NaN, 4]])('clamps initial index %s to card %i', (startIndex, expected) => {
    render(<Carousel startIndex={startIndex}/>); active(expected);
  });
  it('keeps distant image sources deferred while cards are stacked', () => {
    preferences.reduced = false;
    render(<Carousel/>);
    expect(screen.getAllByRole('img').map(img => img.hasAttribute('src'))).toEqual([false, false, true, true, true, false]);
  });
  it('eagerly loads only the center and immediate neighbors', () => {
    render(<Carousel/>);
    expect(screen.getAllByRole('img').map(img => img.getAttribute('loading'))).toEqual(['lazy', 'lazy', 'eager', 'eager', 'eager', 'lazy']);
  });
  it('does not prevent vertical wheel scrolling but handles horizontal wheel movement', async () => {
    render(<Carousel startIndex={0}/>);
    const viewport = screen.getByLabelText('Drag or swipe cards');
    const vertical = new WheelEvent('wheel', {deltaY: 100, bubbles: true, cancelable: true});
    fireEvent(viewport, vertical); expect(vertical.defaultPrevented).toBe(false); active(1);
    const horizontal = new WheelEvent('wheel', {deltaX: 210, bubbles: true, cancelable: true});
    fireEvent(viewport, horizontal); expect(horizontal.defaultPrevented).toBe(true);
    await waitFor(() => active(2));
  });
  it('mouse drag moves to a neighboring card and cancel safely snaps back', () => {
    render(<Carousel startIndex={2}/>);
    const viewport = screen.getByLabelText('Drag or swipe cards');
    fireEvent.pointerDown(viewport, {clientX: 300, clientY: 10, button: 0});
    fireEvent.pointerMove(viewport, {clientX: 90, clientY: 10});
    fireEvent.pointerCancel(viewport); active(3);
    fireEvent.pointerDown(viewport, {clientX: 300, clientY: 10, button: 0});
    fireEvent.pointerMove(viewport, {clientX: 90, clientY: 10});
    fireEvent.pointerUp(viewport, {clientX: 90, clientY: 10});
    expect(screen.getByRole('button', {name: 'Go to card 3'}).getAttribute('aria-current')).not.toBe('true');
  });
  it('keeps the nearest card on top during a drag in either direction before release', async () => {
    const onChange = vi.fn();
    render(<Carousel startIndex={2} onChange={onChange}/>);
    const viewport = screen.getByLabelText('Drag or swipe cards');
    const cards = screen.getAllByRole('group');
    const expectOnTop = (index: number) => {
      const top = Number(cards[index].style.zIndex);
      cards.forEach((card, i) => { if (i !== index) expect(top).toBeGreaterThan(Number(card.style.zIndex)); });
    };
    fireEvent.pointerDown(viewport, {clientX: 300, clientY: 10});
    fireEvent.pointerMove(viewport, {clientX: 170, clientY: 10});
    await waitFor(() => expectOnTop(3));
    fireEvent.pointerMove(viewport, {clientX: 430, clientY: 10});
    await waitFor(() => expectOnTop(1));
    active(3);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerCancel(viewport);
  });
  it('updates stacking during horizontal wheel input before selection settles', async () => {
    render(<Carousel startIndex={2}/>);
    fireEvent.wheel(screen.getByLabelText('Drag or swipe cards'), {deltaX: 130});
    await waitFor(() => {
      const cards = screen.getAllByRole('group');
      expect(Number(cards[3].style.zIndex)).toBeGreaterThan(Number(cards[2].style.zIndex));
      active(3);
    }, {timeout: 120, interval: 10});
  });
  it('keeps stacking with the current position instead of jumping to a spring destination', async () => {
    preferences.reduced = false;
    render(<Carousel startIndex={2} fanOnView={false}/>);
    const cards = screen.getAllByRole('group');
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 6'}));
    expect(Number(cards[2].style.zIndex)).toBeGreaterThan(Number(cards[5].style.zIndex));
    await waitFor(() => expect(screen.getByRole('link', {name: 'Explore 6'})).toBeTruthy(), {timeout: 4000});
    expect(Number(cards[5].style.zIndex)).toBeGreaterThan(Number(cards[2].style.zIndex));
  });
  it.each(['mouse', 'touch'])('hides the ring after a %s drag and restores it on Tab focus', pointerType => {
    render(<Carousel/>);
    const viewport = screen.getByLabelText('Drag or swipe cards');
    fireEvent.pointerDown(viewport, {clientX: 300, clientY: 10, pointerType});
    fireEvent.pointerMove(viewport, {clientX: 170, clientY: 10, pointerType});
    fireEvent.pointerUp(viewport, {clientX: 170, clientY: 10, pointerType});
    expect(document.activeElement).toBe(region());
    expect(region().style.outline).toBe('none');
    act(() => region().blur());
    // jsdom does not perform Tab's default focus traversal; send the key then focus.
    fireEvent.keyDown(document.body, {key: 'Tab'});
    act(() => region().focus());
    expect(region().style.outline).toBe('3px solid currentColor');
    fireEvent.keyDown(region(), {key: 'ArrowLeft'});
    expect(region().style.outline).toBe('3px solid currentColor');
  });
  it('uses keyboard-only focus rings for dots and the active CTA', () => {
    render(<Carousel/>);
    const dot = screen.getByRole('button', {name: 'Go to card 4'});
    fireEvent.pointerDown(dot);
    act(() => dot.focus());
    expect(dot.style.outline).toBe('none');
    fireEvent.keyDown(dot, {key: 'Tab'});
    const link = screen.getByRole('link', {name: 'Explore 4'});
    act(() => link.focus());
    expect(link.style.outline).toBe('3px solid currentColor');
    fireEvent.pointerDown(link);
    expect(link.style.outline).toBe('none');
  });
  it('allows each carousel region to have its own accessible label', () => {
    const {rerender} = render(<Carousel label="What's Inside"/>);
    expect(screen.getByRole('region', {name: "What's Inside"})).toBeTruthy();
    rerender(<Carousel/>);
    expect(region()).toBeTruthy();
  });
  it('completes the entrance under React Strict Mode', async () => {
    preferences.reduced = false;
    render(<StrictMode><Carousel/></StrictMode>);
    act(() => intersect(true));
    await waitFor(() => expect(screen.getByRole('link', {name: 'Explore 4'})).toBeTruthy(), {timeout: 4000});
  });
  it('settles the final selection when a spring is interrupted by another selection', async () => {
    preferences.reduced = false;
    render(<Carousel fanOnView={false}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 1'}));
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 6'}));
    expect(screen.queryByRole('link')).toBeNull();
    await waitFor(() => expect(screen.getByRole('link', {name: 'Explore 6'})).toBeTruthy(), {timeout: 4000});
    active(6);
  });
  it('clamps selection when data shrinks and reports the new index once', () => {
    const onChange = vi.fn();
    const {rerender} = render(<Carousel startIndex={5} onChange={onChange}/>);
    rerender(<Carousel items={items.slice(0, 2)} onChange={onChange}/>);
    active(2);
    expect(onChange.mock.calls).toEqual([[1]]);
  });
  it('cancels pending wheel momentum when the item list shrinks', async () => {
    const onChange = vi.fn();
    const {rerender} = render(<Carousel startIndex={0} onChange={onChange}/>);
    fireEvent.wheel(screen.getByLabelText('Drag or swipe cards'), {deltaX: 800});
    rerender(<Carousel items={items.slice(0, 2)} startIndex={0} onChange={onChange}/>);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
    expect(onChange.mock.calls.every(([value]) => value < 2)).toBe(true);
    const selectedDot = screen.getAllByRole('button').find(button => button.getAttribute('aria-current') === 'true');
    expect(selectedDot).toBeTruthy();
    const selectedCard = screen.getByRole('group', {name: `${selectedDot?.getAttribute('aria-label')?.slice(-1)} of 2`});
    await waitFor(() => expect(selectedCard.style.transform === 'none' || selectedCard.style.transform.includes('translateX(0px)')).toBe(true));
  });
  it('vertical pointer gestures never move the cards', () => {
    render(<Carousel/>);
    const viewport = screen.getByLabelText('Drag or swipe cards');
    fireEvent.pointerDown(viewport, {clientX: 300, clientY: 20, button: 0});
    fireEvent.pointerMove(viewport, {clientX: 280, clientY: 250});
    fireEvent.pointerUp(viewport, {clientX: 280, clientY: 250});
    active(4);
    expect(screen.getByRole('link', {name: 'Explore 4'})).toBeTruthy();
  });
  it('can hide dots and render on the server', () => {
    render(<Carousel showDots={false}/>);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(renderToString(<Carousel/>)).toContain('aria-roledescription="carousel"');
  });
});
