import {StrictMode} from 'react';
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
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


const customItems = Array.from({length: 6}, (_, index) => ({id: `custom-${index}`, heading: `Custom ${index + 1}`}));

describe('SwipeCarousel custom cards', () => {
  it('renders generic item content inside every motion frame without the built-in design', () => {
    render(<library.SwipeCarousel items={customItems} renderCard={item => <h3>{item.heading}</h3>}/>);
    screen.getAllByRole('group').forEach((card, index) => {
      expect(within(card).getByText(`Custom ${index + 1}`)).toBeTruthy();
    });
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.queryByText('undefined')).toBeNull();
  });
  it('reports per-card active, ready and loadImage through fan-out and settling', async () => {
    preferences.reduced = false;
    render(<library.SwipeCarousel items={customItems} renderCard={(item, state) =>
      <div data-testid={item.id} data-state={JSON.stringify(state)}>{item.heading}</div>}/>);
    const state = (index: number) => JSON.parse(screen.getByTestId(`custom-${index}`).getAttribute('data-state')!);
    expect(customItems.map((_, i) => state(i))).toEqual([
      {index: 0, count: 6, active: false, ready: false, loadImage: false},
      {index: 1, count: 6, active: false, ready: false, loadImage: false},
      {index: 2, count: 6, active: false, ready: false, loadImage: true},
      {index: 3, count: 6, active: true, ready: false, loadImage: true},
      {index: 4, count: 6, active: false, ready: false, loadImage: true},
      {index: 5, count: 6, active: false, ready: false, loadImage: false},
    ]);
    act(() => intersect(true));
    await waitFor(() => expect(state(3).ready).toBe(true), {timeout: 4000});
    expect(customItems.map((_, i) => state(i).loadImage)).toEqual([true, true, true, true, true, true]);
    expect(state(2).ready).toBe(false);
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 2'}));
    expect(state(1)).toEqual({index: 1, count: 6, active: true, ready: false, loadImage: true});
    expect(state(3).active).toBe(false);
    await waitFor(() => expect(state(1).ready).toBe(true), {timeout: 4000});
  });
  it('makes custom content immediately ready with reduced motion', () => {
    render(<library.SwipeCarousel items={customItems} renderCard={(item, state) =>
      <span data-testid={item.id}>{String(state.ready)} / {String(state.loadImage)}</span>}/>);
    expect(screen.getByTestId('custom-3').textContent).toBe('true / true');
    expect(screen.getByTestId('custom-0').textContent).toBe('false / true');
  });
  it.each(['a', 'button'] as const)('allows a custom %s click but suppresses its click handler and default action after dragging', tag => {
    const onClick = vi.fn();
    render(<library.SwipeCarousel items={customItems} renderCard={item => tag === 'a'
      ? <a href={`#${item.id}`} onClick={onClick}>{item.heading}</a>
      : <button onClick={onClick}>{item.heading}</button>}/>);
    const control = screen.getByText('Custom 4');
    expect(fireEvent.click(control, {detail: 1})).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
    if (tag === 'a') expect(control.getAttribute('href')).toBe('#custom-3');
    fireEvent.pointerDown(control, {clientX: 300, clientY: 10});
    fireEvent.pointerMove(control, {clientX: 170, clientY: 10});
    fireEvent.pointerUp(control, {clientX: 170, clientY: 10});
    expect(fireEvent.click(control, {detail: 1})).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('blocks native image/link dragging inside custom cards', () => {
    render(<library.SwipeCarousel items={customItems} renderCard={item => <a href={`#${item.id}`}>{item.heading}</a>}/>);
    expect(fireEvent.dragStart(screen.getByText('Custom 4'))).toBe(false);
  });
  it('keeps off-center custom controls inert and restores them when selected', () => {
    render(<library.SwipeCarousel items={customItems} renderCard={item => <a href={`#${item.id}`}>{item.heading}</a>}/>);
    expect(screen.getByText('Custom 1').closest('[inert]')).not.toBeNull();
    expect(screen.getByText('Custom 4').closest('[inert]')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 1'}));
    expect(screen.getByText('Custom 1').closest('[inert]')).toBeNull();
    expect(screen.getByText('Custom 4').closest('[inert]')).not.toBeNull();
  });
  it('moves keyboard focus out of a custom button before its card becomes inert', () => {
    render(<library.SwipeCarousel items={customItems} renderCard={item => <button>{item.heading}</button>}/>);
    const button = screen.getByText('Custom 4');
    act(() => button.focus());
    fireEvent.keyDown(button, {key: 'ArrowLeft'});
    active(3);
    expect(document.activeElement).toBe(region());
  });
  it('supports intrinsic height and frame decoration without changing the motion frame width', () => {
    render(<library.SwipeCarousel items={customItems} cardAspect="auto" cardWidth="280px"
      cardStyle={{borderRadius: 12, background: '#fff', boxShadow: 'none'}}
      renderCard={item => <p>{item.heading}</p>}/>);
    const card = screen.getAllByRole('group')[0];
    expect(card.style.aspectRatio).toBe('auto');
    expect(card.style.borderRadius).toBe('12px');
    expect(card.style.background).toBe('rgb(255, 255, 255)');
    expect(card.style.boxShadow).toBe('none');
    expect(card.style.width).toBe('280px');
  });
});

describe('SwipeCarousel dim overlays', () => {
  const overlays = () => screen.getAllByRole('group').map(card => card.querySelector<HTMLElement>('[data-swipe-carousel-dim]'));
  it('keeps every frame opaque and dims the contents by distance when dimColor is set', async () => {
    render(<library.SwipeCarousel items={customItems} dimColor="#f3f0e9" renderCard={item => <p>{item.heading}</p>}/>);
    expect(screen.getAllByRole('group').map(card => getComputedStyle(card).opacity)).toEqual(['1', '1', '1', '1', '1', '1']);
    expect(overlays().map(overlay => Number(overlay?.style.opacity))).toEqual([.7, .4, .1, 0, .1, .4]);
    overlays().forEach(overlay => {
      expect(overlay?.style.background).toBe('rgb(243, 240, 233)');
      expect(overlay?.style.pointerEvents).toBe('none');
      expect(overlay?.getAttribute('aria-hidden')).toBe('true');
    });
    fireEvent.click(screen.getByRole('button', {name: 'Go to card 2'}));
    await waitFor(() => expect(overlays().map(overlay => Number(overlay?.style.opacity))).toEqual([.1, 0, .1, .4, .7, .7]));
    expect(screen.getAllByRole('group').every(card => getComputedStyle(card).opacity === '1')).toBe(true);
  });
  it('interpolates the overlay during dragging while frames remain opaque', async () => {
    render(<Carousel gap={.5} dimColor="#f3f0e9"/>);
    const viewport = screen.getByLabelText('Drag or swipe cards');
    fireEvent.pointerDown(viewport, {clientX: 300, clientY: 10});
    fireEvent.pointerMove(viewport, {clientX: 210, clientY: 10});
    await waitFor(() => {
      const expected = [.7, .55, .25, .05, .05, .25];
      overlays().forEach((overlay, i) => expect(Number(overlay?.style.opacity)).toBeCloseTo(expected[i]));
    });
    expect(screen.getAllByRole('group').every(card => getComputedStyle(card).opacity === '1')).toBe(true);
    fireEvent.pointerCancel(viewport);
  });
  it('preserves legacy frame fading when dimColor is omitted or transparent', () => {
    const {rerender} = render(<Carousel/>);
    expect(screen.getAllByRole('group').map(card => Number(getComputedStyle(card).opacity))).toEqual([.3, .6, .9, 1, .9, .6]);
    expect(overlays().every(overlay => overlay === null)).toBe(true);
    rerender(<Carousel dimColor="transparent"/>);
    expect(screen.getAllByRole('group').map(card => Number(getComputedStyle(card).opacity))).toEqual([.3, .6, .9, 1, .9, .6]);
    expect(overlays().every(overlay => overlay === null)).toBe(true);
  });
});
