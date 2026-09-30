# Hover Lift

A button or link rises a few pixels on hover or visible keyboard focus. The
wrapper keeps its hit area stationary and preserves the child's semantics.
Rebuilt from the owned TransformNation reference; only transform animates.

```tsx
<HoverLift><button onClick={start}>Get started</button></HoverLift>
<HoverLift dials={{size: 'small'}}><a href="/learn">Learn more</a></HoverLift>
```

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | Any React content; use native buttons/links for controls |
| `dials` | `{}` | `speed`, `size`; unsupported entries ignored |
| `lift` | 3 | 0–20 px upward travel |
| `duration` | .5 | 0–3 seconds |
| `className`, `style` | Unset | Classes/inline layout styles on the stationary inline-block wrapper |

`size` small/medium/large maps to 1.5/3/6 px. `speed` slow/normal/fast maps to
.9375/.5/.28125 seconds with the shared house ease. Explicit props win, including
zero. Numeric values are clamped; non-finite values use dial or preset defaults.

Hover requires `(hover: hover) and (pointer: fine)` and ignores touch pointers.
Visible keyboard focus may lift the same content when a fine pointer is
available; native Tab/Enter/Space behavior and focus outlines remain intact.
No extra focus target, role, hidden content or event cancellation is introduced.
Mouse leave returns to rest unless a descendant retains visible keyboard focus.

Server markup is visible at rest. Reduced motion or loss of fine-pointer
capability clears the transform immediately without a return transition, and
live preference changes are supported. Media-query subscriptions clean up on
unmount. Do not clip ancestor overflow if the lift or native focus outline
needs to extend beyond the surrounding layout.
