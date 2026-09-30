'use client';

import {useLayoutEffect,useRef,type CSSProperties} from 'react';
import {animate,motion,useMotionValue,useTransform} from 'motion/react';
import {cleanDials,type MotionDials} from '../../dials';
import {blurStrength,designMotion,durations,ease} from '../../tokens';
import {useReducedMotionPreference} from '../../useReducedMotionPreference';
import {clampNumber,speedFactor} from '../hover-tilt/behavior';

export interface ImageLoadBlurInProps {
  src: string;
  /** Use an empty string for a decorative background image. */
  alt: string;
  srcSet?: string;
  sizes?: string;
  dials?: MotionDials;
  /** Seconds, 0–5. Default 1.8. */
  duration?: number;
  /** Initial scale, 1–1.2. Default 1.05. */
  startScale?: number;
  /** Entrance blur, 0–10px. Default 6. */
  blur?: number;
  /** Seconds, 0–5. Default 0. */
  delay?: number;
  /** Static wrapper aspect ratio. Default 16 / 9. */
  aspectRatio?: CSSProperties['aspectRatio'];
  objectFit?: 'cover' | 'contain';
  objectPosition?: string;
  className?: string;
  style?: CSSProperties;
}
export function resolveImageLoadSettings(props: Omit<ImageLoadBlurInProps,'src'|'alt'>) {
  const dials=cleanDials('image-load-blur-in',props.dials),base=designMotion.imageLoad;
  const size=dials.size==='small'?.5:dials.size==='large'?2:1;
  return {
    duration:clampNumber(props.duration,base.duration*speedFactor(dials.speed),0,5),
    startScale:clampNumber(props.startScale,1+(base.scale-1)*size,1,1.2),
    blur:clampNumber(props.blur,blurStrength[(dials.blur??'soft') as keyof typeof blurStrength],0,10),
    delay:clampNumber(props.delay,dials.delay==='long'?durations.slow:dials.delay==='short'?durations.fast:0,0,5),
  };
}
/** A sharp, semantic server image that gently resolves once its source loads. */
export function ImageLoadBlurIn({src,alt,srcSet,sizes,aspectRatio='16 / 9',objectFit='cover',objectPosition='50% 50%',className,style,...props}:ImageLoadBlurInProps) {
  const node=useRef<HTMLImageElement>(null),played=useRef<string|undefined>(undefined);
  const load=useRef(()=>{}),fail=useRef(()=>{});
  const scale=useMotionValue(1),blur=useMotionValue(0);
  const filter=useTransform(blur,value=>value<=0?'none':`blur(${Math.min(10,value)}px)`);
  const reduced=useReducedMotionPreference();
  const {duration,startScale,blur:amount,delay}=resolveImageLoadSettings(props);
  const source=`${src}|${srcSet??''}`;
  useLayoutEffect(()=>{
    let active=true;
    const stop=()=>{scale.stop();blur.stop();};
    const final=()=>{stop();scale.set(1);blur.set(0);};
    final();
    const play=()=>{
      if(!active||played.current===source)return;
      played.current=source;
      if(reduced||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||duration===0){final();return;}
      scale.set(startScale);blur.set(amount);
      const timing={type:'tween' as const,duration,delay,ease};
      animate(scale,1,timing);animate(blur,0,timing);
    };
    load.current=play;fail.current=()=>{played.current=source;final();};
    // Cached resources do not emit another load event. The microtask avoids
    // consuming their one-time entrance in StrictMode's effect rehearsal.
    if(node.current?.complete&&node.current.naturalWidth>0)queueMicrotask(play);
    return()=>{active=false;stop();load.current=()=>{};fail.current=()=>{};};
  },[source,reduced,duration,startScale,amount,delay,scale,blur]);
  return <div className={className} style={{aspectRatio,...style,overflow:'hidden'}}>
    <motion.img ref={node} src={src} srcSet={srcSet} sizes={sizes} alt={alt} initial={false}
      onLoad={()=>load.current()} onError={()=>fail.current()}
      style={{display:'block',width:'100%',height:'100%',objectFit,objectPosition,scale:reduced?1:scale,filter:reduced?'none':filter}}/>
  </div>;
}
