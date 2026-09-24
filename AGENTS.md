# WCC Motion Library: rules for every builder (Codex, Claude, people)

This library holds hand-tuned motion pieces used by every CP website
(TransformNation, ChrisPowell.com, M1M and future sites). Quality beats
quantity. A piece that feels cheap does not ship.

## Hard rules
1. Build from scratch. Never copy code, CSS, or assets from Framer, any
   marketplace, template, or website. Links are for studying the feel only.
2. Dependencies: `react`, `react-dom` (peer) and `motion` only. Add nothing
   else without written approval in the brief.
3. Timing comes from `src/tokens.ts` (springs, durations, ease, flick).
   Do not hard-code new spring or easing numbers inside a piece. If a
   piece truly needs a new feel, add a named token and explain why.
4. Animate only `transform` and `opacity` (and `filter` only if the brief
   says so). Never animate width, height, top, left, margin or padding.
5. Reduced motion is required. When the viewer's device asks for reduced
   motion (`useReducedMotion` from `motion/react`), the piece must still
   work fully, with instant or simple fade changes and no springs, parallax
   or flying.
6. Never hijack normal page scrolling. Vertical mouse wheel keeps scrolling
   the page unless the brief says otherwise.
7. Accessible: keyboard works (Tab, arrows, Enter), visible focus, real
   buttons for controls, sensible ARIA labels, images need alt text props.
8. Works on phones: touch swipe, no hover-only features, looks right from
   360px wide up to 1920px.
9. No network calls, no global CSS, no `document` access at import time
   (pieces must render on the server in Next.js without crashing). Mark
   components with `'use client'`.
10. Every setting a site owner might want to change is a prop with a safe
    default and a documented range.

## Every piece must ship with
- `src/pieces/<id>/` (component, styles as CSS module or inline tokens)
- One export line in `src/index.ts`
- `tests/<id>.test.tsx` (renders, keyboard, reduced motion, edge cases)
- `demo/<id>.html` + script (a working demo with sample content)
- A `catalog.json` entry:
  `{id, name, export, summary, status, settings, reducedMotion, demo}`
  - `summary`: one plain sentence a non-technical person understands.
  - `settings`: each prop with `type`, `default`, and `min`/`max` or `options`.
  - `status`: `beta` until Claude's review passes, then `ready`.

## Before you open a pull request
- `npm run check` passes (types plus all tests).
- `npm run build` passes.
- Open a pull request on a branch named `codex/<id>` with the checklist
  from the brief filled in. Do not merge it yourself.
