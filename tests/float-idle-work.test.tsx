import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
const frames = vi.hoisted(() => {
  const original = globalThis.requestAnimationFrame;
  const state = {requested: 0};
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {state.requested++; return original(callback);});
  return state;
});
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
import {Float} from '../src/pieces/float/Float';
import {CtaPills} from '../src/pieces/cta-pills/CtaPills';
const observers = new Set<{targets: Set<Element>; callback: IntersectionObserverCallback}>();
const visibility = (visible: boolean) => act(() => observers.forEach(observer => observer.callback([...observer.targets].map(target => ({target, isIntersecting: visible}) as IntersectionObserverEntry), {} as IntersectionObserver)));
const wait = (ms: number) => act(async () => {await new Promise(resolve => setTimeout(resolve, ms));});
beforeEach(() => {vi.stubGlobal('IntersectionObserver', class {targets = new Set<Element>(); constructor(public callback: IntersectionObserverCallback) {observers.add(this);} observe(target: Element) {this.targets.add(target);} unobserve(target: Element) {this.targets.delete(target);} disconnect() {this.targets.clear(); observers.delete(this);}});});
afterEach(() => {cleanup(); observers.clear(); vi.restoreAllMocks();});
describe('idle motion work suspension', () => {
  it.each(['float', 'pills'])('%s stops its animation driver offscreen and in hidden documents', async kind => {
    render(kind === 'float' ? <Float duration={.3}><span>Idle</span></Float> : <CtaPills duration={.03} delay={0} floatDelay={0} floatDuration={.3}><span>Idle</span></CtaPills>);
    const idle = screen.getByText('Idle').parentElement!;
    visibility(true); await waitFor(() => expect(idle.style.transform).toContain('translateY(-'));
    visibility(false); await wait(100);
    const stopped = frames.requested, position = idle.style.transform;
    await wait(100); expect(frames.requested).toBe(stopped); expect(idle.style.transform).toBe(position);
    visibility(true); await waitFor(() => expect(idle.style.transform).not.toBe(position));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true); fireEvent(document, new Event('visibilitychange'));
    await wait(100); const hidden = frames.requested;
    await wait(100); expect(frames.requested).toBe(hidden);
  });
});
