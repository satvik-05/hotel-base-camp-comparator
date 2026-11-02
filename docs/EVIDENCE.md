# Test & Verification Evidence

Generated at the end of Step 5 and refreshed after the later work (redesign, themes, motion, map, demo cities). Raw logs: [vitest-output.txt](evidence/vitest-output.txt),
[python-verify-output.txt](evidence/python-verify-output.txt). Screenshots: [screenshots/](screenshots/).

## 1. Final gate (all green)
| Command | Result |
|---|---|
| `npm test` | **13 files, 234 tests passed** |
| `npm run lint` (`tsc -b --noEmit`, strict) | no errors |
| `npm run build` | succeeds (type-check + Vite production build) |
| `python3 scripts/verify_expected.py` | `OK: all documented answers match the independent calculation` |

Tests per file: validate 62 · cities (registry, shape, story, layout, parity for all 4 cities) 46 · mainCity (Marlowe data + story +
anti-circularity) 26 · App (full-app, incl. map and cities) 22 · reducer/state 19 · rank 17 · calculate 11 · map viewport maths 8 ·
theme helpers 6 · theme switcher 6 · timeline 5 · currency formatting 3 · a11y (axe) 3.

## 2. Independent calculation parity (`expected.ts` vs a second path) — Marlowe Bay
`scripts/verify_expected.py` re-declares costs, importances and place order on its own, reads only the raw
matrix numbers from `src/data/travelMatrix.ts`, recomputes with exact rational arithmetic (`fractions`) for the
rounded average, and compares against every line of `src/data/expected.ts`. It also asserts every story
condition and brute-forces all single-place importance changes (only `RIVER → 5` flips the winner).
Vitest additionally re-runs the TypeScript engine against `expected.ts`; a test fails if any non-test source
imports `expected.ts`. Main scenario at budget 900 (importance total 41):

| Hotel | Cost | Weighted total | Avg | Status | Rank |
|---|---|---|---|---|---|
| Lamplighter Lodge | 760 | 1,712 | 41.8 | $140 left | **1 Recommended** |
| Riverside Rest | 900 | 1,766 | 43.1 | exactly on budget ($0 left) | 2 |
| Willow Terrace | 830 | 2,048 | 50.0 | $70 left | 3 |
| Tram Depot Inn | 690 | 2,158 | 52.6 | $210 left | 4 |
| Moss Lane B&B | 610 | 2,640 | 64.4 | $290 left | 5 |
| Dockyard Dorms | 520 | 2,874 | 70.1 | $380 left (cheapest affordable) | 6 |
| Clocktower Grand | 980 | 1,096 | 26.7 | Over budget by $80 (unique most accessible) | — |
| Opal Tower Suites | 1,060 | 1,256 | 30.6 | Over budget by $160 | — |
| Marigold Plaza | 1,150 | 1,358 | 33.1 | Over budget by $250 | — |
| Skyline Residence | 1,290 | 1,182 | 28.8 | Over budget by $390 | — |

The same script also verifies the three demo cities (section 11), from the raw constants in `src/data/cities/<id>.ts`:
shape, engine ID/range rules, the story conditions and every number documented in `EXPECTED_CITIES`. A deliberate one-unit
corruption of a documented total makes it fail (checked), so the check is not vacuous.

