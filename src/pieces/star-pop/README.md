# Star Pop

```tsx
<StarPop>{stars.map(star => <span key={star.id}>{star.icon}</span>)}</StarPop>
```

Direct children pop individually; a fragment counts as one item. Wrappers participate in the caller's layout. Supply accessible labels for meaningful icons, or mark decorative icons as hidden. The component adds no star-specific semantics and never duplicates children.

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | React content; arrays, one child, and empty content are supported. |
| `dials` | `{}` | `speed`: slow/normal/fast; `bounce`: none/soft/springy; `delay`: none/short/long. `plays`: once/always/scrub. Other dials ignored. |
| `duration` | 0.6 | Seconds, 0–5. |
| `delay` | 0.25 | Seconds, 0–5. |
| `stagger` | 0.11 | Seconds per child, 0–1. |
| `bounce` | springy | none / soft / springy. |
| `threshold` | 0.25 | Visible fraction, 0–1. |
| `margin` | `0px` | Observer root margin in px or %. |
| `className` | undefined | Class applied to each motion wrapper. |
| `style` | undefined | Decoration/layout CSS; the piece owns its transforms and opacity. |

In timed modes, the reference springy path starts at scale 0, rotation −40°, and opacity 0; reaches scale 1.25, rotation 8°, and opacity 1 at 60%; and finishes at scale 1 and rotation 0. Soft uses scale 1.08 and −20°/3° rotation with the house settle curve. None removes rotational movement and overshoot. Springy uses the named reference cubic curve; timing never introduces local spring numbers.

The delay is `delay + index × stagger`. Short preserves 0.25 seconds, none uses zero, and long adds the house slow duration. Slow/fast multiply the duration by shared slow/base or fast/base ratios. Explicit props win; numeric values clamp to their documented ranges and invalid values use defaults.

The entrance follows scroll by default. Server HTML and first hydration are fully visible. Reduced motion finishes immediately. Children stay keyboard accessible even during delayed entrances: focus cancels pending motion, restores full visibility, and keeps that item still while focused. Native focus indicators remain intact. Observation and motion are cleaned up on unmount.


### Playback (0.5.0)

The default is `dials={{plays: 'scrub'}}`: scroll down to reveal, up to reverse,
and down to reveal again. Set `plays="once"` or `plays="always"` for timed
entrances. Explicit `once` overrides the plays prop and dial (`true` = once,
`false` = always); its default is undefined. The plays prop overrides the dial.

`scrubRange` is the distance from trigger to completion in viewport heights
(default 0.4, range 0.1–1). `smoothing` is the following factor per reference frame
(default 0.14, range 0.01–1). Margin/threshold (and reveal's start dial) set the
trigger. Delay, duration, stagger and bounce tune timed modes only. In scrub,
position maps directly to progress; pills have no independent idle bob.
The range shifts earlier near the document end so final-page content can complete;
non-scrolling pages stay visible. SSR and reduced motion show final content without motion. Focused controls
stay fully visible.
