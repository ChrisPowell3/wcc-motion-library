// @vitest-environment node
import {describe, expect, it} from 'vitest';
import {renderToString} from 'react-dom/server';
import {SwipeCarousel} from '../src';

describe('SwipeCarousel server rendering', () => {
  it('renders generic custom content and inert side cards without browser globals', () => {
    const markup = renderToString(<SwipeCarousel
      items={[{id: 'one', heading: 'One'}, {id: 'two', heading: 'Two'}]}
      cardAspect="auto" renderCard={(item, state) => <a href={`#${item.id}`}>{item.heading}: {String(state.active)}</a>}/>);
    expect(markup).toContain('aspect-ratio:auto');
    expect(markup).toContain('inert=""');
    expect(markup).toContain('href="#two"');
    expect(markup).not.toContain('undefined');
  });
  it('imports and renders without window or document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const markup = renderToString(<SwipeCarousel items={[{id: 'one', image: '/one.svg', alt: 'One', title: 'First card', text: 'Works on the server'}]}/>);
    expect(markup).toContain('aria-roledescription="carousel"');
    expect(markup).toContain('First card');
  });
});