## 3. Requirement → evidence map
| Spec requirement | Where proven |
|---|---|
| Contribution arithmetic (CLOCK/MARKET illustration = 140 / 28.0) | `calculate.test.ts` "spec illustration" |
| Round-half-up display (0.25→0.3, 1.05→1.1, 9.95→10.0) | `calculate.test.ts` "round-half-up display" |
| Exact ranking despite equal rounded averages (141 vs 142, both "10.1") | `rank.test.ts` "ranks by exact total…" |
| Tie-break by stay cost; complete tie by ASCII hotel ID (`A-1 < A10 < A2 < A_1 < Z9`) | `rank.test.ts` "ranking rules" |
| Budget equality affordable, +1 over unranked, label "Over budget by 1" | `rank.test.ts` "budget equality" |
| Budget-only change keeps contributions; importance change recomputes all | `rank.test.ts` "budget vs importance changes" |
| Invalid budget / importance / duplicate ID / incomplete or unknown mapping → only errors, nothing stale | `validate.test.ts` "invalid-state clearing"; `reducer.test.ts`; `App.test.tsx` (visible budget `-5`) |
| `NO_AFFORDABLE_HOTEL`, no winner, shortfalls kept, budget 0 valid | `rank.test.ts`; `App.test.tsx` budget 0; screenshot 07 |
| 10×15 deterministic matrix, ≥3 attractions/food, ≥3 importances, 25 markers | `mainCity.test.ts` "main city shape" |
| Story: 4–7 affordable (6), unique best over budget, winner ≠ cheapest, 90-min split, boundary 980/979 | `mainCity.test.ts` "story conditions" |
| What-if: Riverside Walk 3→5 flips Lamplighter → Riverside Rest (1812 vs 1802); edited in the importance table (the one-place shortcut was removed from Trip settings) | `mainCity.test.ts`, `reducer.test.ts`, `App.test.tsx`, screenshot 04 |
| Hotel inspection changes highlights/explanation only (15 links, result unchanged) | `reducer.test.ts`, `App.test.tsx` (click + keyboard) |
| Reset restores city, budget, importances, inspected hotel exactly | `reducer.test.ts` (`toEqual(freshLoadedState())`), `mainCity.test.ts`, `App.test.tsx`, screenshot 05 |
| Map pixels never used in calculation | `mainCity.test.ts` (engine source has no data/marker import); zoom/pan/layers leave the result unchanged (`App.test.tsx` map tests) |
| Optional budget timeline obeys same rules | `timeline.test.ts` — agrees with `compare()` at **every** budget 0…1400 |
| Accessibility | `a11y.test.tsx` (axe on landing, loaded, budget 0, invalid, and each demo city with the picker and map), text/symbol checks |
| Multiple cities: registry, 10×15 validity, fresh deep-frozen originals, per-city Reset | `cities.test.ts`, `reducer.test.ts` "cities", `App.test.tsx` "cities" |
| Each demo city obeys the same story rules (4–7 affordable, unique best is over budget, winner ≠ cheapest, 90-min split, boundary flips at its cost) | `cities.test.ts` "demo story", `scripts/verify_expected.py` |
| Per-city currency and digit grouping (₹ en-IN, ¥, €, $) | `format.test.ts`, `App.test.tsx` "cities" |
| Map labels never overlap and stay clear of the zoom/compass corners in every demo city | `cities.test.ts` "keeps every marker label clear…" |
| Map: zoom/pan maths, buttons, keyboard, hover cards, layer toggles, invalid-input clearing | `mapViewport.test.ts` (8), `App.test.tsx` "map" (5) |
| Copy summary copies the recommendation and ranking (and never an over-budget hotel as recommended) | `App.test.tsx` |

## 4. Edge-case log (observed values)
- Budget **900**: Riverside Rest (cost 900) is affordable with $0 left and ranked #2.
- Budget **979**: Lamplighter still recommended; Clocktower Grand "Over budget by $1".
- Budget **980**: Clocktower Grand is **#1 Recommended**, $0 left (screenshot 03).
- Budget **0**: `NO_AFFORDABLE_HOTEL`, no ranks, every shortfall shown (screenshot 07).
- Budget **-5**, `abc`, empty, `1000001`: INVALID INPUT banner; ranks, recommendation, explanation, links cleared (screenshot 06).
- Importance **9** / `0` / `x`: INVALID INPUT naming the place; everything cleared (screenshot 08).
- Duplicate hotel ID, hotel/place ID clash, missing place time, unknown place time: rejected in `validate.test.ts`.

## 5. Screenshots (headless Chrome, 1440×1000 unless noted)
| File | Shows |
|---|---|
| `01-landing.png` | Landing: one card per city, each with a one-action Load button |
| `02-initial-budget-900.png` | Initial recommendation, ranking, map, timeline, table |
| `03a-budget-979-just-below.png` / `03-budget-980-…png` | The cost boundary |
| `04-riverside-importance-5-whatif.png` | Raising Riverside Walk to 5 in the importance table changes the recommendation |
| `05-after-reset.png` | Reset restores the original trip |
| `06-invalid-budget-cleared.png` | Invalid budget (`-5`) clears derived state |
| `07-no-affordable-hotel.png` | `NO_AFFORDABLE_HOTEL` at budget 0 |
| `08-invalid-importance-cleared.png` | Invalid importance clears derived state |
| `09-mobile-390px.png` | Responsive layout at phone width |
| `10-dark-theme.png` / `11-light-theme.png` | Premium redesign in both themes |
| `12-theme-switcher-dark.png` / `13-theme-switcher-light.png` | Header theme switcher (Light · Dark · System) with each mode selected |

