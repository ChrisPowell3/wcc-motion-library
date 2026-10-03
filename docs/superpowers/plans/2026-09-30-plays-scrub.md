# Plays scrub implementation plan

**Goal:** Ship the supplied 0.5.0 house-default brief on `codex/plays-scrub`, with a PR into main and no merge.

**Design:** Reuse `internal/viewport.ts` and its shared frame loop. A shared entrance progress observer follows stationary anchors with the ScrollFocus house smoothing. Preserve timed once/always paths and explicit legacy once props. Parallax stays scroll-linked; ImageLoadBlurIn stays load-only. Stack scrub remains reversible; once retains progress and always resets outside view.

**Constraints:** No new dependencies, native scrolling, transform/opacity and permitted entrance blur only, final SSR and reduced-motion output. Preserve the pre-existing `.gitignore` edit.

- [x] Add behavioral regressions for scrub forward/reverse/re-entry, once retention, always reset, SSR, reduced motion, focus and cleanup.
- [x] Add shared dial vocabulary, progress observer and named range token; integrate entrance pieces and stack modes.
- [x] Update rule 12, version, catalog, component docs, README and demo panels.
- [x] Run typecheck/full tests and build, inspect browser down/up/down at 390 and 1440px, review changes.
Delivery: Commit, push and open PR into main with the brief checklist; stop without merging.

Review focus: stationary geometry under scaling, focus while scrubbing, live reduced-motion changes, StrictMode cleanup, once prop precedence, page-load exceptions, tall cards, no idle frame work after settling.

Verification: 436 tests and typecheck pass; build passes. Chrome checks at 390×900 and 1440×900 cover all seven pieces and all three modes (42 combinations). Independent source review findings (focused pills and reachable document-end progress) are fixed and covered by regressions. The existing demo favicon 404 is unrelated to app behavior.
