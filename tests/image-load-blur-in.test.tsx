import {StrictMode} from 'react';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {renderToString} from 'react-dom/server';
import {ImageLoadBlurIn,resolveImageLoadSettings} from '../src/pieces/image-load-blur-in/ImageLoadBlurIn';
const preference=vi.hoisted(()=>({reduced:false}));
vi.mock('motion/react',async original=>({...await original<typeof import('motion/react')>(),useReducedMotion:()=>preference.reduced}));
beforeEach(()=>{preference.reduced=false;});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('ImageLoadBlurIn',()=>{
 it('renders an accessible final image on the server',()=>{
  const html=renderToString(<ImageLoadBlurIn src="photo.jpg" alt="Mountain"/>);
  expect(html).toContain('alt="Mountain"');expect(html).toContain('filter:none');expect(html).toContain('transform:none');
 });
 it('plays only on image load and clears the filter at completion',async()=>{
  render(<ImageLoadBlurIn src="photo.jpg" alt="Mountain" duration={.1} delay={1}/>);
  const img=screen.getByAltText('Mountain');expect(img.style.filter).toBe('none');
  fireEvent.load(img);await waitFor(()=>expect(img.style.filter).toBe('blur(6px)'));
  await waitFor(()=>expect(img.style.filter).toBe('none'),{timeout:2000});
  expect(img.style.transform).toBe('none');
  fireEvent.load(img);expect(img.style.filter).toBe('none');
 });
 it('handles cached images through StrictMode and leaves failed sources readable',async()=>{
  vi.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(100);
  render(<StrictMode><ImageLoadBlurIn src="cached.jpg" alt="Cached" duration={.1} delay={1}/></StrictMode>);
  const img=screen.getByAltText('Cached');await waitFor(()=>expect(img.style.filter).toBe('blur(6px)'));
  fireEvent.error(img);await waitFor(()=>expect(img.style.filter).toBe('none'));expect(img.style.transform).toBe('none');
 });
 it('restarts for new sources but not equivalent dial objects, and reduced motion always wins',async()=>{
  const view=render(<ImageLoadBlurIn src="one.jpg" alt="Photo" delay={1} dials={{blur:'strong'}}/>);
  const img=screen.getByAltText('Photo');fireEvent.load(img);await waitFor(()=>expect(img.style.filter).toBe('blur(10px)'));
  view.rerender(<ImageLoadBlurIn src="one.jpg" alt="Photo" delay={1} dials={{blur:'strong'}}/>);expect(img.style.filter).toBe('blur(10px)');
  preference.reduced=true;view.rerender(<ImageLoadBlurIn src="two.jpg" alt="Photo" dials={{blur:'strong',size:'large'}}/>);
  fireEvent.load(img);await waitFor(()=>expect(img.style.filter).toBe('none'));expect(img.style.transform).toBe('none');
 });
 it('keeps focusable content outside the image and all dial values distinct with explicit priority',()=>{
  const base=resolveImageLoadSettings({});expect(base).toMatchObject({duration:1.8,startScale:1.05,blur:6,delay:0});
  for(const [dial,values] of Object.entries({speed:['slow','normal','fast'],size:['small','medium','large'],blur:['none','soft','strong'],delay:['none','short','long']})){
   const settings=values.map(value=>resolveImageLoadSettings({dials:{[dial]:value}}));expect(new Set(settings.map(value=>JSON.stringify(value))).size).toBe(values.length);
  }
  expect(resolveImageLoadSettings({duration:0,startScale:1,blur:0,delay:0,dials:{speed:'slow',size:'large',blur:'strong',delay:'long'}})).toMatchObject({duration:0,startScale:1,blur:0,delay:0});
 });
});


it.each(['scrub', 'always', 'once'])('keeps image load once and sharp during scroll with plays=%s', async plays => {
  const view = render(<ImageLoadBlurIn src="photo.jpg" alt="Load only" dials={{plays}} duration={.03}/>);
  const img = screen.getByAltText('Load only');
  fireEvent.load(img); await waitFor(() => expect(img.style.filter).not.toBe('none')); await waitFor(() => expect(img.style.filter).toBe('none'));
  for (const value of [1000, 0, 1000]) {vi.stubGlobal('scrollY', value); fireEvent.scroll(window); fireEvent.load(img); expect(img.style.filter).toBe('none');}
  preference.reduced = true; view.rerender(<ImageLoadBlurIn src="other.jpg" alt="Load only" dials={{plays}}/>);
  fireEvent.load(img); await waitFor(() => {expect(img.style.filter).toBe('none'); expect(img.style.transform).toBe('none');});
});
