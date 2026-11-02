import { compare, withImportance } from '../engine';
import type { EngineResult, Hotel, HotelEvaluation, Place, Scenario } from '../engine';
import { MAIN_BUDGET } from '../data/mainCity';
import { parseWhole, type LoadedState } from './reducer';

export interface Problem {
  /** Which input is at fault, e.g. "Budget" or a place name. */
  readonly label: string;
  readonly message: string;
}

export interface HypotheticalBudget {
  readonly budget: number;
  readonly rank: number | null;
  readonly recommendedId: string | null;
}

export interface ComparatorView {
  readonly budget: number;
  /** City with the current importance inputs applied (NaN where the input is invalid). */
  readonly scenario: Scenario;
  readonly result: EngineResult;
  readonly problems: readonly Problem[];
  readonly budgetError: string | null;
  readonly importanceErrors: Readonly<Record<string, string>>;
  /** Null whenever the result is invalid, so nothing stale can be drawn. */
  readonly inspected: HotelEvaluation | null;
  readonly inspectedHotel: Hotel | undefined;
  /** Lowest weighted total overall, regardless of budget. */
  readonly mostAccessible: HotelEvaluation | null;
  /** For an inspected over-budget hotel: what would happen if the budget were raised to its cost. */
  readonly atItsCost: HypotheticalBudget | null;
  readonly budgetChanged: boolean;
  readonly changedImportance: readonly Place[];
  readonly isOriginal: boolean;
}

export function deriveView(s: LoadedState): ComparatorView {
  const budget = parseWhole(s.budgetInput);
  const scenario: Scenario = s.scenario.places.reduce(
    (acc, p) => withImportance(acc, p.id, parseWhole(s.importanceInputs[p.id] ?? '')),
    s.scenario,
  );
  const result = compare(scenario, budget);

  const problems: Problem[] = [];
  let budgetError: string | null = null;
  const importanceErrors: Record<string, string> = {};
  if (result.status === 'invalid') {
    for (const e of result.errors) {
      const place = /^places\[(\d+)\]\.importance$/.exec(e.path);
      if (e.path === 'budget') {
        budgetError = e.message;
        problems.push({ label: 'Budget', message: `${e.message} You entered "${s.budgetInput}".` });
      } else if (place) {
        const p = scenario.places[Number(place[1])]!;
        importanceErrors[p.id] = e.message;
        problems.push({ label: p.name, message: `${e.message} You entered "${s.importanceInputs[p.id]}".` });
      } else {
        problems.push({ label: e.path, message: e.message });
      }
    }
  }

  const ok = result.status === 'ok' ? result : null;
  const inspected = ok?.evaluations.find((e) => e.hotelId === s.inspectedId) ?? null;
  const mostAccessible =
    ok?.evaluations.reduce<HotelEvaluation | null>(
      (best, e) => (best === null || e.weightedTravelTotal < best.weightedTravelTotal ? e : best),
      null,
    ) ?? null;

  let atItsCost: HypotheticalBudget | null = null;
  if (ok && inspected && !inspected.affordable) {
    const r = compare(scenario, inspected.stayCost);
    if (r.status === 'ok') {
      atItsCost = {
        budget: inspected.stayCost,
        rank: r.evaluations.find((e) => e.hotelId === inspected.hotelId)?.rank ?? null,
        recommendedId: r.recommended?.hotelId ?? null,
      };
    }
  }

  const changedImportance = s.scenario.places.filter((p) => s.importanceInputs[p.id] !== String(p.importance));
  const budgetChanged = s.budgetInput !== String(MAIN_BUDGET);
  return {
    budget,
    scenario,
    result,
    problems,
    budgetError,
    importanceErrors,
    inspected,
    inspectedHotel: scenario.hotels.find((h) => h.id === s.inspectedId),
    mostAccessible,
    atItsCost,
    budgetChanged,
    changedImportance,
    isOriginal: !budgetChanged && changedImportance.length === 0,
  };
}
