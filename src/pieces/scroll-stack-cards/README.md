# ScrollStackCards

Cards stick naturally while each outgoing card gently shrinks beneath the next. Built fresh from the owned TransformNation motion reference; no page code or assets are included.

```tsx
<ScrollStackCards dials={{speed: 'normal', size: 'medium'}}>
  <article style={{background: '#fff', padding: 32}}>First card</article>
  <article style={{background: '#eee', padding: 32}}>Second card</article>
</ScrollStackCards>
```

| Prop | Default | Range / purpose |
| --- | --- | --- |
| `children` | required | Each direct child is one card; supports empty/single-card collections |
| `dials` | `{}` | Shared word settings below |
| `scale` | `.95` | Minimum outgoing card scale, .8–1 |
| `smoothing` | `.14` | Follow amount per 60 Hz frame, .01–1 |
| `top` | `96` | Sticky inset, 0–300 px |
| `gap` | `24` | Space between cards in normal flow, 0–160 px |
| `className` | unset | Stack container CSS class |
| `style` | unset | Container React CSS properties; vertical flex layout and gap are owned by the piece |

`size` maps small/medium/large to .975/.95/.925 scale. `speed` maps slow/normal/fast through shared duration ratios. Other dials are ignored. Explicit props win. Invalid numeric inputs fall back to resolved defaults; finite out-of-range inputs clamp.

The overlap target is `clamp(1 − (nextTop − currentTop) / currentHeight, 0, 1)`. Outgoing scale moves from 1 toward .95; the last card stays at full scale. The outer cards supply native sticky geometry and the inner layers own transforms. Shared viewport observation completes all outer-rectangle reads before any layer is changed. No scroll hijacking, wheel interception, or per-frame React state.

Cards must supply their own background, spacing and appearance. Avoid overflow containers between this piece and the page if it should stick to the page viewport. Every card stays in document flow. If any card is taller than the available viewport below `top`, the whole group returns to normal flow so all content remains readable. Resizing, image loads, and other card-size changes are observed. A focused descendant temporarily raises its card above siblings, preserving access to its native controls.

Reduced motion renders cards in normal flow without scale changes, including live preference updates. Server rendering starts as readable normal content. Empty and single-card collections do not subscribe to animation. All subscriptions and resize observers are released on unmount.
