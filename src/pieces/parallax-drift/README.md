# ParallaxDrift

Gently moves supplied content downward as the page scrolls. Built fresh from the owned TransformNation motion reference; no page code or assets are included.

```tsx
<ParallaxDrift dials={{speed: 'normal', size: 'medium', direction: 'down'}}>
  <img src="/hero.webp" alt="A coach welcoming the community" style={{display: 'block', width: '100%'}} />
</ParallaxDrift>
```

| Prop | Default | Range / purpose |
| --- | --- | --- |
| `children` | required | React content; supply image alt text |
| `dials` | `{}` | Shared word settings below |
| `distance` | `70` | Maximum travel, 0–300 px |
| `factor` | `.08` | Travel per page scroll pixel, 0–1 |
| `smoothing` | `.14` | Follow amount per 60 Hz frame, .01–1 |
| `direction` | `'down'` | `'up'` or `'down'` |
| `className` | unset | Outer wrapper CSS class |
| `style` | unset | Outer wrapper React CSS properties |

`size` maps small/medium/large to 35/70/105 px. `speed` maps slow/normal/fast through the shared duration ratios. `direction` supports up/down; left/right are ignored. Other shared dials are ignored. Explicit numeric and direction props win over dials. Invalid numeric inputs fall back to the resolved default; finite out-of-range inputs clamp.

The default target is `clamp(pageScrollY × .08, 0, 70)`. This is a page-origin effect intended for hero media; below-fold media may already be at its maximum displacement when reached. Put clipping and sufficient image overscan on the outer wrapper when needed. The inner wrapper owns the transform, leaving measurement geometry stationary.

Reduced motion renders without displacement and responds to live preference changes. All content is visible during server rendering. Native page scrolling, touch gestures, focus, and descendant controls remain available. Scroll/resize observations share the library's passive observer and frame scheduler; no animation runs after settling or unmount.
