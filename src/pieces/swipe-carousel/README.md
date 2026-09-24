# Swipe Carousel

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
