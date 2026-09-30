// @vitest-environment node
import {renderToString} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {CursorFollowImage,CursorProximityFade,ImageLoadBlurIn,ParallaxDrift,ScrollStackCards} from '../src';
describe('design pieces server-render without browser globals',()=>{
 for(const [name,content] of [
  ['ImageLoadBlurIn',<ImageLoadBlurIn src="photo.jpg" alt="Readable content" dials={{blur:'strong',size:'large'}}/>],
  ['CursorProximityFade',<CursorProximityFade><button>Readable content</button></CursorProximityFade>],
  ['ParallaxDrift',<ParallaxDrift>Readable content</ParallaxDrift>],
  ['ScrollStackCards',<ScrollStackCards>{[<div key="a">Readable content</div>,<div key="b">Second card</div>]}</ScrollStackCards>],
  ['CursorFollowImage',<CursorFollowImage><img src="image.jpg" alt="Readable content"/></CursorFollowImage>],
 ] as const)it(`${name} is final and visible`,()=>{
  const html=renderToString(content);expect(html).toContain('Readable content');expect(html).not.toMatch(/opacity:0|blur\([1-9]|translate[XY3]|position:sticky|scale\(0/);expect(html).not.toContain('inert');
 });
});
