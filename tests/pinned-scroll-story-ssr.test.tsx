// @vitest-environment node
import {renderToString} from 'react-dom/server';
import {expect, it} from 'vitest';
import {PinnedScrollStory} from '../src/pieces/pinned-scroll-story/PinnedScrollStory';

it('imports without a browser and exposes all story content before hydration', () => {
  const html = renderToString(<PinnedScrollStory items={[
    {id: 'a', label: 'One', content: <p>Beginning</p>},
    {id: 'b', label: 'Two', content: <p>Middle</p>},
    {id: 'c', label: 'Three', content: <p>End</p>},
  ]}/>);
  expect(html).toContain('Beginning'); expect(html).toContain('Middle'); expect(html).toContain('End');
  expect(html).toContain('At a glance'); expect(html).toContain('data-story-mode="flow"');
  expect(html).not.toContain('position:sticky'); expect(html).not.toContain('inert=""');
});
