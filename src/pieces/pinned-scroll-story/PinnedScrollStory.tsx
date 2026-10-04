'use client';
import {useEffect, useId, useRef, useState, type ReactNode, type CSSProperties, type KeyboardEvent} from 'react';
import {motion, useMotionValue, useMotionValueEvent, type MotionValue} from 'motion/react';
import {subscribeFrame} from '../../internal/frame.js';
import {observeViewport} from '../../internal/viewport.js';
import {useReducedMotionPreference} from '../../useReducedMotionPreference.js';
import {ease} from '../../tokens.js';
import {resolvePinnedScrollStory, storyProgress, type PinnedScrollStorySettings} from './settings.js';
export interface PinnedScrollStoryItem {id: string; label: string; content: ReactNode; thumbnail?: ReactNode;}
export interface PinnedScrollStoryProps extends PinnedScrollStorySettings {items: readonly PinnedScrollStoryItem[]; overviewLabel?: string; ariaLabel?: string; className?: string; style?: CSSProperties;}

function StoryProgress({progress, pinned}: {progress: MotionValue<number>; pinned: boolean}) {
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(progress, 'change', value => setPercent(Math.round(value * 100)));
  return <div role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pinned ? percent : 100} style={{height: 3, width: 'min(240px, 100%)', background: 'color-mix(in srgb, currentColor 16%, transparent)', borderRadius: 3}}><motion.div style={{height: '100%', background: 'currentColor', transformOrigin: 'left', scaleX: pinned ? progress : 1}}/></div>;
}

