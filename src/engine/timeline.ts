import { compare } from './index';
import type { Scenario } from './types';

export interface TimelineSegment {
  /** First budget (inclusive) at which this outcome holds. */
  readonly from: number;
  /** Last budget (inclusive) at which it holds; null = every higher budget. */
  readonly to: number | null;
  /** Recommended hotel id, or null for NO_AFFORDABLE_HOTEL. */
  readonly recommendedId: string | null;
}

/**
 * Budget ranges and the recommendation in each. Affordability only changes at a hotel's stay cost,
 * so the engine is evaluated once per distinct cost — the same `compare` the rest of the app uses,
 * so affordability and ranking rules cannot drift. Returns [] if the scenario is invalid.
 */
export function budgetTimeline(scenario: Scenario): TimelineSegment[] {
  const costs = [...new Set(scenario.hotels.map((h) => h.stayCost))].sort((a, b) => a - b);
  const steps: { from: number; recommendedId: string | null }[] = [];

  const first = compare(scenario, 0);
  if (first.status !== 'ok') return [];
  steps.push({ from: 0, recommendedId: first.recommended?.hotelId ?? null });

  for (const cost of costs) {
    const r = compare(scenario, cost);
    if (r.status !== 'ok') return [];
    const id = r.recommended?.hotelId ?? null;
    if (steps[steps.length - 1]!.recommendedId !== id) steps.push({ from: cost, recommendedId: id });
  }
  return steps.map((s, i) => ({
    from: s.from,
    to: i + 1 < steps.length ? steps[i + 1]!.from - 1 : null,
    recommendedId: s.recommendedId,
  }));
}
