import { MARKER_POSITIONS } from '../data/mainCity';
import type { Contribution, Hotel, HotelEvaluation, Place } from '../engine';
import type { ComparatorView } from '../state/derive';

interface Props {
  view: ComparatorView;
  hoverPlaceId: string | null;
  onHoverPlace: (id: string | null) => void;
  inspectedId: string;
  onInspect: (id: string) => void;
}

const halo = { paintOrder: 'stroke', stroke: 'white', strokeWidth: 4, strokeLinejoin: 'round' } as const;

function hotelFill(e: HotelEvaluation | undefined): { fill: string; stroke: string; text: string; glyph: string } {
  if (!e) return { fill: '#e2e8f0', stroke: '#64748b', text: '#334155', glyph: '' };
  if (e.status === 'RECOMMENDED') return { fill: '#047857', stroke: '#064e3b', text: '#ffffff', glyph: '★' };
  if (e.status === 'RANKED') return { fill: '#fbbf24', stroke: '#92400e', text: '#451a03', glyph: String(e.rank) };
  return { fill: '#f1f5f9', stroke: '#e11d48', text: '#be123c', glyph: '✕' };
}

export function CityMap({ view, hoverPlaceId, onHoverPlace, inspectedId, onInspect }: Props) {
  const { scenario, result, inspected } = view;
  const evals = new Map(result.status === 'ok' ? result.evaluations.map((e) => [e.hotelId, e]) : []);
  const contribs = new Map<string, Contribution>(inspected ? inspected.contributions.map((c) => [c.placeId, c]) : []);
  const maxValue = Math.max(1, ...[...contribs.values()].map((c) => c.value));
  const from = inspected ? MARKER_POSITIONS[inspected.hotelId] : undefined;

  const placeColor = (p: Place) => (p.type === 'attraction' ? '#7c3aed' : '#ea580c');

  return (
    <section aria-labelledby="map-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="map-title" className="text-base font-semibold text-slate-900">
          Marlowe Bay schematic map
        </h2>
        <p className="text-xs text-slate-500">Not to scale. Lines are comparison links, not routes.</p>
      </div>

      <svg viewBox="0 0 1000 640" role="group" aria-label="Schematic map of 10 hotels and 15 wishlist places" className="mt-3 w-full rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1000" height="640" fill="url(#grid)" />
        <path d="M 870 0 C 930 120 790 210 840 330 S 890 540 840 640" fill="none" stroke="#bae6fd" strokeWidth="34" strokeLinecap="round" opacity="0.8" />
        <text x="868" y="620" fontSize="13" fill="#0369a1" opacity="0.9" transform="rotate(-84 868 620)">Marlow River</text>

        {/* comparison links: only for the inspected hotel */}
        {inspected && from && (
          <g role="group" aria-label={`Comparison links from ${inspected.name}`}>
            {scenario.places.map((p) => {
              const to = MARKER_POSITIONS[p.id];
              const c = contribs.get(p.id);
              if (!to || !c) return null;
              const active = hoverPlaceId === p.id;
              return (
                <line
                  key={p.id}
                  data-testid={`link-${p.id}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={active ? '#4338ca' : '#6366f1'}
                  strokeOpacity={active ? 1 : 0.55}
                  strokeWidth={1.2 + (c.value / maxValue) * 4.5}
                  strokeLinecap="round"
                  strokeDasharray="1 0"
                />
              );
            })}
          </g>
        )}

        {/* places */}
        {scenario.places.map((p) => {
          const pt = MARKER_POSITIONS[p.id]!;
          const c = contribs.get(p.id);
          const active = hoverPlaceId === p.id;
          return (
            <g
              key={p.id}
              data-testid={`place-${p.id}`}
              onMouseEnter={() => onHoverPlace(p.id)}
              onMouseLeave={() => onHoverPlace(null)}
              className="cursor-default"
            >
              <title>
                {p.name} ({p.type}, importance {Number.isFinite(p.importance) ? p.importance : 'invalid'})
                {c ? ` — round trip ${c.roundTripMinutes} min, contribution ${c.value}` : ''}
              </title>
              {p.type === 'attraction' ? (
                <circle cx={pt.x} cy={pt.y} r={active ? 12 : 9} fill={placeColor(p)} stroke="white" strokeWidth="2" />
              ) : (
                <rect x={pt.x - 8} y={pt.y - 8} width="16" height="16" rx="3" transform={`rotate(45 ${pt.x} ${pt.y})`} fill={placeColor(p)} stroke="white" strokeWidth="2" />
              )}
              <text x={pt.x} y={pt.y + 26} textAnchor="middle" fontSize="13.5" fontWeight={active ? 700 : 500} fill="#1e293b" style={halo}>
                {p.name}
              </text>
              {c && (
                <text x={pt.x} y={pt.y + 41} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#4338ca" style={halo}>
                  {c.roundTripMinutes} min · ×{c.importance} = {c.value}
                </text>
              )}
            </g>
          );
        })}

        {/* hotels */}
        {scenario.hotels.map((h: Hotel) => {
          const pt = MARKER_POSITIONS[h.id]!;
          const e = evals.get(h.id);
          const st = hotelFill(e);
          const selected = h.id === inspectedId;
          const statusText = e ? (e.status === 'RECOMMENDED' ? 'recommended' : e.status === 'RANKED' ? `rank ${e.rank}` : `over budget by ${e.shortfall}`) : 'unranked';
          return (
            <g
              key={h.id}
              data-testid={`hotel-${h.id}`}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`Hotel ${h.name}, ${statusText}. Press to inspect.`}
              onClick={() => onInspect(h.id)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onInspect(h.id);
                }
              }}
              className="cursor-pointer outline-none focus-visible:[&>rect:first-child]:stroke-indigo-600"
            >
              <rect x={pt.x - 18} y={pt.y - 14} width="36" height="28" rx="7" fill="none" stroke={selected ? '#4f46e5' : 'transparent'} strokeWidth="3" transform="scale(1)" />
              <rect x={pt.x - 15} y={pt.y - 11} width="30" height="22" rx="5" fill={st.fill} stroke={st.stroke} strokeWidth="2" strokeDasharray={e?.status === 'OVER_BUDGET' ? '4 3' : undefined} />
              <text x={pt.x} y={pt.y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={st.text}>
                {st.glyph}
              </text>
              <text x={pt.x} y={pt.y - 21} textAnchor="middle" fontSize="14.5" fontWeight="700" fill="#0f172a" style={halo}>
                {h.name}
              </text>
              <title>{`${h.name} — ${statusText}`}</title>
            </g>
          );
        })}
      </svg>

      <ul aria-label="Map legend" className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
        <li className="flex items-center gap-1.5"><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#7c3aed" /></svg> Attraction</li>
        <li className="flex items-center gap-1.5"><svg width="14" height="14"><rect x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" fill="#ea580c" /></svg> Food stop</li>
        <li className="flex items-center gap-1.5"><span className="inline-flex h-4 w-6 items-center justify-center rounded bg-emerald-700 text-[10px] font-bold text-white">★</span> Recommended</li>
        <li className="flex items-center gap-1.5"><span className="inline-flex h-4 w-6 items-center justify-center rounded bg-amber-300 text-[10px] font-bold text-amber-950">2</span> Ranked (affordable)</li>
        <li className="flex items-center gap-1.5"><span className="inline-flex h-4 w-6 items-center justify-center rounded border border-dashed border-rose-500 bg-slate-100 text-[10px] font-bold text-rose-700">✕</span> Over budget</li>
        <li className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-6 bg-indigo-500" /> Link of inspected hotel (thicker = larger contribution)</li>
      </ul>
      {!inspected && <p className="mt-2 text-sm text-slate-600">No links shown: there is no valid comparison to inspect.</p>}
    </section>
  );
}
