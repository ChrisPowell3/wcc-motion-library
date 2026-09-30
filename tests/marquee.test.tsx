import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {useState} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Marquee} from '../src/pieces/marquee/Marquee';
import {resolveMarqueeSettings} from '../src/pieces/marquee/dials';

const preferences = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => preferences.reduced}));
let containerWidth: number;
let setWidth: number;
let resize: () => void;
let visibility: (visible: boolean) => void;
let resizeDisconnect: ReturnType<typeof vi.fn>;
beforeEach(() => {
  preferences.reduced = false;
  containerWidth = 1200; setWidth = 200;
  resizeDisconnect = vi.fn();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function(this: HTMLElement) {
    const width = this.hasAttribute('data-marquee-set') ? setWidth : containerWidth;
    return {x: 0, y: 0, top: 0, left: 0, right: width, bottom: 40, width, height: 40, toJSON() {}};
  });
  vi.stubGlobal('ResizeObserver', class {constructor(callback: () => void) {resize = callback;} observe() {} disconnect = resizeDisconnect;});
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {visibility = visible => this.callback([{target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0} as IntersectionObserverEntry], this as unknown as IntersectionObserver);}
    unobserve() {} disconnect() {}
  });
});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
const content = <><span id="original-label">One</span><span>Two</span></>;
const interactiveContent = <><a id="original-link" href="#one">One</a><span>Two</span></>;
const track = () => document.querySelector<HTMLElement>('[data-marquee-track]')!;
const copies = () => document.querySelectorAll('[data-marquee-copy]');
const x = () => Number(track().style.transform.match(/translateX\(([-\d.]+)px\)/)?.[1] ?? 0);

