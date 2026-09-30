// @vitest-environment node
import {renderToString} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FullscreenViewer} from '../src/pieces/fullscreen-viewer/FullscreenViewer';

describe('FullscreenViewer server output', () => {
  it('renders usable, fully visible thumbnails without browser globals', () => {
    const html = renderToString(<FullscreenViewer items={[{id: 'one', label: 'One', thumbnail: <img src="one.jpg" alt="One preview"/>, content: 'Modal content'}]} dials={{fade: 'full', size: 'large'}}/>);
    expect(html).toContain('aria-label="Open One"');
    expect(html).toContain('alt="One preview"');
    expect(html).not.toMatch(/opacity:0|translate|scale\(|<dialog|Modal content/);
  });
  it('supports an empty gallery on the server', () => {
    expect(renderToString(<FullscreenViewer items={[]}/>)).not.toContain('<button');
  });
});
