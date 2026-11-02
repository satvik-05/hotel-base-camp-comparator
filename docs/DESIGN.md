# Design

## Goal
Compare complete-stay hotel prices with round-trip travel times to every wishlist place, recommend the most
accessible affordable hotel, and explain why. It is a decision aid, not an itinerary planner.

## Layers (dependencies point downward only)
```
components/  presentation (React + Tailwind + lucide)
state/       reducer, derive (pure), useComparator hook
engine/      pure: validate, calculate, rank, compare, timeline   <- no React, DOM, randomness, or data imports
data/        Marlowe Bay city, constant matrix, marker coordinates; expected.ts (tests/docs only)
```
The engine never imports `data/` or marker positions, so pixels cannot influence results (tested).

## Engine contract
`compare(scenario, budget)` validates everything first, then evaluates and ranks.
- Invalid → `{status:'invalid', errors[]}` with a code, message and path per problem. Ranks, recommendation,
  contributions and importance total are absent from the type, so a partial ranking cannot be produced.
- Valid → `{status:'ok', evaluations (input order), ranking (affordable, rank 1..n), recommended | null, outcome}`.
- `NO_AFFORDABLE_HOTEL` is an *ok* outcome (`recommended: null`, shortfalls retained), as the spec requires.

### Formulas
```
contribution(h,p)        = importance(p) × minutes(h,p)
weighted_travel_total(h) = Σ contribution(h,p)               exact integer — the only ranking key
importance_total         = Σ importance(p)
remaining(h)             = budget − stay_cost(h)             affordable ⇔ stay_cost ≤ budget
```
Sort affordable hotels by `(total, stay_cost, hotelId)`; IDs compare by plain code-unit order (ASCII), never
locale rules, so `A-1 < A10 < A2 < A_1`.

### Integer round-half-up
`tenths = floor((20·T + I) / (2·I))`, displayed as `tenths/10`, where T is the total and I the importance total.
This is `floor(10·T/I + 1/2)`: exact for non-negative values, no floating point. Examples: T=1, I=4 → 0.25 → `0.3`;
T=995, I=100 → `10.0`. Display rounding never feeds ranking: two hotels with totals 141 and 142 over I=14 both show
`10.1` yet rank in exact order.

## Anti-circularity
`data/expected.ts` records the documented answers for the main scenario. It is imported only by tests (a test
scans `src/` and fails on any other importer) and checked by a *second* implementation, `scripts/verify_expected.py`,
which shares no code with the engine — only the raw matrix digits. The app therefore reproduces the documented
numbers from costs, importances and times; it never reads them.

## State management
`useReducer` with five actions: `LOAD`, `RESET`, `SET_BUDGET`, `SET_IMPORTANCE`, `INSPECT`.
- State holds **raw strings** for the budget and every importance, so invalid input stays visible and editable
  instead of being coerced. `parseWhole` is strict (`1.5`, `1e3`, `1,000`, empty → NaN → rejected by the engine).
- Results are **derived**, never stored (`deriveView`, memoised), so nothing can go stale: invalid input yields
  `inspected: null`, no links, no explanation.
- `inspectedId` is UI-only and never reaches the engine, so inspection cannot change a result.
- `RESET` rebuilds the city from constants (`createMainScenario()` returns a fresh deep-frozen object), restoring
  budget 900, original importances, and the default inspected hotel.
- Alternative considered: a state library or storing results in state. Rejected: more surface for stale data, no
  benefit at this size.

## Main city story ("Marlowe Bay", budget 900)
8 attractions, 7 food stops, importances 1–5 (total 41). Six hotels affordable; Lamplighter Lodge (1,712) is
recommended though Dockyard Dorms (520) is cheapest. Clocktower Grand (1,096, unique best) costs 980, 80 over
budget, and becomes recommended at exactly 980. Lamplighter's longest trip is 70 min; Dockyard has trips up to 118.
Riverside Walk importance 3→5 makes Riverside Rest (1,802) beat Lamplighter (1,812).
The matrix is hand-authored constants; no geometry or randomness is used.

## Budget timeline
`budgetTimeline(scenario)` evaluates `compare()` at budget 0 and at each distinct stay cost (the only places
affordability can change), merging adjacent equal recommendations. Because it calls the same engine it cannot
drift from the main rules; a test checks it against `compare()` at every integer budget from 0 to 1400.

## Visual system (premium SaaS look)
- **Tokens, not per-component dark classes.** `src/index.css` defines a `surface` colour plus map ink/grid/river tokens, and a dark
  theme under `:root[data-theme="dark"]` that remaps the Tailwind scale variables (50↔950, 100↔900, 200↔800, 300↔700, text-muted lifted).
  Components therefore use one set of utilities and still get a correct dark theme; accent mid-tones (400–600) are shared.
- **Surfaces:** a `card` utility (`rounded-xl`, 1px zinc border, `shadow-sm`, hover `shadow-md`).
- **Header:** sticky frosted command bar (`backdrop-blur-md`, translucent surface, subtle border, gradient logo, "runs locally" chip).
- **Badges / status:** tinted pills (`bg-*-500/10`, matching dark-text, `ring-1`, soft glow for Recommended); banners use the same tints.
- **Controls:** custom range slider (filled track via a CSS variable, round thumb, hover/active/focus feedback) and a segmented 1–5 control.
- **Map:** SVG ink, halo, grid and river colours come from CSS variables, so the map follows the theme. Colour is still paired with shape/text.
- **Theme switching:** Light / Dark / System via a header radiogroup. `useTheme` stores the preference in `localStorage` and sets
  `data-theme`; System tracks `prefers-color-scheme` live. An inline script in `index.html` applies the saved theme before first
  paint so there is no flash. Theme state is independent of the comparison state and cannot affect results.
- The redesign changed presentation only; the theme feature added UI-only modules and no engine or data code.

## Accessibility & UX
Table = accessible equivalent of the map (all 150 times, importance inputs, status row). Colour is always paired
with text or a symbol. See `EVIDENCE.md` §6 for the audit and its limits.

## Known limitations / trade-offs
- Marker layout is hand-placed; labels are readable in the main city but a general layout engine was out of scope.
- Importance can be edited for every place, but hotel data and the city cannot (spec: no editor required).
- Structural errors (duplicate IDs, bad mappings) are demonstrated by tests, not by UI, as the spec allows.
