import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {PinnedScrollStory} from '../src/pieces/pinned-scroll-story/PinnedScrollStory';
import {resolvePinnedScrollStory, storyProgress} from '../src/pieces/pinned-scroll-story/settings';

const viewport = vi.hoisted(() => ({callback: undefined as undefined | ((rect: DOMRectReadOnly, height: number, delta: number) => boolean)}));
vi.mock('../src/internal/viewport', () => ({observeViewport: (_element: Element, callback: typeof viewport.callback) => {viewport.callback = callback; return () => {viewport.callback = undefined;};}}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
const items = [{id: 'one', label: 'First', content: <a href="#first">First content</a>}, {id: 'two', label: 'Second', content: <p>Second content</p>}];
const rect = (top: number, height: number) => ({top, bottom: top + height, left: 0, right: 400, width: 400, height, x: 0, y: top, toJSON() {}});
let media: EventTarget & {matches: boolean};
let tall = false;
let contentHeights: number[] | undefined;
let frames: Map<number, FrameRequestCallback>;
let frameId = 0;
function frame() {act(() => {const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(100));});}
function scroll(top: number) {act(() => {viewport.callback?.(rect(top, 2800), 1000, 16);});}
beforeEach(() => {
  media = Object.assign(new EventTarget(), {matches: false});
  vi.stubGlobal('matchMedia', () => media); vi.stubGlobal('innerHeight', 1000);
  vi.stubGlobal('scrollTo', vi.fn()); tall = false; contentHeights = undefined; frames = new Map();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {frames.set(++frameId, callback); return frameId;});
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function(this: HTMLElement) {
    const index = ['First', 'Second', 'At a glance'].indexOf(this.parentElement?.getAttribute('aria-label') ?? '');
    return rect(0, this.hasAttribute('data-story-content') ? (tall ? 1200 : contentHeights?.[index] ?? 300) : this.tagName === 'NAV' ? 52 : 2800);
  });
});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); viewport.callback = undefined;});
describe('PinnedScrollStory', () => {
  it('renders every story panel and overview in readable natural flow on the server', () => {
    const html = renderToString(<PinnedScrollStory items={items}/>);
    expect(html).toContain('First content'); expect(html).toContain('Second content'); expect(html).toContain('At a glance');
    const document = new DOMParser().parseFromString(html, 'text/html');
    document.querySelectorAll('[role="group"]').forEach(panel => expect(panel.getAttribute('aria-hidden')).toBeNull());
    expect(html).not.toContain('position:sticky'); expect(html).not.toContain('opacity:0');
  });
  it('maps clamped scroll progress to every panel including the final overview', () => {
    expect(storyProgress(100, 1800, 3)).toEqual({progress: 0, index: 0});
    expect(storyProgress(-900, 1800, 3)).toEqual({progress: .5, index: 1});
    expect(storyProgress(-1800, 1800, 3)).toEqual({progress: 1, index: 2});
    expect(storyProgress(-4000, 1800, 3)).toEqual({progress: 1, index: 2});
    expect(storyProgress(0, 0, 0)).toEqual({progress: 0, index: 0});
  });
  it('supports shared dials while finite explicit settings take precedence', () => {
    expect(resolvePinnedScrollStory({dials: {speed: 'fast', size: 'small', blur: 'none', fade: 'soft'}})).toMatchObject({duration: .50625, distance: 20, blur: 0, startOpacity: .5});
    expect(resolvePinnedScrollStory({duration: 0, distance: 0, blur: 6, startOpacity: 1, dials: {speed: 'slow', size: 'large', blur: 'none', fade: 'full'}})).toMatchObject({duration: 0, distance: 0, blur: 6, startOpacity: 1});
    expect(resolvePinnedScrollStory({duration: Infinity, distance: -10, blur: 99, trackPerSlide: 0, top: 1000})).toMatchObject({duration: .9, distance: 0, blur: 10, trackPerSlide: .2, top: 240});
  });
  it('defaults to start alignment and lets an explicit alignment override the shared dial', () => {
    expect(resolvePinnedScrollStory({}).align).toBe('start');
    expect(resolvePinnedScrollStory({dials: {align: 'center'}}).align).toBe('center');
    expect(resolvePinnedScrollStory({align: 'start', dials: {align: 'center'}}).align).toBe('start');
    expect(resolvePinnedScrollStory({align: 'center', dials: {align: 'start'}}).align).toBe('center');
    expect(resolvePinnedScrollStory({dials: {align: 'bottom'}}).align).toBe('start');
  });
  it('fits the tallest panel without viewport centering and trims the overview tail without changing scroll travel', () => {
    contentHeights = [560, 400, 280];
    const view = render(<PinnedScrollStory items={items} top={100} duration={0}/>); frame();
    const root = view.container.querySelector('section')!;
    const stage = root.firstElementChild as HTMLElement;
    const grid = stage.firstElementChild!.firstElementChild as HTMLElement;
    expect(stage.style.height).toBe('631px'); // Tallest panel + 48 padding + 20 gap + 3 progress.
    expect(stage.style.justifyContent).toBe('flex-start');
    expect(root.style.height).toBe('2151px'); // 1800 travel + 351 overview footprint.
    expect(stage.style.marginBottom).toBe('-280px'); // Keep the full sticky travel for taller scenes.
    expect(grid.style.height).toBe('560px');
    expect(screen.getByRole('group', {name: 'First'}).style.alignSelf).toBe('start');
    scroll(-1700);
    expect(stage.style.height).toBe('351px');
    expect(stage.style.marginBottom).toBe('0px');
    expect(grid.style.height).toBe('280px');
    expect(grid.style.overflow).toBe('clip'); // A departing tall panel must not cover the following section.
    expect(root.style.height).toBe('2151px');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    scroll(100);
    expect(stage.style.height).toBe('631px');
    expect(screen.getByRole('button', {name: 'Go to First'}).getAttribute('aria-current')).toBe('step');
    scroll(-1700);
    expect(stage.style.height).toBe('351px');
    expect(screen.getByRole('button', {name: 'Go to At a glance'}).getAttribute('aria-current')).toBe('step');
  });
  it('centers shorter panels only when requested and reserves the side rail when it is taller', () => {
    contentHeights = [80, 90, 100];
    const view = render(<PinnedScrollStory items={items} align="center"/>); frame();
    const stage = view.container.querySelector('section')!.firstElementChild as HTMLElement;
    expect(stage.style.height).toBe('203px'); // Three 44px controls plus 71px chrome.
    expect(screen.getByRole('group', {name: 'First'}).style.alignSelf).toBe('center');
    scroll(-1800);
    expect(stage.style.height).toBe('203px');
  });
  it('reserves enough travel for a tall scene to clear the following section on a short track', () => {
    vi.stubGlobal('innerHeight', 900);
    contentHeights = [700, 0, 100];
    const view = render(<PinnedScrollStory items={[items[0]]} trackPerSlide={.2} duration={0}/>); frame();
    const root = view.container.querySelector('section')!;
    const stage = root.firstElementChild as HTMLElement;
    expect(stage.style.height).toBe('771px');
    expect(root.style.height).toBe('1371px'); // Two 600px intervals + 171px final stage.
    scroll(-599);
    expect(screen.getByRole('button', {name: 'Go to First'}).getAttribute('aria-current')).toBe('step');
    expect(parseFloat(root.style.height) - 599).toBeGreaterThanOrEqual(parseFloat(stage.style.height));
    vi.stubGlobal('scrollY', 600); scroll(-600);
    expect(screen.getByRole('button', {name: 'Go to At a glance'}).getAttribute('aria-current')).toBe('step');
    expect(stage.style.height).toBe('171px');
    fireEvent.click(screen.getByRole('button', {name: 'Go to At a glance'}));
    expect(window.scrollTo).toHaveBeenLastCalledWith({top: 900, behavior: 'smooth'});
  });
  it('enhances fitting content and updates active navigation and progress from native scroll', () => {
    const view = render(<PinnedScrollStory items={items} duration={0}/>); frame(); scroll(-900);
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('pinned');
    expect(screen.getByRole('button', {name: 'Go to Second'}).getAttribute('aria-current')).toBe('step');
    expect(screen.queryByRole('link', {name: 'First content'})).toBeNull();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50');
    scroll(-1800);
    expect(screen.getByRole('heading', {name: 'At a glance'})).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    const wheel = new Event('wheel', {bubbles: true, cancelable: true}); view.container.firstChild!.dispatchEvent(wheel); expect(wheel.defaultPrevented).toBe(false);
  });
  it('uses nav-local arrows and Home/End and scrolls only after explicit navigation', () => {
    render(<PinnedScrollStory items={items}/>); frame(); scroll(0); expect(window.scrollTo).not.toHaveBeenCalled();
    const first = screen.getByRole('button', {name: 'Go to First'}); first.focus();
    fireEvent.keyDown(first, {key: 'ArrowRight'});
    const second = screen.getByRole('button', {name: 'Go to Second'});
    expect(document.activeElement).toBe(second); expect(window.scrollTo).toHaveBeenLastCalledWith({top: 900, behavior: 'smooth'});
    fireEvent.keyDown(second, {key: 'End'}); expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Go to At a glance'}));
    fireEvent.keyDown(document.activeElement!, {key: 'Home'}); expect(document.activeElement).toBe(first);
    const key = new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true, cancelable: true}); document.body.dispatchEvent(key); expect(key.defaultPrevented).toBe(false);
  });
  it('keeps tall content readable and live reduced motion restores every panel', () => {
    tall = true; const tallView = render(<PinnedScrollStory items={items}/>); frame();
    expect(tallView.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('flow');
    expect(screen.getByRole('link', {name: 'First content'})).toBeTruthy(); tallView.unmount(); tall = false;
    const view = render(<PinnedScrollStory items={items}/>); frame(); scroll(-900);
    act(() => {media.matches = true; media.dispatchEvent(new Event('change'));});
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('flow');
    expect(screen.getByRole('link', {name: 'First content'})).toBeTruthy(); expect(screen.getByText('Second content')).toBeTruthy(); expect(viewport.callback).toBeUndefined();
    view.unmount(); expect(frames.size).toBe(0);
  });
  it('handles empty, single, duplicate ids and an initial reduced preference', () => {
    const empty = render(<PinnedScrollStory items={[]}/>); expect(empty.container.textContent).toBe(''); empty.unmount();
    media.matches = true; const view = render(<PinnedScrollStory items={[items[0], {...items[1], id: 'one'}]}/>); frame();
    expect(screen.getByText('First content')).toBeTruthy(); expect(screen.getByText('Second content')).toBeTruthy(); expect(viewport.callback).toBeUndefined();
    view.rerender(<PinnedScrollStory items={[items[0]]}/>); expect(screen.getByText('First content')).toBeTruthy(); expect(screen.getByRole('heading', {name: 'At a glance'})).toBeTruthy();
  });
  it('moves focus to the active dot before a focused slide becomes inert', () => {
    render(<PinnedScrollStory items={items}/>); frame(); scroll(0);
    screen.getByRole('link', {name: 'First content'}).focus(); scroll(-900);
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Go to Second'}));
  });
  it('does not hide content the reader focused before enhancement', () => {
    const view = render(<PinnedScrollStory items={[items[1], items[0]]}/>);
    const link = screen.getByRole('link', {name: 'First content'}); link.focus(); frame();
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('flow');
    expect(document.activeElement).toBe(link);
  });
  it('keeps outgoing panels visible for their exit while removing interaction immediately', () => {
    const view = render(<PinnedScrollStory items={items}/>); frame(); scroll(0); scroll(-900);
    const outgoing = view.container.querySelector('[aria-label="First"][role="group"]') as HTMLElement;
    expect(outgoing.style.visibility).toBe('visible'); expect(outgoing.getAttribute('aria-hidden')).toBe('true'); expect(outgoing.hasAttribute('inert')).toBe(true);
    const future = view.container.querySelector('[aria-label="At a glance"][role="group"]') as HTMLElement;
    expect(future.style.visibility).toBe('hidden');
  });
  it('hides departed panels immediately when every visual transition is disabled', () => {
    const view = render(<PinnedScrollStory items={items} distance={0} blur={0} startOpacity={1}/>); frame(); scroll(0); scroll(-900);
    expect((view.container.querySelector('[aria-label="First"][role="group"]') as HTMLElement).style.visibility).toBe('hidden');
  });
  it('falls back when resized content no longer fits and releases all pending work', () => {
    const view = render(<PinnedScrollStory items={items}/>); frame(); scroll(0);
    tall = true; fireEvent(window, new Event('resize')); frame();
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('flow');
    expect(screen.getByRole('link', {name: 'First content'})).toBeTruthy(); expect(viewport.callback).toBeUndefined();
    fireEvent(window, new Event('resize')); view.unmount(); expect(frames.size).toBe(0);
  });
  it('uses a vertical side rail while pinned and a horizontal navigation row in natural flow', () => {
    render(<PinnedScrollStory items={items}/>); frame();
    const nav = screen.getByRole('navigation', {name: 'Scroll story steps'});
    expect(nav.style.flexDirection).toBe('column');
    expect(nav.parentElement!.style.gridTemplateColumns).toBe('minmax(0, 1fr) 44px');
    expect(nav.contains(screen.getByRole('progressbar'))).toBe(false);
    expect(screen.getByRole('button', {name: 'Go to First'}).style.minHeight).toBe('44px');
    act(() => {media.matches = true; media.dispatchEvent(new Event('change'));});
    expect(nav.style.flexDirection).toBe('row');
  });
  it('uses natural flow when the vertical rail cannot fit in the viewport', () => {
    const many = Array.from({length: 24}, (_, i) => ({...items[0], id: String(i), label: `Step ${i}`}));
    const view = render(<PinnedScrollStory items={many}/>); frame();
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('flow');
  });
  it('keeps every panel in flow when the document ends too soon to finish the compact pin', () => {
    const documentHeight = vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2800);
    const view = render(<PinnedScrollStory items={items}/>); frame();
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('flow');
    expect(screen.getByRole('link', {name: 'First content'})).toBeTruthy();
    expect(screen.getByText('Second content')).toBeTruthy();
    expect(screen.getByRole('heading', {name: 'At a glance'})).toBeTruthy();
    documentHeight.mockReturnValue(4000); fireEvent(window, new Event('resize')); frame();
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe('pinned');
  });
  it.each([{top: 0, mode: 'flow'}, {top: 100, mode: 'pinned'}])('includes the sticky offset when checking room to finish: $top', ({top, mode}) => {
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(3400);
    const view = render(<PinnedScrollStory items={items} top={top}/>); frame();
    expect(view.container.querySelector('[data-story-mode]')?.getAttribute('data-story-mode')).toBe(mode);
  });
});
