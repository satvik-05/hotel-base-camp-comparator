# Hotel Base-Camp Comparator

Local React + Vite + TypeScript + Tailwind (v4) app that ranks 10 fictional hotels by weighted
travel total to 15 wishlist places under one whole-stay budget. Spec: SPR26_D2_P03 PDF. Plan: `docs/PLAN.md`.

## Commands
- `npm run dev` — dev server
- `npm test` — Vitest (run once); `npm run test:watch`
- `npm run lint` — type-check (`tsc`)
- `npm run build` — type-check + production build
- `python3 scripts/verify_expected.py` — independent recomputation of documented answers

## Architecture
- `src/engine/` — pure, framework-free calculation, validation, ranking and `timeline.ts` (budget→recommendation steps). No React, no DOM, no randomness, no imports from `data/`.
- `src/data/` — fictional city. `mainCity.ts` + `travelMatrix.ts` are inputs; `expected.ts` holds documented answers.
- `src/state/` — `reducer.ts` holds raw input strings + inspected hotel; `derive.ts` computes the view (results are never stored). UI-only state never enters the engine.
- `src/components/` — presentation. Tailwind utilities, lucide-react icons.

## Invariants (do not break)
1. Rank by exact integer `weighted_travel_total` asc, then `stay_cost` asc, then hotel ID (ASCII) asc. Never rank on the rounded average.
2. Affordable iff `stay_cost <= budget`. Over-budget hotels: "Over budget by X", no rank, never recommended.
3. Rounded tenths use integer math: `floor((20*T + I) / (2*I))`.
4. Map pixel coordinates and link lengths are presentation only — never used in calculation.
5. `src/data/expected.ts` is imported ONLY by tests/docs, never by app or engine code (a test enforces this).
6. Invalid input (budget/importance/structure) => result is `invalid`; the UI must clear ranks, recommendation, contributions and highlights. No partial ranking.
7. No affordable hotel => `NO_AFFORDABLE_HOTEL`, shortfalls retained, no winner. This is not a validation error.
8. Inspecting a hotel changes only explanation/highlights, never results.
9. Reset restores the exact original city, budget, importances and default inspected hotel.
10. No external services, accounts, or network calls.

## Conventions
- TypeScript strict; immutable data (`readonly`, `Object.freeze`); pure functions; tests colocated as `*.test.ts(x)`.
- Add/adjust a test with every behaviour change. Keep engine tests free of UI imports.

## Evidence & docs
`docs/EVIDENCE.md` (test results, screenshots), `docs/DESIGN.md`, `docs/PROMPTS.md`, `docs/PLAN.md`.
Before finishing any change run: `npm test && npm run lint && npm run build && python3 scripts/verify_expected.py`.
Screenshots in `docs/screenshots/` are taken with headless Chrome against `npm run dev`.
