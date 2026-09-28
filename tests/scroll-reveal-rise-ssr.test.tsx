// @vitest-environment node
import {describe, expect, it} from 'vitest';
import {renderToString} from 'react-dom/server';
import {ScrollRevealRise} from '../src';

describe('ScrollRevealRise server rendering', () => {
  it('renders readable, fully visible content without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const html = renderToString(<ScrollRevealRise as="image"><a href="#next">Next section</a><img src="/placeholder.svg" alt="A green placeholder"/></ScrollRevealRise>);
    expect(html).toContain('Next section');
    expect(html).toContain('alt="A green placeholder"');
    expect(html).toContain('opacity:1');
    expect(html).toContain('transform:none');
    expect(html).not.toContain('aria-hidden');
    expect(html).not.toContain('inert');
  });
});
