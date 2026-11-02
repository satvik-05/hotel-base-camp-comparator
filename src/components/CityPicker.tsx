import { Info } from 'lucide-react';
import { CITIES, getCity } from '../data/cities';

interface Props {
  cityId: string;
  onChange: (cityId: string) => void;
}

/** One-line honesty note shown wherever a city is described. */
export const dataNote = (fictional: boolean): string =>
  fictional ? 'Fictional city with invented data.' : 'Real landmark names. Hotels, prices and travel times are invented and approximate.';

/** Segmented city switcher; arrow keys move between cities (roving tabindex). Switching loads that city's original trip. */
export function CityPicker({ cityId, onChange }: Props) {
  const current = getCity(cityId);
  const move = (from: string, delta: number) => {
    const i = CITIES.findIndex((c) => c.id === from);
    const next = CITIES[(i + delta + CITIES.length) % CITIES.length]!;
    onChange(next.id);
    document.getElementById(`city-${next.id}`)?.focus();
  };

  return (
    <section aria-labelledby="city-title" className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id="city-title" className="text-base font-semibold text-zinc-900">
          City
        </h2>
        <div role="radiogroup" aria-labelledby="city-title" className="inline-flex flex-wrap gap-0.5 rounded-lg bg-zinc-500/10 p-0.5 ring-1 ring-zinc-500/20">
          {CITIES.map((c) => {
            const selected = c.id === cityId;
            return (
              <button
                key={c.id}
                id={`city-${c.id}`}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => !selected && onChange(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    move(c.id, 1);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    move(c.id, -1);
                  }
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition duration-150 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                  selected ? 'bg-surface text-zinc-900 shadow-sm ring-1 ring-zinc-500/20' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-700">
        <span className="font-medium text-zinc-900">{current.country}</span> · amounts in {current.currency.symbol} · {current.blurb}
      </p>
      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-zinc-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>{dataNote(current.fictional)} Switching city loads its original trip.</span>
      </p>
    </section>
  );
}
