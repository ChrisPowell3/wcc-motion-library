# WCC Motion Library (@wcc/motion-library)

Shared motion pieces for every CP website. The Website Command Center
(WCC) reads `catalog.json` to know what pieces exist and what settings
they take, so CP can say "use the swipe carousel here" on any site.

- House timing lives in `src/tokens.ts`.
- Rules for builders live in `AGENTS.md`.
- Run `npm run check` to test and `npm run demo` to see pieces.

## Motion dials (0.4.0)

Every piece accepts the same `dials` shape. The Website Command Center can send
words without knowing distances, durations or spring physics:

```tsx
import {ScrollRevealRise, SwipeCarousel, cleanDials, type MotionDials} from '@wcc/motion-library';

const dials: MotionDials = {speed: 'fast', bounce: 'springy'};
<ScrollRevealRise dials={{...dials, plays: 'always', direction: 'left'}}>Hello</ScrollRevealRise>
<SwipeCarousel items={cards} dials={{...dials, autoplay: 'on', loop: 'on'}} />

// Use at settings boundaries too. Pieces call it internally.
cleanDials('scroll-reveal-rise', {speed: 'fast', loop: 'on', amount: 42});
// => {speed: 'fast'}
```

`SHARED_DIALS` and `PIECE_DIALS` export frozen `id -> readonly values` vocabularies.
`DialId` is the union of their ids. `MotionDials` is
`Partial<Record<DialId, string>>`; values are intentionally validated at runtime.
`cleanDials(pieceId, input)` accepts unknown settings, retains only supported
exact string values, and never mutates input or throws. Unknown pieces yield `{}`.
The validator does not fill defaults. Each piece owns its mappings.

| Shared id | Values | Reveal | Carousel |
| --- | --- | --- | --- |
| speed | slow / normal / fast | Yes | Yes |
| size | small / medium / large | Yes | Yes |
| bounce | none / soft / springy | Yes | Yes |
| plays | once / always | Yes | Unsupported |
| delay | none / short / long | Yes | Unsupported |
| cascade | together / cascade | Yes | Unsupported |
| direction | up / down / left / right | Yes | Unsupported |
| fade | none / soft / full | Yes | Unsupported |
| start | early / middle / late / load | Yes | Unsupported |
| blur | none / soft / strong | Yes | Unsupported |
| autoplay | off / on | Unsupported | Yes |
| loop | off / on | Unsupported | Yes |
| sideCards | normal / smaller / dimmer | Unsupported | Yes |
| flick | soft / normal / strong | Unsupported | Yes |

Existing explicit props take priority, including `false` and `0`. For example,
`once={false}` wins over `dials={{plays: 'once'}}`, and `gap={0.4}` wins over a
carousel size dial. Omitting dials retains each piece's current look; image reveal
presets still have their own slower, full-fade defaults. Reduced motion overrides
all dials: no entrance/navigation animation, fade transition or autoplay. Direct
carousel dragging and instant keyboard navigation remain usable.

The catalog exposes `dials` (supported id array), `dialDefaults` (id-to-word map),
`unsupportedDials`, and reveal `dialDefaultsByPreset` for image overrides. New
pieces must register their support in `src/dials.ts`, implement their own token
mappings, and declare all defaults and unsupported ids in the catalog. New dial
ids belong in the central vocabulary, never in a piece-local vocabulary.

All demo pages include a dial panel with reset and replay controls. Initially
visible reveal content retains its short, subtle entrance; scroll to below-fold
samples to compare full distance, speed, bounce and trigger settings. The sample
labeled optional replay retains its explicit `once={false}` to demonstrate prop
priority. Carousel autoplay can also be paused using its visible button; pointer,
focus, tab visibility and reduced-motion preferences take priority over playback.


## Motion Batch 1

The generic pieces below use the timing studied in our own design reference.
All timings and curves are named in `src/tokens.ts`; no reference code or assets
are shipped. Run `npm run demo`, then open `/motion-batch-1.html` for the full
showcase at phone or desktop widths. Each piece also has its own linked demo.

| Piece | Supported dials | Usage and props |
| --- | --- | --- |
| ScrollFocus | speed, size, blur | [Text focus](src/pieces/scroll-focus/README.md) |
| CountUp | speed, delay, plays | [Exact formatted numbers](src/pieces/count-up/README.md) |
| StarPop | speed, bounce, delay | [Staggered small items](src/pieces/star-pop/README.md) |
| Marquee | speed, direction, size | [Seamless strip](src/pieces/marquee/README.md) |
| Float | speed, size | [Idle bob](src/pieces/float/README.md) |
| HoverTilt | size, speed | [Pointer-following card](src/pieces/hover-tilt/README.md) |
| HoverLift | size, speed | [Button lift](src/pieces/hover-lift/README.md) |
| ImageHoverZoom | size, speed | [Clipped image zoom](src/pieces/image-hover-zoom/README.md) |
| Accordion | speed, cascade | [Keyboard disclosures](src/pieces/accordion/README.md) |
| CtaPills | speed, size, blur, delay | [Entrance and idle pills](src/pieces/cta-pills/README.md) |

