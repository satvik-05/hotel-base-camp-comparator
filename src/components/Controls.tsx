import { RotateCcw, Wallet, Waves } from 'lucide-react';
import { WHAT_IF } from '../data/mainCity';
import type { Comparator } from '../state/useComparator';
import type { LoadedState } from '../state/reducer';
import type { ComparatorView } from '../state/derive';
import { money } from './format';

const SLIDER_MAX = 1500;

interface Props {
  state: LoadedState;
  view: ComparatorView;
  setBudget: Comparator['setBudget'];
  setImportance: Comparator['setImportance'];
  reset: Comparator['reset'];
}

export function Controls({ state, view, setBudget, setImportance, reset }: Props) {
  const riverPlace = state.scenario.places.find((p) => p.id === WHAT_IF.placeId)!;
  const riverRaw = state.importanceInputs[riverPlace.id] ?? '';
  const sliderValue = Number.isFinite(view.budget) ? Math.min(Math.max(view.budget, 0), SLIDER_MAX) : 0;
  const unlock = view.mostAccessible && !view.mostAccessible.affordable ? view.mostAccessible : null;

  return (
    <section aria-labelledby="controls-title" className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id="controls-title" className="text-base font-semibold text-zinc-900">
          Trip settings
        </h2>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-surface px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition duration-150 hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <RotateCcw className="size-4" aria-hidden /> Reset trip
        </button>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="budget" className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
            <Wallet className="size-4 text-zinc-500" aria-hidden /> Whole-stay hotel budget
          </label>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500" aria-hidden>
                $
              </span>
              <input
                id="budget"
                inputMode="numeric"
                autoComplete="off"
                value={state.budgetInput}
                onChange={(e) => setBudget(e.target.value)}
                aria-invalid={view.budgetError !== null}
                aria-describedby={view.budgetError ? 'budget-error' : 'budget-help'}
                className={`block w-32 rounded-lg border bg-surface py-2 pl-7 pr-3 text-right text-base font-semibold tabular-nums shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-1 ${
                  view.budgetError
                    ? 'border-rose-500 bg-rose-500/10 text-rose-900 focus-visible:outline-rose-600'
                    : 'border-zinc-300 text-zinc-900 focus-visible:outline-indigo-600'
                }`}
              />
            </div>
            <input
              type="range"
              min={0}
              max={SLIDER_MAX}
              step={10}
              value={sliderValue}
              onChange={(e) => setBudget(e.target.value)}
              aria-label="Budget slider"
              style={{ '--pct': `${(sliderValue / SLIDER_MAX) * 100}%` } as React.CSSProperties}
              className="range-modern min-w-0 flex-1"
            />
          </div>
          {view.budgetError ? (
            <p id="budget-error" role="alert" className="mt-1.5 text-sm font-medium text-rose-700">
              {view.budgetError}
            </p>
          ) : (
            <p id="budget-help" className="mt-1.5 text-sm text-zinc-500">
              One budget for the complete stay (not per night). A hotel at exactly this price is still affordable.
            </p>
          )}
          {unlock && (
            <button
              type="button"
              onClick={() => setBudget(String(unlock.stayCost))}
              className="mt-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-500/30 shadow-[0_0_14px_-4px] shadow-indigo-500/50 transition duration-150 hover:bg-indigo-500/20 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Try {money(unlock.stayCost)} to afford the most accessible hotel ({unlock.name})
            </button>
          )}
        </div>

        <fieldset>
          <legend className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
            <Waves className="size-4 text-sky-600" aria-hidden /> What if “{riverPlace.name}” mattered more?
          </legend>
          <div role="radiogroup" aria-label={`${riverPlace.name} importance`} className="mt-2 inline-flex gap-0.5 rounded-lg bg-zinc-500/10 p-0.5 ring-1 ring-zinc-500/20">
            {[1, 2, 3, 4, 5].map((v) => {
              const selected = riverRaw === String(v);
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setImportance(riverPlace.id, String(v))}
                  className={`w-11 rounded-md py-2 text-sm font-semibold tabular-nums transition duration-150 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    selected ? 'bg-indigo-600 text-white shadow-[0_0_14px_-3px] shadow-indigo-500/70' : 'text-zinc-700 hover:bg-surface hover:shadow-sm'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-sm text-zinc-500">
            Original importance {riverPlace.importance}. Try {WHAT_IF.importance} to see the recommendation change. Every
            place can be edited in the table below.
          </p>
          {view.importanceErrors[riverPlace.id] && (
            <p role="alert" className="mt-1 text-sm font-medium text-rose-700">
              {view.importanceErrors[riverPlace.id]}
            </p>
          )}
        </fieldset>
      </div>

      <p className="mt-4 text-xs text-zinc-500" aria-live="polite">
        {view.isOriginal
          ? 'Showing the original trip.'
          : `Modified: ${[view.budgetChanged ? 'budget' : null, view.changedImportance.length ? `${view.changedImportance.length} importance value(s)` : null].filter(Boolean).join(' and ')}.`}
      </p>
    </section>
  );
}
