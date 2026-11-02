# Prompts used

The prompts below are the ones issued in this development session, in order, condensed to what each asked for.
Each was given to Claude Code together with the problem-statement PDF (SPR26_D2_P03). Earlier work outside this
session is not recorded here.

## Prompt 0 — Role, stack, rules, mission (kickoff)
> Act as an elite full-stack engineer and architect. Read the PDF and follow its business logic, data constraints,
> validation rules and acceptance criteria strictly. **Stack:** React + Vite, TypeScript, Tailwind, Lucide.
> **Architecture:** modular components; separate engine, state, map renderer, dashboard, validation; pure
> deterministic functions with tests; immutability and type safety. **Core rules restated:** the contribution /
> total / average formulas, `stay_cost <= budget`, "Over budget by X", sort by total then cost then ASCII ID,
> gapless ranks, `NO_AFFORDABLE_HOTEL`, instant invalid-state clearing, the story-scenario conditions.
> **Mission:** propose a plan, outline a file structure, then begin with foundation + engine + tests.

Constraints this gave the assistant: fixed tech stack, pure-engine boundary, TDD, spec rules as invariants.
Follow-up from the user: use Claude's best practices (e.g. `CLAUDE.md`). **Outcome:** plan-mode proposal with 5
ordered steps and checkpoints (approved), project scaffold, `CLAUDE.md` holding the ten non-negotiable invariants.

## Prompt 1 — Steps 2 & 3 (engine + data), "rigorously using TDD"
> Create `types.ts`, `constants.ts`, `validate.ts`, `calculate.ts`, `rank.ts` with the exact formulas, ranges, ID
> regex and integer round-half-up. Write tests first/alongside for arithmetic, round-half-up, exact ranking
> despite rounded averages, both tie-breaks, budget equality and +1, invalid-state clearing, no-affordable.
> Hand-author 10 hotels / 15 places and a 10×15 matrix satisfying every story condition; record `expected.ts`
> (never imported by app code); write an independent Python verifier. Run everything and report.

**Outcome:** 116 tests; story numbers chosen with a scratch script and then frozen as constants; Python verifier
that parses only the matrix numbers from the TS file. Assistant-driven decisions: `compare()` returns a
discriminated union so "invalid" structurally cannot carry ranks; `withImportance` is non-validating so the UI can
keep raw bad input; `RIVER` chosen as the what-if place after brute-forcing all single-importance flips.

## Prompt 2 — Step 4 (state + UI)
> Reducer/hook for budget, importance overrides (Riverside Walk what-if), inspected hotel, errors, wired to the
> engine. Components: Controls, HotelRanking, CityMap (25 labelled markers, only the inspected hotel's 15 links
> with times/contributions), ExplanationPanel, StatusBanner. Tailwind v4, emerald/amber/slate-rose colour coding,
> keyboard accessible, responsive.

**Outcome:** raw-string inputs in state so invalid values stay visible; derived view computed by a pure
`deriveView`; table added as the accessible equivalent of the map. A headless-Chrome screenshot showed overlapping
map labels, which led to re-spacing the markers and widening the map.

## Prompt 3 — Step 5 (this step)
> Optional budget timeline obeying the same rules; accessibility/polish pass (text and symbols, contrast,
> keyboard, aria); `EVIDENCE.md`, `PROMPTS.md`, `DESIGN.md`; final `npm test` / `lint` / `build`.

**Outcome:** `budgetTimeline()` built on `compare()` (verified against `compare()` at every budget 0–1400); axe
audit found and fixed one real defect; a contrast calculation found and fixed one failing badge colour.

## Plan changes vs. the original 5-step plan
- Step 4 gained the table and a landing/Load screen earlier than planned (spec: "load the city in one action").
- Timeline lives in `src/engine/timeline.ts` (pure) rather than only in a component, so it is unit-tested.
- Added axe-core and a headless-browser screenshot pass that the plan did not list.

## Prompt-design takeaways
Give the assistant the invariants as a checklist (they became `CLAUDE.md`), forbid shortcuts that would defeat
verification (app must not import documented answers), and require an independent calculation path.
