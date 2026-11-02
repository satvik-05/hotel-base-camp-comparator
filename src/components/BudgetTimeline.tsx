import { Milestone } from 'lucide-react';
import { useMemo } from 'react';
import { budgetTimeline } from '../engine/timeline';
import type { ComparatorView } from '../state/derive';
import { money } from './format';

const PALETTE = ['bg-zinc-300', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500'];

interface Props {
  view: ComparatorView;
  onPickBudget: (budget: number) => void;
}

/** Compact "budget -> recommendation" ladder, derived by the same engine as the main result. */
export function BudgetTimeline({ view, onPickBudget }: Props) {
  const { scenario } = view;
  const segments = useMemo(() => budgetTimeline(scenario), [scenario]);
  if (segments.length === 0) return null;

  const names = new Map(scenario.hotels.map((h) => [h.id, h.name]));
  const axisMax = Math.max(...scenario.hotels.map((h) => h.stayCost)) + 100;
  const current = Number.isFinite(view.budget) ? view.budget : null;
  const activeIdx = current === null ? -1 : segments.findIndex((s) => current >= s.from && (s.to === null || current <= s.to));
  const label = (id: string | null) => (id ? names.get(id)! : 'NO_AFFORDABLE_HOTEL');

  return (
    <section aria-labelledby="timeline-title" className="card p-5">
      <h2 id="timeline-title" className="flex items-center gap-1.5 text-base font-semibold text-zinc-900">
        <Milestone className="size-4 text-indigo-600" aria-hidden /> Budget timeline
      </h2>
      <p className="mt-1 text-sm text-zinc-500">The recommendation changes only at these budgets. Select a step to try its starting budget.</p>

      <div className="relative mt-4" aria-hidden>
        <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-zinc-200">
          {segments.map((s, i) => (
            <div
              key={s.from}
              className={`${PALETTE[i % PALETTE.length]} ${i === activeIdx ? '' : 'opacity-60'} border-r border-white last:border-r-0`}
              style={{ width: `${(((s.to === null ? axisMax : s.to + 1) - s.from) / axisMax) * 100}%` }}
            />
          ))}
        </div>
        {current !== null && (
          <div className="absolute -top-1 h-5 w-0.5 rounded bg-zinc-900 shadow-[0_0_0_2px] shadow-surface" style={{ left: `${Math.min(current / axisMax, 1) * 100}%` }} />
        )}
      </div>

      <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {segments.map((s, i) => (
          <li key={s.from}>
            <button
              type="button"
              onClick={() => onPickBudget(s.from)}
              aria-current={i === activeIdx ? 'true' : undefined}
              className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left text-sm transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                i === activeIdx ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_18px_-8px] shadow-indigo-500/70' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-500/5'
              }`}
            >
              <span className={`mt-1 size-3 shrink-0 rounded-sm ${PALETTE[i % PALETTE.length]}`} aria-hidden />
              <span>
                <span className="block font-semibold tabular-nums text-zinc-900">
                  {money(s.from)}
                  {s.to === null ? ' and up' : ` – ${money(s.to)}`}
                  {i === activeIdx && <span className="ml-1.5 text-xs font-medium text-indigo-700">(you are here)</span>}
                </span>
                <span className="text-zinc-700">
                  {s.recommendedId ? 'Recommend ' : ''}
                  {label(s.recommendedId)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
