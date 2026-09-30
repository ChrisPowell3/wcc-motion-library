# Hover Tilt

A card gently follows a fine pointer in three dimensions and lifts slightly.
Rebuilt from the owned TransformNation reference, with a stationary hit area and
shared frame scheduler. Mouse/pen motion is decorative; touch and coarse-pointer
viewers receive the unchanged content.

```tsx
<HoverTilt dials={{size: 'medium'}}>
  <article><h3>One good habit</h3><a href="/start">Start today</a></article>
</HoverTilt>
```

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | Any React content; preserve native links/buttons and image alt text |
| `dials` | `{}` | `speed`, `size`; unsupported entries ignored |
| `maxTilt` | 6 | 0–15 degrees per axis |
| `lift` | 8 | 0–24 px upward hover travel |
| `perspective` | 1000 | 400–2000 px |
| `smoothing` | .1 | .01–1 following factor per reference frame |
| `className`, `style` | Unset | Classes/inline layout styles on the stationary outer block |

`size` small/medium/large maps to 3/6/10 degrees and 4/8/12 px lift. `speed`
slow/normal/fast scales the following time by 1.875/1/.5625 using house duration
ratios; normal preserves .1 smoothing. Explicit props win over dials, including
zero. Numeric values are clamped; non-finite values use dial or preset defaults.

Pointer coordinates are normalized against the stationary outer box and bounded
at each edge. Only the inner block transforms. Smoothing accounts for frame
duration and stops at exact rest. Leaving/cancelling returns the card smoothly;
changing to reduced motion or losing fine-pointer capability resets immediately.
All subscriptions are removed on unmount. No scroll or wheel handlers are used.

Server markup is fully visible at rest. There are no added tab stops or roles;
keyboard activation and descendant focus outlines remain native. Nothing is
hidden, inert or available only on hover. Reduced motion always wins, including
live preference changes. Avoid clipping ancestor overflow if lifted content or
its native focus outline should extend beyond the surrounding layout.
