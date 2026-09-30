# Marquee

A continuous, seamless strip with one accessible copy of its content. Built
from scratch; the word-band reference supplied the 30-second linear timing and
28-pixel spacing only.

```tsx
import {Marquee} from '@wcc/motion-library';

<Marquee label="Ways to move" dials={{speed: 'normal', direction: 'left'}}>
  <span>Walk</span><span>Stretch</span><span>Build strength</span>
</Marquee>
```

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | ReactNode; empty content and fragments supported |
| `dials` | `{}` | `speed`: slow/normal/fast; `size`: small/medium/large; `direction`: left/right |
| `duration` | `30` | Seconds per original set, clamped to 5–120; overrides speed |
| `gap` | `28` | Pixels between items and sets, clamped to 0–120; overrides size |
| `direction` | `left` | left/right travel; overrides direction dial |
| `label` | `Moving content` | Non-empty accessible name for the region |
| `showPauseControl` | `true` | Boolean; keep enabled for automatic moving content |

The normal speed uses `batchMotion.marquee.duration`. Slow multiplies it by
`durations.slow/durations.base` (56.25 seconds); fast uses
`durations.fast/durations.base` (16.875 seconds). Size changes the gap only:
small/medium/large resolve to 14/28/56 pixels. Left and right describe travel.
Vertical directions and unsupported dials are ignored. Non-finite numbers use
the resolved dial or normal default. Explicit zero gap is supported.

The component measures the original set and viewport together, then adds enough
decorative sets to fill even a wide viewport with a short list. One extra
original-set width makes the wrap seamless. ResizeObserver updates the geometry;
where unavailable, window resizing still updates it. Images should have explicit
dimensions to minimize layout shifts. The only animated property is transform.

Hover, leaving the viewport, and a hidden browser tab freeze the current motion
and unsubscribe from the shared frame loop; there is no paused animation driver
running in the background. Resuming retains the loop's progress. Keyboard focus
in the strip and the manual pause control instead show the whole original set at
rest, wrapping naturally. Native focus outlines remain. Reduced motion uses this static layout and disables the
pause control; a live preference change stops the strip immediately. Server HTML
also includes the full wrapped original set once, with no copies or initial
translation. No wheel or touch scrolling is intercepted.

Copies are `aria-hidden` and `inert`. Content containing links, buttons, form or
media controls, embedded documents, editable areas, tabbable elements, or button/link roles automatically
uses the static wrapped layout with no copies and a disabled pause control. This
keeps every visible interactive element actionable with mouse, keyboard and touch.
Detection inspects rendered child DOM and watches for later changes, so custom
components that render native controls are covered too. Keep nonsemantic custom
widgets (for example, clickable canvas drawings without controls) outside the
marquee. Authored ids on intrinsic decorative child elements are removed from
copies to avoid duplicate ids. Custom decorative components render separately
for each copy: use React `useId` inside them instead of fixed ids, and avoid
children whose mounting has external side effects. Supply meaningful alt text for informative images.
Content keeps its own colors and typography; the pause control uses inherited
color. Remount to reset manual pause state.
