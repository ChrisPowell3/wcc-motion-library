// @vitest-environment node
import {describe, expect, it} from 'vitest';
import {renderToString} from 'react-dom/server';
import {Marquee} from '../src/pieces/marquee/Marquee';
import {Accordion} from '../src/pieces/accordion/Accordion';

describe('marquee and accordion server rendering', () => {
  it('needs no browser globals and keeps authored marquee content visible once', () => {
    expect(typeof document).toBe('undefined');
    const html = renderToString(<Marquee dials={{direction: 'right'}}><a href="#first">First</a><span>Second</span></Marquee>);
    expect(html).toContain('First');
    expect(html).toContain('Second');
    expect(html).toContain('transform:none');
    expect(html).not.toContain('aria-hidden');
    expect(html).not.toContain('data-marquee-copy');
  });
  it('preserves explicitly open accordion content without entrance hiding', () => {
    const html = renderToString(<Accordion defaultOpenIds={['first']} items={[{id: 'first', heading: 'Question', content: 'Answer'}]}/>);
    expect(html).toContain('grid-template-rows:1fr');
    expect(html).toContain('opacity:1');
    expect(html).not.toContain('inert');
    expect(html).toContain('aria-expanded="true"');
  });
});
