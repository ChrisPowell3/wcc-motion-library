import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {renderToString} from 'react-dom/server';
import {CursorProximityFade,resolveProximitySettings} from '../src/pieces/cursor-proximity-fade/CursorProximityFade';
let fine=true,reduced=false;
let reduceQuery:EventTarget;
let queue=new Map<number,FrameRequestCallback>(),id=0;
const frame=()=>act(()=>{const current=[...queue];queue.clear();current.forEach(([,fn])=>fn(performance.now()));});
beforeEach(()=>{
 fine=true;reduced=false;queue=new Map();id=0;vi.useFakeTimers();
 reduceQuery=Object.assign(new EventTarget(),{get matches(){return reduced;}});
 Object.defineProperty(reduceQuery,'matches',{get:()=>reduced});
 const fineQuery=new EventTarget();Object.defineProperty(fineQuery,'matches',{get:()=>fine});
 vi.stubGlobal('matchMedia',(query:string)=>query.includes('reduce')?reduceQuery:fineQuery);
 vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>{queue.set(++id,fn);return id;});vi.stubGlobal('cancelAnimationFrame',(id:number)=>queue.delete(id));
 vi.stubGlobal('scrollY',0);vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue(new DOMRect(0,0,100,100));
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const wrapper=()=>screen.getByText('Keep reading').parentElement!;
describe('CursorProximityFade',()=>{
 it('renders SSR content visible with no keyboard restrictions',()=>{
  const html=renderToString(<CursorProximityFade><a href="#next">Keep reading</a></CursorProximityFade>);
  expect(html).toContain('opacity:1');expect(html).not.toContain('aria-hidden');expect(html).not.toContain('inert');
 });
 it('toggles instantly near260px, after idle4500ms and off after60px scroll',()=>{
  render(<CursorProximityFade><span>Keep reading</span></CursorProximityFade>);frame();expect(wrapper().style.opacity).toBe('0');
  fireEvent.pointerMove(window,{clientX:50,clientY:50});frame();expect(wrapper().style.opacity).toBe('1');
  fireEvent.pointerMove(window,{clientX:900,clientY:900});frame();expect(wrapper().style.opacity).toBe('0');
  act(()=>vi.advanceTimersByTime(4500));frame();expect(wrapper().style.opacity).toBe('1');
  vi.stubGlobal('scrollY',60);fireEvent.scroll(window);frame();expect(wrapper().style.opacity).toBe('0');
 });
 it('exposes focused children immediately, preserves wheel scrolling, and cleans up',()=>{
  const timers=vi.spyOn(globalThis,'setTimeout'),clear=vi.spyOn(globalThis,'clearTimeout');
  const view=render(<CursorProximityFade><button>Keep reading</button></CursorProximityFade>);frame();
  act(()=>screen.getByRole('button').focus());expect(wrapper().style.opacity).toBe('1');
  const wheel=new Event('wheel',{bubbles:true,cancelable:true});wrapper().dispatchEvent(wheel);expect(wheel.defaultPrevented).toBe(false);
  view.unmount();expect(queue.size).toBe(0);
  timers.mock.calls.forEach((call,index)=>{if(call[1]===4500)expect(clear).toHaveBeenCalledWith(timers.mock.results[index].value);});
 });
 it('stays visible without a fine pointer and under reduced motion',()=>{
  fine=false;const view=render(<CursorProximityFade><span>Keep reading</span></CursorProximityFade>);frame();expect(wrapper().style.opacity).toBe('1');
  reduced=true;vi.stubGlobal('scrollY',200);view.rerender(<CursorProximityFade radius={100}><span>Keep reading</span></CursorProximityFade>);frame();expect(wrapper().style.opacity).toBe('1');
 });
 it('resolves word dials and preserves explicit zero',()=>{
  expect(resolveProximitySettings({})).toEqual({radius:260,idleDelay:4.5,scrollLimit:60});
  expect(resolveProximitySettings({dials:{size:'small',delay:'short'}})).toEqual({radius:130,idleDelay:2.25,scrollLimit:60});
  expect(resolveProximitySettings({radius:0,idleDelay:0,scrollLimit:0,dials:{size:'large',delay:'long'}})).toEqual({radius:0,idleDelay:0,scrollLimit:0});
 });
});


it('honors a live reduced-motion change without any parent rerender',()=>{
 render(<CursorProximityFade><span>Keep reading</span></CursorProximityFade>);frame();expect(wrapper().style.opacity).toBe('0');
 act(()=>{reduced=true;reduceQuery.dispatchEvent(new Event('change'));});expect(wrapper().style.opacity).toBe('1');
 vi.stubGlobal('scrollY',200);fireEvent.scroll(window);frame();expect(wrapper().style.opacity).toBe('1');
});
