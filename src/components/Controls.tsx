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
    <section aria-labelledby="controls-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 id="controls-title" className="text-base font-semibold text-slate-900">
          Trip settings
        </h2>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <RotateCcw className="size-4" aria-hidden /> Reset trip
        </button>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="budget" className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
            <Wallet className="size-4 text-slate-500" aria-hidden /> Whole-stay hotel budget
          </label>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden>
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
                className={`w-32 rounded-lg border py-2 pl-7 pr-3 text-right text-base font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-1 ${
                  view.budgetError
                    ? 'border-rose-500 bg-rose-50 text-rose-900 focus-visible:outline-rose-600'
                    : 'border-slate-300 text-slate-900 focus-visible:outline-indigo-600'
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
              className="h-2 min-w-0 flex-1 accent-indigo-600"
            />
          </div>
          {view.budgetError ? (
            <p id="budget-error" role="alert" className="mt-1.5 text-sm font-medium text-rose-700">
              {view.budgetError}
            </p>
          ) : (
            <p id="budget-help" className="mt-1.5 text-sm text-slate-500">
              One budget for the complete stay (not per night). A hotel at exactly this price is still affordable.
            </p>
          )}
          {unlock && (
            <button
              type="button"
              onClick={() => setBudget(String(unlock.stayCost))}
              className="mt-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Try {money(unlock.stayCost)} to afford the most accessible hotel ({unlock.name})
            </button>
          )}
        </div>

        <fieldset>
          <legend className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
            <Waves className="size-4 text-sky-600" aria-hidden /> What if “{riverPlace.name}” mattered more?
          </legend>
          <div role="radiogroup" aria-label={`${riverPlace.name} importance`} className="mt-2 inline-flex overflow-hidden rounded-lg border border-slate-300">
            {[1, 2, 3, 4, 5].map((v) => {
              const selected = riverRaw === String(v);
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setImportance(riverPlace.id, String(v))}
                  className={`w-11 border-r border-slate-300 py-2 text-sm font-semibold tabular-nums transition last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    selected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
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

      <p className="mt-4 text-xs text-slate-500" aria-live="polite">
        {view.isOriginal
          ? 'Showing the original trip.'
          : `Modified: ${[view.budgetChanged ? 'budget' : null, view.changedImportance.length ? `${view.changedImportance.length} importance value(s)` : null].filter(Boolean).join(' and ')}.`}
      </p>
    </section>
  );
}
