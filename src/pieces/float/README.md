# Float

```tsx
<Float rotate={0.6} dials={{speed: 'normal', size: 'medium'}}>
  {badges.map(badge => <span key={badge.id}>{badge.label}</span>)}
</Float>
```

Each direct child floats gently in an independent wrapper. A fragment is one item. The default reference pattern alternates from rest to −10px with a 3.6-second one-way duration, adds 0.7 seconds for each index modulo three, and starts each successive item 0.9 seconds farther into its loop.

| Prop | Default | Range / meaning |
| --- | --- | --- |
| `children` | Required | React content; empty content is supported. |
| `dials` | `{}` | `speed`: slow/normal/fast; `size`: small/medium/large. Other dials ignored. |
| `distance` | 10 | Vertical travel in px, 0–40. |
| `duration` | 3.6 | Base one-way duration in seconds, 0.2–20. |
| `durationStep` | 0.7 | Extra seconds × `(index % 3)`, 0–3. |
| `phase` | 0.9 | Negative initial delay in seconds × index, 0–5. |
| `rotate` | 0 | Rotation magnitude in degrees, 0–5. Use 0.6 for a subtle optional sway. |
| `className` | undefined | Class applied to each wrapper. |
| `style` | undefined | Decoration/layout CSS; the piece owns vertical translation and rotation. |

Size multiplies distance by 0.5 / 1 / 1.5. Speed multiplies the duration, duration step, and phase by shared slow/base or fast/base ratios. An explicit prop overrides its corresponding preset. Finite numbers clamp to the documented ranges; invalid numbers use defaults. Rotation alternates its starting sign across siblings and uses the same timing as vertical travel.

Server HTML and hydration start at rest. Motion starts only after visibility is observed; loops pause outside the viewport or in a hidden document and resume from the paused position. Reduced motion resets every track to rest immediately, including when the device preference changes live. Focus also returns the child to rest and holds it there until remount, keeping controls steady and their native keyboard behavior intact. All observers, listeners and motion stop on unmount.
