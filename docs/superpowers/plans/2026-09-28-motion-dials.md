# Shared Motion Dials Implementation Plan

> **For agentic workers:** Use test-driven implementation and independent code review. The requested integration is a PR into main; do not merge.

**Goal:** Give every current and future piece one validated word-based dial API while retaining explicit props and the current default appearance.

**Architecture:** Frozen shared and carousel-only vocabularies live in `src/dials.ts`. `cleanDials(pieceId: string, input: unknown): MotionDials` filters against piece support. Each piece owns a pure resolver used by its component, so explicit props override dials and tests can cover the full mapping without mocking animations. Catalog data declares supported defaults and unsupported ids. A common demo panel edits supported word values.

**Tech stack:** Existing React, Motion, TypeScript, Vitest and Vite only.

**Spec:** User's “SHARED MOTION DIALS FOR EVERY PIECE” brief, version 0.3.0.

## Constraints

- Exact vocabulary: speed slow/normal/fast; size small/medium/large; bounce none/soft/springy; plays once/always; delay none/short/long; cascade together/cascade; direction up/down/left/right; fade none/soft/full; start early/middle/late; autoplay off/on; loop off/on; sideCards normal/smaller/dimmer; flick soft/normal/strong.
- Reveal supports the nine shared ids. Carousel supports speed/size/bounce and four carousel ids.
- Explicit props win; absent dials retain current presets, including image defaults.
- Transform and opacity only; reduced motion wins, native page scroll stays native, server output has no entrance-hidden content.
- No additional dependencies. All timing/springs derive from house tokens.

## Tasks

- [x] Write failing validation tests; implement deeply frozen vocabularies, safe per-piece filtering and exports.
- [x] Reveal: test all resolved dial values, prop priority, directions/fades, repeat/delay/cascade and reduced motion. Implement local resolver and integrate without losing focus/SSR protections.
- [x] Carousel: test all resolved dial values, prop priority, bounded/looping navigation, autoplay pause conditions and reduced motion. Integrate local resolver, motion speed/bounce, geometry and flick settings. Keep default fan and snap behavior and existing tests intact.
- [x] Add shared dial panel to each demo with replay/reset controls; document mappings and catalog defaults/unsupported ids. Add exact AGENTS rule. Bump package, lockfile and catalog to 0.3.0.
- [x] Run check/build, review diff independently, exercise browser panels and carousel pause/loop behavior at phone and desktop widths; fix findings and rerun relevant checks.
- [ ] Commit, push codex/motion-dials, open PR into main with verification and stop without merging.

## Review focus

- Validator: null, primitives, invalid values, unknown pieces, inherited keys and throwing properties must not throw or leak unsupported keys.
- Explicit zero/false props must win; image defaults must remain different from block defaults.
- Autoplay must stop under focus/hover/touch/hidden/reduced preferences and on unmount; timer resets must not race manual navigation.
- Looping must handle zero/one cards, changing counts, reverse navigation and gestures without duplicate focusable content.
- Preference changes and SSR/hydration must never leave active content hidden or an animation/autoplay running against reduced motion.

## Verification

- Types and 161 tests across 12 files pass; build and whitespace checks pass.
- Independent review fixes cover viewport-height trigger geometry, horizontal overflow, reversing a pending carousel wrap and changing loop mode mid-animation.
- Chromium dial panels verified at 360×900, 1440×900 and 1920×720, including loop keyboard navigation, reduced motion and absence of horizontal page overflow.
