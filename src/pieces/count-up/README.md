# Count Up

```tsx
<CountUp dials={{speed: 'normal', delay: 'short', plays: 'once'}}>
  {['−182', '$49', '100k+', '25+', '1,234.50']}
</CountUp>
```

Each string counts from zero to its authored magnitude when visible. Prefixes, suffixes, grouping and decimal precision remain intact, and the final string is restored exactly, including authored leading zeros. Unsupported strings remain unchanged. Each value has one group with its final string as its accessible name; visual ticks are hidden from assistive technology, so counting never repeatedly announces numbers.

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | A string or readonly string array; empty arrays supported. |
| `dials` | `{}` | `speed`: slow/normal/fast; `delay`: none/short/long; `plays`: once/always. Other dials ignored. |
| `duration` | 2.2 | Seconds, 0–10. |
| `delay` | 0.5 | Seconds, 0–5. |
| `stagger` | 0.18 | Seconds, 0–1; item delay is `delay + (index % 4) × stagger`. |
| `once` | true | False resets offscreen and counts on re-entry. |
| `threshold` | 0.12 | Visible fraction, 0–1. |
| `margin` | `0px 0px -6% 0px` | Observer root margin in px or %. |
| `className` | undefined | Class applied to each number wrapper. |
| `style` | undefined | Inline CSS applied to each number wrapper. |

Normal speed uses the reference 2.2-second exponential ease-out (`1 − 2^(-10p)`, exact final endpoint). Slow/fast multiply the duration by the shared slow/base or fast/base duration ratio. Delay none is zero, short is 0.5 seconds, and long adds the house slow duration (currently 0.6 seconds). Explicit props win over dials; invalid numeric values use safe defaults and finite values clamp to their documented range.

Server rendering and initial hydration show the final strings. Reduced motion restores final values immediately and cancels any running count. No wheel, scrolling, keyboard, or pointer behavior is intercepted. Visibility uses the shared observer pool, and subscriptions and animation work are removed on unmount. Give surrounding statistics their descriptive label in the caller's content.