function StoryPanel({active, pinned, id, label, duration, distance, blur, startOpacity, top, align, content, panelRef, contentRef}: {
  active: boolean; pinned: boolean; id: string; label: string; duration: number; distance: number; blur: number; startOpacity: number; top: number; align: string; content: ReactNode;
  panelRef: (node: HTMLDivElement | null) => void; contentRef: (node: HTMLDivElement | null) => void;
}) {
  // Initial enhancement hides unselected panels immediately. Later departures
  // remain painted until their transition ends, but become inert immediately.
  const [display, setDisplay] = useState({active, pinned, visible: active});
  if (active !== display.active || pinned !== display.pinned) setDisplay({active, pinned, visible: active || (pinned && display.pinned && display.active && duration > 0 && (distance !== 0 || blur !== 0 || startOpacity !== 1))});
  return <motion.div ref={panelRef} id={id} role="group" aria-label={label} aria-hidden={active ? undefined : true} inert={!active} initial={false}
    animate={active ? {opacity: 1, y: 0, filter: 'none'} : {opacity: startOpacity, y: distance, filter: blur ? `blur(${blur}px)` : 'none'}}
    transition={{duration: pinned ? duration : 0, ease}}
    onAnimationComplete={() => setDisplay(previous => !previous.active && previous.visible ? {...previous, visible: false} : previous)}
    style={{gridArea: pinned ? '1 / 1' : undefined, alignSelf: align, minWidth: 0, visibility: display.visible ? 'visible' : 'hidden', pointerEvents: active ? undefined : 'none', scrollMarginTop: top + 24}}>
    <div data-story-content="" ref={contentRef} style={{display: 'flow-root', minWidth: 0}}>{content}</div>
  </motion.div>;
}
export function PinnedScrollStory({items, overviewLabel = 'At a glance', ariaLabel = 'Scroll story', className, style, ...settings}: PinnedScrollStoryProps) {
  const resolved = resolvePinnedScrollStory(settings);
  const {top, trackPerSlide, duration, distance, blur, startOpacity, align} = resolved;
  const reduced = useReducedMotionPreference();
  const root = useRef<HTMLElement>(null);
  const controls = useRef<HTMLElement>(null);
  const panels = useRef<Array<HTMLDivElement | null>>([]);
  const contents = useRef<Array<HTMLDivElement | null>>([]);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const documentTop = useRef(0);
  const id = useId();
  const count = items.length + 1;
  const [layout, setLayout] = useState({fits: false, height: 0, tallest: 0, overview: 0, rail: 0, media: [] as boolean[]});
  const progress = useMotionValue(0);
  const [selected, setSelected] = useState(0);
  const pinned = layout.fits && !reduced && items.length > 0;
  const index = Math.min(selected, count - 1);
  const available = Math.max(0, layout.height - top);
  // 24px above/below, a 20px progress gutter, and the 3px progress bar.
  const chrome = 71;
  const rowHeight = Math.max(index === count - 1 ? layout.overview : layout.tallest, layout.rail);
  const stageHeight = Math.min(available, rowHeight + chrome);
  const endHeight = Math.min(available, Math.max(layout.overview, layout.rail) + chrome);
  const tallestStage = Math.min(available, Math.max(layout.tallest, layout.rail) + chrome);
  // Even the last instant before the overview must leave enough track below a
  // taller scene. Very short requested intervals expand to prevent overlap.
  const span = Math.max(layout.height * trackPerSlide, tallestStage - endHeight) * count;

  useEffect(() => {
    if (reduced || !items.length || !root.current) return;
    let stop: (() => void) | undefined;
    let rejectedPinnedLayout = false;
    const measure = () => {
      if (stop) return;
      stop = subscribeFrame(() => {
        stop = undefined;
        // Read every panel before publishing layout changes. Hidden grid panels
        // retain their intrinsic height so a resize cannot hide oversized content.
        const heights = contents.current.slice(0, count).map(node => node?.getBoundingClientRect().height ?? 0);
        const navHeight = controls.current?.getBoundingClientRect().height ?? 0;
        const height = window.innerHeight;
        const rootRect = root.current?.getBoundingClientRect();
        const media = contents.current.slice(0, count).map(node => Boolean(node?.querySelector('img,picture,video,canvas,svg,iframe')));
        if (rootRect) documentTop.current = rootRect.top + window.scrollY;
        const readingFlow = root.current?.dataset.storyMode === 'flow' && panels.current.some(panel => panel?.contains(document.activeElement));
        const measuredPinned = root.current?.dataset.storyMode === 'pinned';
        // The pinned rail reserves 44px plus a 24px gutter. ResizeObserver
        // remeasures wrapped content at that width. If it overflows, stay in
        // flow until a viewport resize rather than oscillating between widths.
        const railHeight = measuredPinned ? Math.max(navHeight, count * 44) : count * 44;
        const tallest = Math.max(...heights);
        const overview = heights[count - 1] ?? 0;
        const fitsHeight = height > top && heights.length === count && heights.every(value => value > 0) && Math.max(tallest, railHeight) + chrome <= height - top;
        // A compact stage at the document end cannot reach its pin endpoint.
        // Use readable flow instead of extending the page with a blank spacer.
        const documentHeight = document.documentElement.scrollHeight;
        const trailing = rootRect ? documentHeight - (rootRect.bottom + window.scrollY) : 0;
        const exitRoom = Math.max(0, height - top - (Math.max(overview, railHeight) + chrome));
        const fitsDocument = documentHeight < height || trailing + 1 >= exitRoom;
        if (measuredPinned && (!fitsHeight || !fitsDocument)) rejectedPinnedLayout = true;
        const fits = !readingFlow && !rejectedPinnedLayout && fitsHeight && fitsDocument;
        setLayout(previous => previous.fits === fits && previous.height === height && previous.tallest === tallest && previous.overview === overview && previous.rail === railHeight && previous.media.join() === media.join() ? previous : {fits, height, tallest, overview, rail: railHeight, media});
        // Check the newly reserved rail width even when ResizeObserver is absent.
        if (fits && !measuredPinned) measure();
        return false;
      });
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;
    contents.current.slice(0, count).forEach(node => {if (node) observer?.observe(node);});
    if (controls.current) observer?.observe(controls.current);
    const resize = () => {rejectedPinnedLayout = false; measure();};
    window.addEventListener('resize', resize, {passive: true});
    measure();
    return () => {stop?.(); observer?.disconnect(); window.removeEventListener('resize', resize);};
  }, [items, count, reduced, top]);

  useEffect(() => {
    if (!pinned || !root.current) return;
    return observeViewport(root.current, rect => {
      documentTop.current = rect.top + window.scrollY;
      const next = storyProgress(rect.top - top, span, count);
      // A reader tabbed into a slide must never be left inside an inert panel.
      panels.current.forEach((panel, panelIndex) => {
        if (panelIndex !== next.index && panel?.contains(document.activeElement)) buttons.current[next.index]?.focus({preventScroll: true});
      });
      progress.set(next.progress);
      setSelected(previous => previous === next.index ? previous : next.index);
      return false;
    });
  }, [pinned, top, span, count, progress]);

  const navigate = (target: number) => {
    if (pinned) window.scrollTo({top: documentTop.current - top + span * (target + .5) / count, behavior: 'smooth'});
    else panels.current[target]?.scrollIntoView({behavior: 'auto', block: 'start'});
  };
  const navigateKey = (event: KeyboardEvent<HTMLButtonElement>, current: number) => {
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (current + 1) % count : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (current - 1 + count) % count : undefined;
    if (target === undefined) return;
    event.preventDefault(); buttons.current[target]?.focus({preventScroll: true}); navigate(target);
  };
  if (!items.length) return null;
  const labels = [...items.map(item => item.label), overviewLabel];
  const overview = <><h3 style={{margin: '0 0 24px'}}>{overviewLabel}</h3><div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 16}}>{items.map((item, itemIndex) => <div key={`${item.id}-${itemIndex}`} style={{minWidth: 0, padding: 16, border: '1px solid currentColor', borderRadius: 16}}>{item.thumbnail}<div style={{marginTop: item.thumbnail ? 12 : 0}}>{item.label}</div></div>)}</div></>;
  return <section ref={root} className={className} aria-label={ariaLabel} data-story-mode={pinned ? 'pinned' : 'flow'} style={{...style, position: 'relative', height: pinned ? endHeight + span : undefined, minWidth: 0}}>
    {/* Reserve the final footprint throughout. The negative end margin lets taller
        scenes stay sticky for the same travel, even with a short overview or fast
        trackPerSlide. It vanishes on the overview; page height never jumps. */}
    <div style={{position: pinned ? 'sticky' : 'relative', top: pinned ? top : undefined, height: pinned ? stageHeight : undefined, marginBottom: pinned ? endHeight - stageHeight : undefined, boxSizing: 'border-box', padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 20}}>
      <div style={{display: 'grid', gridTemplateColumns: pinned ? 'minmax(0, 1fr) 44px' : 'minmax(0, 1fr)', alignItems: 'center', gap: 24, minWidth: 0}}>
      {/* Contain a taller departing scene when the overview shortens the row. */}
      <div style={{display: 'grid', gridTemplateRows: pinned ? 'minmax(0, 1fr)' : undefined, height: pinned ? rowHeight : undefined, overflow: pinned && index === count - 1 ? 'clip' : undefined, gap: pinned ? 0 : 40, minWidth: 0}}>
        {[...items.map(item => item.content), overview].map((content, panelIndex) => {
          const active = !pinned || panelIndex === index;
          const hiddenBlur = panelIndex === items.length || layout.media[panelIndex] ? 0 : blur;
          return <StoryPanel key={panelIndex} panelRef={node => {panels.current[panelIndex] = node;}} contentRef={node => {contents.current[panelIndex] = node;}}
            id={`${id}-panel-${panelIndex}`} label={labels[panelIndex]} active={active} pinned={pinned} duration={duration} distance={panelIndex < index ? -distance : distance} blur={hiddenBlur} startOpacity={startOpacity} top={top} align={align} content={content}/>;
        })}
      </div>
      <nav ref={controls} aria-label={`${ariaLabel} steps`} style={{display: 'flex', flexDirection: pinned ? 'column' : 'row', flexWrap: pinned ? 'nowrap' : 'wrap', alignItems: 'center', justifyContent: 'center'}}>
        {labels.map((label, buttonIndex) => <button key={buttonIndex} ref={node => {buttons.current[buttonIndex] = node;}} type="button" aria-label={`Go to ${label}`} aria-controls={`${id}-panel-${buttonIndex}`} aria-current={pinned && index === buttonIndex ? 'step' : undefined} onClick={() => navigate(buttonIndex)} onKeyDown={event => navigateKey(event, buttonIndex)} style={{minWidth: 44, minHeight: 44, width: 44, height: 44, flexShrink: 0, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', borderRadius: 8, outlineOffset: 2}}><span aria-hidden="true" style={{width: 8, height: 8, borderRadius: '50%', background: 'currentColor', opacity: pinned && index !== buttonIndex ? .35 : 1, transform: pinned && index === buttonIndex ? 'scale(1.5)' : 'none'}}/></button>)}
      </nav>
      </div>
      <div style={{display: 'flex', justifyContent: 'center'}}><StoryProgress progress={progress} pinned={pinned}/></div>
    </div>
  </section>;
}
