# Design

## Goal
Compare complete-stay hotel prices with round-trip travel times to every wishlist place, recommend the most
accessible affordable hotel, and explain why. It is a decision aid, not an itinerary planner.

## Layers (dependencies point downward only)
```
components/  presentation (React + Tailwind + lucide)
state/       reducer, derive (pure), useComparator hook
engine/      pure: validate, calculate, rank, compare, timeline   <- no React, DOM, randomness, or data imports
data/        cities/ (registry + Marlowe Bay, Hyderabad, Kyoto, Lisbon), constant matrices, marker coordinates; expected.ts (tests/docs only)
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
`useReducer` with five actions: `LOAD` (optionally with a city id), `RESET`, `SET_BUDGET`, `SET_IMPORTANCE`, `INSPECT`.
- State holds **raw strings** for the budget and every importance, so invalid input stays visible and editable
  instead of being coerced. `parseWhole` is strict (`1.5`, `1e3`, `1,000`, empty → NaN → rejected by the engine).
- Results are **derived**, never stored (`deriveView`, memoised), so nothing can go stale: invalid input yields
  `inspected: null`, no links, no explanation.
- `inspectedId` is UI-only and never reaches the engine, so inspection cannot change a result.
- `LoadedState.cityId` records the city. `RESET` rebuilds the *current* city from constants (`createScenario()` returns a fresh deep-frozen object), restoring
  that city's budget, original importances, and default inspected hotel. `LOAD` with another city id replaces the whole trip (edits are discarded).
- Alternative considered: a state library or storing results in state. Rejected: more surface for stale data, no
  benefit at this size.

## Main city story ("Marlowe Bay", budget 900)
Marlowe Bay is the reference city the spec's conditions are written against; the demo cities below follow the same conditions.
8 attractions, 7 food stops, importances 1–5 (total 41). Six hotels affordable; Lamplighter Lodge (1,712) is
recommended though Dockyard Dorms (520) is cheapest. Clocktower Grand (1,096, unique best) costs 980, 80 over
budget, and becomes recommended at exactly 980. Lamplighter's longest trip is 70 min; Dockyard has trips up to 118.
Riverside Walk importance 3→5 makes Riverside Rest (1,802) beat Lamplighter (1,812); this is edited in the importance
table like any other place (an earlier one-place shortcut in Trip settings was removed because it duplicated the table
and confused the panel).
The matrix is hand-authored constants; no geometry or randomness is used.

## Cities
`src/data/cities/` holds a `CityDefinition` per city: id, name, country, blurb, `fictional`, `currency` (symbol + digit-grouping locale), default budget,
slider range, default inspected hotel, marker positions, a `BackdropSpec` and `createScenario()`.
- `marlowe.ts` wraps the original `mainCity.ts` unchanged; `hyderabad.ts`, `kyoto.ts` and `lisbon.ts` are generated once and committed
  (`build.ts` freezes them like Marlowe Bay). `index.ts` is the registry (`CITIES`, `getCity`, `DEFAULT_CITY_ID`); an unknown id falls back to Marlowe Bay.
- **Real landmarks, invented everything else.** Place names are real; hotels, prices and travel times are invented. Times come from a rough
  formula over real coordinates, frozen as constants, and the UI labels them "invented and approximate". Nothing is fetched and no geometry runs at runtime.
- Every demo city passes the same validation and the same story conditions as Marlowe Bay (4–7 affordable, unique most-accessible hotel over budget,
  winner not the cheapest, a 90-minute split, boundary flips at its cost, one hotel exactly on budget, winner leaves money over). A generator
  searched for prices satisfying these; tests and `scripts/verify_expected.py` re-check them independently.
- **Currency** is presentation: `makeMoney(currency)` formats amounts (symbol first, locale grouping, so ₹ uses 1,25,000). The engine only ever sees integers.
  The slider range and step are per city (₹60,000 / ₹500, ¥200,000 / ¥1,000, €1,500 / €10).
- **UI.** The landing screen shows a card per city; a segmented picker (roving tabindex, arrow keys) switches city from the workspace. Switching loads
  that city's original trip.
- **Map backdrop** is data: texture (`blocks` or `grid`), parks, water, rivers, roads, bridges and district labels as SVG paths in map space.
  Marker positions and backdrop shapes are presentation only (invariant 4).
- **Layout** of the 25 markers per demo city came from a scratch simulated-annealing pass (fixed seeds): minimise overlap of label rectangles (hotel names
  above the badge, place names below), stay near each landmark's projected position, keep land markers off the sea and clear of the zoom/compass corners.
  Zero overlaps in all three cities, enforced by a test. Alternatives rejected: live map tiles (network, no), a force-directed layout without
  rectangles (labels still collided), a hot annealing start (scrambled the geography).
- Rejected: loading the demo cities from JSON at runtime (more surface for malformed data than constants checked by tests) and a per-city engine (the engine is city-agnostic).

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
- **Controls:** Trip settings holds only the budget (input + custom range slider with a filled track via a CSS variable) and Reset. Importance is edited in the table.
- **Map:** see *Map* below. Its ink, halo, land, roads, parks and river colours come from CSS variables, so it follows the theme; colour is still paired with shape/text.
- **Theme switching:** Light / Dark / System via a header radiogroup. `useTheme` stores the preference in `localStorage` and sets
  `data-theme`; System tracks `prefers-color-scheme` live. An inline script in `index.html` applies the saved theme before first
  paint so there is no flash. Theme state is independent of the comparison state and cannot affect results.
- The redesign changed presentation only; the theme feature added UI-only modules and no engine or data code.

## Motion
All presentation-only, built from CSS keyframes plus one small hook, and all disabled by `prefers-reduced-motion`.
- `useFlip` (Web Animations API) slides ranked hotel cards to their new position when the order changes; it is a no-op without layout (jsdom).
- Staggered fade-up on load (`.reveal-stack`), a pop on the recommendation banner when the winner/outcome changes (keyed wrapper), map links that draw in (`stroke-dashoffset`, re-keyed per inspected hotel), and a pulsing ring on the recommended marker.
- **Copy summary** (recommendation banner): writes the winner, budget, leftover and the ranking to the clipboard. No network.
- Rejected: animated counting numbers. They would show intermediate values to screen readers and tests, which is worse than a quiet change.

## Map
The map is a fixed 1000 × 640 coordinate space. It is presentation only: marker positions, zoom and pan never reach the engine (invariant 4), and the map still says "Not to scale. Lines are comparison links, not routes."
- `mapViewport.ts` — pure pan/zoom maths (`zoomAt`, `panBy`, `centerOn`, clamping to 100–400%); unit-tested.
- `useMapViewport.ts` — state: buttons (eased tween), `+`/`−`/`0` keys, Ctrl/⌘ + wheel (native non-passive listener, also what trackpad pinch sends), drag to pan with a 5 px threshold and pointer capture only after it (so marker clicks still work and a drag never inspects a hotel), recentring when keyboard focus lands on an off-screen marker.
- `MapBackdrop.tsx` — decorative, `aria-hidden` city: block-texture pattern, four arterial roads, parks, river with bridges, district names, compass.
- `MapTooltip.tsx` — hover/focus card for hotels and places, `aria-hidden` because its content is also in the ranking list, table and marker labels. It flips below a marker near the top edge and clamps horizontally.
- `CityMap.tsx` — layers (Names, Link values, Top 5 links only: a display filter, ties broken by place id), label sizes scaled by `zoom^-0.55` so zoomed views stay legible.
- Markers carry an `aria-label` (place markers are `role="img"`); the native SVG `<title>` was dropped to avoid a second tooltip on top of the card.
- Alternative considered: a map library. Rejected: the requirement is a schematic map, no network, and a library would add weight and tile/network risk.

## Accessibility & UX
Table = accessible equivalent of the map (all 150 times, importance inputs, status row). Colour is always paired
with text or a symbol. See `EVIDENCE.md` §8 for the audit and its limits.

## Known limitations / trade-offs
- Marlowe Bay's marker layout is hand-placed. The demo cities' layouts are generated, but schematic: to keep 25 labels readable some markers sit away from their true position. The backdrop streets and parks are decorative and do not correspond to the travel matrix.
- Map pinch-zoom relies on the browser's Ctrl+wheel events; it was not tested on a physical touch device.
- Importance can be edited for every place, but hotel data and cities cannot (spec: no editor required). The demo cities' times and prices are approximations, not real quotes or traffic.
- Structural errors (duplicate IDs, bad mappings) are demonstrated by tests, not by UI, as the spec allows.
