import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {Accordion} from '../src/pieces/accordion/Accordion';

const preferences = vi.hoisted(() => ({reduced: false}));
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => preferences.reduced}));
const items = [
  {id: 'a', heading: 'First question', content: <a href="#answer">First answer</a>},
  {id: 'b', heading: 'Second question', content: 'Second answer'},
  {id: 'c', heading: 'Third question', content: 'Third answer'},
];
const header = (index = 0) => screen.getByRole('button', {name: items[index].heading});
const panel = (index = 0) => document.getElementById(header(index).getAttribute('aria-controls')!)!;
afterEach(() => {cleanup(); preferences.reduced = false; vi.restoreAllMocks(); vi.unstubAllGlobals();});

describe('Accordion', () => {
  it('starts closed and toggles exactly one accessible panel', () => {
    const onChange = vi.fn();
    render(<Accordion items={items} onChange={onChange}/>);
    expect(header().getAttribute('aria-expanded')).toBe('false');
    expect(panel().hasAttribute('inert')).toBe(true);
    fireEvent.click(header());
    expect(header().getAttribute('aria-expanded')).toBe('true');
    expect(panel().hasAttribute('inert')).toBe(false);
    expect(panel().getAttribute('aria-labelledby')).toBe(header().id);
    expect(panel().style.gridTemplateRows).toBe('1fr');
    expect(panel().querySelector<HTMLElement>('[data-accordion-content]')?.style.transition).toBe('opacity 0.4s ease');
    fireEvent.click(header(1));
    expect(header().getAttribute('aria-expanded')).toBe('false');
    expect(header(1).getAttribute('aria-expanded')).toBe('true');
    expect(onChange).toHaveBeenLastCalledWith(['b']);
    fireEvent.click(header(1));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
  it('moves focus with arrows, Home and End without changing expanded state', () => {
    render(<Accordion items={items}/>);
    act(() => header().focus());
    fireEvent.keyDown(header(), {key: 'ArrowUp'});
    expect(document.activeElement).toBe(header(2));
    fireEvent.keyDown(header(2), {key: 'ArrowDown'});
    expect(document.activeElement).toBe(header());
    fireEvent.keyDown(header(), {key: 'End'});
    expect(document.activeElement).toBe(header(2));
    fireEvent.keyDown(header(2), {key: 'Home'});
    expect(document.activeElement).toBe(header());
    expect(header().getAttribute('aria-expanded')).toBe('false');
    expect(header().getAttribute('type')).toBe('button');
  });
  it('supports many panels through cascade together and explicit multiple wins', () => {
    const view = render(<Accordion items={items} dials={{cascade: 'together'}}/>);
    fireEvent.click(header()); fireEvent.click(header(1));
    expect(header().getAttribute('aria-expanded')).toBe('true');
    expect(header(1).getAttribute('aria-expanded')).toBe('true');
    view.rerender(<Accordion items={items} multiple={false} dials={{cascade: 'together'}}/>);
    expect(screen.getAllByRole('button', {expanded: true})).toHaveLength(1);
    fireEvent.click(header(2));
    expect(screen.getAllByRole('button', {expanded: true})).toEqual([header(2)]);
    view.rerender(<Accordion items={items} multiple dials={{cascade: 'cascade'}}/>);
    fireEvent.click(header());
    expect(screen.getAllByRole('button', {expanded: true})).toHaveLength(2);
  });
  it('restores only valid default ids, deduplicates, and safely handles item removal and empty sets', () => {
    const view = render(<Accordion items={items} multiple defaultOpenIds={['missing', 'b', 'b', 'a']}/>);
    expect(screen.getAllByRole('button', {expanded: true})).toHaveLength(2);
    view.rerender(<Accordion items={items.slice(2)} multiple/>);
    expect(screen.queryAllByRole('button', {expanded: true})).toHaveLength(0);
    view.rerender(<Accordion items={[]}/>);
    expect(screen.queryByRole('button')).toBeNull();
  });
  it.each([['slow', 0.9375], ['normal', 0.5], ['fast', 0.28125]] as const)('uses %s timing and explicit duration overrides it', (speed, seconds) => {
    const view = render(<Accordion items={items} dials={{speed}}/>);
    expect(panel().style.transition).toContain(`${seconds}s`);
    view.rerender(<Accordion items={items} dials={{speed}} duration={0}/>);
    expect(panel().style.transition).toBe('none');
  });
  it('uses instant panels, icon and opacity when reduced motion changes live', () => {
    const view = render(<Accordion items={items}/>);
    fireEvent.click(header());
    preferences.reduced = true;
    view.rerender(<Accordion items={items}/>);
    expect(panel().style.transition).toBe('none');
    expect(header().querySelector('svg')?.style.transition).toBe('none');
    expect(panel().querySelector<HTMLElement>('[data-accordion-content]')?.style.transition).toBe('none');
    fireEvent.click(header(1));
    expect(panel(1).style.gridTemplateRows).toBe('1fr');
  });
  it('responds to real media-query changes without requiring a parent render', () => {
    const media = Object.assign(new EventTarget(), {matches: false});
    vi.stubGlobal('matchMedia', () => media);
    render(<Accordion items={items}/>);
    fireEvent.click(header());
    act(() => {media.matches = true; media.dispatchEvent(new Event('change'));});
    expect(panel().style.transition).toBe('none');
    expect(panel().style.gridTemplateRows).toBe('1fr');
  });
  it('renders the requested expanded state on the server and namespaces ids per instance', () => {
    const html = renderToString(<><Accordion items={items} defaultOpenIds={['a']}/><Accordion items={items}/></>);
    const host = document.createElement('div'); host.innerHTML = html;
    const ids = [...host.querySelectorAll('[id]')].map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(host.querySelector('a')?.closest('[inert]')).toBeNull();
    expect(host.querySelector('[role="region"]')?.getAttribute('style')).toContain('grid-template-rows:1fr');
  });
});
