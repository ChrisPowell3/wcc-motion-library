import {act, cleanup, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CountUp as ActualCountUp, countText, resolveCountUpSettings} from '../src/pieces/count-up/CountUp';
// Retain coverage of the legacy timed path; plays.test.tsx exercises the house scrub default.
function CountUp(props: React.ComponentProps<typeof ActualCountUp>) {
  return <ActualCountUp {...props} dials={{plays: 'once', ...props.dials}}/>;
}

const preference = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => preference.reduced}));
const observers = new Set<{targets: Set<Element>; callback: IntersectionObserverCallback}>();
function visibility(visible: boolean) {act(() => observers.forEach(observer => observer.callback([...observer.targets].map(target => ({target, isIntersecting: visible}) as IntersectionObserverEntry), {} as IntersectionObserver)));}
beforeEach(() => {preference.reduced = false; vi.stubGlobal('IntersectionObserver', class {
  targets = new Set<Element>(); constructor(public callback: IntersectionObserverCallback) {observers.add(this);}
  observe(target: Element) {this.targets.add(target);} unobserve(target: Element) {this.targets.delete(target);} disconnect() {this.targets.clear(); observers.delete(this);}
});});
afterEach(() => {cleanup(); observers.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
describe('CountUp', () => {
  it('renders exact final strings in server markup and keeps accessible labels unchanged during counting', async () => {
    const values = ['−182', '$49', '100k+', '25+', '1,234.50'];
    const html = renderToString(<CountUp>{values}</CountUp>);
    values.forEach(value => expect(html).toContain(value));
    render(<CountUp duration={.08} delay={0} stagger={0}>{values}</CountUp>);
    values.forEach(value => expect(screen.getByRole('group', {name: value})).toBeTruthy());
    expect(screen.getByRole('group', {name: '$49'}).textContent).toBe('$0');
    visibility(true);
    await waitFor(() => values.forEach(value => expect(screen.getByRole('group', {name: value}).textContent).toBe(value)));
    expect(screen.getByRole('group', {name: '$49'}).firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
  it.each([['−182', '−91'], ['$49', '$25'], ['100k+', '50k+'], ['25+', '13+'], ['12,345', '6,173'], ['1,234.50', '617.25'], ['007.00', '3.50']])('preserves formatted magnitude for %s', (original, middle) => {
    expect(countText(original, .5)).toBe(middle);
    expect(countText(original, 1)).toBe(original);
  });
  it.each(['slow', 'normal', 'fast'])('accepts %s speed with bounded explicit values', speed => {
    const durations = ['slow', 'normal', 'fast'].map(value => resolveCountUpSettings({dials: {speed: value}}).duration);
    expect(new Set(durations).size).toBe(3);
    expect(resolveCountUpSettings({duration: -2, delay: 99, dials: {speed}})).toMatchObject({duration: 0, delay: 5});
  });
  it('preserves a delayed count when a parent recreates an equivalent dials object', () => {
    const {rerender} = render(<CountUp delay={5} dials={{speed: 'normal'}}>25+</CountUp>);
    visibility(true); expect(screen.getByRole('group').textContent).toBe('0+');
    rerender(<CountUp delay={5} dials={{speed: 'normal'}}>25+</CountUp>);
    expect(screen.getByRole('group').textContent).toBe('0+');
  });
  it('replays only with always and otherwise retains the final number', async () => {
    const {rerender} = render(<CountUp duration={.03} delay={0} dials={{plays: 'always'}}>25+</CountUp>);
    visibility(true); await waitFor(() => expect(screen.getByRole('group').textContent).toBe('25+'));
    visibility(false); expect(screen.getByRole('group').textContent).toBe('0+');
    visibility(true); await waitFor(() => expect(screen.getByRole('group').textContent).toBe('25+'));
    rerender(<CountUp duration={.03} delay={0} once dials={{plays: 'always'}}>25+</CountUp>);
    visibility(false); expect(screen.getByRole('group').textContent).toBe('25+');
  });
  it('uses stagger groups and explicit timing overrides while ignoring unsupported dials', () => {
    expect(resolveCountUpSettings({})).toMatchObject({duration: 2.2, delay: .5, stagger: .18, once: false, plays: 'scrub'});
    expect(resolveCountUpSettings({dials: {speed: 'fast', delay: 'long', plays: 'always'}})).toMatchObject({duration: 1.2375, delay: 1.1, once: false});
    expect(resolveCountUpSettings({duration: 3, delay: 0, once: true, dials: {speed: 'fast', delay: 'long', plays: 'always', size: 'large'}})).toMatchObject({duration: 3, delay: 0, once: true});
  });
  it('leaves invalid strings and empty collections safe, and resolves live reduced motion immediately', () => {
    let matches = false; let change!: () => void;
    vi.stubGlobal('matchMedia', () => ({get matches() {return matches;}, addEventListener: (_: string, fn: () => void) => {change = fn;}, removeEventListener() {}}));
    const {rerender, unmount} = render(<CountUp>{['no number', '12.5%', '']}</CountUp>);
    expect(screen.getByRole('group', {name: 'no number'}).textContent).toBe('no number');
    act(() => {matches = true; change();});
    expect(screen.getByRole('group', {name: '12.5%'}).textContent).toBe('12.5%');
    rerender(<CountUp>{[]}</CountUp>); expect(screen.queryAllByRole('group')).toHaveLength(0);
    unmount(); expect([...observers].every(observer => observer.targets.size === 0)).toBe(true);
  });
});
