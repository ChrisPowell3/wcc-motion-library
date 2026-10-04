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
4. Animate transform and opacity. Exception: a filter blur of 10px or less is allowed on entrances and on ScrollFocus text only, and must end at filter: none. Never blur large images on scroll.
   The 2026-09-30 brief also permits PinnedScrollStory slide blur transitions (maximum 10px) and FullscreenViewer background scroll locking while open. Other pieces never lock page scrolling.
   Accordion may animate grid-template-rows between 0fr and 1fr, as explicitly authorized in the Motion Batch 1 brief.
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

11. Every piece MUST accept the shared dials (dials prop, cleanDials). A dial that makes no sense for the piece is listed as unsupported in catalog.json and ignored. New dials are added to src/dials.ts for all pieces, never per piece.

12. Motion never plays once and locks. Every entrance animation moves when you scroll down, reverses when you scroll back up, and plays again when you scroll down again. The page never sits static. Default for every entrance piece is plays: scrub.

13. Every change to `src/` must rebuild and commit `dist/` in the same PR.
    Git dependency installs use the committed build with install scripts disabled.

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
