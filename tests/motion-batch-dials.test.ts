import {describe,expect,it} from 'vitest';
import {SHARED_DIALS,type MotionDials} from '../src/dials';
import {resolveCountUpSettings} from '../src/pieces/count-up/CountUp';
import {resolveStarPopSettings} from '../src/pieces/star-pop/StarPop';
import {resolveFloatSettings} from '../src/pieces/float/Float';
import {resolveCtaPillsSettings} from '../src/pieces/cta-pills/CtaPills';
import {resolveScrollFocus} from '../src/pieces/scroll-focus/settings';
import {resolveHoverTilt} from '../src/pieces/hover-tilt/settings';
import {resolveHoverLift} from '../src/pieces/hover-lift/settings';
import {resolveImageHoverZoom} from '../src/pieces/image-hover-zoom/settings';
import {resolveMarqueeSettings} from '../src/pieces/marquee/dials';

const pieces:[string,(props:{dials?:MotionDials})=>unknown,(keyof typeof SHARED_DIALS)[]][]=[
 ['CountUp',resolveCountUpSettings,['speed','delay','plays']],
 ['StarPop',resolveStarPopSettings,['speed','bounce','delay','plays']],
 ['Float',resolveFloatSettings,['speed','size']],
 ['CtaPills',resolveCtaPillsSettings,['speed','size','blur','delay','plays']],
 ['ScrollFocus',resolveScrollFocus,['speed','size','blur']],
 ['HoverTilt',resolveHoverTilt,['speed','size']],
 ['HoverLift',resolveHoverLift,['speed','size']],
 ['ImageHoverZoom',resolveImageHoverZoom,['speed','size']],
 ['Marquee',resolveMarqueeSettings,['speed','size','direction']],
];
describe('every batch word changes resolved settings',()=>{
 for(const [piece,resolve,dials] of pieces)for(const dial of dials)it(`${piece}: ${dial}`,()=>{
  const values=SHARED_DIALS[dial].filter(word=>piece!=='Marquee'||dial!=='direction'||word==='left'||word==='right');
  for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)expect(resolve({dials:{[dial]:values[i]}})).not.toEqual(resolve({dials:{[dial]:values[j]}}));
 });
});
