# CursorFollowImage

A supplied image gently follows a nearby pointer inside its stationary wrapper. Built fresh from the owned TransformNation motion reference; no page code or assets are included.

```tsx
<CursorFollowImage dials={{speed: 'normal', size: 'medium'}}>
  <img src="/coach.webp" alt="Coach smiling" style={{display: 'block', width: '100%'}} />
</CursorFollowImage>
```

| Prop | Default | Range / purpose |
| --- | --- | --- |
| `children` | required | React content; images must supply meaningful `alt` or `alt=""` for decoration |
| `dials` | `{}` | Shared word settings below |
| `maxX` | `26` | Horizontal travel cap, 0–100 px |
| `maxY` | `22` | Vertical travel cap, 0–100 px |
| `scale` | `1.03` | Active scale, 1–1.2 |
| `falloff` | `420` | Distance where pull stops growing, 1–2000 px |
| `strength` | `.06` | Pointer displacement multiplier, 0–1 |
| `smoothing` | `.08` | Follow amount per 60 Hz frame, .01–1 |
| `className` | unset | Outer wrapper CSS class |
| `style` | unset | Outer wrapper React CSS properties |

`size` maps small/medium/large to half/normal/1.5× travel and scale excess above 1. `speed` maps slow/normal/fast through the shared duration ratios. Other dials are ignored. Explicit props win. Invalid numeric inputs fall back to resolved defaults; finite out-of-range inputs clamp.

The center-relative pointer displacement is multiplied by `.06 × min(1, 420 / distance)` and capped independently on each axis. Active scale is 1.03. Smoothing uses the shared clock with elapsed-time correction. Leaving or canceling the pointer returns exactly to rest; repeated equivalent dials do not restart movement.

Fine, hover-capable pointers only. Touch, coarse pointers, and reduced-motion users receive stationary media with full content and controls. Preference and pointer-capability changes apply immediately. Server rendering starts at rest. Images are caller-supplied so this wrapper also accepts picture elements and framework image components. The outer wrapper is measured and the inner layer moves, avoiding a feedback loop. Leave room around the media or clip the outer wrapper if the design requires it. No page scrolling or keyboard handling is intercepted.
