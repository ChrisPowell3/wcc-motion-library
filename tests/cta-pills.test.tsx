import {act, cleanup, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CtaPills, resolveCtaPillsSettings} from '../src/pieces/cta-pills/CtaPills';
const preference = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => preference.reduced}));
const observers = new Set<{targets: Set<Element>; callback: IntersectionObserverCallback}>();
const visibility = (visible: boolean) => act(() => observers.forEach(observer => observer.callback([...observer.targets].map(target => ({target, isIntersecting: visible}) as IntersectionObserverEntry), {} as IntersectionObserver)));
beforeEach(() => {preference.reduced = false; vi.stubGlobal('IntersectionObserver', class {targets = new Set<Element>(); constructor(public callback: IntersectionObserverCallback) {observers.add(this);} observe(target: Element) {this.targets.add(target);} unobserve(target: Element) {this.targets.delete(target);} disconnect() {this.targets.clear(); observers.delete(this);}});});
afterEach(() => {cleanup(); observers.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
describe('CtaPills', () => {
 it('ships readable server content, reveals without retained blur, then bobs', async () => {
  expect(renderToString(<CtaPills><button>Join</button></CtaPills>)).toContain('filter:none');
  render(<CtaPills duration={.06} delay={0} floatDelay={.15} floatDuration={.2}><button>Join</button></CtaPills>);
  const button = screen.getByRole('button', {name: 'Join'}), idle = button.parentElement!, frame = idle.parentElement!;
  await waitFor(() => expect(frame.style.filter).toBe('blur(6px)'));
  expect(button.closest('[inert]')).toBeNull();
  visibility(true); await waitFor(() => expect(frame.style.filter).toBe('none'));
  expect(frame.style.opacity).toBe('1');
  await waitFor(() => expect(idle.style.transform).toContain('translateY(-'));
 });
 it('preserves delayed entrances across equivalent inline dials objects', async () => {
  const {rerender} = render(<CtaPills delay={5} floatDelay={10} dials={{speed: 'normal'}}><span>Pending</span></CtaPills>);
  const frame = screen.getByText('Pending').parentElement!.parentElement!;
  await waitFor(() => expect(frame.style.opacity).toBe('0')); visibility(true);
  rerender(<CtaPills delay={5} floatDelay={10} dials={{speed: 'normal'}}><span>Pending</span></CtaPills>);
  await act(async () => {await new Promise(resolve => setTimeout(resolve, 50));});
  expect(frame.style.opacity).toBe('0'); expect(frame.style.filter).toBe('blur(6px)');
 });
 it('focus ends all pending entrance and idle motion without changing child semantics', async () => {
  render(<CtaPills delay={5}><a href="#join">Join</a></CtaPills>);
  const link = screen.getByRole('link', {name: 'Join'}), idle = link.parentElement!, frame = idle.parentElement!;
  act(() => link.focus()); visibility(true);
  await waitFor(() => expect(frame.style.opacity).toBe('1'));
  expect(frame.style.filter).toBe('none'); expect(idle.style.transform).toBe('none');
  expect(screen.getAllByRole('link')).toHaveLength(1);
 });
 it('resolves reference timing, dial effects and explicit overrides', () => {
  expect(resolveCtaPillsSettings({})).toMatchObject({duration: .9, delay: .2, stagger: .14, distance: 16, scale: .9, blur: 6, bob: 4, floatDuration: 2.8, floatStep: .4, floatDelay: 1.2, floatDelayStep: .3});
  expect(resolveCtaPillsSettings({dials: {size: 'large', blur: 'strong', delay: 'long'}})).toMatchObject({distance: 24, bob: 6, blur: 10, delay: .8});
  expect(resolveCtaPillsSettings({distance: 8, blur: 0, delay: 0, dials: {size: 'large', blur: 'strong', delay: 'long'}})).toMatchObject({distance: 8, blur: 0, delay: 0});
 });
 it('resets all tracks under live reduced motion and cleans up observers', async () => {
  const {rerender, unmount} = render(<CtaPills><span>Content</span></CtaPills>);
  preference.reduced = true; rerender(<CtaPills><span>Content</span></CtaPills>);
  const idle = screen.getByText('Content').parentElement!, frame = idle.parentElement!;
  await waitFor(() => expect(frame.style.transform).toBe('none'));
  expect(frame.style.filter).toBe('none'); expect(idle.style.transform).toBe('none');
  unmount(); expect([...observers].every(observer => observer.targets.size === 0)).toBe(true);
 });
 it('supports an empty child collection', () => {const {container} = render(<CtaPills>{[]}</CtaPills>); expect(container.childElementCount).toBe(0);});
});
