import type { Comparator } from '../state/useComparator';
import type { LoadedState } from '../state/reducer';
import type { ComparatorView } from '../state/derive';
import { money, num } from './format';

interface Props {
  state: LoadedState;
  view: ComparatorView;
  hoverPlaceId: string | null;
  onHoverPlace: (id: string | null) => void;
  setImportance: Comparator['setImportance'];
  onInspect: (id: string) => void;
}

/** Accessible hotel-by-place equivalent of the map: supplied times, editable importance, contributions. */
export function TravelTable({ state, view, hoverPlaceId, onHoverPlace, setImportance, onInspect }: Props) {
  const { scenario, result, inspected } = view;
  const evals = new Map(result.status === 'ok' ? result.evaluations.map((e) => [e.hotelId, e]) : []);

  return (
    <section aria-labelledby="table-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="table-title" className="text-base font-semibold text-slate-900">
        Round-trip minutes: every hotel × every place
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Supplied times in minutes (bold = over 90). Edit an importance (1–5) to recalculate everything. Select a hotel column to inspect it.
      </p>
      <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table className="min-w-full border-collapse text-sm tabular-nums">
          <caption className="sr-only">Round-trip minutes from each hotel to each wishlist place, with place importance</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">Place</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-slate-700">Importance</th>
              {scenario.hotels.map((h) => {
                const sel = h.id === state.inspectedId;
                const e = evals.get(h.id);
                return (
                  <th key={h.id} scope="col" className={`min-w-24 px-1 py-1 text-center ${sel ? 'bg-indigo-100' : ''}`}>
                    <button
                      type="button"
                      onClick={() => onInspect(h.id)}
                      aria-pressed={sel}
                      className="w-full rounded px-1 py-1 text-xs font-semibold leading-tight text-slate-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      {e?.status === 'RECOMMENDED' && <span aria-label="Recommended">★ </span>}
                      {e?.status === 'OVER_BUDGET' && <span aria-label="Over budget">✕ </span>}
                      {h.name}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {scenario.places.map((p) => {
              const err = view.importanceErrors[p.id];
              const hot = hoverPlaceId === p.id;
              return (
                <tr key={p.id} onMouseEnter={() => onHoverPlace(p.id)} onMouseLeave={() => onHoverPlace(null)} className={`border-t border-slate-100 ${hot ? 'bg-indigo-50' : ''}`}>
                  <th scope="row" className={`sticky left-0 z-10 px-3 py-1.5 text-left font-medium text-slate-800 ${hot ? 'bg-indigo-50' : 'bg-white'}`}>
                    <span className={`mr-1.5 inline-block size-2 ${p.type === 'attraction' ? 'rounded-full bg-violet-600' : 'rotate-45 bg-orange-600'}`} aria-hidden />
                    {p.name} <span className="sr-only">({p.type})</span>
                  </th>
                  <td className="px-2 py-1 text-center">
                    <input
                      inputMode="numeric"
                      autoComplete="off"
                      aria-label={`Importance for ${p.name}`}
                      aria-invalid={err !== undefined}
                      title={err}
                      value={state.importanceInputs[p.id] ?? ''}
                      onChange={(ev) => setImportance(p.id, ev.target.value)}
                      className={`w-12 rounded-md border py-1 text-center font-semibold focus-visible:outline-2 focus-visible:outline-indigo-600 ${err ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-300'}`}
                    />
                  </td>
                  {scenario.hotels.map((h) => {
                    const sel = h.id === state.inspectedId;
                    const m = h.roundTripMinutes[p.id]!;
                    const c = inspected && sel ? inspected.contributions.find((x) => x.placeId === p.id) : undefined;
                    return (
                      <td key={h.id} className={`px-2 py-1.5 text-center ${sel ? 'bg-indigo-50' : ''} ${m > 90 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                        {m}
                        {c && <span className="block text-[11px] font-semibold text-indigo-700">= {num(c.value)}</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-800">
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left">Stay cost</th>
              <td />
              {scenario.hotels.map((h) => (
                <td key={h.id} className="px-2 py-2 text-center">{money(h.stayCost)}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left">Weighted total</th>
              <td />
              {scenario.hotels.map((h) => (
                <td key={h.id} className="px-2 py-2 text-center">{evals.get(h.id) ? num(evals.get(h.id)!.weightedTravelTotal) : '—'}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left">Average (min)</th>
              <td />
              {scenario.hotels.map((h) => (
                <td key={h.id} className="px-2 py-2 text-center">{evals.get(h.id)?.weightedAverage ?? '—'}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left">Status</th>
              <td />
              {scenario.hotels.map((h) => {
                const e = evals.get(h.id);
                return (
                  <td key={h.id} className="px-2 py-2 text-center text-xs">
                    {!e ? '—' : e.status === 'RECOMMENDED' ? '★ #1 Recommended' : e.status === 'RANKED' ? `#${e.rank}` : `✕ Over by ${money(e.shortfall)}`}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
