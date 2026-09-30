# Motion Batch 1 — implementation and review plan

Branch: codex/motion-batch-1 from updated main. Release:0.4.0. Deliver a PR without merging.

Reference: the locally supplied Powell Media motion script and page, studied for timing/feel only. Implement fresh React pieces with Motion and named house tokens; no copied code/assets and no new dependencies. Keep reference/ uncommitted and outside package files/dist.

1. Add house tokens matching the reference; blur vocabulary and start:load; update AGENTS exception.
2. Build shared observer/frame/viewport infrastructure. Stage scroll geometry reads before writes; all listeners passive. SSR and reduced motion show final content.
3. Extend ScrollRevealRise with entrance-only blur, numeric token duration override, delay and page-load trigger; preserve existing defaults.
4. Independently implement ScrollFocus and pointer pieces; CountUp/StarPop/Float/CtaPills; Marquee/Accordion. Each owns docs and tests.
5. Register exports/catalog with supported/default/unsupported dials and safe ranges. Add generic demos with dial panels and README preset/vocabulary. Bump package/lock/catalog to0.4.0.
6. Verify targeted tests, then full types/tests/build. Review implementation across ownership boundaries, inspect browser behavior at390px and1440px including reduced motion and keyboard. Verify npm package excludes references.
7. Commit, push, open PR into main with the brief checklist and validation evidence. Stop without merging.

Review focus: exact original CountUp strings and sibling timing; no hidden SSR entrances; live reduced preference; filter:none after all entrances; stationary hit/measurement targets; smooth pause/resume and semantic duplicate handling in Marquee; real buttons and inert closed Accordion regions; explicit props override dials; no new timing literals in pieces.

## Completed verification

- `npm run check`:307tests across28files and TypeScript pass.
- `npm run build`:pass. Package dry run:67files, no reference or demo assets.
- Chromium390px/1440px:11batchsamples,105dialvalues, exact formatted counts, keyboard disclosures, reduced motion, no overflow or console errors. Additional mouse/touch checks passed.
- Independent reviews found and resolved duplicate nested frame scheduling, paused idle frame work, inert interactive marquee copies, and equivalent inline dials interrupting entrances. StrictMode page-load replay is covered.
- Physical-device frame-rate profiling was not performed; browser checks use viewport emulation.