describe('Marquee', () => {
  it.each([['slow', 56.25], ['normal', 30], ['fast', 16.875]] as const)('resolves %s into the loop cadence without overriding explicit duration', (speed, seconds) => {
    expect(resolveMarqueeSettings({dials: {speed}}).seconds).toBe(seconds);
    expect(resolveMarqueeSettings({dials: {speed}, duration: 10}).seconds).toBe(10);
  });
  it.each([['small', 14], ['medium', 28], ['large', 56]] as const)('resolves %s into spacing', (size, gap) => {
    render(<Marquee dials={{size}}>{content}</Marquee>);
    expect(document.querySelector<HTMLElement>('[data-marquee-set]')?.style.gap).toBe(`${gap}px`);
  });
  it('clamps numeric ranges, ignores invalid directions and keeps safe fallbacks', () => {
    expect(resolveMarqueeSettings({duration: -1, gap: -10, dials: {direction: 'up'}})).toMatchObject({seconds: 5, spacing: 0, travel: 'left'});
    expect(resolveMarqueeSettings({duration: 1000, gap: 1000})).toMatchObject({seconds: 120, spacing: 120});
    expect(resolveMarqueeSettings({duration: NaN, gap: Infinity})).toMatchObject({seconds: 30, spacing: 28});
    expect(resolveMarqueeSettings({dials: {direction: 'right'}}).travel).toBe('right');
    expect(resolveMarqueeSettings({direction: 'left', dials: {direction: 'right'}}).travel).toBe('left');
  });
  it('fills a wide viewport seamlessly with inert duplicate sets and only one semantic copy', () => {
    render(<Marquee>{content}</Marquee>);
    expect(copies().length).toBeGreaterThanOrEqual(6);
    expect(document.querySelectorAll('[data-marquee-set]')).toHaveLength(1);
    expect(document.querySelectorAll('#original-label')).toHaveLength(1);
    for (const copy of copies()) {
      expect(copy.getAttribute('aria-hidden')).toBe('true');
      expect(copy.hasAttribute('inert')).toBe(true);
    }
  });
  it('re-measures after resize and disconnects on unmount', () => {
    const view = render(<Marquee>{content}</Marquee>);
    const oldCount = copies().length;
    containerWidth = 1920;
    act(() => resize());
    expect(copies().length).toBeGreaterThan(oldCount);
    setWidth = 400;
    act(() => resize());
    expect(copies().length).toBeLessThan(oldCount);
    view.unmount();
    expect(resizeDisconnect).toHaveBeenCalled();
  });
  it('moves left, pauses on hover and offscreen, and resumes without restarting the loop', async () => {
    render(<Marquee duration={5}>{content}</Marquee>);
    act(() => visibility(true));
    await waitFor(() => expect(x()).toBeLessThan(-1));
    fireEvent.mouseEnter(screen.getByRole('region'));
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 30));});
    const hovered = x();
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 80));});
    expect(x()).toBe(hovered);
    fireEvent.mouseLeave(screen.getByRole('region'));
    await waitFor(() => expect(x()).toBeLessThan(hovered));
    act(() => visibility(false));
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 30));});
    const offscreen = x();
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 80));});
    expect(x()).toBe(offscreen);
  });
  it('makes the complete original content static and readable for manual pause and reduced motion', async () => {
    const view = render(<Marquee>{content}</Marquee>);
    fireEvent.click(screen.getByRole('button', {name: 'Pause motion'}));
    expect(copies()).toHaveLength(0);
    expect(track().style.transform).toBe('none');
    expect(document.querySelector<HTMLElement>('[data-marquee-set]')?.style.flexWrap).toBe('wrap');
    fireEvent.click(screen.getByRole('button', {name: 'Resume motion'}));
    expect(copies().length).toBeGreaterThan(0);
    preferences.reduced = true;
    view.rerender(<Marquee>{content}</Marquee>);
    expect(copies()).toHaveLength(0);
    expect(track().style.transform).toBe('none');
    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
  });
  it('pauses while the document is hidden', async () => {
    render(<Marquee duration={5}>{content}</Marquee>);
    act(() => visibility(true));
    await waitFor(() => expect(x()).toBeLessThan(-1));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 30));});
    const stopped = x();
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 80));});
    expect(x()).toBe(stopped);
  });
  it('honors right direction and explicit gap over dials without preventing normal wheel events', async () => {
    render(<Marquee direction="right" duration={5} gap={0} dials={{direction: 'left', size: 'large'}}>{content}</Marquee>);
    act(() => visibility(true));
    await waitFor(() => expect(x()).toBeLessThan(-150));
    const first = x();
    await waitFor(() => expect(x()).toBeGreaterThan(first));
    expect(document.querySelector<HTMLElement>('[data-marquee-set]')?.style.gap).toBe('0px');
    const wheel = new WheelEvent('wheel', {deltaY: 100, bubbles: true, cancelable: true});
    screen.getByRole('region').dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });
  it('renders all original content once and visibly on the server, and handles empty children', () => {
    const html = renderToString(<Marquee>{interactiveContent}</Marquee>);
    const host = document.createElement('div'); host.innerHTML = html;
    expect(host.querySelectorAll('a')).toHaveLength(1);
    expect(host.querySelector('a')?.closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(host.querySelector<HTMLElement>('[data-marquee-set]')?.style.flexWrap).toBe('wrap');
    expect(html).toContain('transform:none');
    const view = render(<Marquee>{null}</Marquee>);
    expect(view.container.querySelector('button')).toBeNull();
  });
  it('preserves keyed original child state when content is reordered', () => {
    function Counter({name}: {name: string}) {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(value => value + 1)}>{name} {count}</button>;
    }
    const view = render(<Marquee><Counter key="alpha" name="Alpha"/><Counter key="beta" name="Beta"/></Marquee>);
    fireEvent.click(screen.getByRole('button', {name: 'Alpha 0'}));
    view.rerender(<Marquee><Counter key="beta" name="Beta"/><Counter key="alpha" name="Alpha"/></Marquee>);
    expect(screen.getByRole('button', {name: 'Alpha 1'})).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Beta 0'})).toBeTruthy();
  });
  it('keeps links and custom native controls static so visible copies never become dead tap targets', () => {
    const action = vi.fn();
    function Control() {return <button onClick={action}>Act</button>;}
    render(<Marquee>{interactiveContent}<Control/></Marquee>);
    expect(copies()).toHaveLength(0);
    expect(document.querySelectorAll('a')).toHaveLength(1);
    expect(track().style.transform).toBe('none');
    expect(document.querySelector<HTMLElement>('[data-marquee-set]')?.style.flexWrap).toBe('wrap');
    act(() => screen.getByRole('link', {name: 'One'}).focus());
    expect(document.activeElement).toBe(screen.getByRole('link', {name: 'One'}));
    fireEvent.click(screen.getByRole('button', {name: 'Act'}));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', {name: 'Pause motion'}).hasAttribute('disabled')).toBe(true);
  });
  it('keeps native media controls in one actionable original set', () => {
    const view = render(<Marquee><video controls aria-label="Clip"/></Marquee>);
    expect(copies()).toHaveLength(0);
    expect(view.container.querySelectorAll('video')).toHaveLength(1);
    expect(view.container.querySelector('video')?.closest('[inert]')).toBeNull();
  });
  it('detects an interactive control added by a child after the marquee mounts', async () => {
    let reveal: (() => void) | undefined;
    function ChangingChild() {
      const [link, setLink] = useState(false);
      reveal ??= () => setLink(true);
      return link ? <a href="#new">New link</a> : <span>Plain content</span>;
    }
    render(<Marquee><ChangingChild/></Marquee>);
    expect(copies().length).toBeGreaterThan(0);
    await act(async () => {reveal!();});
    await waitFor(() => expect(copies()).toHaveLength(0));
    expect(document.querySelectorAll('a')).toHaveLength(1);
  });
  it('hydrates reduced-motion content without duplicate markup or mismatches', async () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(<Marquee>{content}</Marquee>);
    document.body.append(host);
    preferences.reduced = true;
    const errors = vi.spyOn(console, 'error');
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {root = hydrateRoot(host, <Marquee>{content}</Marquee>);});
    try {
      expect(errors).not.toHaveBeenCalled();
      expect(host.querySelector('[data-marquee-copy]')).toBeNull();
      expect(host.querySelector<HTMLElement>('[data-marquee-track]')?.style.transform).toBe('none');
    } finally {act(() => root.unmount()); host.remove();}
  });
  it('stops immediately when the live OS preference changes without a parent render', async () => {
    const media = Object.assign(new EventTarget(), {matches: false});
    vi.stubGlobal('matchMedia', () => media);
    render(<Marquee duration={5}>{content}</Marquee>);
    act(() => visibility(true));
    await waitFor(() => expect(x()).toBeLessThan(-1));
    act(() => {media.matches = true; media.dispatchEvent(new Event('change'));});
    expect(copies()).toHaveLength(0);
    expect(track().style.transform).toBe('none');
    expect(document.querySelector<HTMLElement>('[data-marquee-set]')?.style.flexWrap).toBe('wrap');
  });
});
