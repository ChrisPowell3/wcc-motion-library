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
| `as` | `block` | `block`, `image`, `button` |
| `distance` | 24; image: 64 | 8–120 px |
| `duration` | `base`; image: `slow` | `fast`, `base`, `slow` |
| `stagger` | 90 | 0–300 ms between siblings |
| `startOpacity` | 0.5; image: 0 | 0–0.6 |
| `once` | true | true or false |
| `margin` | `0px 0px -10% 0px` | IntersectionObserver root margin: 1–4 px/% values |

Numeric props are clamped; non-finite values use the preset default. Long lists
cap each item's delay at nine beats and at `durations.entrance` (900 ms). Each
item must intersect independently before its delay starts. Already-visible items
start at at most 8 px and 0.8 opacity, use `durations.fast`, and cap delay at that
same duration. Their observer uses the actual viewport (zero margin), including
items visible in the bottom inset strip on mount. Below-fold text/buttons use `settleEase`, a duration-normalized
sample of `springs.settle`; their opacity and all image motion use `ease`.

The default negative bottom margin moves the trigger **inside** the viewport;
it does not start offscreen. Native IntersectionObserver percentage margins are
relative to the root's width. Use px for a viewport-width-independent inset.
Threshold zero triggers even for elements taller than the viewport. The observer
watches the stationary anchor, so the entrance transform cannot shift its trigger.
A missing observer or invalid margin fails open, with fully visible content.

`once` is per mounted, keyed child. With `once={false}`, leaving view resets the
item instantly and the next entry reveals again; there is no animated exit.
Changing props does not replay an already-revealed one-time item. Remount to replay.

Server markup is fully visible, and hydration prepares the animation before paint.
Reduced motion skips movement, fading and delays entirely, including when the OS
preference changes during an entrance. There is no prop to override the preference.
Only transform and opacity animate; content is never inert or hidden from assistive
technology. The explicit image opacity default of 0 follows the prop contract;
use `startOpacity={0.5}` when images should remain translucent before revealing.