| `14-map-overview.png` | Upgraded map: city backdrop, layer toggles, zoom controls |
| `15-map-hover-card.png` | Hover card on Clocktower Grand (over budget by $80) |
| `16-map-zoomed.png` | Zoomed to 225% and panned; labels scale down so they stay readable |
| `17-map-dark-top5-links.png` | Dark theme with "Top 5 links only" |

| `18-landing-cities.png` | The four city cards (Marlowe Bay, Hyderabad, Kyoto, Lisbon) and their data notes |
| `19-hyderabad-overview.png` | A full Hyderabad page: city picker, ₹ budget, recommendation, timeline, ranking, map, table |
| `20-hyderabad-map.png` / `21-kyoto-map.png` / `22-lisbon-map.png` | Each demo city's own map backdrop and layout |
| `23-kyoto-map-dark.png` | A demo city's map in the dark theme |
| `24-hyderabad-mobile-390px.png` | City picker and budget at phone width |

All screenshots were regenerated for the current UI. 01–09, 11, 13, 14–16, 18–22 and 24 are taken in forced light mode; 10, 12, 17 and 23 in dark mode.

## 6. Visual redesign check (Linear/Vercel-style pass)
Presentation-only change: `git status` shows no edits under `src/engine`, `src/data`, `src/state`, any `*.test.*` file or `scripts/`. After the redesign: 143/143 tests, lint, build and the Python verifier are green. Browser check in light and dark found two defects, both fixed: the `$` prefix of the budget box was misplaced (a bulk rename had turned `-translate-y-1/2` into `-tranzinc-y-1/2`, found by measuring the element boxes), and long hotel names were clipped by the badges.

## 7. Theme switcher (Light · Dark · System)
- `src/theme.ts` (pure helpers), `src/state/useTheme.ts` (hook), `src/components/ThemeSwitcher.tsx` (header control).
- The choice is stored in `localStorage` (`theme-pref`) and applied as `<html data-theme>`. System follows the OS live.
- **No flash:** an inline script in `index.html` sets `data-theme` before first paint. Verified in headless Chrome for four
  OS/saved-preference combinations (OS light + saved dark, OS dark + saved light, and no saved value under each OS): the
  attribute only ever takes its final value and never flips.
- Browser walkthrough: click Dark → dark; reload keeps dark; click Light → light; System tracks the OS flipping to dark.
- Robust to private mode: storage read/write failures are caught (tested); the preference then just does not persist.
- Keyboard: it is a radiogroup with roving tabindex; arrow keys move and select. axe reports no violations with it present.
- Tests: `theme.test.ts` (6) and `ThemeSwitcher.test.tsx` (6) cover defaults, live OS changes, explicit override and persistence,
  restore on next visit, arrow keys, and that switching theme never changes a comparison result.

## 8. Accessibility pass
- axe-core (jsdom): zero violations in 4 states. It caught one real defect (unlabelled SVG group), fixed with `role="group"`.
- State is never colour-only: ★ Recommended, rank numbers, "Affordable", ✕ + dashed outline + "Over budget by $X"; attractions are circles and food stops are diamonds, and both are named in table rows (`sr-only`) and in each map marker's `aria-label`.
- Keyboard: every control is a native button/input; map hotels are focusable and activate on Enter/Space; hotel cards and table headers are toggle buttons (`aria-pressed`); the current timeline step has `aria-current`; errors use `role="alert"`.
- Contrast (WCAG, computed by script from the actual token values), after the visual redesign:
  - Light: Recommended pill 4.99:1, Affordable 6.56:1, Over-budget 5.52:1, banner text 8.09:1, muted text 4.83:1, white on indigo-600 6.29:1.
  - Dark: Recommended pill 10.08:1, Affordable 12.09:1, Over-budget 8.51:1, banner text 15.66:1, muted text 6.91:1, body 16.12:1.
  - History: the original solid Recommended badge measured 3.77:1 and was fixed before the redesign.
- `prefers-reduced-motion` disables transitions and CSS animations, skips the card-reorder slide and the map zoom tween.
- The map's hover card is `aria-hidden` and supplementary: everything in it is in the ranking list, the table and the marker labels.
- Known limits: axe cannot check contrast or layout in jsdom, so contrast was computed by script, not measured in a browser; no screen-reader run was done.

