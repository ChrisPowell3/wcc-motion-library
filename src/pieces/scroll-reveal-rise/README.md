# Scroll Reveal Rise

Content rises into place as its leading edge enters view. Text and buttons have
a short settle; images travel farther and take longer. Built from scratch using
React, Motion and the library's timing tokens. No scroll, wheel or touch handlers.

```tsx
import {ScrollRevealRise} from '@wcc/motion-library';

<ScrollRevealRise>
  <h2>A little progress, every day.</h2>
  <p>Start where you are.</p>
</ScrollRevealRise>

<div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
  <ScrollRevealRise as="button">
    <button onClick={start}>Get started</button>
    <a href="/learn">Learn more</a>
  </ScrollRevealRise>
</div>

<ScrollRevealRise as="image">
  <img src="/team.jpg" alt="The team walking together" style={{width: '100%'}} />
</ScrollRevealRise>
```

`as` selects a motion preset; it does not create a button or image. Supply semantic
children with their own alt text, accessible names and native keyboard behavior.
Each direct child gets a stationary block anchor and a moving block frame. These
anchors participate in a parent flex/grid layout. Fragments count as one item;
use a fragment to reveal a heading and paragraph as a single unit. Use stable keys
for arrays. This component is for flow content, not inside a paragraph, table or
list that requires specific direct child tags. It does not add tab stops to text.
Native focus outlines remain intact; a keyboard-focused item also gets a frame
outline. Focusing any descendant cancels that item's delay and reveals it at once.

| Prop | Default | Allowed values |
| --- | --- | --- |
| `children` | Required | ReactNode or ReactNode[]; empty content supported |
| `dials` | `{}` | Shared word settings listed below; unsupported/invalid entries are ignored |
| `as` | `block` | `block`, `image`, `button` |
| `distance` | 24; image: 64 | 8–120 px |
| `duration` | `base`; image: `slow` | `fast`, `base`, `slow` |
| `stagger` | 90 | 0–300 ms between siblings |
| `startOpacity` | 0.5; image: 0 | 0–0.6 |
| `once` | true | true or false |
| `margin` | `0px 0px -10% 0px` | IntersectionObserver root margin: 1–4 px/% values |

Set `dials` for word-based controls. Omitting it keeps the existing preset;
`image` defaults to slow speed, no bounce and a full fade, while `block` and
`button` use normal speed, soft bounce and a soft fade.

```tsx
<ScrollRevealRise
  dials={{direction: 'left', size: 'small', delay: 'short', plays: 'always'}}
  stagger={0}
>
  <h2>Keep moving forward.</h2>
  <p>These siblings start together after the short delay.</p>
</ScrollRevealRise>
```

| Dial | Values and effect | Default |
| --- | --- | --- |
| `speed` | `slow`: 600 ms; `normal`: 320 ms; `fast`: 180 ms | `normal`; image: `slow` |
| `size` | `small`: half preset distance; `medium`: preset distance; `large`: double, capped at 120 px | `medium` |
| `bounce` | `none`: house ease; `soft`: settle curve; `springy`: snap spring curve | `soft`; image: `none` |
| `plays` | `once`: one entrance per mount; `always`: repeat after leaving view | `once` |
| `delay` | `none`: 0; `short`: 180 ms; `long`: 600 ms | `none` |
| `cascade` | `together`: no sibling stagger; `cascade`: 90 ms between siblings | `cascade` |
| `direction` | `up`: starts below; `down`: above; `left`: to the left; `right`: to the right | `up` |
| `fade` | `none`: fully opaque; `soft`: starts at 0.5; `full`: starts at 0 | `soft`; image: `full` |
| `start` | `early`: bottom inset 10% of viewport height; `middle`: 25%; `late`: 40% | `early` |

Explicit `distance`, `duration`, `stagger`, `startOpacity`, `once` and `margin`
override their matching dials, including zero and false. Numeric props keep their
existing clamps; non-finite values use the resolved dial or preset default.
`fade: 'none'` stays fully opaque; an explicit `startOpacity` still clamps to 0–0.6.
Size resolves to 12/24/48 px for blocks and buttons, and 32/64/120 px for images.

Each item must intersect independently before its delay starts. The sibling
portion of the delay is capped at nine beats and `durations.entrance` (900 ms);
the selected `delay` is added separately, so the total can reach 1500 ms.
Already-visible content keeps a subtle entrance: distance at most 8 px, opacity
at least 0.8, `durations.fast` and the house ease. Its sibling wait is capped at
180 ms, but the selected delay still applies. Its observer uses the actual
viewport (zero margin), including the bottom inset strip, so `start` affects
items initially outside the viewport. Use below-fold content to preview the
full distance, speed, bounce, fade and start settings.

A start dial moves the trigger **inside** the viewport using its height; it
updates after resize or rotation, including on wide, short screens. An explicit
`margin` overrides this calculation. With no start dial or margin, the original
`0px 0px -10% 0px` preset remains unchanged. Native IntersectionObserver
percentage margins are relative to the root's width; use explicit px when that
width-dependent behavior is unwanted.
Threshold zero triggers even for elements taller than the viewport. The observer
watches the stationary anchor, so the entrance transform cannot shift its trigger.
A missing observer or invalid margin fails open, with fully visible content.

`once` is per mounted, keyed child. With `once={false}`, leaving view resets the
item instantly and the next entry reveals again; there is no animated exit.
Changing props does not replay an already-revealed one-time item. Remount to replay.

Server markup is fully visible, and hydration prepares the animation before paint.
Reduced motion skips movement, fading and delays entirely, including when the OS
preference changes during an entrance. There is no prop to override the preference.
Horizontal entrances clip overflow at the stationary anchor so they cannot
widen the page; vertical overflow and the anchor focus outline remain visible.
Only transform and opacity animate; content is never inert or hidden from assistive
technology. The explicit image opacity default of 0 follows the prop contract;
use `startOpacity={0.5}` when images should remain translucent before revealing.
