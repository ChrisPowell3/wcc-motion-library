# Swipe Carousel v0.2

```tsx
'use client';
import {SwipeCarousel} from '@wcc/motion-library';

<SwipeCarousel
  label="What’s Inside"
  items={[
    {id: 'begin', image: '/begin.jpg', alt: 'Walking outdoors', title: 'Begin here', text: 'One step at a time.', cta: {label: 'Explore', href: '/begin'}},
    {id: 'grow', image: '/grow.jpg', alt: 'Training with a friend', title: 'Keep growing', text: 'Build a little every day.'},
  ]}
  onChange={index => console.log(index)}
/>
```

The optional `label` prop names the carousel region for assistive technology and defaults to `"Image carousel"`. Use distinct labels for multiple carousels on one page.

All props, defaults, and ranges are in the `swipe-carousel` entry in `catalog.json`. IDs must be unique and stable. `startIndex` is an initial value, not a controlled selection. For an even number of cards, the later middle card is selected. Empty lists are supported. If a list shrinks below the selected index, selection clamps to its new last card and calls `onChange`.

Cards have a 3:4 aspect ratio, with width capped to the available container minus 32px. Keep copy concise for the smallest configured card width. Styles are inline and inherit the surrounding font and control color; no stylesheet import is needed.

Drag horizontally with touch or a mouse, scroll sideways on a trackpad, focus the region and use Left/Right (Home/End also work), or use the dot buttons. Each dot has a 44px touch target. Focus rings appear for keyboard input, including Tab and arrow navigation; mouse/touch interaction keeps focus without a ring. Stacking follows the live card position, so the nearest card stays on top throughout dragging and spring travel. Vertical gestures and pinch-to-zoom remain available. Only the settled center card's CTA can receive focus. Content fades in after the token-based spring completes. Dragging suppresses accidental CTA clicks.

Fan-out runs once per mounted instance when it enters view. Reduced motion skips the fan and springs, and applies navigation instantly. The current card and its immediate left/right neighbors use eager image loading; all remaining images use native lazy loading, with their sources deferred until the opening fan has finished so the initial stack cannot trigger eager fetching. Trackpad deltas already include platform momentum, so they snap after an idle interval instead of adding a second flick projection.

The library uses `useReducedMotion`, `useInView`, and motion values from `motion/react`. No DOM is read at module evaluation or server render time. The component module includes `'use client'` for Next.js.


## Custom card designs

`SwipeCarousel` infers your item type from `items`. Existing `SwipeCarouselItem` arrays and `SwipeCarouselProps` usages keep working. For other shapes, TypeScript requires `renderCard`; each item only needs a stable string `id`.

```tsx
const chapters = [{id: 'start', heading: 'Start here', artwork: '/start.svg'}];

<SwipeCarousel
  items={chapters}
  label="Chapters"
  cardAspect="auto"
  cardStyle={{borderRadius: 16, background: '#fff', boxShadow: 'none'}}
  renderCard={(item, state) => (
    <div style={{color: '#203c3b'}}>
      <img src={state.loadImage ? item.artwork : undefined} alt={item.heading}
        style={{display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover'}}/>
      <h3>{item.heading}</h3>
      <a href={`/chapters/${item.id}`}>Read chapter</a>
    </div>
  )}
/>
```

`renderCard` replaces all built-in content, including the image, text overlay and CTA. The callback returns React content and receives `SwipeCarouselCardState`:

| Field | Meaning |
| --- | --- |
| `index` | Zero-based card index. |
| `count` | Total number of cards. |
| `active` | Selected center card; while settling, the destination card. |
| `ready` | True only for the active card after fan-out/settling finishes, exactly when the built-in text starts fading. False during dragging. Instant with reduced motion. |
| `loadImage` | True for the selected card and its immediate left/right neighbors initially; true for every card after fan-out or interaction. Gate custom image sources with this flag. With fan-out disabled or reduced motion, all sources may be assigned immediately, as in the built-in design; use native `loading="lazy"` for distant images. |

Custom content controls its own visuals and may use `active`/`ready` for presentation. The library does not add a text overlay or fade to custom content. If you add animations inside your renderer, use the house tokens, animate only transform/opacity, and honor reduced motion.

`cardAspect` defaults to `"3 / 4"`. Use `"auto"` with normal-flow custom content for intrinsic height; absolutely positioned content cannot establish that height. The shared grid reserves room for the tallest card, and the cards remain vertically centered. Height changes are not animated.

`cardStyle` accepts `borderRadius`, `background`, and `boxShadow`. Omitted fields preserve today's look. The motion frame owns width, transforms, opacity, stacking and clipping. Put other styling inside your returned content. The exported `SwipeCarouselCardStyle` type describes these overrides.

The custom-content wrapper is `inert` whenever its card is off-center or not yet ready. This blocks descendant links/buttons from pointer activation and keyboard focus without rewriting their props. The wrapper does not hide side-card designs visually. Normal active-card clicks retain their native behavior; horizontal dragging suppresses the resulting click before it reaches your handlers. Native image/link dragging is prevented so the pointer gesture remains with the carousel. Keep custom controls inside the returned DOM subtree (not portals), and retain visible keyboard focus styles.