## 9. Motion & copy summary (presentation only)
- Ranked hotel cards slide to their new positions when the order changes (FLIP via the Web Animations API, `useFlip.ts`); panels fade up in a stagger on load; the recommendation banner pops when the winner or outcome changes; map links draw in when another hotel is inspected; the recommended marker has a pulsing ring.
- A **Copy summary** button on the recommendation banner copies the winner, budget, leftover and full ranking as text (local clipboard only).
- Browser check (headless Chrome): reordering after an importance edit produced running `translateY` animations; no console errors.
- Found while testing: the theme switcher moved focus in a `requestAnimationFrame`, so two quick arrow presses could hit the old button (a flaky `ThemeSwitcher` test). Focus now moves synchronously; 8 consecutive full-suite runs passed.
- Removed the Riverside "what if" 1–5 control from Trip settings: it duplicated the importance table and confused the settings panel. Importance is now edited in one place.

## 10. Map upgrade (presentation only)
- Backdrop (`MapBackdrop.tsx`): block texture, four arterial roads, parks, river with bridges, district names, compass; themed via CSS variables. Decorative only and `aria-hidden`; the note "Not to scale. Lines are comparison links, not routes" stays.
- Zoom 100–400% and pan: buttons, `+` / `−` / `0` keys, Ctrl/⌘ + wheel or pinch at the cursor, drag to pan when zoomed. Pure maths in `mapViewport.ts` (8 tests); a drag never counts as a click (checked in Chrome: the inspected hotel stayed the same). Focusing an off-screen marker by keyboard recentres the map.
- Hover/focus cards (`MapTooltip.tsx`) for hotels (price, status/rank, total, average, longest trip) and places (type, importance, minutes and contribution from the inspected hotel, share of its total). Invalid input shows "No comparison while input is invalid." Hovering a place fades the other links.
- Layer toggles: Names, Link values, Top 5 links only (display filter; ties by place id; default shows all 15 links).
- Invariants held: map coordinates and zoom never enter the engine; `git diff` shows no changes under `src/engine`, `src/data`, `src/state`.
- Browser check: default view, hover card, zoom + drag, Ctrl+wheel, reset, top-5 + dark theme; no console errors. Known limits: marker layout is still hand-placed; no touch pinch test on a real device (pinch is handled via the browser's Ctrl+wheel events).

## 11. Demo cities: Hyderabad, Kyoto, Lisbon (data + UI)
- **What is real and what is not.** Place names are real landmarks; hotels, prices and travel times are invented. Times come from a
  rough formula over real coordinates (road factor, per-km rate with a faster long-distance tier, ±10% deterministic jitter),
  run once by a scratch script and committed as constants like Marlowe Bay's. They are not live traffic or quotes, and the UI says so on
  the landing cards and under the picker.
- **Same rules, same engine.** Each city is 10 hotels × 15 places (8 attractions, 7 food stops, importances 1–5). The engine, ranking
  rules, validation and `expected.ts` guard are unchanged; `git diff` shows no change under `src/engine/` or `src/data/mainCity.ts`.
- **Default trips** (all verified by test and by the Python script):

| City | Currency | Budget | Recommended | Most accessible (over budget) | Affordable |
|---|---|---|---|---|---|
| Hyderabad | ₹ (en-IN grouping) | ₹20,500 | Banjara Heights | Abids Courtyard, ₹30,000 (over by ₹9,500) | 6 |
| Kyoto | ¥ | ¥56,000 | Fushimi Gate Lodge | Gion Lantern House, ¥111,000 (over by ¥55,000) | 4 |
| Lisbon | € | €790 | Avenida Suites | Bairro Alto Loft, €1,300 (over by €510) | 6 |

- **State.** `LoadedState.cityId`; `LOAD` takes a city; `RESET` restores the *current* city's original (tested: a Hyderabad Reset does not fall back
  to Marlowe Bay's $900). Switching city loads that city's original trip and discards edits (tested).
- **Map layouts** are produced by simulated annealing (fixed seeds) that minimises label-box overlap while staying close to each landmark's
  real position, keeps land markers off the sea in Lisbon, and avoids the zoom and compass corners. Result: zero overlapping label boxes in
  all three cities, enforced by a test. Two defects found by looking at screenshots and fixed: a first spacing metric treated every label as the
  same box (hotel names sit above the badge, place names below), so labels still collided; and a hot-start annealing run scrambled Lisbon's order.
- **Known limits.** The layout is schematic: to keep 25 labels readable some markers sit away from their true position (for example Alfama Lanes
  is not beside Alfama Azulejo House on Lisbon's map). Street and park shapes are decorative. Travel times are approximations, not data. Reset
  and city switching have no undo.

