# Image Load Blur-In

```tsx
<ImageLoadBlurIn src="/landscape.jpg" alt="Mountain at sunrise" dials={{speed:'normal',blur:'soft'}} />
```

A semantic image fills a clipped frame. On successful load it moves from scale1.05
and blur6px to scale1 and `filter:none` over1.8seconds with the house ease. The
starting values remain in place during a configured delay, matching backwards
fill. Cached images work through StrictMode; failed images return to the final
state. Each new src/srcSet is eligible for one entrance. SSR is fully sharp.
Reduced motion skips the effect and clears an active effect immediately.

| Prop | Default | Range/options |
| --- | --- | --- |
| src / alt | Required | URL and accessible description; empty alt for decoration |
| srcSet / sizes | Unset | Responsive image attributes |
| dials | {} | speed, size, blur, delay |
| duration |1.8|0–5seconds |
| startScale |1.05|1–1.2 |
| blur |6|0–10px |
| delay |0|0–5seconds |
| aspectRatio |16 / 9|CSS aspect ratio |
| objectFit |cover|cover / contain |
| objectPosition |50% 50%|CSS object position |
| className / style |Unset|Static frame styling |

Speed uses the fast/base/slow house duration ratios. Size changes the excess
scale to half/normal/double. Blur none/soft/strong means0/6/10px. Delay
none/short/long uses0/durations.fast/durations.slow. Explicit props win.
This is a load entrance, never a scroll-linked image blur.


### Playback (0.5.0)

The plays dial defaults to scrub and accepts once/always/scrub. The page-load stage remains once per source for all three values. This piece has no on-scroll stage; it never blurs large images on scroll.