The WCC vocabulary above applies across pieces. Marquee accepts only `left` and
`right` directions; `cleanDials` drops `up` and `down` for that piece. Its direction
means travel direction. Accordion uses `cascade` for one open item and `together`
for multiple open items. `start: 'load'` is supported by ScrollRevealRise and plays
on mount. The blur dial uses 0/6/10px for none/soft/strong. ScrollFocus preserves the
reference's 8px default when no blur dial is supplied; selecting soft explicitly
uses 6px. The demo's Default option preserves that reference preset.

## Blur-rise preset

The word dials choose blur, opacity and smooth settling. Explicit props select
the exact reference geometry and house timing. Scroll entrances use 70ms sibling
stagger; the hero plays on load with 110ms stagger after 350ms.

```tsx
import {ScrollRevealRise, batchMotion} from '@wcc/motion-library';

const blurRise = {blur: 'strong', fade: 'full', bounce: 'none'} as const;
<ScrollRevealRise
  dials={blurRise}
  distance={batchMotion.blurRise.distance}
  duration={batchMotion.blurRise.duration}
  stagger={batchMotion.blurRise.stagger * 1000}
>{content}</ScrollRevealRise>

<ScrollRevealRise
  dials={{...blurRise, start: 'load'}}
  distance={batchMotion.blurRise.distance}
  duration={batchMotion.blurRise.duration}
  stagger={batchMotion.blurRise.heroStagger * 1000}
  delay={batchMotion.blurRise.heroDelay * 1000}
>{heroContent}</ScrollRevealRise>
```

The preset uses a 1.1-second entrance and house ease `[0.22,1,0.36,1]`. Entrance blur
ends at `filter: none`; it never runs as continuous image-scroll blur. Existing
unblurred above-fold reveals keep their subtle short entrance. `trigger="scroll"`
or `trigger="load"` overrides the start dial; numeric `duration` is in seconds,
while reveal `delay` and `stagger` remain milliseconds.

Server markup contains final, visible entrance content and final number strings.
Accordion renders its chosen open/closed disclosure state. Reduced motion stops
movement, blur, counting, marquee and idle loops; controls stay usable. Pointer
pieces require a fine hover-capable pointer. Observers are pooled, and continuous
scroll/pointer following shares a requestAnimationFrame scheduler. ScrollFocus
reads all positions before writing styles. No piece intercepts native scrolling.
The sole layout-animation exception is Accordion's grid rows.


## Load, pointer and scroll pieces (2026-09-30)

Open `/design-2026-09-30.html` with `npm run demo` for the seven-piece showcase,
or choose an individual page from the demo index. Each sample has its own dial
panel. Reference files are studied locally and are excluded from the npm build.

| Piece | Supported dials | Details |
| --- | --- | --- |
| ImageLoadBlurIn | speed, size, blur, delay | [Image load entrance](src/pieces/image-load-blur-in/README.md) |
| ParallaxDrift | speed, size, direction | [Scroll drift](src/pieces/parallax-drift/README.md) |
| CursorProximityFade | size, delay | [Optional proximity cue](src/pieces/cursor-proximity-fade/README.md) |
| FullscreenViewer | speed, size, loop, fade | [Accessible fullscreen viewing](src/pieces/fullscreen-viewer/README.md) |
| PinnedScrollStory | speed, size, blur, fade | [Native sticky story](src/pieces/pinned-scroll-story/README.md) |
| ScrollStackCards | speed, size | [Stacking cards](src/pieces/scroll-stack-cards/README.md) |
| CursorFollowImage | speed, size | [Pointer-following image](src/pieces/cursor-follow-image/README.md) |

```tsx
<ImageLoadBlurIn src="/landscape.jpg" alt="A mountain at sunrise" />
<ParallaxDrift><img src="/detail.jpg" alt="Mountain detail" /></ParallaxDrift>
<CursorProximityFade><a href="#next">Keep reading</a></CursorProximityFade>
<FullscreenViewer items={galleryItems} dials={{loop:'on'}} />
<PinnedScrollStory items={storyItems} />
<ScrollStackCards>{cards}</ScrollStackCards>
<CursorFollowImage><img src="/product.jpg" alt="Product detail" /></CursorFollowImage>
```

Parallax accepts only `up` or `down`, meaning travel direction; irrelevant dial
values are dropped. FullscreenViewer uses the existing shared `loop` vocabulary.
Explicit props override dials. The exact study timings are named in
`designMotion` in `src/tokens.ts`.

Server output stays readable: images are sharp, scroll effects are at rest, and
stories/cards are in natural flow. Reduced motion keeps those final states and
all controls working. FullscreenViewer locks background scrolling only while its
native modal is open, then restores the previous styles and focus. The pinned
story uses CSS sticky positioning and a scroll track; it does not intercept wheel
or touch scrolling. Tall story panels and cards fall back to readable flow.
