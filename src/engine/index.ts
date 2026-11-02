import {
  contributionsFor,
  formatTenths,
  importanceTotal,
  roundedTenths,
  weightedTravelTotal,
} from './calculate';
import { isAffordable, rankHotels, type UnrankedEvaluation } from './rank';
import type { EngineResult, Scenario } from './types';
import { validateBudget, validateScenario } from './validate';

export * from './types';
export * from './constants';
export { validateBudget, validateImportance, validateScenario } from './validate';
export { formatTenths, roundedTenths } from './calculate';

/** Validates, then evaluates and ranks. Invalid input yields errors only — never partial results. */
export function compare(scenario: Scenario, budget: number): EngineResult {
  const errors = [...validateBudget(budget), ...validateScenario(scenario)];
  if (errors.length > 0) return { status: 'invalid', errors };

  const impTotal = importanceTotal(scenario.places);
  const unranked: UnrankedEvaluation[] = scenario.hotels.map((hotel) => {
    const contributions = contributionsFor(hotel, scenario.places);
    const total = weightedTravelTotal(contributions);
    const tenths = roundedTenths(total, impTotal);
    const affordable = isAffordable(hotel.stayCost, budget);
    return {
      hotelId: hotel.id,
      name: hotel.name,
      stayCost: hotel.stayCost,
      contributions,
      weightedTravelTotal: total,
      roundedTenths: tenths,
      weightedAverage: formatTenths(tenths),
      longestTripMinutes: Math.max(...contributions.map((c) => c.roundTripMinutes)),
      affordable,
      remainingBudget: budget - hotel.stayCost,
      shortfall: affordable ? 0 : hotel.stayCost - budget,
    };
  });

  return { status: 'ok', budget, importanceTotal: impTotal, ...rankHotels(unranked) };
}

/** Returns a new scenario with one place's importance replaced (not validated here). */
export function withImportance(scenario: Scenario, placeId: string, importance: number): Scenario {
  return {
    ...scenario,
    places: scenario.places.map((p) => (p.id === placeId ? { ...p, importance } : p)),
  };
}
