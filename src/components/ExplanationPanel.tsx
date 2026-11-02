import { Landmark, Utensils } from 'lucide-react';
import type { ComparatorView } from '../state/derive';
import { money, num } from './format';

export function ExplanationPanel({ view }: { view: ComparatorView }) {
  const { result, inspected, scenario } = view;

  if (result.status === 'invalid' || !inspected) {
    return (
      <section aria-labelledby="explain-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="explain-title" className="text-base font-semibold text-slate-900">Why this hotel?</h2>
        <p className="mt-2 text-sm text-slate-600">Explanation cleared — there is no valid calculation to explain.</p>
      </section>
    );
  }

  const placeById = new Map(scenario.places.map((p) => [p.id, p]));
  const rows = [...inspected.contributions].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...rows.map((r) => r.value));
  const [first, second] = result.ranking;
  const mostAcc = view.mostAccessible;

  const story: string[] = [];
  if (result.outcome === 'NO_AFFORDABLE_HOTEL') {
    story.push(`No hotel fits the ${money(result.budget)} budget, so nothing can be recommended.`);
  } else if (inspected.status === 'RECOMMENDED' && first) {
    if (second) {
      const gap = second.weightedTravelTotal - first.weightedTravelTotal;
      story.push(
        gap > 0
          ? `Lowest weighted travel total of ${result.ranking.length} affordable hotels: ${num(gap)} importance-minutes ahead of ${second.name}.`
          : second.stayCost !== first.stayCost
            ? `Tied with ${second.name} on weighted travel total; the lower stay cost breaks the tie.`
            : `Tied with ${second.name} on both total and cost; hotel ID order breaks the tie.`,
      );
    } else {
      story.push('The only affordable hotel, so it is recommended.');
    }
  } else if (inspected.status === 'RANKED' && first) {
    story.push(
      `Rank ${inspected.rank} of ${result.ranking.length}: ${num(inspected.weightedTravelTotal - first.weightedTravelTotal)} importance-minutes behind ${first.name}${inspected.stayCost < first.stayCost ? `, though it costs ${money(first.stayCost - inspected.stayCost)} less` : ''}.`,
    );
  } else {
    story.push(`Over budget by ${money(inspected.shortfall)} (stay ${money(inspected.stayCost)} vs budget ${money(result.budget)}), so it is unranked and never recommended.`);
    if (view.atItsCost) {
      story.push(
        view.atItsCost.rank === 1
          ? `At a budget of ${money(view.atItsCost.budget)} it would become the recommendation.`
          : `At a budget of ${money(view.atItsCost.budget)} it would rank #${view.atItsCost.rank}.`,
      );
    }
  }
  if (mostAcc && !mostAcc.affordable && inspected.status !== 'OVER_BUDGET' && result.recommended) {
    story.push(
      `The most accessible hotel overall is ${mostAcc.name} (${num(mostAcc.weightedTravelTotal)}), but it is ${money(mostAcc.shortfall)} over budget.`,
    );
  }
  const cheapestAff = [...result.ranking].sort((a, b) => a.stayCost - b.stayCost)[0];
  if (inspected.status === 'RECOMMENDED' && cheapestAff && cheapestAff.hotelId !== inspected.hotelId) {
    story.push(`The cheapest affordable hotel, ${cheapestAff.name} (${money(cheapestAff.stayCost)}), has a higher weighted travel total (${num(cheapestAff.weightedTravelTotal)}).`);
  }

  return (
    <section aria-labelledby="explain-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="explain-title" className="text-base font-semibold text-slate-900">
        Why {inspected.name}?
      </h2>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {story.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
        <p className="font-medium text-slate-900">The calculation</p>
        <p className="mt-1 tabular-nums">
          Σ (importance × round-trip minutes) = <strong>{num(inspected.weightedTravelTotal)}</strong> importance-minutes
        </p>
        <p className="tabular-nums">
          {num(inspected.weightedTravelTotal)} ÷ importance total {result.importanceTotal} = <strong>{inspected.weightedAverage} min</strong> weighted average
        </p>
        <p className="tabular-nums">
          Budget {money(result.budget)} − stay {money(inspected.stayCost)} = {money(inspected.remainingBudget)} remaining
        </p>
        <p className="mt-1 text-xs text-slate-500">Ranking uses the exact total, not the rounded average.</p>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">Contribution by place (importance × minutes)</h3>
      <ul className="mt-2 space-y-1.5" aria-label={`Contribution breakdown for ${inspected.name}`}>
        {rows.map((r) => {
          const p = placeById.get(r.placeId)!;
          const Icon = p.type === 'attraction' ? Landmark : Utensils;
          return (
            <li key={r.placeId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-sm">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-slate-800">
                  <Icon className={`size-3.5 shrink-0 ${p.type === 'attraction' ? 'text-violet-600' : 'text-orange-600'}`} aria-label={p.type} />
                  {p.name}
                </p>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${(r.value / maxValue) * 100}%` }} />
                </div>
              </div>
              <p className="text-right text-xs tabular-nums text-slate-600">
                {r.importance} × {r.roundTripMinutes} = <strong className="text-slate-900">{num(r.value)}</strong>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
