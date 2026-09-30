'use client';

import {useLayoutEffect,useRef,type CSSProperties,type ReactNode} from 'react';
import {cleanDials,type MotionDials} from '../../dials';
import {designMotion} from '../../tokens';
import {subscribeFrame} from '../../internal/frame';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {clampNumber,useFinePointer} from '../hover-tilt/behavior';

export interface CursorProximityFadeProps {
  children: ReactNode;
  dials?: MotionDials;
  /** Proximity radius in px, 0–2000. Default 260. */
  radius?: number;
  /** Idle delay in seconds, 0–60. Default 4.5. */
  idleDelay?: number;
  /** Hide at this page scroll offset in px, 0–2000. Default 60. */
  scrollLimit?: number;
  className?: string;
  style?: CSSProperties;
}
export function resolveProximitySettings(props:Omit<CursorProximityFadeProps,'children'>) {
  const dials=cleanDials('cursor-proximity-fade',props.dials),base=designMotion.proximity;
  return {
    radius:clampNumber(props.radius,base.radius*(dials.size==='small'?.5:dials.size==='large'?1.5:1),0,2000),
    idleDelay:clampNumber(props.idleDelay,dials.delay==='none'?0:dials.delay==='short'?base.idle/2:base.idle,0,60),
    scrollLimit:clampNumber(props.scrollLimit,base.scrollLimit,0,2000),
  };
}
/** A proximity cue that remains available to keyboard and touch users. */
export function CursorProximityFade({children,className,style,...props}:CursorProximityFadeProps) {
  const node=useRef<HTMLDivElement>(null),focused=useRef(false),refresh=useRef(()=>{});
  const reduced=useReducedMotionPreference(),fine=useFinePointer();
  const {radius,idleDelay,scrollLimit}=resolveProximitySettings(props);
  useLayoutEffect(()=>{
    const element=node.current;if(!element)return;
    let point:{x:number;y:number}|undefined,idle=idleDelay===0;
    let timer:ReturnType<typeof setTimeout>|undefined,release:(()=>void)|undefined;
    const still=reduced||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const paint=()=>{
      const rect=element.getBoundingClientRect();
      const near=point!==undefined&&Math.hypot(point.x-rect.left-rect.width/2,point.y-rect.top-rect.height/2)<radius;
      element.style.opacity=still||focused.current||(window.scrollY<scrollLimit&&(!fine||idle||near))?'1':'0';
    };
    const wake=()=>{if(!release)release=subscribeFrame(()=>{release=undefined;paint();return false;});};
    refresh.current=paint;
    paint();
    if(still)return()=>{refresh.current=()=>{};};
    const arm=()=>{
      clearTimeout(timer);idle=idleDelay===0;
      if(!idle)timer=setTimeout(()=>{idle=true;wake();},idleDelay*1000);
    };
    const move=(event:PointerEvent)=>{if(event.pointerType==='touch')return;point={x:event.clientX,y:event.clientY};arm();wake();};
    if(fine){window.addEventListener('pointermove',move,{passive:true});arm();}
    window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',wake,{passive:true});
    return()=>{
      clearTimeout(timer);release?.();window.removeEventListener('pointermove',move);window.removeEventListener('scroll',wake);window.removeEventListener('resize',wake);refresh.current=()=>{};
    };
  },[fine,reduced,radius,idleDelay,scrollLimit]);
  return <div ref={node} className={className} style={{display:'inline-block',...style,opacity:1}}
    onFocusCapture={()=>{focused.current=true;refresh.current();}}
    onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)){focused.current=false;refresh.current();}}}>
    {children}
  </div>;
}
