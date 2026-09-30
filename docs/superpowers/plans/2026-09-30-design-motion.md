# Design Motion Implementation Plan

**Goal:** Seven generic library pieces reproducing the supplied load, pointer, fullscreen and scroll motion study.
**Architecture:** Existing React/Motion conventions and shared dial validation; pooled observations and shared frame scheduling. Native sticky sections and native modal dialogs preserve browser behavior.
**Spec:** User brief “NEW MOTION LIBRARY PIECES FOR A DESIGN: TransformNation”, with local reference/tn-2026-motion.js and tn-2026-page.html studied for timing only.

## Constraints

- Branch codex/design-2026-09-30 from updated main; PR to main, never merge.
- No copied reference code/assets, no new dependencies, no reference files in package/build.
- Every piece: client component, dials/cleanDials, explicit props win, house tokens, final visible SSR, live reduced motion.
- Preserve the existing user .gitignore change. No version bump requested.
- Only FullscreenViewer locks scroll, and only while open. Story uses native sticky positioning and its specifically requested ≤10px slide blur.

## Tasks

- [x] Add named designMotion tokens and seven central support entries; retain the existing vocabulary.
- [x] ImageLoadBlurIn: semantic image, cached/load/error handling; 1.8s scale1.05/blur6 → final, house ease, backward-filled preparation. Tests for load, source changes, explicit settings, reduced motion and SSR.
- [x] CursorProximityFade: radius260, idle4.5s, page scroll limit60, instant opacity; passive observations, native keyboard focus forces visible, touch has no proximity dependency. Tests for pointer distance, idle, scroll, focus and reduced state.
- [x] ParallaxDrift/ScrollStackCards/CursorFollowImage: bounded geometry and token smoothing, stationary measurement targets, no scroll interference; tests for dial values, smoothing, cleanup and pointer capability.
- [x] FullscreenViewer: labelled thumbnail controls, native modal isolation, arrow/dot/touch navigation, Escape, focus restoration, scoped scroll lock restoration; tests for multiple instances, data changes and reduced motion.
- [x] PinnedScrollStory: native sticky track, index/progress mapping, slide transitions, accessible rail and final overview; natural-flow SSR/reduced/tall-content fallback, keyboard and resize tests.
- [x] Register exports, beta catalog entries and documented props/ranges; individual demos plus shared showcase with dial panels, README examples.
- [x] Independent review, npm run check/build, browser390/1440 and reduced/fine/touch checks, package dry run. Commit, push, open PR with completed checklist, stop.

## Review Focus

- Cached/broken images and changing sources must never remain blurred.
- Equivalent inline dials must not restart running animation; live reduced preference immediately clears transforms/filter.
- Dialog close/unmount restores prior scroll styles and focus, including multiple viewers.
- Story/card content taller than a phone viewport must remain reachable; keyboard focus must never remain in a hidden slide.
- Continuous motion sleeps at rest, batches geometry reads before writes, and uses no wheel/touch scroll interception.


## Verification

- npm run check: TypeScript and 380 tests across 38 files pass.
- npm run build: pass. Package dry run contains 91 files and excludes reference/demo folders.
- Chromium at 390px/1440px: all 7 pieces and 61 dial choices; native modal focus/arrow/dot/Escape/scroll restoration; pinned overview and vertical rail; reduced-motion flow; no overflow or console errors.
- Detailed browser checks: parallax 32px at 400px scroll and 70px cap, stack 0.95, pointer follow/reset, proximity idle/scroll/focus, coarse touch disable.
- Independent reviews produced regressions and fixes for stack focus after reorder and nested viewer swipes. Story exits remain painted until complete; tall/narrow story layouts fall back without oscillation.
- Browser tests emulate viewports; no physical-device frame-rate benchmark was performed.
