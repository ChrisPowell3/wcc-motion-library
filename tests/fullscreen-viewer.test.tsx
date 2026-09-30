import {act, cleanup, fireEvent, render, screen, within, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {FullscreenViewer} from '../src/pieces/fullscreen-viewer/FullscreenViewer';

// jsdom does not implement the native dialog top layer. Real browser behavior is
// exercised in the demo; this shim supplies only its open/close DOM contract.
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {configurable: true, value: function(this: HTMLDialogElement) {this.open = true;}});
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {configurable: true, value: function(this: HTMLDialogElement) {this.open = false;}});
});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.style.cssText = ''; document.documentElement.style.cssText = '';});
const items = [
  {id: 'a', label: 'Alpine lake', thumbnail: <img src="lake.jpg" alt="Lake preview"/>, content: <a href="#lake">Lake details</a>},
  {id: 'b', label: 'Desert sky', thumbnail: <span>Desert preview</span>, content: <p>Desert details</p>},
  {id: 'c', label: 'Forest trail', thumbnail: <span>Forest preview</span>, content: <input aria-label="Trail note"/>},
];
const open = (name = 'Alpine lake') => fireEvent.click(screen.getByRole('button', {name: `Open ${name}`}));
const dialog = () => screen.getByRole('dialog');
const button = (name: string) => within(dialog()).getByRole('button', {name});

