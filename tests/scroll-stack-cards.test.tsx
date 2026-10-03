import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {ScrollStackCards} from '../src/pieces/scroll-stack-cards/ScrollStackCards';
import {resolveScrollStackCards,stackProgress} from '../src/pieces/scroll-stack-cards/settings';
vi.mock('motion/react',async original=>({...await original<typeof import('motion/react')>(),useReducedMotion:()=>false}));
let reduced:EventTarget & {matches:boolean};let frames:Map<number,FrameRequestCallback>;let id=0;let time=0;let tops=[96,196];let height=200;
function tick(count=1){act(()=>{for(let i=0;i<count;i++){time+=1000/60;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));}});}
beforeEach(()=>{frames=new Map();time=0;tops=[96,196];height=200;reduced=Object.assign(new EventTarget(),{matches:false});vi.stubGlobal('matchMedia',()=>reduced);vi.stubGlobal('innerHeight',800);vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>{frames.set(++id,fn);return id;});vi.stubGlobal('cancelAnimationFrame',(key:number)=>frames.delete(key));vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){const top=tops[Number(this.dataset.stackCard)]??0;return {top,bottom:top+height,left:0,right:320,width:320,height,x:0,y:top,toJSON(){}};});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('ScrollStackCards',()=>{
  it('maps every supported dial, explicit values and safe bounds',()=>{
    expect(resolveScrollStackCards({})).toEqual({plays:'scrub',scale:.95,smoothing:.14,top:96,gap:24});
    for(const [size,scale] of [['small',.975],['medium',.95],['large',.925]] as const)expect(resolveScrollStackCards({dials:{size}}).scale).toBeCloseTo(scale);
    expect(resolveScrollStackCards({dials:{speed:'slow'}}).smoothing).toBeLessThan(.14);expect(resolveScrollStackCards({dials:{speed:'normal'}}).smoothing).toBe(.14);expect(resolveScrollStackCards({dials:{speed:'fast'}}).smoothing).toBeGreaterThan(.14);
    expect(resolveScrollStackCards({scale:1,smoothing:1,top:0,gap:0,dials:{size:'large',speed:'slow'}})).toEqual({plays:'scrub',scale:1,smoothing:1,top:0,gap:0});
    expect(resolveScrollStackCards({scale:0,smoothing:NaN,top:Infinity,gap:900})).toEqual({plays:'scrub',scale:.8,smoothing:.14,top:96,gap:160});expect(resolveScrollStackCards({dials:{direction:'up',blur:'strong'}})).toEqual(resolveScrollStackCards({}));
    expect(stackProgress(96,196,200)).toBe(.5);expect(stackProgress(96,500,200)).toBe(0);expect(stackProgress(96,0,200)).toBe(1);expect(stackProgress(96,0,0)).toBe(0);
  });
  it('renders empty and single-card stacks and readable server controls',()=>{
    expect(renderToString(<ScrollStackCards><button>Read</button></ScrollStackCards>)).toContain('Read');
    const view=render(<ScrollStackCards>{null}</ScrollStackCards>);tick();view.rerender(<ScrollStackCards><button>Read</button></ScrollStackCards>);tick();screen.getByRole('button').focus();expect(document.activeElement).toBe(screen.getByRole('button'));
  });
  it('shrinks only outgoing inner cards from stationary overlap and leaves wheel native',()=>{
    const view=render(<ScrollStackCards dials={{speed:'normal'}}><button>First</button><button>Second</button></ScrollStackCards>);tick();const first=screen.getByText('First').parentElement!;const second=screen.getByText('Second').parentElement!;
    expect(first.parentElement!.style.position).toBe('sticky');expect(first.style.transform).toBe('scale(0.9965)');expect(second.style.transform).toBe('none');
    view.rerender(<ScrollStackCards dials={{speed:'normal'}}><button>First</button><button>Second</button></ScrollStackCards>);tick();expect(first.style.transform).toBe('scale(0.9935)');
    tops=[96,96];fireEvent.scroll(window);tick(180);expect(first.style.transform).toBe('scale(0.95)');expect(second.style.transform).toBe('none');
    const wheel=new Event('wheel',{bubbles:true,cancelable:true});first.dispatchEvent(wheel);expect(wheel.defaultPrevented).toBe(false);
  });
  it('reads every stationary card before writing transforms and exposes focused controls above the stack',()=>{
    render(<ScrollStackCards><button>First</button><button>Second</button></ScrollStackCards>);
    const events:string[]=[];
    const read=vi.mocked(HTMLElement.prototype.getBoundingClientRect).getMockImplementation()!;
    vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){events.push('read');return read.call(this);});
    for(const name of ['First','Second']) {const style=screen.getByText(name).parentElement!.style;Object.defineProperty(style,'transform',{configurable:true,get(){return style.getPropertyValue('transform');},set(value:string){events.push('write');style.setProperty('transform',value);}});}
    tick();expect(events).toEqual(['read','read','write','write']);
    const button=screen.getByRole('button',{name:'First'});button.focus();expect(button.parentElement!.parentElement!.style.zIndex).toBe('2');button.blur();expect(button.parentElement!.parentElement!.style.zIndex).toBe('0');
  });
  it('updates explicit props, handles card replacement, and releases live animation on unmount',()=>{
    const view=render(<ScrollStackCards smoothing={1}><span>First</span><span>Second</span></ScrollStackCards>);tick();
    expect(screen.getByText('First').parentElement!.style.transform).toBe('scale(0.975)');
    view.rerender(<ScrollStackCards smoothing={1} scale={.8} top={40} gap={0}><span>First</span><span>Second</span></ScrollStackCards>);tick();
    const layer=screen.getByText('First').parentElement!;expect(layer.style.transform).toBe('scale(0.9)');expect(layer.parentElement!.style.top).toBe('40px');
    view.rerender(<ScrollStackCards><span>Only</span></ScrollStackCards>);tick();expect(screen.getByText('Only').parentElement!.style.transform).toBe('none');
    view.rerender(<ScrollStackCards><span>First</span><span>Second</span></ScrollStackCards>);tick();view.unmount();expect(frames.size).toBe(0);
  });
  it('remeasures asynchronously resized content without a page scroll and disconnects on unmount',()=>{
    let resize: (()=>void) | undefined; const disconnect=vi.fn();
    vi.stubGlobal('ResizeObserver',class {constructor(callback:()=>void){resize=callback;}observe(){}disconnect(){disconnect();}});
    const view=render(<ScrollStackCards><span>First</span><span>Second</span></ScrollStackCards>);tick();const layer=screen.getByText('First').parentElement!;
    height=900;act(()=>resize?.());tick();expect(layer.parentElement!.style.position).toBe('relative');expect(layer.style.transform).toBe('none');
    view.unmount();expect(disconnect).toHaveBeenCalledOnce();expect(frames.size).toBe(0);
  });
  it('keeps a focused card above siblings after keyed reordering or adding cards',()=>{
    const view=render(<ScrollStackCards><button key="a">First</button><button key="b">Second</button></ScrollStackCards>);tick();
    const button=screen.getByRole('button',{name:'Second'});button.focus();expect(button.parentElement!.parentElement!.style.zIndex).toBe('2');
    view.rerender(<ScrollStackCards><button key="b">Second</button><button key="a">First</button><button key="c">Third</button></ScrollStackCards>);tick();
    expect(document.activeElement).toBe(button);expect(button.parentElement!.parentElement!.style.zIndex).toBe('3');button.blur();expect(button.parentElement!.parentElement!.style.zIndex).toBe('0');
  });
  it('turns off sticking for tall cards and live reduced motion',()=>{
    const view=render(<ScrollStackCards><span>First</span><span>Second</span></ScrollStackCards>);tick();const first=screen.getByText('First').parentElement!;
    height=900;fireEvent.resize(window);tick();expect(first.parentElement!.style.position).toBe('relative');expect(first.parentElement!.style.top).toBe('');expect(first.style.transform).toBe('none');
    height=200;fireEvent.resize(window);tick(2);expect(first.parentElement!.style.position).toBe('sticky');
    act(()=>{reduced.matches=true;reduced.dispatchEvent(new Event('change'));});expect(first.parentElement!.style.position).toBe('relative');expect(first.parentElement!.style.top).toBe('');expect(first.style.transform).toBe('none');expect(frames.size).toBe(0);view.unmount();expect(frames.size).toBe(0);
  });
});


