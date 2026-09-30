import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ImageHoverZoom} from '../src/pieces/image-hover-zoom/ImageHoverZoom';
import {resolveImageHoverZoom} from '../src/pieces/image-hover-zoom/settings';
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
let fine: EventTarget & {matches: boolean}; let reduced: EventTarget & {matches: boolean};
function pointer(element: Element, type: string, pointerType: string) {fireEvent(element, Object.assign(new Event(type, {bubbles: true}), {pointerType}));}
beforeEach(() => {fine = Object.assign(new EventTarget(), {matches: true}); reduced = Object.assign(new EventTarget(), {matches: false}); vi.stubGlobal('matchMedia', (q: string) => q.includes('reduced') ? reduced : fine);});
afterEach(() => {cleanup(); vi.unstubAllGlobals();});
describe('ImageHoverZoom', () => {
  it('resolves subtle zoom and token speed values with explicit prop priority', () => {
    expect(resolveImageHoverZoom({})).toMatchObject({scale: 1.03, duration: 1});
    for (const [size, scale] of [['small', 1.015], ['medium', 1.03], ['large', 1.06]] as const) expect(resolveImageHoverZoom({dials: {size}}).scale).toBeCloseTo(scale);
    for (const [speed, duration] of [['slow', 1.875], ['normal', 1], ['fast', .5625]] as const) expect(resolveImageHoverZoom({dials: {speed}}).duration).toBeCloseTo(duration);
    expect(resolveImageHoverZoom({scale: 1, duration: 0, dials: {size: 'large', speed: 'slow'}})).toMatchObject({scale: 1, duration: 0});
    expect(resolveImageHoverZoom({scale: 10, duration: -1})).toMatchObject({scale: 1.2, duration: 0});
  });
  it('preserves image alt text and remains fully visible on the server', () => {
    const html = renderToString(<ImageHoverZoom><img src="/sample.jpg" alt="Walking together"/></ImageHoverZoom>);
    expect(html).toContain('alt="Walking together"'); expect(html).toContain('transform:none'); expect(html).toContain('overflow:hidden'); expect(html).not.toContain('filter'); expect(html).not.toContain('aria-hidden');
  });
  it('zooms inside a clipped frame only for fine pointers', () => {
    render(<ImageHoverZoom><img src="/sample.jpg" alt="Walking together"/></ImageHoverZoom>);
    const content = screen.getByAltText('Walking together').parentElement!; const frame = content.parentElement!;
    expect(frame.style.overflow).toBe('hidden');
    pointer(frame, 'pointerover', 'touch'); expect(content.style.transform).toBe('none');
    pointer(frame, 'pointerover', 'mouse'); expect(content.style.transform).toBe('scale(1.03)'); expect(content.style.transition).toBe('transform 1s cubic-bezier(0.22,1,0.36,1)');
    pointer(frame, 'pointerout', 'mouse'); expect(content.style.transform).toBe('none');
  });
  it('keeps links keyboard accessible and visible and resets for reduced motion', () => {
    render(<ImageHoverZoom><a href="/gallery">View gallery</a></ImageHoverZoom>); const link = screen.getByRole('link'); const content = link.parentElement!; const frame = content.parentElement!;
    act(() => link.focus()); expect(document.activeElement).toBe(link); expect(frame.style.outline).toBe('3px solid currentColor');
    pointer(frame, 'pointerover', 'mouse');
    act(() => {reduced.matches = true; reduced.dispatchEvent(new Event('change'));}); expect(content.style.transform).toBe('none'); expect(content.style.transition).toBe('none');
    expect(link.closest('[inert], [aria-hidden="true"]')).toBeNull();
  });
  it('disables coarse-pointer hover after a capability change and supports empty children', () => {
    const view = render(<ImageHoverZoom><span>Image placeholder</span></ImageHoverZoom>); const content = screen.getByText('Image placeholder').parentElement!;
    pointer(content.parentElement!, 'pointerover', 'mouse');
    act(() => {fine.matches = false; fine.dispatchEvent(new Event('change'));}); expect(content.style.transform).toBe('none');
    view.rerender(<ImageHoverZoom>{null}</ImageHoverZoom>); expect(view.container.textContent).toBe('');
  });
});
