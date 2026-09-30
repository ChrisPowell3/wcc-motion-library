# Accordion

A disclosure group with a smooth opening panel and a plus that turns into a close
icon. Built from scratch; the reference supplied the timing and feel only.

```tsx
import {Accordion} from '@wcc/motion-library';

<Accordion items={[
  {id: 'start', heading: 'Where do I start?', content: <p>Begin with one small step.</p>},
  {id: 'support', heading: 'Can I get help?', content: <a href="/support">Contact support</a>},
]}/>
```

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `items` | Required | Readonly `{id: string, heading: ReactNode, content: ReactNode}[]`; empty supported |
| `dials` | `{}` | `speed`: slow/normal/fast; `cascade`: together/cascade |
| `multiple` | `false` | Boolean; permits more than one open panel; overrides cascade |
| `defaultOpenIds` | `[]` | Initial item ids; unknown or repeated ids ignored |
| `duration` | `0.5` | Seconds, clamped to 0–2; finite explicit value overrides speed |
| `onChange` | undefined | `(openIds: string[]) => void`, called after user toggles |

All panels start closed. By default only one panel can be open; clicking its
header closes it. `cascade: 'together'` allows several panels; `cascade: 'cascade'`
keeps one open. This dial controls the disclosure grouping, not a timed stagger.
Explicit `multiple={false}` wins over the dial. Unknown dials and values are
ignored. Duplicate item ids use the first item. Give every item a stable unique id.

Normal timing comes from `batchMotion.accordion`: rows 0.5 seconds, icon 0.45
seconds, opacity 0.4 seconds. Rows and icon use its `[.16,1,.3,1]` curve; opacity
uses CSS ease. Slow multiplies each duration by `durations.slow/durations.base`
(1.875); fast uses `durations.fast/durations.base` (0.5625). An explicit duration
scales the icon and opacity proportionally. Zero is instant; non-finite values
fall back to the dial or normal preset.

The brief explicitly permits the `grid-template-rows: 0fr → 1fr` height technique
for this piece. Only that grid track, opacity, and icon transform transition.
Closed content is inert and hidden from assistive technology immediately.
Expanded panels have a region labelled by their header. Arrow Up/Down cycle
through headers; Home/End jump to the first/last. Enter and Space use native
button activation. Focus outlines are the browser's native keyboard outlines.
Do not place links or buttons inside `heading`; put them in `content`.

Server HTML contains the requested final expanded state, with no entrance
animation. Reduced motion makes every change instant, including changes to the
system preference while mounted. There are no page scroll handlers or global
styles. `defaultOpenIds` is read only on mount; remount to reset it. If items are
removed or multiple mode is disabled, stale open ids are discarded. `onChange`
reports user actions, not those prop-driven adjustments.
