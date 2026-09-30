// @vitest-environment node
import {renderToString} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {CountUp,CtaPills,Float,HoverLift,HoverTilt,ImageHoverZoom,ScrollFocus,ScrollRevealRise,StarPop} from '../src';

describe('batch server output without a browser',()=>{
  for(const [name,view] of [
    ['ScrollFocus',<ScrollFocus dials={{blur:'strong',size:'large'}}>Final text</ScrollFocus>],
    ['ScrollRevealRise',<ScrollRevealRise dials={{blur:'strong',start:'load',fade:'full'}}>Final text</ScrollRevealRise>],
    ['StarPop',<StarPop>Final text</StarPop>],
    ['Float',<Float rotate={.6}>Final text</Float>],
    ['CtaPills',<CtaPills>Final text</CtaPills>],
    ['HoverTilt',<HoverTilt>Final text</HoverTilt>],
    ['HoverLift',<HoverLift>Final text</HoverLift>],
    ['ImageHoverZoom',<ImageHoverZoom><img alt="Final text" src="image.png"/></ImageHoverZoom>],
  ] as const){
    it(`${name} renders final visible content`,()=>{
      const html=renderToString(view);
      expect(html).toContain('Final text');
      expect(html).not.toMatch(/opacity:0|blur\([1-9]|translate[XY]\(|scale\(0|rotate\(-?[1-9]/);
    });
  }
  it('renders authored number strings exactly before hydration',()=>{
    const html=renderToString(<CountUp>{['−182','$49','100k+','25+','1,234.50']}</CountUp>);
    for(const value of ['−182','$49','100k+','25+','1,234.50'])expect(html).toContain(`>${value}</span>`);
  });
});
