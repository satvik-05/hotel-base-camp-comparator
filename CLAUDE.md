# Hotel Base-Camp Comparator

Local React + Vite + TypeScript + Tailwind (v4) app that ranks 10 hotels by weighted
travel total to 15 wishlist places under one whole-stay budget, in four cities: the fictional Marlowe Bay (the spec's reference city) plus Hyderabad, Kyoto and Lisbon (real landmark names; invented hotels, prices and times). Spec: SPR26_D2_P03 PDF. Plan: `docs/PLAN.md`.

## Commands
- `npm run dev` — dev server
- `npm test` — Vitest (run once); `npm run test:watch`
- `npm run lint` — type-check (`tsc`)
- `npm run build` — type-check + production build
- `python3 scripts/verify_expected.py` — independent recomputation of documented answers for all four cities

## Architecture
- `src/engine/` — pure, framework-free calculation, validation, ranking and `timeline.ts` (budget→recommendation steps). No React, no DOM, no randomness, no imports from `data/`.
- `src/data/` — cities. `cities/` holds the registry (`index.ts`), `marlowe.ts` (wraps `mainCity.ts` + `travelMatrix.ts`) and generated `hyderabad.ts`/`kyoto.ts`/`lisbon.ts` (constants; each city is 10 hotels × 15 places with its own currency, slider range, markers and `BackdropSpec`). `expected.ts` holds documented answers for all four cities (tests/docs only).
- `src/state/` — `reducer.ts` holds `cityId`, raw input strings + inspected hotel; `derive.ts` computes the view (results are never stored). UI-only state never enters the engine.
- `src/components/` — presentation. Tailwind utilities, lucide-react icons. Theme tokens + dark mode live in `src/index.css` (scale remap under `:root[data-theme="dark"]`, set by `src/theme.ts` / `useTheme`; keep the inline script in `index.html` in sync); use `card`/`bg-surface`, not hard-coded white. Never bulk-rename `slate-`/`zinc-` with a plain string replace (it corrupts `translate-`).
- Map: `CityMap.tsx` composes `MapBackdrop.tsx` (decorative, aria-hidden), `MapTooltip.tsx` (hover card), `useMapViewport.ts` (pan/zoom state) and pure `mapViewport.ts` (maths, unit-tested). Zoom, pan, layers and marker pixels are presentation only and never reach `engine/`.
- Motion: CSS keyframes in `src/index.css` plus `useFlip.ts`; all must respect `prefers-reduced-motion`. No animated counters (they'd expose intermediate numbers to screen readers and tests).
- Currency formatting goes through `makeMoney(view.city.currency)` (never a hard-coded `$`). New cities are added to `src/data/cities/index.ts`, with tests in `cities.test.ts` and documented answers in `expected.ts` that `scripts/verify_expected.py` re-checks.
- Importance is edited only in `TravelTable.tsx`; Trip settings (`Controls.tsx`) holds the budget and Reset only.

## Invariants (do not break)
1. Rank by exact integer `weighted_travel_total` asc, then `stay_cost` asc, then hotel ID (ASCII) asc. Never rank on the rounded average.
2. Affordable iff `stay_cost <= budget`. Over-budget hotels: "Over budget by X", no rank, never recommended.
3. Rounded tenths use integer math: `floor((20*T + I) / (2*I))`.
4. Map pixel coordinates and link lengths are presentation only — never used in calculation.
5. `src/data/expected.ts` is imported ONLY by tests/docs, never by app or engine code (a test enforces this).
6. Invalid input (budget/importance/structure) => result is `invalid`; the UI must clear ranks, recommendation, contributions and highlights. No partial ranking.
7. No affordable hotel => `NO_AFFORDABLE_HOTEL`, shortfalls retained, no winner. This is not a validation error.
8. Inspecting a hotel changes only explanation/highlights, never results.
9. Reset restores the exact original of the *current* city: budget, importances and default inspected hotel (never Marlowe Bay's by accident). Switching city loads that city's original trip.
10. No external services, accounts, or network calls.
11. Every city obeys the same rules and story conditions (4–7 affordable at its default budget, unique most-accessible hotel over budget, winner not the cheapest, 90-minute split, boundary flips at its cost). Demo-city data are frozen constants; times/prices are invented and must stay labelled as such in the UI and docs. Currency is presentation only: the engine sees integers.

## Conventions
- TypeScript strict; immutable data (`readonly`, `Object.freeze`); pure functions; tests colocated as `*.test.ts(x)`.
- Add/adjust a test with every behaviour change. Keep engine tests free of UI imports.

## Evidence & docs
`docs/EVIDENCE.md` (test results, screenshots), `docs/DESIGN.md`, `docs/PROMPTS.md`, `docs/PLAN.md`.
Before finishing any change run: `npm test && npm run lint && npm run build && python3 scripts/verify_expected.py`.
Screenshots in `docs/screenshots/` (01–24) are taken with headless Chrome against `npm run dev`; regenerate them and the raw logs in `docs/evidence/` after any visible UI change, and keep the test count in `docs/EVIDENCE.md` current.
