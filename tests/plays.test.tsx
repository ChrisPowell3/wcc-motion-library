import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ScrollRevealRise, CountUp, StarPop, CtaPills, cleanDials, SHARED_DIALS, type MotionDials} from '../src';

vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
let top = 1100;
let media: EventTarget & {matches: boolean};
const observers = new Set<{targets: Set<Element>; callback: IntersectionObserverCallback}>();
function visibility(visible: boolean) {act(() => observers.forEach(observer => observer.callback([...observer.targets].map(target => ({target, isIntersecting: visible}) as IntersectionObserverEntry), {} as IntersectionObserver)));}
function scroll(next: number) {top = next; fireEvent.scroll(window);}
beforeEach(() => {
  top = 1100; media = Object.assign(new EventTarget(), {matches: false});
  vi.stubGlobal('innerHeight', 1000); vi.stubGlobal('innerWidth', 1000);
  vi.stubGlobal('matchMedia', () => media);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({top, bottom: top + 100, left: 0, right: 100, height: 100, width: 100, x: 0, y: top, toJSON() {}}));
  vi.stubGlobal('IntersectionObserver', class {
    targets = new Set<Element>(); constructor(public callback: IntersectionObserverCallback) {observers.add(this);}
    observe(target: Element) {this.targets.add(target);} unobserve(target: Element) {this.targets.delete(target);} disconnect() {observers.delete(this);}
  });
});
afterEach(() => {cleanup(); observers.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
const cases = [
  {id: 'scroll-reveal-rise', render: (dials?: MotionDials, once?: boolean) => <ScrollRevealRise dials={dials} once={once} duration={.03} delay={0} startOpacity={0}><button>Sample</button></ScrollRevealRise>, value: () => Number(screen.getByText('Sample').parentElement!.style.opacity)},
  {id: 'count-up', render: (dials?: MotionDials, once?: boolean) => <CountUp dials={dials} once={once} duration={.03} delay={0}>100</CountUp>, value: () => Number(screen.getByRole('group').textContent) / 100},
  {id: 'star-pop', render: (dials?: MotionDials, once?: boolean) => <StarPop dials={dials} once={once} duration={.03} delay={0}><button>Sample</button></StarPop>, value: () => Number(screen.getByText('Sample').parentElement!.style.opacity)},
  {id: 'cta-pills', render: (dials?: MotionDials, once?: boolean) => <CtaPills dials={dials} once={once} duration={.03} delay={0} bob={0}><button>Sample</button></CtaPills>, value: () => Number(screen.getByText('Sample').parentElement!.parentElement!.style.opacity)},
];
for (const piece of cases) describe(`${piece.id} plays`, () => {
  it('defaults to scrub and follows down, up, down with intermediate progress', async () => {
    render(piece.render());
    await waitFor(() => expect(piece.value()).toBe(0));
    scroll(750); await waitFor(() => {expect(piece.value()).toBeGreaterThan(.05); expect(piece.value()).toBeLessThan(.95);});
    scroll(100); await waitFor(() => expect(piece.value()).toBe(1), {timeout: 2000});
    scroll(1100); await waitFor(() => expect(piece.value()).toBe(0), {timeout: 2000});
    scroll(100); await waitFor(() => expect(piece.value()).toBe(1), {timeout: 2000});
  });
  it.each(['once', 'always'] as const)('%s retains or resets and replays in either direction', async plays => {
    render(piece.render({plays}));
    await waitFor(() => expect(piece.value()).toBe(0));
    visibility(true); await waitFor(() => expect(piece.value()).toBe(1));
    visibility(false); await waitFor(() => expect(piece.value()).toBe(plays === 'once' ? 1 : 0));
    visibility(true); await waitFor(() => expect(piece.value()).toBe(1));
  });
  it.each([true, false])('explicit once=%s wins over scrub', async once => {
    render(piece.render({plays: 'scrub'}, once));
    visibility(true); await waitFor(() => expect(piece.value()).toBe(1));
    scroll(1100); visibility(false);
    await waitFor(() => expect(piece.value()).toBe(once ? 1 : 0));
  });
  it.each(['scrub', 'once', 'always'])('%s is static and fully visible with reduced motion', async plays => {
    media.matches = true;
    const html = renderToString(piece.render({plays}));
    expect(html).not.toContain('opacity:0');
    render(piece.render({plays}));
    scroll(1100); visibility(false);
    expect(piece.value()).toBe(1);
    expect(observers.size).toBe(0);
  });
});
it('advertises scrub for every entrance and preserves the two exceptions', () => {
  expect(SHARED_DIALS.plays).toEqual(['once', 'always', 'scrub']);
  for (const id of [...cases.map(piece => piece.id), 'scroll-stack-cards', 'parallax-drift', 'image-load-blur-in']) expect(cleanDials(id, {plays: 'scrub'})).toEqual({plays: 'scrub'});
});

for (const piece of cases.filter(piece => piece.id !== 'count-up')) {
  it(`${piece.id} keeps focused content visible across mode changes and resumes scrub after blur`, async () => {
    const view = render(piece.render({plays: 'scrub'}));
    await waitFor(() => expect(piece.value()).toBe(0));
    const button = screen.getByRole('button');
    act(() => button.focus()); await waitFor(() => expect(piece.value()).toBe(1));
    view.rerender(piece.render({plays: 'always'}));
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 40));});
    expect(piece.value()).toBe(1);
    view.rerender(piece.render({plays: 'scrub'}));
    scroll(1100); await waitFor(() => expect(piece.value()).toBe(1));
    act(() => button.blur()); scroll(1099);
    await waitFor(() => expect(piece.value()).toBe(0));
  });
}
