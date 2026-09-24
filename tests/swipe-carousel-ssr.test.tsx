// @vitest-environment node
import {describe, expect, it} from 'vitest';
import {renderToString} from 'react-dom/server';
import {SwipeCarousel} from '../src';

describe('SwipeCarousel server rendering', () => {
  it('imports and renders without window or document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const markup = renderToString(<SwipeCarousel items={[{id: 'one', image: '/one.svg', alt: 'One', title: 'First card', text: 'Works on the server'}]}/>);
    expect(markup).toContain('aria-roledescription="carousel"');
    expect(markup).toContain('First card');
  });
});