describe('stack playback modes', () => {
  it.each(['scrub', 'once', 'always'] as const)('%s reverses or retains overlap and resets always outside view', plays => {
    tops = [96, 96];
    render(<ScrollStackCards smoothing={1} dials={{plays}}><span>First</span><span>Second</span></ScrollStackCards>); tick(2);
    const layer = screen.getByText('First').parentElement!;
    expect(layer.style.transform).toBe('scale(0.95)');
    tops = [96, 196]; fireEvent.scroll(window); tick(2);
    expect(layer.style.transform).toBe(plays === 'scrub' ? 'scale(0.975)' : 'scale(0.95)');
    tops = [1000, 1300]; fireEvent.scroll(window); tick(2);
    expect(layer.style.transform).toBe(plays === 'once' ? 'scale(0.95)' : 'none');
    tops = [96, 196]; fireEvent.scroll(window); tick(2);
    expect(layer.style.transform).toBe(plays === 'once' ? 'scale(0.95)' : 'scale(0.975)');
    tops = [96, 96]; fireEvent.scroll(window); tick(2);
    expect(layer.style.transform).toBe('scale(0.95)');
    act(() => {reduced.matches = true; reduced.dispatchEvent(new Event('change'));});
    expect(layer.style.transform).toBe('none'); expect(frames.size).toBe(0);
  });
});
