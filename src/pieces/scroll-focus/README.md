# Scroll Focus

Plain text sharpens and rises as it enters the viewport, then softly loses focus
as it leaves the top. Rebuilt from the owned TransformNation reference. This
piece deliberately accepts a **string only**: use separate image motion pieces
for photos. It never blurs an image, button, link or nested interactive content.

```tsx
<ScrollFocus as="h2" dials={{blur: 'soft', speed: 'normal'}}>
  Progress starts with one step.
</ScrollFocus>
```

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | Plain string; empty text supported |
| `as` | `span` | `span`, `p`, `h1`–`h6`; preserves text semantics |
| `dials` | `{}` | `speed`, `size`, `blur`; unsupported entries ignored |
| `blur` | 8 | 0–10 px maximum blur |
| `distance` | 14 | 0–60 px upward entry travel |
| `startOpacity` | .2 | 0–1 entry opacity |
| `smoothing` | .14 | .01–1 following factor per reference frame |
| `enter` | .4 | .1–1 fraction of viewport height for entry |
| `exit` | .22 | .05–1 fraction of viewport height for exit |
| `exitFocus` | .35 | 0–1 focus remaining after leaving the top |
| `className`, `style` | Unset | Classes/inline layout styles on the stationary text tag |

`size` maps small/medium/large to 7/14/28 px. `blur` maps none/soft/strong
to 0/6/10 px; omitting it preserves the reference's 8 px. `speed` adjusts the
following rate using house duration ratios: slow takes 1.875 times normal,
fast takes .5625 times normal. Normal preserves .14 smoothing. Explicit props
win over matching dials, including zero. Numeric values are clamped and
non-finite values fall back to the dial or preset.

Entry completes after the text travels through the bottom 40% of the viewport.
When its bottom passes the top 22%, focus declines toward .35: default opacity
settles at .48 and blur at 5.2 px, while the text stays at its resting position.
The shared viewport scheduler batches geometry reads, then applies smoothed
transform/opacity/filter writes. It sleeps at rest and wakes on passive native
scroll or resize; no wheel, touch or keyboard events are intercepted. Smoothing
accounts for frame duration. Full focus writes the literal `filter: none`.

The outer tag is stationary; only the inner text span moves. Both are block
formatted, so use this for flow text, not inside a paragraph. Supply typography
and layout through the outer `className`/`style` or surrounding CSS. Server markup
is fully readable at rest. Reduced motion immediately clears movement, fading,
blur and the viewport subscription, including when the preference changes live.
