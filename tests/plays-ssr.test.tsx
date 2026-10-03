// @vitest-environment node
import {renderToString} from 'react-dom/server';
import {expect, it} from 'vitest';
import {ScrollRevealRise, CountUp, StarPop, CtaPills, ScrollStackCards, ParallaxDrift, ImageLoadBlurIn} from '../src';

it.each(['scrub', 'once', 'always'])('%s renders final content without browser globals', plays => {
  const dials = {plays};
  const samples = [
    <ScrollRevealRise dials={dials}><button>Readable</button></ScrollRevealRise>,
    <CountUp dials={dials}>$1,234</CountUp>,
    <StarPop dials={dials}><button>Readable</button></StarPop>,
    <CtaPills dials={dials}><button>Readable</button></CtaPills>,
    <ScrollStackCards dials={dials}><button>Readable</button><button>Second</button></ScrollStackCards>,
    <ParallaxDrift dials={dials}>Readable</ParallaxDrift>,
    <ImageLoadBlurIn dials={dials} src="photo.jpg" alt="Readable"/>,
  ];
  for (const sample of samples) {
    const html = renderToString(sample);
    expect(html).toMatch(/Readable|\$1,234/);
    expect(html).not.toMatch(/opacity:0|blur\([1-9]|translate[XY3]|position:sticky|scale\(0/);
  }
});
