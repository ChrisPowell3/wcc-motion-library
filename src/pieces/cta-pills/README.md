# CTA Pills

```tsx
<CtaPills dials={{speed: 'normal', size: 'medium', blur: 'soft', delay: 'short'}}>
  {links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
</CtaPills>
```

Generic child content enters with a shallow rise, scale and blur, then gently floats. The component supplies motion wrappers, not pill colors, copy, link behavior, or button semantics. A fragment counts as one child; arrays and empty content are supported.

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | React content. |
| `dials` | `{}` | speed slow/normal/fast; size small/medium/large; blur none/soft/strong; delay none/short/long. Others ignored. |
| `duration` | 0.9 | Entrance seconds, 0–5. |
| `delay` | 0.2 | Entrance base delay seconds, 0–5. |
| `stagger` | 0.14 | Entrance sibling delay seconds, 0–1. |
| `distance` | 16 | Entrance travel px, 0–64. |
| `scale` | 0.9 | Entrance scale, 0.5–1. |
| `blur` | 6 | Entrance blur px, 0–10. |
| `bob` | 4 | Idle float distance px, 0–20. |
| `floatDuration` | 2.8 | Idle base one-way duration seconds, 0.2–20. |
| `floatStep` | 0.4 | Extra idle duration seconds × index, 0–3. |
| `floatDelay` | 1.2 | Idle base delay from the visibility trigger, seconds, 0–10. |
| `floatDelayStep` | 0.3 | Extra idle delay seconds × index, 0–3. |
| `threshold` | 0.25 | Visible fraction, 0–1. |
| `margin` | `0px` | Observer root margin in px or %. |
| `className` | undefined | Class applied to each outer wrapper. |
| `style` | undefined | Decoration/layout CSS; transforms, opacity and filter belong to the piece. |

Default entrances use the named reference cubic curve and begin after `0.2 + index × 0.14` seconds. Idle motion uses a separate nested transform, starts `1.2 + index × 0.3` seconds from the same trigger, and alternates over `2.8 + index × 0.4` seconds. These independent tracks preserve the reference cadence without one transform overwriting another. Entrance blur is capped at 10px and always ends at `filter: none`.

Speed scales entrance duration, idle duration and idle duration step by the shared slow/base or fast/base ratios. Size scales entrance and idle distances by 0.5 / 1 / 1.5. Blur selects 0 / 6 / 10px. Delay none is zero, short preserves 0.2 seconds, and long adds the house slow duration. Explicit props win. Invalid numeric values use defaults, and finite values clamp to the ranges above.

Server HTML and hydration are readable and unblurred. The entrance runs once per item; idle motion pauses offscreen and in hidden documents. Reduced motion finishes the entrance and resets the float immediately, including live preference changes. Children remain focusable during a delayed entrance. Receiving focus cancels all motion, restores full visibility, and holds the item still until remount. Children retain their native semantics and focus indicators. All subscriptions and motion stop on unmount.
