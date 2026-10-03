# PinnedScrollStory

A sequence of content panels advances as the reader scrolls, ending with an overview of the whole story. Built from scratch using the owned design's pacing as reference.

```tsx
<PinnedScrollStory
  ariaLabel="How the program works"
  items={[
    {id: 'plan', label: 'Your plan', content: <Plan />, thumbnail: <PlanIcon />},
    {id: 'team', label: 'Your team', content: <Team />, thumbnail: <TeamIcon />},
  ]}
/>
```

`items` is a readonly array of `{id: string, label: string, content: ReactNode, thumbnail?: ReactNode}`. Labels identify navigation and overview tiles; content is fully site-owned. Supply alt text on every meaningful image. Thumbnails appear only in the overview. Empty arrays render nothing; one item still receives an overview. Duplicate item IDs do not create duplicate DOM IDs. Keep item order stable when preserving stateful content.

| Prop | Default | Accepted range / meaning |
| --- | --- | --- |
| `items` | required | Zero or more story items |
| `overviewLabel` | `At a glance` | Any descriptive text |
| `ariaLabel` | `Scroll story` | Accessible section and navigation name |
| `trackPerSlide` | `0.6` | `0.2–2` viewport heights per panel, including overview; short intervals expand only if needed to keep a taller scene clear of the following section |
| `top` | `0` | `0–240` px; offset below a fixed site header |
| `align` | `start` | `start` or `center`; vertical alignment of panels in the compact stage |
| `duration` | `0.9` | `0–3` seconds for panel transitions |
| `distance` | `40` | `0–120` px vertical entrance distance |
| `blur` | `10` | `0–10` px text-only panel entrance blur |
| `startOpacity` | `0` | `0–1`; entrance opacity |
| `dials` | normal / medium / strong / full / start | Shared speed, size, blur, fade, align settings |
| `className`, `style` | unset | Section styling; structural position/height are owned by the piece |

Numeric values are clamped. Nonfinite values use defaults. Explicit props override dials, including `align`. Speed slow/normal/fast gives 1.6875/0.9/0.50625 seconds, using the house duration ratios; size small/medium/large gives 20/40/80 px; blur none/soft/strong gives 0/6/10 px; fade none/soft/full gives 1/0.5/0 starting opacity. `align="start"` places panels 24px below the stage top; `align="center"` centers shorter panels within the measured row. Other dials are ignored.

Six items plus the overview create seven panels and normally a 420vh scroll span. The stage is `min(viewport height - top, max(tallest panel, navigation rail) + 71px)`: 24px padding above and below, a 20px gap before the 3px progress bar. The overview uses its own measured row height when active. The track reserves only that final footprint plus the scroll span. Earlier, taller scenes use a negative bottom margin equal to the height difference to preserve the full sticky travel; the margin becomes zero on the overview. Each interval is at least that height difference, so even very short requested tracks cannot overlap the following section. Track height stays constant when switching panels, including when reversing direction, and ends exactly when overview progress reaches 100%. The final row clips departing scenes during its transition so a fast scroll cannot paint them over following content.

The native scroll position maps to progress 0–1 and evenly spaced panel intervals. Pinned navigation uses a vertical side rail with 44px touch targets and a 24px gutter; natural-flow navigation uses a wrapping horizontal row. The separate horizontal progress bar uses a MotionValue and scaleX; only index changes rerender the story, while its accessible progress indicator updates in whole percentages. The selected navigation dot grows using transform. Past panels depart upward; upcoming panels wait below. Departing panels stay painted through their transition, with interaction disabled immediately. The progress endpoint always displays the overview. There are no wheel, touch, or document-level keyboard handlers. Buttons and navigation-local arrows/Home/End scroll to the chosen interval; unenhanced buttons scroll directly to the corresponding content.

On the server and before measurement, every panel is readable in natural flow. Reduced motion also uses this layout, with no sticky track or animated entrance, and responds to live preference changes. If any panel or the overview cannot fit with navigation in the available viewport, the entire story stays in natural flow. A story also stays in flow when there is too little content after it to reach the compact stage's scroll endpoint; it never adds a blank spacer to make the page longer. Resize observation rechecks content, images, and navigation. A rejected pinned layout is retried on viewport resize. This protects short phones, larger text, and long content from clipping. Keep the story's ancestors free of overflow clipping if sticky behavior is wanted.

Only the active pinned panel participates in keyboard interaction or the accessibility tree. When native scrolling moves away from a focused panel, focus transfers to the new active navigation button without scrolling. Controls retain native visible focus and 44px touch targets. Motion ends with `filter: none`. Panels containing image, picture, video, canvas, SVG, or iframe elements skip blur; the overview never blurs. For content with CSS background images, pass `blur={0}`. There is no continuous scroll blur.

Measurement uses the shared frame scheduler, and progress uses the shared passive viewport observer. Both subscriptions, resize observers, and pending measurement work are released on unmount. The component performs no network requests and accesses no browser globals at module scope.
