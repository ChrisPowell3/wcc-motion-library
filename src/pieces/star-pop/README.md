# Star Pop

```tsx
<StarPop>{stars.map(star => <span key={star.id}>{star.icon}</span>)}</StarPop>
```

Direct children pop individually; a fragment counts as one item. Wrappers participate in the caller's layout. Supply accessible labels for meaningful icons, or mark decorative icons as hidden. The component adds no star-specific semantics and never duplicates children.

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | React content; arrays, one child, and empty content are supported. |
| `dials` | `{}` | `speed`: slow/normal/fast; `bounce`: none/soft/springy; `delay`: none/short/long. Other dials ignored. |
| `duration` | 0.6 | Seconds, 0–5. |
| `delay` | 0.25 | Seconds, 0–5. |
| `stagger` | 0.11 | Seconds per child, 0–1. |
| `bounce` | springy | none / soft / springy. |
| `threshold` | 0.25 | Visible fraction, 0–1. |
| `margin` | `0px` | Observer root margin in px or %. |
| `className` | undefined | Class applied to each motion wrapper. |
| `style` | undefined | Decoration/layout CSS; the piece owns its transforms and opacity. |

The reference springy path starts at scale 0, rotation −40°, and opacity 0; reaches scale 1.25, rotation 8°, and opacity 1 at 60%; and finishes at scale 1 and rotation 0. Soft uses scale 1.08 and −20°/3° rotation with the house settle curve. None removes rotational movement and overshoot. Springy uses the named reference cubic curve; timing never introduces local spring numbers.

The delay is `delay + index × stagger`. Short preserves 0.25 seconds, none uses zero, and long adds the house slow duration. Slow/fast multiply the duration by shared slow/base or fast/base ratios. Explicit props win; numeric values clamp to their documented ranges and invalid values use defaults.

The entrance plays once per mounted item. Server HTML and first hydration are fully visible. Reduced motion finishes immediately. Children stay keyboard accessible even during delayed entrances: focus cancels pending motion, restores full visibility, and keeps that item still until remount. Native focus indicators remain intact. Observation and motion are cleaned up on unmount.
