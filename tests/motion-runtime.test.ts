import {afterEach, describe, expect, it, vi} from 'vitest';
import {observeVisibility} from '../src/internal/observe';
import {subscribeFrame} from '../src/internal/frame';
import {observeViewport} from '../src/internal/viewport';

afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});
describe('shared motion observation', () => {
  it('pools observers by options, dispatches independently and cleans up the final subscription', () => {
    let callback!: IntersectionObserverCallback;
    const observer = {observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn()};
    const constructor = vi.fn(function(cb: IntersectionObserverCallback) {callback = cb; return observer;});
    vi.stubGlobal('IntersectionObserver', constructor);
    const one = document.createElement('div'), two = document.createElement('div');
    const first = vi.fn(), second = vi.fn();
    const stop1=observeVisibility(one, first), stop2=observeVisibility(two, second);
    expect(constructor).toHaveBeenCalledTimes(1);
    callback([{target: one, isIntersecting: true}, {target: two, isIntersecting: false}] as unknown as IntersectionObserverEntry[], observer as unknown as IntersectionObserver);
    expect(first).toHaveBeenCalledWith(true); expect(second).toHaveBeenCalledWith(false);
    stop1(); expect(observer.disconnect).not.toHaveBeenCalled();
    stop2(); expect(observer.disconnect).toHaveBeenCalledOnce();
  });
  it('leaves content visible if observers are absent or invalid', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const cb=vi.fn(); observeVisibility(document.createElement('div'),cb)();
    expect(cb).toHaveBeenCalledWith(true);
  });
});
describe('shared animation frame', () => {
  it('runs multiple subscribers in one frame and stops at rest', () => {
    let tick!: FrameRequestCallback;
    const raf=vi.fn((cb: FrameRequestCallback)=>{tick=cb;return 1;});
    vi.stubGlobal('requestAnimationFrame',raf);vi.stubGlobal('cancelAnimationFrame',vi.fn());
    const a=vi.fn(()=>false),b=vi.fn(()=>false);
    const stopA=subscribeFrame(a), stopB=subscribeFrame(b);
    expect(raf).toHaveBeenCalledTimes(1);
    tick(100);
    expect(a).toHaveBeenCalledOnce();expect(b).toHaveBeenCalledOnce();
    expect(raf).toHaveBeenCalledTimes(1);stopA();stopB();
  });
  it('measures every viewport target before any update callback writes', () => {
    let tick!: FrameRequestCallback;
    vi.stubGlobal('requestAnimationFrame',(cb: FrameRequestCallback)=>{tick=cb;return 2;});vi.stubGlobal('cancelAnimationFrame',vi.fn());
    const events:string[]=[];
    const a=document.createElement('div'),b=document.createElement('div');
    vi.spyOn(a,'getBoundingClientRect').mockImplementation(()=>{events.push('readA');return new DOMRect(0,400,100,20);});
    vi.spyOn(b,'getBoundingClientRect').mockImplementation(()=>{events.push('readB');return new DOMRect(0,500,100,20);});
    const stopA=observeViewport(a,()=>{events.push('writeA');return false;});
    const stopB=observeViewport(b,()=>{events.push('writeB');return false;});
    tick(100);expect(events).toEqual(['readA','readB','writeA','writeB']);stopA();stopB();
  });
});

it('keeps one frame when a callback subscribes another follower mid-frame', () => {
  let id=0;
  const pending=new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{pending.set(++id,cb);return id;});
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>pending.delete(id));
  let stopChild=()=>{};
  const stop=subscribeFrame(()=>{stopChild=subscribeFrame(()=>true);return false;});
  const [first,run]=[...pending][0];pending.delete(first);run(0);
  const size=pending.size;
  stop();stopChild();
  expect(size).toBe(1);
  expect(pending.size).toBe(0);
});
