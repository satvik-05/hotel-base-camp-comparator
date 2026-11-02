# Implementation Plan
1. Foundation + CLAUDE.md (Vite/React/TS/Tailwind/Vitest) — checkpoint: build + smoke test green.
2. Pure engine + validation via TDD — checkpoint: spec test list green.
3. Main city data, expected answers, independent Python check — checkpoint: story-condition tests green.
4. State + UI workspace (ranking, SVG map, table, explanation, controls, invalid/no-affordable) — checkpoint: component tests + manual walkthrough.
5. Polish, budget timeline, a11y, evidence in docs/EVIDENCE.md — checkpoint: lint + test + build clean.

## Post-plan enhancements (after Step 5; presentation-only)
Steps 6–10 live in `src/components/`, `src/state/useTheme.ts`, `src/theme.ts` and `src/index.css`; step 11 also adds `src/data/cities/` and `cityId` in state. None changed the engine or ranking rules.
6. Premium SaaS redesign with a tokenised dark theme.
7. Light / Dark / System switcher with no-flash first paint.
8. Trip settings simplified: the one-place "what if" control was removed; importance is edited in the table.
9. Motion pass (card reorder, entrance, banner pop, link drawing) and a Copy summary button.
10. Map upgrade: city backdrop, zoom/pan, hover cards, layer toggles, Top-5 links.
11. Demo cities: a city registry, per-city currency/slider/backdrop, a city picker, and Hyderabad, Kyoto and Lisbon (data verified by tests and the Python script). `src/engine/` untouched.
Checkpoint for each: `npm test && npm run lint && npm run build && python3 scripts/verify_expected.py`, plus a headless-Chrome check. Current state: 234 tests in 13 files, all green. See `EVIDENCE.md` §6–11.
