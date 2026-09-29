# WCC Motion Library (@wcc/motion-library)

Shared motion pieces for every CP website. The Website Command Center
(WCC) reads `catalog.json` to know what pieces exist and what settings
they take, so CP can say "use the swipe carousel here" on any site.

- House timing lives in `src/tokens.ts`.
- Rules for builders live in `AGENTS.md`.
- Run `npm run check` to test and `npm run demo` to see pieces.

## Motion dials (0.3.0)

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
| start | early / middle / late | Yes | Unsupported |
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

Both demo pages include a dial panel with reset and replay controls. Initially
visible reveal content retains its short, subtle entrance; scroll to below-fold
samples to compare full distance, speed, bounce and trigger settings. The sample
labeled optional replay retains its explicit `once={false}` to demonstrate prop
priority. Carousel autoplay can also be paused using its visible button; pointer,
focus, tab visibility and reduced-motion preferences take priority over playback.
