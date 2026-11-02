import type { Contribution, HotelEvaluation, Place } from '../engine';
import { num, type Money } from './format';

export type TipTarget =
  | { readonly kind: 'hotel'; readonly id: string; readonly name: string; readonly stayCost: number; readonly evaluation: HotelEvaluation | undefined; readonly selected: boolean }
  | { readonly kind: 'place'; readonly place: Place; readonly contribution: Contribution | undefined; readonly fromHotel: HotelEvaluation | null };

interface Props {
  target: TipTarget;
  money: Money;
  /** Marker position as a percentage of the map window. */
  leftPct: number;
  topPct: number;
}

const statusLine = (e: HotelEvaluation, money: Money): string => (e.status === 'RECOMMENDED' ? 'Recommended' : e.status === 'RANKED' ? `Rank #${e.rank} · affordable` : `Over budget by ${money(e.shortfall)}`);

/** Hover/focus card for a map marker. Supplementary: everything in it is also in the list, table and labels. */
export function MapTooltip({ target, money, leftPct, topPct }: Props) {
  const below = topPct < 34;
  const left = Math.min(86, Math.max(14, leftPct));
  return (
    <div
      aria-hidden
      className="map-tip pointer-events-none absolute z-10 w-56 rounded-xl border border-zinc-200 bg-surface p-3 text-xs shadow-lg"
      style={{ left: `${left}%`, top: `${topPct}%`, transform: below ? 'translate(-50%, 22px)' : 'translate(-50%, calc(-100% - 22px))' }}
    >
      {target.kind === 'hotel' ? (
        <>
          <p className="text-sm font-semibold text-zinc-900">{target.name}</p>
          <p className="mt-0.5 text-zinc-600">
            Stay {money(target.stayCost)}
            {target.evaluation && <> · {statusLine(target.evaluation, money)}</>}
          </p>
          {target.evaluation ? (
            <p className="mt-1.5 tabular-nums text-zinc-600">
              <span className="font-semibold text-zinc-800">{num(target.evaluation.weightedTravelTotal)}</span> imp-min ·{' '}
              <span className="font-semibold text-zinc-800">{target.evaluation.weightedAverage}</span> min avg · longest trip{' '}
              <span className="font-semibold text-zinc-800">{target.evaluation.longestTripMinutes}</span> min
            </p>
          ) : (
            <p className="mt-1.5 text-zinc-500">No comparison while input is invalid.</p>
          )}
          <p className="mt-1.5 text-zinc-500">{target.selected ? 'Currently inspected' : 'Click to inspect'}</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-zinc-900">{target.place.name}</p>
          <p className="mt-0.5 text-zinc-600">
            {target.place.type === 'attraction' ? 'Attraction' : 'Food stop'} · importance {Number.isFinite(target.place.importance) ? target.place.importance : 'invalid'}
          </p>
          {target.contribution && target.fromHotel ? (
            <p className="mt-1.5 tabular-nums text-zinc-600">
              From {target.fromHotel.name}: <span className="font-semibold text-zinc-800">{target.contribution.roundTripMinutes} min</span> round trip × {target.contribution.importance} ={' '}
              <span className="font-semibold text-zinc-800">{target.contribution.value}</span> (
              {Math.round((target.contribution.value / Math.max(1, target.fromHotel.weightedTravelTotal)) * 100)}% of its total)
            </p>
          ) : (
            <p className="mt-1.5 text-zinc-500">No comparison while input is invalid.</p>
          )}
        </>
      )}
    </div>
  );
}
