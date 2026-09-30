import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Float, resolveFloatSettings} from '../src/pieces/float/Float';
const preference = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => preference.reduced}));
const observers = new Set<{targets: Set<Element>; callback: IntersectionObserverCallback}>();
const visible = (value: boolean) => act(() => observers.forEach(observer => observer.callback([...observer.targets].map(target => ({target, isIntersecting: value}) as IntersectionObserverEntry), {} as IntersectionObserver)));
const pause = (ms: number) => act(async () => {await new Promise(resolve => setTimeout(resolve, ms));});
beforeEach(() => {preference.reduced = false; vi.stubGlobal('IntersectionObserver', class {targets = new Set<Element>(); constructor(public callback: IntersectionObserverCallback) {observers.add(this);} observe(target: Element) {this.targets.add(target);} unobserve(target: Element) {this.targets.delete(target);} disconnect() {this.targets.clear(); observers.delete(this);}});});
afterEach(() => {cleanup(); observers.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
describe('Float', () => {
 it('renders at rest on the server and floats only while visible', async () => {
  expect(renderToString(<Float>Badge</Float>)).toContain('transform:none');
  render(<Float duration={.3} phase={0}><span>Badge</span></Float>);
  const frame = screen.getByText('Badge').parentElement!;
  await pause(50); expect(frame.style.transform).toBe('none');
  visible(true); await waitFor(() => expect(frame.style.transform).toContain('translateY(-'));
  visible(false); await pause(30); const paused = frame.style.transform;
  await pause(100); expect(frame.style.transform).toBe(paused);
 });
 it('pauses while the document is hidden and stops on keyboard focus or reduced motion', async () => {
  const {rerender} = render(<Float duration={.3}><button>Join</button></Float>);
  const button = screen.getByRole('button', {name: 'Join'}), frame = button.parentElement!;
  visible(true); await waitFor(() => expect(frame.style.transform).toContain('translateY(-'));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true); fireEvent(document, new Event('visibilitychange'));
  await pause(30); const paused = frame.style.transform; await pause(70); expect(frame.style.transform).toBe(paused);
  act(() => button.focus()); await waitFor(() => expect(frame.style.transform).toBe('none'));
  preference.reduced = true; rerender(<Float duration={.3}><button>Join</button></Float>);
  visible(true); await pause(70); expect(frame.style.transform).toBe('none');
 });
 it('responds to live reduced motion during a running float and resumes without a remount', async () => {
  let matches = false; let change!: () => void;
  vi.stubGlobal('matchMedia', () => ({get matches() {return matches;}, addEventListener: (_: string, fn: () => void) => {change = fn;}, removeEventListener() {}}));
  render(<Float duration={.3}><span>Live</span></Float>);
  const frame = screen.getByText('Live').parentElement!;
  visible(true); await waitFor(() => expect(frame.style.transform).toContain('translateY(-'));
  act(() => {matches = true; change();}); await waitFor(() => expect(frame.style.transform).toBe('none'));
  await pause(80); expect(frame.style.transform).toBe('none');
  act(() => {matches = false; change();}); visible(true);
  await waitFor(() => expect(frame.style.transform).toContain('translateY(-'));
 });
 it('continues its current phase across equivalent inline dials objects', async () => {
  const {rerender} = render(<Float duration={.6} dials={{speed: 'normal'}}><span>Continuous</span></Float>);
  const frame = screen.getByText('Continuous').parentElement!;
  visible(true); await waitFor(() => expect(frame.style.transform).toContain('translateY(-'));
  rerender(<Float duration={.6} dials={{speed: 'normal'}}><span>Continuous</span></Float>);
  await pause(40); const position = frame.style.transform;
  await pause(100); expect(frame.style.transform).not.toBe(position);
 });
 it('resolves duration variations, phases, sizes and explicit overrides', () => {
  expect(resolveFloatSettings({})).toMatchObject({duration: 3.6, durationStep: .7, phase: .9, distance: 10, rotate: 0});
  expect(resolveFloatSettings({dials: {speed: 'fast', size: 'large'}})).toMatchObject({duration: 2.025, durationStep: .39375, distance: 15});
  expect(resolveFloatSettings({distance: 7, duration: 2, rotate: .6, dials: {speed: 'fast', size: 'large', loop: 'on'}})).toMatchObject({duration: 2, distance: 7, rotate: .6});
 });
 it('supports empty children and disconnects when unmounted', () => {
  const {rerender, unmount, container} = render(<Float>{[]}</Float>); expect(container.childElementCount).toBe(0);
  rerender(<Float><span>One</span></Float>); unmount(); expect([...observers].every(observer => observer.targets.size === 0)).toBe(true);
 });
});
