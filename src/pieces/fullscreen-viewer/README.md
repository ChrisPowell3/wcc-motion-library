# FullscreenViewer

A gallery of ordinary thumbnail buttons that opens custom content in a native
fullscreen modal. Built from scratch; the owned reference supplies only the
entrance cadence. There is no backdrop blur, image blur, global stylesheet,
network request, or browser access during server rendering.

```tsx
<FullscreenViewer
  items={[
    {
      id: 'lake',
      label: 'Alpine lake',
      thumbnail: <img src="/lake-thumb.jpg" alt="Alpine lake preview" style={{width: 240, maxWidth: '100%'}} />,
      content: <img src="/lake.jpg" alt="Alpine lake beneath the mountains" style={{width: '100%', height: '100%', objectFit: 'contain'}} />,
    },
  ]}
  dials={{speed: 'normal', size: 'medium', loop: 'on', fade: 'full'}}
/>
```

`items` is required; an empty list renders an empty gallery. Each item has a stable
string `id`, a plain-text `label`, `thumbnail: ReactNode`, and `content: ReactNode`.
Repeated ids keep their first item. Reordering preserves the selected id; removing
that item closes the modal. Thumbnails must not contain buttons, links, inputs, or
other interactive descendants because they live inside native buttons. Authors
must provide meaningful image alt text and responsive sizes. Modal content may
include interactive elements.

| Prop | Default | Range / options |
| --- | --- | --- |
| `dials` | `{}` | Supports `speed`, `size`, `loop`, `fade`; ignores all other dials |
| `loop` | `true` | `false` / `true`; overrides loop dial |
| `duration` | `.6` | `0–3` seconds; overrides speed for content |
| `overlayDuration` | `.5` | `0–3` seconds; overrides speed for overlay |
| `distance` | `24` | `0–120` pixels; overrides size |
| `startScale` | `.97` | `.8–1`; overrides size |
| `fade` | `full` | `none`, `soft`, `full`; overrides fade dial |
| `ariaLabel` | `Fullscreen viewer` | Accessible modal name |
| `maxWidth` | `1100` | `280–1920` pixels; viewport still constrains it |
| `gap` | `16` | `0–80` pixels between thumbnails |
| `swipeThreshold` | `48` | `16–200` pixels |
| `className` | unset | Gallery wrapper class |
| `style` | unset | Gallery wrapper inline styles |

Finite numeric values are clamped; nonfinite values use defaults. Slow/fast speed
uses the shared duration ratios. Small/large size halves or multiplies the entrance
rise and scale difference by 1.5. Soft content fade starts at `.5` opacity, full at
`0`, and none at `1`; the overlay always fades in. All entrances finish fully
opaque and at rest. Only transform and opacity animate, using `designMotion.viewer`
and the house easing from `src/tokens.ts`.

Open with click, touch, or the thumbnail button's native Enter/Space activation.
Use left/right arrows, Previous/Next, dots, or a horizontal touch swipe to navigate.
Typing controls retain their own arrow keys, and vertical gestures still scroll
modal content. Escape, the close button, a native dialog cancel, or the uncovered
background closes the viewer. Dots announce which item is current; controls have
44px touch targets and retain native focus outlines. Single-item galleries disable
both navigation buttons.

The browser's `HTMLDialogElement.showModal()` places the viewer in its top layer
and makes the page behind it inert. Supported browsers need native modal dialog
support. Focus moves to Close, Tab stays inside the dialog, and closing restores
the opening button when it still exists. Body and root overflow are locked only
while a viewer is open. Their previous inline overflow values and priorities are
restored on close or unmount; nested or overlapping viewers share a counted lock.
No wheel event is intercepted.

Reduced motion is checked live through the library's Motion-backed preference
hook: in-flight motion stops and settles immediately, and all navigation stays
available. Server output includes fully visible thumbnails with no hidden entrance
styles. The dialog is created only after an explicit user open action.
