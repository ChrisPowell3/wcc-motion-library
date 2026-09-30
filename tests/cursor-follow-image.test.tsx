import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CursorFollowImage} from '../src/pieces/cursor-follow-image/CursorFollowImage';
import {resolveCursorFollowImage, cursorTarget} from '../src/pieces/cursor-follow-image/settings';
vi.mock('motion/react', async original => ({...await original<typeof import('motion/react')>(), useReducedMotion: () => false}));
let reduced: EventTarget & {matches: boolean}; let fine: EventTarget & {matches:boolean}; let frames: Map<number, FrameRequestCallback>; let id=0; let time=0;
const rect={top:0,left:0,width:200,height:100,bottom:100,right:200,x:0,y:0,toJSON(){}};
function tick(count=1){act(()=>{for(let i=0;i<count;i++){time+=1000/60;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));}});}
function pointer(element:Element,type:string,pointerType='mouse',x=200,y=100){fireEvent(element,Object.assign(new Event(type,{bubbles:true}),{pointerType,clientX:x,clientY:y}));}
beforeEach(()=>{frames=new Map();time=0;fine=Object.assign(new EventTarget(),{matches:true});reduced=Object.assign(new EventTarget(),{matches:false});vi.stubGlobal('matchMedia',(q:string)=>q.includes('reduced')?reduced:fine);vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>{frames.set(++id,fn);return id;});vi.stubGlobal('cancelAnimationFrame',(key:number)=>frames.delete(key));vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue(rect);});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('CursorFollowImage',()=>{
  it('maps all size and speed values and bounds settings',()=>{
    expect(resolveCursorFollowImage({})).toEqual({maxX:26,maxY:22,scale:1.03,falloff:420,strength:.06,smoothing:.08});
    for(const [size,maxX,maxY,scale] of [['small',13,11,1.015],['medium',26,22,1.03],['large',39,33,1.045]] as const)expect(resolveCursorFollowImage({dials:{size}})).toMatchObject({maxX,maxY,scale});
    expect(resolveCursorFollowImage({dials:{speed:'slow'}}).smoothing).toBeLessThan(.08);expect(resolveCursorFollowImage({dials:{speed:'normal'}}).smoothing).toBe(.08);expect(resolveCursorFollowImage({dials:{speed:'fast'}}).smoothing).toBeGreaterThan(.08);
    expect(resolveCursorFollowImage({maxX:0,maxY:0,scale:1,smoothing:1,dials:{size:'large',speed:'slow'}})).toMatchObject({maxX:0,maxY:0,scale:1,smoothing:1});
    expect(resolveCursorFollowImage({maxX:Infinity,maxY:-1,scale:9,falloff:0,strength:NaN,smoothing:0})).toEqual({maxX:26,maxY:0,scale:1.2,falloff:1,strength:.06,smoothing:.01});
    expect(resolveCursorFollowImage({dials:{direction:'up',blur:'strong'}})).toEqual(resolveCursorFollowImage({}));
  });
  it('uses center-relative pull, distance falloff, axis limits and zero boxes',()=>{
    const config=resolveCursorFollowImage({});expect(cursorTarget(rect,100,50,config)).toEqual({x:0,y:0});expect(cursorTarget(rect,200,100,config)).toEqual({x:6,y:3});expect(cursorTarget(rect,10100,50,config).x).toBeCloseTo(25.2);expect(cursorTarget(rect,100,10050,config).y).toBe(22);expect(cursorTarget({...rect,width:0},200,100,config)).toEqual({x:0,y:0});
  });
  it('keeps the supplied image accessible on the server',()=>{
    const html=renderToString(<CursorFollowImage><img src="portrait.jpg" alt="Coach smiling"/></CursorFollowImage>);expect(html).toContain('alt="Coach smiling"');expect(html).toContain('transform:none');
  });
  it('follows from stationary bounds and settles on leave without interrupting equal dials',()=>{
    const view=render(<CursorFollowImage dials={{speed:'normal'}}><img src="portrait.jpg" alt="Coach"/></CursorFollowImage>);const content=screen.getByRole('img').parentElement!;const anchor=content.parentElement!;
    pointer(anchor,'pointermove');tick();expect(content.style.transform).toContain('translate3d(0.48px,0.24px,0)');
    view.rerender(<CursorFollowImage dials={{speed:'normal'}}><img src="portrait.jpg" alt="Coach"/></CursorFollowImage>);tick();expect(content.style.transform).toContain('translate3d(0.922px,0.461px,0)');
    tick(180);expect(content.style.transform).toContain('scale(1.03)');pointer(anchor,'pointerout');tick(180);expect(content.style.transform).toBe('none');
    const wheel=new Event('wheel',{bubbles:true,cancelable:true});anchor.dispatchEvent(wheel);expect(wheel.defaultPrevented).toBe(false);
  });
  it('reacts to explicit prop changes, cancel and active unmount',()=>{
    const view=render(<CursorFollowImage smoothing={1}><img src="photo.jpg" alt="Coach"/></CursorFollowImage>);const layer=screen.getByRole('img').parentElement!;const anchor=layer.parentElement!;
    pointer(anchor,'pointermove');tick();expect(layer.style.transform).toBe('translate3d(6px,3px,0) scale(1.03)');
    view.rerender(<CursorFollowImage smoothing={1} maxX={2} maxY={1} scale={1.1}><img src="photo.jpg" alt="Coach"/></CursorFollowImage>);pointer(anchor,'pointermove');tick();expect(layer.style.transform).toBe('translate3d(2px,1px,0) scale(1.1)');
    pointer(anchor,'pointercancel');tick();expect(layer.style.transform).toBe('none');pointer(anchor,'pointermove');view.unmount();expect(frames.size).toBe(0);
  });
  it('ignores touch and coarse pointers and stops on live reduced motion',()=>{
    const view=render(<CursorFollowImage><button>Open photo</button></CursorFollowImage>);const button=screen.getByRole('button');const content=button.parentElement!;const anchor=content.parentElement!;
    button.focus();expect(document.activeElement).toBe(button);pointer(anchor,'pointermove','touch');tick();expect(content.style.transform).toBe('none');
    act(()=>{fine.matches=false;fine.dispatchEvent(new Event('change'));});pointer(anchor,'pointermove');tick();expect(content.style.transform).toBe('none');
    act(()=>{fine.matches=true;fine.dispatchEvent(new Event('change'));});pointer(anchor,'pointermove');tick();expect(content.style.transform).not.toBe('none');
    act(()=>{reduced.matches=true;reduced.dispatchEvent(new Event('change'));});expect(content.style.transform).toBe('none');expect(frames.size).toBe(0);view.unmount();expect(frames.size).toBe(0);
  });
});