describe('FullscreenViewer', () => {
  it('opens the clicked item, marks its dot current, and Escape restores focus and scroll styles', () => {
    document.body.style.setProperty('overflow', 'scroll', 'important');
    document.documentElement.style.overflow = 'auto';
    render(<FullscreenViewer items={items}/>);
    expect(screen.queryByRole('dialog')).toBeNull();
    const trigger = screen.getByRole('button', {name: 'Open Desert sky'});
    trigger.focus(); fireEvent.click(trigger);
    expect(dialog().getAttribute('aria-label')).toBe('Fullscreen viewer');
    expect(within(dialog()).getByText('Desert details')).toBeTruthy();
    expect(button('Show Desert sky').getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).toBe(button('Close viewer'));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
    fireEvent.keyDown(dialog(), {key: 'Escape'});
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
    expect(document.documentElement.style.overflow).toBe('auto');
  });
  it('navigates with arrows, buttons and dots, including default looping', () => {
    render(<FullscreenViewer items={items}/>); open();
    fireEvent.keyDown(dialog(), {key: 'ArrowLeft'});
    expect(button('Show Forest trail').getAttribute('aria-current')).toBe('true');
    fireEvent.click(button('Next item'));
    expect(button('Show Alpine lake').getAttribute('aria-current')).toBe('true');
    fireEvent.click(button('Show Desert sky'));
    fireEvent.keyDown(dialog(), {key: 'ArrowRight'});
    expect(button('Show Forest trail').getAttribute('aria-current')).toBe('true');
  });
  it('honors loop off and explicit loop overrides its dial', () => {
    const view = render(<FullscreenViewer items={items} dials={{loop: 'off'}}/>); open();
    expect((button('Previous item') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(dialog(), {key: 'ArrowLeft'});
    expect(button('Show Alpine lake').getAttribute('aria-current')).toBe('true');
    view.rerender(<FullscreenViewer items={items} loop dials={{loop: 'off'}}/>);
    fireEvent.keyDown(dialog(), {key: 'ArrowLeft'});
    expect(button('Show Forest trail').getAttribute('aria-current')).toBe('true');
  });
  it('traps Tab at both boundaries and preserves editing arrow keys', () => {
    render(<FullscreenViewer items={items}/>); open('Forest trail');
    const first = button('Close viewer'), last = button('Next item');
    last.focus(); fireEvent.keyDown(last, {key: 'Tab'});
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, {key: 'Tab', shiftKey: true});
    expect(document.activeElement).toBe(last);
    const input = within(dialog()).getByRole('textbox');
    input.focus(); fireEvent.keyDown(input, {key: 'ArrowRight'});
    expect(button('Show Forest trail').getAttribute('aria-current')).toBe('true');
  });
  it('closes on native cancel and background click but not content clicks', () => {
    render(<FullscreenViewer items={items}/>); open();
    fireEvent.click(within(dialog()).getByText('Lake details'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent(dialog(), new Event('cancel', {bubbles: false, cancelable: true}));
    expect(screen.queryByRole('dialog')).toBeNull();
    open(); fireEvent.click(dialog().firstElementChild!);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('deduplicates ids, handles one item, and closes when the active item disappears', () => {
    const view = render(<FullscreenViewer items={[items[0], items[0]]}/>);
    expect(screen.getAllByRole('button')).toHaveLength(1); open();
    expect((button('Previous item') as HTMLButtonElement).disabled).toBe(true);
    expect((button('Next item') as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<FullscreenViewer items={[]}/>);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    view.rerender(<FullscreenViewer items={items}/>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('preserves selection through reorder and restores scroll on unmount', () => {
    document.body.style.overflow = 'clip';
    const view = render(<FullscreenViewer items={items}/>); open('Desert sky');
    view.rerender(<FullscreenViewer items={[items[2], items[0], items[1]]}/>);
    expect(button('Show Desert sky').getAttribute('aria-current')).toBe('true');
    view.unmount(); expect(document.body.style.overflow).toBe('clip');
  });
  it('keeps reduced motion usable and removes movement when the preference changes live', async () => {
    const media = Object.assign(new EventTarget(), {matches: false});
    vi.stubGlobal('matchMedia', () => media);
    render(<FullscreenViewer items={items} duration={3}/>); open();
    act(() => {media.matches = true; media.dispatchEvent(new Event('change'));});
    await waitFor(() => expect(within(dialog()).getByText('Lake details').parentElement?.style.transform).toBe('none'));
    fireEvent.keyDown(dialog(), {key: 'ArrowRight'});
    expect(within(dialog()).getByText('Desert details')).toBeTruthy();
    fireEvent.keyDown(dialog(), {key: 'Escape'});
    expect(document.body.style.overflow).toBe('');
  });
  it('keeps nested viewers isolated and locks scrolling until the final viewer closes', () => {
    const nested = [{...items[0], content: <FullscreenViewer items={[items[1], items[2]]} ariaLabel="Inner viewer"/>}, items[2]];
    render(<FullscreenViewer items={nested} ariaLabel="Outer viewer"/>); open(); open('Desert sky');
    const inner = screen.getByRole('dialog', {name: 'Inner viewer'});
    fireEvent.keyDown(inner, {key: 'ArrowRight'});
    const outer = screen.getByRole('dialog', {name: 'Outer viewer'});
    expect(within(outer).getByRole('button', {name: 'Show Alpine lake'}).getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(inner, {key: 'Escape'});
    expect(screen.queryByRole('dialog', {name: 'Inner viewer'})).toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(outer, {key: 'Escape'});
    expect(document.body.style.overflow).toBe('');
  });
  it('keeps a nested touch swipe inside the inner viewer', () => {
    const nested = [{...items[0], content: <FullscreenViewer items={[items[1], items[2]]} ariaLabel="Inner viewer"/>}, items[2]];
    render(<FullscreenViewer items={nested} ariaLabel="Outer viewer"/>); open(); open('Desert sky');
    const inner = screen.getByRole('dialog', {name: 'Inner viewer'});
    const content = within(inner).getByText('Desert details').parentElement!;
    const pointer = (type: string, x: number) => fireEvent(content, Object.assign(new Event(type, {bubbles: true}), {pointerType: 'touch', pointerId: 1, clientX: x, clientY: 100}));
    pointer('pointerdown', 200); pointer('pointerup', 80);
    expect(screen.getByRole('dialog', {name: 'Inner viewer'})).toBe(inner);
    expect(within(inner).getByRole('button', {name: 'Show Forest trail'}).getAttribute('aria-current')).toBe('true');
    const outer = screen.getByRole('dialog', {name: 'Outer viewer'});
    expect(within(outer).getByRole('button', {name: 'Show Alpine lake'}).getAttribute('aria-current')).toBe('true');
  });
  it('supports horizontal touch swipes while ignoring predominantly vertical gestures', () => {
    render(<FullscreenViewer items={items} duration={0}/>); open();
    const content = within(dialog()).getByText('Lake details').parentElement!;
    const pointer = (type: string, x: number, y: number) => fireEvent(content, Object.assign(new Event(type, {bubbles: true}), {pointerType: 'touch', pointerId: 1, clientX: x, clientY: y}));
    pointer('pointerdown', 200, 100); pointer('pointerup', 80, 250);
    expect(button('Show Alpine lake').getAttribute('aria-current')).toBe('true');
    pointer('pointerdown', 200, 100); pointer('pointerup', 80, 110);
    expect(button('Show Desert sky').getAttribute('aria-current')).toBe('true');
  });
  it('applies supported size/fade dials and explicit motion settings override them', () => {
    const view = render(<FullscreenViewer items={items} dials={{size: 'large', fade: 'none', blur: 'strong'}}/>); open();
    let content = within(dialog()).getByText('Lake details').parentElement!;
    expect(content.style.transform).toContain('translateY(36px)');
    expect(content.style.opacity).toBe('1');
    expect(content.style.filter).toBe('');
    fireEvent.keyDown(dialog(), {key: 'Escape'});
    view.rerender(<FullscreenViewer items={items} dials={{size: 'large', fade: 'none'}} distance={8} startScale={.9} fade="full" overlayDuration={0}/>); open();
    content = within(dialog()).getByText('Lake details').parentElement!;
    expect(content.style.transform).toContain('translateY(8px) scale(0.9)');
    expect(content.style.opacity).toBe('0');
    expect((dialog().firstElementChild as HTMLElement).style.opacity).toBe('1');
  });
  it('renders reduced motion instantly from the first open', () => {
    const media = Object.assign(new EventTarget(), {matches: true});
    vi.stubGlobal('matchMedia', () => media);
    render(<FullscreenViewer items={items}/>); open();
    expect(within(dialog()).getByText('Lake details').parentElement?.style.transform).not.toMatch(/translate|scale/);
    expect((dialog().firstElementChild as HTMLElement).style.opacity).toBe('1');
  });

  it('shares the half-opacity soft fade vocabulary and safely bounds malformed numeric settings', () => {
    render(<FullscreenViewer items={items} dials={{fade:'soft'}} distance={Infinity} startScale={-1} maxWidth={Infinity} gap={-10}/>); open();
    const content = within(dialog()).getByText('Lake details').parentElement!;
    expect(content.style.opacity).toBe('0.5');
    expect(content.style.transform).toContain('translateY(24px) scale(0.8)');
    expect(content.style.maxWidth).toBe('1100px');
  });

});


it('matches the reference full-fade default on opening',()=>{
 render(<FullscreenViewer items={items}/>);open();
 expect(within(dialog()).getByText('Lake details').parentElement?.style.opacity).toBe('0');
});
