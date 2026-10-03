# Count Up

```tsx
<CountUp dials={{speed: 'normal', delay: 'short', plays: 'scrub'}}>
  {['−182', '$49', '100k+', '25+', '1,234.50']}
</CountUp>
```

Each string counts from zero to its authored magnitude when visible. Prefixes, suffixes, grouping and decimal precision remain intact, and the final string is restored exactly, including authored leading zeros. Unsupported strings remain unchanged. Each value has one group with its final string as its accessible name; visual ticks are hidden from assistive technology, so counting never repeatedly announces numbers.

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | A string or readonly string array; empty arrays supported. |
| `dials` | `{}` | `speed`: slow/normal/fast; `delay`: none/short/long; `plays`: once/always/scrub. Other dials ignored. |
| `duration` | 2.2 | Seconds, 0–10. |
| `delay` | 0.5 | Seconds, 0–5. |
| `stagger` | 0.18 | Seconds, 0–1; item delay is `delay + (index % 4) × stagger`. |
| `once` | undefined (scrub) | False resets offscreen and counts on re-entry. |
| `threshold` | 0.12 | Visible fraction, 0–1. |
| `margin` | `0px 0px -6% 0px` | Observer root margin in px or %. |
| `className` | undefined | Class applied to each number wrapper. |
| `style` | undefined | Inline CSS applied to each number wrapper. |

In timed modes, normal speed uses the reference 2.2-second exponential ease-out (`1 − 2^(-10p)`, exact final endpoint). Slow/fast multiply the duration by the shared slow/base or fast/base duration ratio. Delay none is zero, short is 0.5 seconds, and long adds the house slow duration (currently 0.6 seconds). Explicit props win over dials; invalid numeric values use safe defaults and finite values clamp to their documented range.

Server rendering and initial hydration show the final strings. Reduced motion restores final values immediately and cancels any running count. No wheel, scrolling, keyboard, or pointer behavior is intercepted. Visibility uses the shared observer pool, and subscriptions and animation work are removed on unmount. Give surrounding statistics their descriptive label in the caller's content.


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
