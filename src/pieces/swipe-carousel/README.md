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
  dimColor="#f3f0e9"
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


`dimColor` defaults to `"transparent"`, preserving the original fading of entire card frames. Set it to a page/background color (for example `"#f3f0e9"`) to keep frames at opacity 1 (except the optional loop seam concealment) and dim their contents with an internal overlay instead. The overlay follows live distance at opacity 0 / 0.1 / 0.4 / 0.7, capped at three cards away, and never intercepts clicks or keyboard focus. With opaque card backgrounds this avoids neighboring text/images showing through each other. Only the overlay's opacity changes; frame movement and all other motion behavior remain the same.

## Shared motion dials

```tsx
<SwipeCarousel items={items} dials={{speed: 'slow', sideCards: 'smaller', loop: 'on'}}/>
```

Omitting `dials` preserves the original finite carousel. Unsupported shared dials (`plays`, `delay`, `cascade`, `direction`, `fade`, `start`) and invalid values are ignored. Explicit `gap`, `sideScale`, and `dimColor` props retain precedence over their corresponding preset choices.

| Dial | Values and effect | Default |
| --- | --- | --- |
| `speed` | `slow` / `normal` / `fast`: playback speed is `durations.base` divided by `durations.slow` / `durations.base` / `durations.fast`. Applies to fan, settling, content fade and dots. | `normal` |
| `size` | `small` / `medium` / `large`: center spacing is 0.4 / 0.55 / 0.75 of card width; explicit `gap` wins. | `medium` |
| `bounce` | `none`: eased tween; `soft`: house settle spring and original float fan; `springy`: house snap spring. | `soft` |
| `autoplay` | `off` / `on`: advance every `durations.entrance × 5` seconds (currently 4.5 seconds). | `off` |
| `loop` | `off`: stop at the first/last card. `on`: arrows, dots, dragging, horizontal wheel and autoplay wrap through the cards. | `off` |
| `sideCards` | `normal`: original scale/dimming; `smaller`: scale 0.65, unless `sideScale` is explicit; `dimmer`: stronger dimming, retaining the chosen `dimColor`. | `normal` |
| `flick` | `soft` / `normal` / `strong`: multiply house flick power and maximum travel by 0.5 / 1 / 1.5. Trackpad momentum is unchanged. | `normal` |

`dimmer` uses frame opacity 1 / 0.65 / 0.35 / 0.15 at distances 0 / 1 / 2 / 3 when `dimColor` is transparent. A supplied overlay color keeps frames opaque and uses overlay opacity 0 / 0.35 / 0.65 / 0.85. The loop's opposite seam fades out cards briefly to conceal their repositioning; each item still has exactly one slide and one set of interactive content.

Autoplay displays a native Pause/Resume button. It pauses while hovered, while focus is anywhere inside the region, from pointer down through release/cancel, while the document is hidden, while less than a quarter of the carousel is in view, and whenever reduced motion is enabled. Leaving a pause condition restarts a full interval; a manual pause stays paused until Resume is chosen. With loop off, autoplay stops on the last card. Zero or one item never creates an autoplay timer. Speed does not alter the reading interval.

Reduced motion responds to live device preference changes. It stops autoplay and active animation, skips springs/fades, and keeps dots, keyboard, drag and wheel navigation functional with immediate settling. Server HTML exposes the active content; the entrance is prepared on the client before paint, with stable markup during hydration.
