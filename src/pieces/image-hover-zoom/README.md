# Image Hover Zoom

An image grows subtly inside its cropped frame on fine-pointer hover. Rebuilt
from the owned TransformNation reference, using only transform and the house
ease. This wrapper accepts React content so existing responsive images and
links retain their own props; supply meaningful `alt` text on every image,
or `alt=""` for a decorative image.

```tsx
<ImageHoverZoom style={{borderRadius: 20}}>
  <img src="/walk.jpg" alt="Friends walking together" style={{display: 'block', width: '100%'}} />
</ImageHoverZoom>
```

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | React image/content with appropriate native image alt props |
| `dials` | `{}` | `speed`, `size`; unsupported entries ignored |
| `scale` | 1.03 | 1–1.2 hover scale |
| `duration` | 1 | 0–3 seconds |
| `className`, `style` | Unset | Classes/inline layout styles on the stationary cropped frame |

`size` small/medium/large maps to 1.015/1.03/1.06. `speed` slow/normal/fast
maps to 1.875/1/.5625 seconds. Explicit props win, including duration zero and
scale one. Numeric values are clamped; non-finite values use dial or preset defaults.

The outer frame always uses `overflow: hidden`; only the inner block scales.
Provide image dimensions/aspect ratio and border radius through your image or
wrapper styles. The component never blurs an image. Touch and coarse pointers
remain still, and there is no added tab stop or hidden content. Native links
retain keyboard navigation; a visible focus outline on the outer frame avoids
losing the indicator inside the crop. Keyboard focus alone does not zoom.

Server markup is visible at rest. Reduced motion and loss of fine-pointer
capability reset instantly with no return transition, including live changes.
Media-query subscriptions are removed on unmount. No scroll, wheel or touch
handlers intercept native page interaction.
