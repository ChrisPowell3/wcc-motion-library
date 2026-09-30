# Cursor Proximity Fade

```tsx
<CursorProximityFade><a href="#next">Keep reading ↓</a></CursorProximityFade>
```

A small cue instantly toggles opacity. It appears within260px of a fine pointer
or after4.5seconds of pointer inactivity, and hides at60px of page scroll.
Pointer movement restarts the idle timer. On touch/coarse-pointer devices it is
visible until the scroll threshold, so proximity is never required to use it.
Keyboard focus makes it visible immediately even after the scroll threshold.
SSR and reduced motion render fully visible content. No aria-hidden, inert or
extra tab stops are added. Supply real links/buttons with accessible names.

| Prop | Default | Range/options |
| --- | --- | --- |
| children |Required|ReactNode |
| dials |{}|size, delay |
| radius |260|0–2000px |
| idleDelay |4.5|0–60seconds |
| scrollLimit |60|0–2000px |
| className / style |Unset|Static wrapper styling |

Size small/medium/large selects130/260/390px. Delay none/short/long selects
0/2.25/4.5seconds, with long as the default. Explicit props win. There is no
fade-duration control because the authored effect is an instant opacity toggle.
Global pointer/scroll observations are passive; layout is measured in a shared
animation frame, never in a scroll handler. Timers and observations are removed
on unmount. Use this for optional small cues, not essential page content.
