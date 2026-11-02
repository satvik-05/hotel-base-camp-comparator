import type { Outcome } from './types';
import type { HotelEvaluation } from './types';

export const isAffordable = (stayCost: number, budget: number): boolean => stayCost <= budget;

/** Plain code-unit comparison = ASCII order for our ID alphabet (no locale rules). */
const compareId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export const compareEvaluations = (a: HotelEvaluation, b: HotelEvaluation): number =>
  a.weightedTravelTotal - b.weightedTravelTotal ||
  a.stayCost - b.stayCost ||
  compareId(a.hotelId, b.hotelId);

export interface RankingResult {
  readonly evaluations: readonly HotelEvaluation[];
  readonly ranking: readonly HotelEvaluation[];
  readonly recommended: HotelEvaluation | null;
  readonly outcome: Outcome;
}

export type UnrankedEvaluation = Omit<HotelEvaluation, 'rank' | 'status' | 'reason'>;

/** Ranks affordable hotels 1..n; over-budget hotels get no rank and are never recommended. */
export function rankHotels(unranked: readonly UnrankedEvaluation[]): RankingResult {
  const draft = unranked.map((e) => ({ ...e, rank: null, status: 'OVER_BUDGET', reason: '' }) as HotelEvaluation);
  const affordable = draft.filter((e) => e.affordable).sort(compareEvaluations);

  const finished = new Map<string, HotelEvaluation>();
  affordable.forEach((e, i) => {
    const rank = i + 1;
    finished.set(e.hotelId, {
      ...e,
      rank,
      status: rank === 1 ? 'RECOMMENDED' : 'RANKED',
      reason:
        rank === 1
          ? `Recommended: lowest weighted travel total among affordable hotels, ${e.remainingBudget.toLocaleString('en-US')} left in budget.`
          : `Ranked #${rank} of ${affordable.length} affordable hotels.`,
    });
  });
  for (const e of draft) {
    if (!e.affordable) {
      finished.set(e.hotelId, {
        ...e,
        reason: `Over budget by ${e.shortfall.toLocaleString('en-US')}: not ranked, never recommended.`,
      });
    }
  }

  const evaluations = unranked.map((e) => finished.get(e.hotelId) as HotelEvaluation);
  const ranking = affordable.map((e) => finished.get(e.hotelId) as HotelEvaluation);
  const recommended = ranking[0] ?? null;
  return {
    evaluations,
    ranking,
    recommended,
    outcome: recommended ? 'RECOMMENDED' : 'NO_AFFORDABLE_HOTEL',
  };
}
