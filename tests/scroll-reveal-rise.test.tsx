import {StrictMode} from 'react';
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import * as library from '../src';
import {settleEase, springyEase} from '../src/tokens';
import {animate} from 'motion/react';
import type {ScrollRevealRiseProps} from '../src/pieces/scroll-reveal-rise/ScrollRevealRise';

const preferences = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => {
  const motion = await original<typeof import('motion/react')>();
  return {...motion, animate: vi.fn(motion.animate), useReducedMotion: () => preferences.reduced};
});
class Observer {
  static all: Observer[] = [];
  targets = new Set<Element>();
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) { Observer.all.push(this); }
  observe(target: Element) { this.targets.add(target); }
  unobserve(target: Element) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
  enter(visible: boolean) {
    this.callback([...this.targets].map(target => ({target, isIntersecting: visible, intersectionRatio: visible ? 0.01 : 0,
      boundingClientRect: target.getBoundingClientRect(), intersectionRect: target.getBoundingClientRect(), rootBounds: null, time: performance.now(),
    })), this as unknown as IntersectionObserver);
  }
}
let media: EventTarget & {matches: boolean};
const rect = (top: number) => ({top, bottom: top + 1500, left: 0, right: 360, width: 360, height: 1500, x: 0, y: top, toJSON() {}});
beforeEach(() => {
  preferences.reduced = false;
  vi.mocked(animate).mockClear();
  Observer.all = [];
  vi.stubGlobal('IntersectionObserver', Observer);
  media = Object.assign(new EventTarget(), {matches: false});
  vi.stubGlobal('matchMedia', () => media);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(2000));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const Reveal = (props: Partial<ScrollRevealRiseProps>) => <library.ScrollRevealRise {...props}>{props.children ?? <button>Continue</button>}</library.ScrollRevealRise>;
const frame = (name = 'Continue') => screen.getByText(name).parentElement!;
const enter = (visible: boolean) => act(() => Observer.all.forEach(observer => observer.enter(visible)));
const finished = async (name = 'Continue') => waitFor(() => {
  expect(frame(name).style.opacity).toBe('1');
  expect(frame(name).style.transform).toBe('none');
}, {timeout: 2500});

describe('ScrollRevealRise', () => {
  it.each([
    ['up', 'translateY(24px)'], ['down', 'translateY(-24px)'],
    ['left', 'translateX(-24px)'], ['right', 'translateX(24px)'],
  ] as const)('uses the %s dial on the rendered entrance', async (direction, transform) => {
    render(<Reveal dials={{direction}}/>);
    await waitFor(() => expect(frame().style.transform).toBe(transform));
    enter(true); await finished();
  });
  it.each([['none', '1'], ['soft', '0.5'], ['full', '0']] as const)('uses %s fade without limiting the internal no-fade value', async (fade, opacity) => {
    render(<Reveal dials={{fade}}/>);
    await waitFor(() => expect(frame().style.transform).toBe('translateY(24px)'));
    await waitFor(() => expect(frame().style.opacity).toBe(opacity));
  });
  it('repeats with the always dial and honors a late trigger', async () => {
    render(<Reveal dials={{plays: 'always', start: 'late', direction: 'left'}}/>);
    expect(Observer.all[0].options?.rootMargin).toBe(`0px 0px -${window.innerHeight * 0.4}px 0px`);
    enter(true); await finished(); enter(false);
    await waitFor(() => expect(frame().style.transform).toBe('translateX(-24px)'));
  });
  it('keeps late starts reachable on wide short viewports and updates after rotation', async () => {
    vi.stubGlobal('innerWidth', 1920); vi.stubGlobal('innerHeight', 720);
    render(<Reveal dials={{start: 'late', plays: 'always'}}/>);
    expect(Observer.all.at(-1)?.options?.rootMargin).toBe('0px 0px -288px 0px');
    act(() => { window.innerWidth = 720; window.innerHeight = 1280; window.dispatchEvent(new Event('resize')); });
    expect(Observer.all[0].targets.size).toBe(0);
    expect(Observer.all.at(-1)?.options?.rootMargin).toBe('0px 0px -512px 0px');
    enter(true); await finished();
  });
  it('preserves explicit margins and completed one-time entrances across viewport resizes', async () => {
    vi.stubGlobal('innerWidth', 1920); vi.stubGlobal('innerHeight', 720);
    const view = render(<Reveal margin="0px 0px -25% 0px" dials={{start: 'late'}}/>);
    expect(Observer.all.at(-1)?.options?.rootMargin).toBe('0px 0px -25% 0px');
    view.rerender(<Reveal dials={{start: 'late'}}/>);
    await waitFor(() => expect(frame().style.opacity).toBe('0.5'));
    enter(true); await finished();
    const count = Observer.all.length;
    act(() => { window.innerHeight = 1280; window.dispatchEvent(new Event('resize')); });
    expect(Observer.all).toHaveLength(count);
    expect(frame().style.opacity).toBe('1');
    expect(frame().style.transform).toBe('none');
  });
  it('contains horizontal entrances without clipping vertical motion or the anchor focus ring', async () => {
    const view = render(<Reveal dials={{direction: 'right', size: 'large'}}/>);
    await waitFor(() => expect(frame().style.transform).toBe('translateX(48px)'));
    const anchor = frame().parentElement!;
    expect(anchor.style.overflowX).toBe('clip');
    expect(anchor.style.overflowY).toBe('visible');
    act(() => screen.getByRole('button').focus());
    await finished();
    expect(anchor.style.outline).toBe('3px solid currentColor');
    view.rerender(<Reveal dials={{direction: 'up'}}/>);
    expect(anchor.style.overflowX).toBe('');
  });
  it('lets explicit false and zero override dials', async () => {
    render(<Reveal once={false} startOpacity={0} stagger={0} margin="0px" dials={{plays: 'once', fade: 'none', start: 'late', cascade: 'cascade'}}/>);
    expect(Observer.all[0].options?.rootMargin).toBe('0px');
    await waitFor(() => expect(frame().style.opacity).toBe('0'));
    enter(true); await finished(); enter(false);
    await waitFor(() => expect(frame().style.opacity).toBe('0'));
  });
  it('reduced motion overrides every dial with fully visible content and no observer', () => {
    preferences.reduced = true; media.matches = true;
    render(<Reveal dials={{direction: 'left', size: 'large', fade: 'full', bounce: 'springy', plays: 'always', delay: 'long', cascade: 'cascade', start: 'late', speed: 'slow'}}/>);
    expect(frame().style.opacity).toBe('1');
    expect(frame().style.transform).toBe('none');
    expect(Observer.all).toHaveLength(0);
  });
  it('passes dial timing and bounce to real animations and caps only the sibling wait', async () => {
    render(<Reveal stagger={300} dials={{delay: 'long', speed: 'slow', bounce: 'springy'}}
      children={Array.from({length: 20}, (_, i) => <p key={i}>Item {i}</p>)}/>);
    enter(true);
    const calls = vi.mocked(animate).mock.calls;
    expect(calls[0][2]).toMatchObject({duration: 0.6, delay: 0.6, ease: springyEase});
    expect(calls[38][2]).toMatchObject({duration: 0.6, delay: 1.5, ease: springyEase});
    await finished('Item 19');
  });
  it('starts siblings together when requested while honoring the common delay', () => {
    render(<Reveal dials={{cascade: 'together', delay: 'short'}}><span>One</span><span>Two</span></Reveal>);
    enter(true);
    const calls = vi.mocked(animate).mock.calls;
    expect(calls[0][2]).toMatchObject({delay: 0.18});
    expect(calls[2][2]).toMatchObject({delay: 0.18});
  });
  it('honors the initial delay while keeping already visible content readable', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(rect(0));
    render(<Reveal stagger={300} dials={{delay: 'long', start: 'late', fade: 'full', direction: 'left'}}><span>One</span><span>Two</span></Reveal>);
    await waitFor(() => expect(frame('One').style.transform).toBe('translateX(-8px)'));
    expect(frame('One').style.opacity).toBe('0.8');
    expect(Observer.all[0].options?.rootMargin).toBe('0px');
    enter(true);
    const calls = vi.mocked(animate).mock.calls;
    expect(calls[0][2]).toMatchObject({duration: 0.18, delay: 0.6});
    expect(calls[2][2]).toMatchObject({duration: 0.18, delay: 0.78});
    await finished('Two');
  });
  it('exports the component', () => expect(typeof library.ScrollRevealRise).toBe('function'));
  it('renders content accessibly before intersection and reveals a tall item at its leading edge', async () => {
    render(<Reveal/>);
    expect(screen.getByRole('button', {name: 'Continue'}).tabIndex).toBe(0);
    await waitFor(() => expect(frame().style.opacity).toBe('0.5'));
    expect(frame().style.transform).toBe('translateY(24px)');
    expect(Observer.all[0].options).toEqual({rootMargin: '0px 0px -10% 0px', threshold: 0});
    enter(false);
    expect(frame().style.opacity).toBe('0.5');
    enter(true);
    await finished();
    enter(false); enter(true);
    expect(frame().style.opacity).toBe('1');
    expect(Observer.all.every(observer => observer.targets.size === 0)).toBe(true);
  });
  it('uses a subtler short entrance for initially visible content', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(rect(0));
    render(<Reveal as="image"/>);
    await waitFor(() => expect(frame().style.transform).toBe('translateY(8px)'));
    expect(frame().style.opacity).toBe('0.8');
    enter(true);
    await finished();
  });
  it('reveals initially visible content in the bottom margin strip without waiting for a scroll', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(rect(window.innerHeight - 5));
    render(<Reveal/>);
    expect(Observer.all[0].options?.rootMargin).toBe('0px');
    enter(true); await finished();
  });
  it('keeps the settle curve monotonic and exactly at rest at completion', () => {
    const values = Array.from({length: 101}, (_, index) => settleEase(index / 100));
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(1);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      expect(values[i]).toBeLessThanOrEqual(1);
    }
  });
  it('replays only when explicitly requested and resets instantly outside view', async () => {
    render(<Reveal once={false}/>);
    enter(false); enter(true); await finished();
    enter(false);
    await waitFor(() => expect(frame().style.transform).toBe('translateY(24px)'));
    enter(true); await finished();
  });
  it('makes keyboard-focused content immediately visible even during a delayed image reveal', async () => {
    const activated = vi.fn();
    render(<Reveal as="image" stagger={300} children={[<span key="one">One</span>, <button key="two" onClick={activated}>Continue</button>]}/>);
    enter(false); enter(true);
    act(() => screen.getByRole('button').focus());
    await finished();
    expect(document.activeElement).toBe(screen.getByRole('button'));
    expect(screen.getByRole('button').closest('[inert], [aria-hidden="true"]')).toBeNull();
    const key = new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true, cancelable: true});
    screen.getByRole('button').dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole('button'));
    expect(activated).toHaveBeenCalledOnce();
  });
  it('supports autofocus before effects and keeps focused content visible across prop updates', async () => {
    const view = render(<Reveal as="image" once={false}><button autoFocus>Continue</button></Reveal>);
    await finished();
    view.rerender(<Reveal as="image" once={false} distance={100}><button autoFocus>Continue</button></Reveal>);
    await finished();
    act(() => screen.getByRole('button').blur());
    enter(false);
    await waitFor(() => expect(frame().style.transform).toBe('translateY(100px)'));
    enter(true); await finished();
  });
  it('allows replay after keyboard focus leaves a repeatable item', async () => {
    render(<Reveal once={false}/>);
    act(() => screen.getByRole('button').focus());
    await finished();
    act(() => screen.getByRole('button').blur());
    enter(false);
    await waitFor(() => expect(frame().style.opacity).toBe('0.5'));
    enter(true); await finished();
  });
  it('skips all motion and observers for reduced motion even with extreme props', () => {
    preferences.reduced = true;
    media.matches = true;
    render(<Reveal as="image" startOpacity={0} distance={120} stagger={300}/>);
    expect(frame().style.opacity).toBe('1');
    expect(frame().style.transform).toBe('none');
    expect(Observer.all).toHaveLength(0);
  });
  it('resumes opt-in repeat entrances when an initially reduced preference is disabled', async () => {
    preferences.reduced = true;
    media.matches = true;
    render(<Reveal once={false}/>);
    await finished();
    act(() => { media.matches = false; media.dispatchEvent(new Event('change')); });
    await waitFor(() => expect(frame().style.opacity).toBe('0.5'));
    enter(true); await finished();
  });
  it('stops pending motion when the system preference changes and does not replay when restored', async () => {
    render(<Reveal as="image"/>);
    enter(true);
    act(() => { media.matches = true; media.dispatchEvent(new Event('change')); });
    await finished();
    act(() => { media.matches = false; media.dispatchEvent(new Event('change')); });
    enter(false); enter(true);
    expect(frame().style.opacity).toBe('1');
  });
  it('keeps separate items pending until each enters and caps long-list delay', async () => {
    render(<Reveal stagger={300} children={Array.from({length: 20}, (_, i) => <p key={i}>Item {i}</p>)}/>);
    enter(false);
    act(() => Observer.all[0].enter(true));
    await finished('Item 0');
    expect(frame('Item 19').style.opacity).toBe('0.5');
    enter(true);
    await finished('Item 19');
  });
  it.each([
    {distance: -5, startOpacity: -1, expectedY: 8, expectedOpacity: 0},
    {distance: 1000, startOpacity: 1, expectedY: 120, expectedOpacity: 0.6},
    {distance: NaN, startOpacity: NaN, expectedY: 24, expectedOpacity: 0.5},
  ])('normalizes numeric input: $distance / $startOpacity', async ({distance, startOpacity, expectedY, expectedOpacity}) => {
    render(<Reveal distance={distance} startOpacity={startOpacity}/>);
    await waitFor(() => expect(frame().style.transform).toBe(`translateY(${expectedY}px)`));
    expect(frame().style.opacity).toBe(String(expectedOpacity));
  });
  it('fails open without IntersectionObserver or with a rejected margin', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const view = render(<Reveal/>);
    await finished(); view.unmount();
    vi.stubGlobal('IntersectionObserver', class { constructor() { throw new SyntaxError('Invalid margin'); } });
    render(<Reveal margin="invalid"/>);
    await finished();
  });
  it('handles empty content, later children, custom margin and StrictMode cleanup', async () => {
    const view = render(<StrictMode><Reveal children={[]}/></StrictMode>);
    expect(view.container.textContent).toBe('');
    view.rerender(<StrictMode><Reveal margin="0px"/></StrictMode>);
    expect(Observer.all.at(-1)?.options?.rootMargin).toBe('0px');
    enter(true); await finished();
    view.unmount();
    expect(Observer.all.every(observer => observer.targets.size === 0)).toBe(true);
  });
});
