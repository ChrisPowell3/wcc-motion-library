import {act, cleanup, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {StarPop, resolveStarPopSettings} from '../src/pieces/star-pop/StarPop';
const preference = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => preference.reduced}));
const observers = new Set<{targets: Set<Element>; callback: IntersectionObserverCallback}>();
const enter = () => act(() => observers.forEach(observer => observer.callback([...observer.targets].map(target => ({target, isIntersecting: true}) as IntersectionObserverEntry), {} as IntersectionObserver)));
beforeEach(() => {preference.reduced = false; vi.stubGlobal('IntersectionObserver', class {
 targets = new Set<Element>(); constructor(public callback: IntersectionObserverCallback) {observers.add(this);} observe(target: Element) {this.targets.add(target);} unobserve(target: Element) {this.targets.delete(target);} disconnect() {this.targets.clear(); observers.delete(this);}
});});
afterEach(() => {cleanup(); observers.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
describe('StarPop', () => {
 it('has visible server content, then plays a staggered pop and settles exactly', async () => {
  expect(renderToString(<StarPop><span>★</span></StarPop>)).not.toContain('opacity:0');
  render(<StarPop duration={.06} delay={0} stagger={.3}>{[<span key="a">First</span>, <span key="b">Second</span>]}</StarPop>);
  const first = screen.getByText('First').parentElement!, second = screen.getByText('Second').parentElement!;
  await waitFor(() => expect(first.style.opacity).toBe('0')); expect(first.style.transform).toContain('rotate(-40deg)');
  enter(); await waitFor(() => expect(first.style.transform).toBe('none'));
  expect(Number(second.style.opacity)).toBeLessThan(1);
  await waitFor(() => expect(second.style.transform).toBe('none'));
  expect(second.style.opacity).toBe('1');
 });
 it('preserves a pending entrance across equivalent inline dials objects', async () => {
  const {rerender} = render(<StarPop delay={5} dials={{speed: 'normal'}}><span>Pending</span></StarPop>);
  const frame = screen.getByText('Pending').parentElement!;
  await waitFor(() => expect(frame.style.opacity).toBe('0')); enter();
  rerender(<StarPop delay={5} dials={{speed: 'normal'}}><span>Pending</span></StarPop>);
  await act(async () => {await new Promise(resolve => setTimeout(resolve, 50));});
  expect(frame.style.opacity).toBe('0');
 });
 it('cancels delayed motion when a descendant receives keyboard focus', async () => {
  render(<StarPop delay={5}><button>Choose</button></StarPop>);
  const button = screen.getByRole('button', {name: 'Choose'}); expect(button.closest('[inert]')).toBeNull();
  act(() => button.focus()); enter();
  await waitFor(() => expect(button.parentElement?.style.opacity).toBe('1'));
  expect(button.parentElement?.style.transform).toBe('none');
 });
 it('honors live reduced motion and removes observers on unmount', async () => {
  const {rerender, unmount} = render(<StarPop><span>Star</span></StarPop>);
  preference.reduced = true; rerender(<StarPop><span>Star</span></StarPop>);
  await waitFor(() => expect(screen.getByText('Star').parentElement?.style.transform).toBe('none'));
  unmount(); expect([...observers].every(observer => observer.targets.size === 0)).toBe(true);
 });
 it('resolves distinct bounce paths and timing with explicit props winning', () => {
  expect(resolveStarPopSettings({})).toMatchObject({duration: .6, delay: .25, stagger: .11, peakScale: 1.25, startRotate: -40, peakRotate: 8});
  expect(resolveStarPopSettings({dials: {bounce: 'none'}})).toMatchObject({peakScale: 1, startRotate: 0, peakRotate: 0});
  expect(resolveStarPopSettings({dials: {bounce: 'soft'}})).toMatchObject({peakScale: 1.08, startRotate: -20, peakRotate: 3});
  expect(resolveStarPopSettings({bounce: 'none', duration: 2, delay: 0, dials: {bounce: 'springy', speed: 'fast', delay: 'long'}})).toMatchObject({duration: 2, delay: 0, peakScale: 1});
 });
 it('supports empty and single children without adding semantics', () => {
  const {container, rerender} = render(<StarPop>{[]}</StarPop>); expect(container.childElementCount).toBe(0);
  preference.reduced = true; rerender(<StarPop><span role="img" aria-label="Five stars">★★★★★</span></StarPop>);
  expect(screen.getAllByRole('img')).toHaveLength(1);
 });
});
