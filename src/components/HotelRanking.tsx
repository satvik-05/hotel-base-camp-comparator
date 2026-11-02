import { Ban, Hotel as HotelIcon, Star } from 'lucide-react';
import type { HotelEvaluation } from '../engine';
import type { ComparatorView } from '../state/derive';
import { money, num } from './format';

interface Props {
  view: ComparatorView;
  inspectedId: string;
  onInspect: (id: string) => void;
}

function RowBody({ e, maxTotal }: { e: HotelEvaluation; maxTotal: number }) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{e.name}</p>
          <p className="text-sm text-slate-600">
            Stay <span className="font-medium tabular-nums text-slate-800">{money(e.stayCost)}</span>
            <span className="mx-1.5 text-slate-300" aria-hidden>
              •
            </span>
            {e.affordable ? (
              <span className="tabular-nums">{e.remainingBudget === 0 ? 'exactly on budget ($0 left)' : `${money(e.remainingBudget)} left`}</span>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {e.status === 'RECOMMENDED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-white">
              <Star className="size-3.5 fill-current" aria-hidden /> Recommended
            </span>
          )}
          {e.status === 'RANKED' && (
            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
              Affordable
            </span>
          )}
          {e.status === 'OVER_BUDGET' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-300">
              <Ban className="size-3.5" aria-hidden /> Over budget by {money(e.shortfall)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden>
          <div
            className={`h-full rounded-full transition-all duration-500 ${e.status === 'OVER_BUDGET' ? 'bg-slate-400' : e.status === 'RECOMMENDED' ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${(e.weightedTravelTotal / maxTotal) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-xs tabular-nums text-slate-600">
          <span className="font-semibold text-slate-800">{num(e.weightedTravelTotal)}</span> imp-min ·{' '}
          <span className="font-semibold text-slate-800">{e.weightedAverage}</span> min avg
        </p>
      </div>
      {e.status === 'OVER_BUDGET' && <p className="mt-1 text-xs text-slate-500">Not ranked and never recommended while over budget.</p>}
    </>
  );
}

const rowStyle = (e: HotelEvaluation, selected: boolean): string => {
  const tone =
    e.status === 'RECOMMENDED'
      ? 'border-emerald-300 bg-emerald-50/70'
      : e.status === 'RANKED'
        ? 'border-amber-200 bg-white'
        : 'border-slate-200 border-dashed bg-slate-50 opacity-90';
  return `${tone} ${selected ? 'ring-2 ring-indigo-500' : 'hover:border-slate-400'}`;
};

export function HotelRanking({ view, inspectedId, onInspect }: Props) {
  const { result } = view;

  if (result.status === 'invalid') {
    return (
      <section aria-labelledby="ranking-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="ranking-title" className="text-base font-semibold text-slate-900">
          Ranked hotels
        </h2>
        <p className="mt-2 text-sm text-slate-600">Ranking cleared — fix the highlighted input to see results again.</p>
        <ul className="mt-3 space-y-1 text-sm text-slate-500">
          {view.scenario.hotels.map((h) => (
            <li key={h.id}>
              {h.name} — {money(h.stayCost)} (unranked)
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const maxTotal = Math.max(...result.evaluations.map((e) => e.weightedTravelTotal));
  const over = result.evaluations
    .filter((e) => !e.affordable)
    .sort((a, b) => a.shortfall - b.shortfall || (a.hotelId < b.hotelId ? -1 : 1));

  const renderItem = (e: HotelEvaluation, badge: React.ReactNode) => (
    <li key={e.hotelId}>
      <button
        type="button"
        onClick={() => onInspect(e.hotelId)}
        aria-pressed={e.hotelId === inspectedId}
        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${rowStyle(e, e.hotelId === inspectedId)}`}
      >
        <span aria-hidden className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700 ring-1 ring-slate-200">
          {badge}
        </span>
        <span className="min-w-0 flex-1">
          <RowBody e={e} maxTotal={maxTotal} />
        </span>
      </button>
    </li>
  );

  return (
    <section aria-labelledby="ranking-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 id="ranking-title" className="text-base font-semibold text-slate-900">
          Ranked hotels
        </h2>
        <p className="text-xs text-slate-500">Lower total = more accessible</p>
      </div>
      {result.ranking.length > 0 ? (
        <ol aria-label="Affordable hotels by rank" className="mt-3 space-y-2">
          {result.ranking.map((e) => renderItem(e, e.rank === 1 ? <Star className="size-4 fill-emerald-500 text-emerald-600" /> : `#${e.rank}`))}
        </ol>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No affordable hotels, so nothing is ranked.</p>
      )}
      {over.length > 0 && (
        <>
          <h3 className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <HotelIcon className="size-4" aria-hidden /> Over budget ({over.length}) — unranked
          </h3>
          <ul aria-label="Over-budget hotels" className="mt-2 space-y-2">
            {over.map((e) => renderItem(e, <Ban className="size-4 text-rose-500" />))}
          </ul>
        </>
      )}
    </section>
  );
}
