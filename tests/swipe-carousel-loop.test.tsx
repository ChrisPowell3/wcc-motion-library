import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {SwipeCarousel} from '../src/pieces/swipe-carousel/SwipeCarousel';

vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
const items = Array.from({length: 4}, (_, i) => ({id: String(i), image: 'data:image/svg+xml,<svg/>', alt: `Image ${i}`, title: `Card ${i}`, text: 'Description', cta: {label: `Visit ${i}`, href: `#${i}`}}));
const region = () => screen.getByRole('region');
const active = (index: number) => expect(screen.getByRole('button', {name: `Go to card ${index + 1}`}).getAttribute('aria-current')).toBe('true');
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {observe() {} disconnect() {} unobserve() {}});
  vi.stubGlobal('ResizeObserver', class {observe() {} disconnect() {}});
});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});

describe('carousel loop interruptions', () => {
  it.each([[3, 'ArrowRight', 'ArrowLeft', -1], [0, 'ArrowLeft', 'ArrowRight', 1]] as const)('reverses a pending wrap from card %i without making another revolution', async (start, outward, inward, sign) => {
    render(<SwipeCarousel items={items} startIndex={start} fanOnView={false} dials={{loop: 'on', bounce: 'none', speed: 'slow'}}/>);
    const returningCard = screen.getAllByRole('group')[start];
    const x = () => Number(returningCard.style.transform.match(/translateX\(([-\d.]+)px\)/)?.[1] ?? 0);
    fireEvent.keyDown(region(), {key: outward});
    await waitFor(() => expect(x() * sign).toBeGreaterThan(30));
    const positions: number[] = [];
    const sample = setInterval(() => positions.push(x() * sign), 10);
    try {
      fireEvent.keyDown(region(), {key: inward}); active(start);
      await waitFor(() => expect(screen.getByRole('link', {name: `Visit ${start}`})).toBeTruthy(), {timeout: 2500});
      expect(positions.length).toBeGreaterThan(0);
      expect(Math.max(...positions)).toBeLessThan(200);
      expect(Math.min(...positions)).toBeGreaterThan(-2);
    } finally {clearInterval(sample);}
  });
  it('normalizes and stops an in-flight wrap when loop is turned off', async () => {
    const {rerender} = render(<SwipeCarousel items={items} startIndex={3} fanOnView={false} dials={{loop: 'on'}}/>);
    fireEvent.keyDown(region(), {key: 'ArrowRight'});
    await waitFor(() => {
      const x = Number(screen.getAllByRole('group')[3].style.transform.match(/translateX\(([-\d.]+)px\)/)?.[1] ?? 0);
      expect(x).toBeLessThan(-30);
    });
    rerender(<SwipeCarousel items={items} startIndex={3} fanOnView={false} dials={{loop: 'off'}}/>);
    active(0);
    expect(screen.getByRole('link', {name: 'Visit 0'})).toBeTruthy();
    await waitFor(() => expect(screen.getAllByRole('group')[0].style.transform).toBe('none'));
    await act(async () => {await new Promise(resolve => setTimeout(resolve, 900));});
    expect(screen.getAllByRole('group')[0].style.transform).toBe('none');
    fireEvent.keyDown(region(), {key: 'ArrowLeft'}); active(0);
  });
});
