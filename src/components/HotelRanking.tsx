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
          <p className="font-semibold text-zinc-900">{e.name}</p>
          <p className="text-sm text-zinc-600">
            Stay <span className="font-medium tabular-nums text-zinc-800">{money(e.stayCost)}</span>
            <span className="mx-1.5 text-zinc-300" aria-hidden>
              •
            </span>
            {e.affordable ? (
              <span className="tabular-nums">{e.remainingBudget === 0 ? 'exactly on budget ($0 left)' : `${money(e.remainingBudget)} left`}</span>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {e.status === 'RECOMMENDED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/40 shadow-[0_0_14px_-3px] shadow-emerald-500/60">
              <Star className="size-3.5 fill-current" aria-hidden /> Recommended
            </span>
          )}
          {e.status === 'RANKED' && (
            <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/40">
              Affordable
            </span>
          )}
          {e.status === 'OVER_BUDGET' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/40">
              <Ban className="size-3.5" aria-hidden /> Over budget by {money(e.shortfall)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100" aria-hidden>
          <div
            className={`h-full rounded-full transition-all duration-500 ${e.status === 'OVER_BUDGET' ? 'bg-zinc-400' : e.status === 'RECOMMENDED' ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${(e.weightedTravelTotal / maxTotal) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-xs tabular-nums text-zinc-600">
          <span className="font-semibold text-zinc-800">{num(e.weightedTravelTotal)}</span> imp-min ·{' '}
          <span className="font-semibold text-zinc-800">{e.weightedAverage}</span> min avg
        </p>
      </div>
      {e.status === 'OVER_BUDGET' && <p className="mt-1 text-xs text-zinc-500">Not ranked and never recommended while over budget.</p>}
    </>
  );
}

const rowStyle = (e: HotelEvaluation, selected: boolean): string => {
  const tone =
    e.status === 'RECOMMENDED'
      ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_24px_-10px] shadow-emerald-500/60'
      : e.status === 'RANKED'
        ? 'border-zinc-200 bg-surface shadow-sm'
        : 'border-zinc-300 border-dashed bg-zinc-500/5';
  return `${tone} ${selected ? 'ring-2 ring-indigo-500/70 ring-offset-1 ring-offset-surface' : 'hover:-translate-y-px hover:border-zinc-400 hover:shadow-md'}`;
};

export function HotelRanking({ view, inspectedId, onInspect }: Props) {
  const { result } = view;

  if (result.status === 'invalid') {
    return (
      <section aria-labelledby="ranking-title" className="card p-5">
        <h2 id="ranking-title" className="text-base font-semibold text-zinc-900">
          Ranked hotels
        </h2>
        <p className="mt-2 text-sm text-zinc-600">Ranking cleared — fix the highlighted input to see results again.</p>
        <ul className="mt-3 space-y-1 text-sm text-zinc-500">
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
        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${rowStyle(e, e.hotelId === inspectedId)}`}
      >
        <span aria-hidden className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-sm font-bold text-zinc-700 ring-1 ring-zinc-500/20">
          {badge}
        </span>
        <span className="min-w-0 flex-1">
          <RowBody e={e} maxTotal={maxTotal} />
        </span>
      </button>
    </li>
  );

  return (
    <section aria-labelledby="ranking-title" className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="ranking-title" className="text-base font-semibold text-zinc-900">
          Ranked hotels
        </h2>
        <p className="text-xs text-zinc-500">Lower total = more accessible</p>
      </div>
      {result.ranking.length > 0 ? (
        <ol aria-label="Affordable hotels by rank" className="mt-3 space-y-2">
          {result.ranking.map((e) => renderItem(e, e.rank === 1 ? <Star className="size-4 fill-emerald-500 text-emerald-600" /> : `#${e.rank}`))}
        </ol>
      ) : (
        <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">No affordable hotels, so nothing is ranked.</p>
      )}
      {over.length > 0 && (
        <>
          <h3 className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
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
