import { useState } from 'react';
import { Hash, ListFilter, Locate, Minus, Plus, Tag } from 'lucide-react';
import type { Contribution, Hotel, HotelEvaluation, Place } from '../engine';
import type { ComparatorView } from '../state/derive';
import { makeMoney } from './format';
import { MapBackdrop } from './MapBackdrop';
import { MapTooltip, type TipTarget } from './MapTooltip';
import { viewBoxOf, viewHeight, viewWidth } from './mapViewport';
import { useMapViewport } from './useMapViewport';

interface Props {
  view: ComparatorView;
  hoverPlaceId: string | null;
  onHoverPlace: (id: string | null) => void;
  inspectedId: string;
  onInspect: (id: string) => void;
}

const TOP_LINKS = 5;
const halo = { paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 4, strokeLinejoin: 'round' } as const;

function hotelFill(e: HotelEvaluation | undefined): { fill: string; stroke: string; text: string; glyph: string } {
  if (!e) return { fill: '#e2e8f0', stroke: '#64748b', text: '#334155', glyph: '' };
  if (e.status === 'RECOMMENDED') return { fill: '#047857', stroke: '#064e3b', text: '#ffffff', glyph: '★' };
  if (e.status === 'RANKED') return { fill: '#fbbf24', stroke: '#92400e', text: '#451a03', glyph: String(e.rank) };
  return { fill: '#f1f5f9', stroke: '#e11d48', text: '#be123c', glyph: '✕' };
}

function Toggle({ pressed, onClick, icon, children }: { pressed: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        pressed ? 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/40' : 'bg-surface text-zinc-600 ring-zinc-500/25 hover:bg-zinc-500/10'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

const zoomBtn =
  'flex size-8 items-center justify-center text-zinc-700 transition duration-150 hover:bg-zinc-500/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-indigo-600';

export function CityMap({ view, hoverPlaceId, onHoverPlace, inspectedId, onInspect }: Props) {
  const { scenario, result, inspected, city } = view;
  const markers = city.markers;
  const money = makeMoney(city.currency);
  const map = useMapViewport();
  const { vp } = map;
  const [showNames, setShowNames] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [topOnly, setTopOnly] = useState(false);
  const [hoverHotelId, setHoverHotelId] = useState<string | null>(null);

  const evals = new Map(result.status === 'ok' ? result.evaluations.map((e) => [e.hotelId, e]) : []);
  const contribs = new Map<string, Contribution>(inspected ? inspected.contributions.map((c) => [c.placeId, c]) : []);
  const maxValue = Math.max(1, ...[...contribs.values()].map((c) => c.value));
  const from = inspected ? markers[inspected.hotelId] : undefined;
  // "Top links" is a display filter only: the largest contributions, ties broken by place id.
  const topIds = new Set(
    [...contribs.values()]
      .sort((a, b) => b.value - a.value || (a.placeId < b.placeId ? -1 : 1))
      .slice(0, TOP_LINKS)
      .map((c) => c.placeId),
  );
  const linkShown = (placeId: string) => !topOnly || topIds.has(placeId);

  // Labels grow more slowly than the map when zooming, so zoomed-in views stay readable.
  const fs = (size: number) => size / Math.pow(vp.zoom, 0.55);
  const placeColor = (p: Place) => (p.type === 'attraction' ? '#7c3aed' : '#ea580c');
  const inspect = (id: string) => {
    if (!map.wasDragged()) onInspect(id);
  };

  let tip: { target: TipTarget; x: number; y: number } | null = null;
  if (hoverHotelId) {
    const h = scenario.hotels.find((x) => x.id === hoverHotelId);
    const pt = markers[hoverHotelId];
    if (h && pt) tip = { target: { kind: 'hotel', id: h.id, name: h.name, stayCost: h.stayCost, evaluation: evals.get(h.id), selected: h.id === inspectedId }, ...pt };
  } else if (hoverPlaceId) {
    const p = scenario.places.find((x) => x.id === hoverPlaceId);
    const pt = markers[hoverPlaceId];
    if (p && pt) tip = { target: { kind: 'place', place: p, contribution: contribs.get(p.id), fromHotel: inspected }, ...pt };
  }
  const tipLeft = tip ? ((tip.x - vp.x) / viewWidth(vp)) * 100 : 0;
  const tipTop = tip ? ((tip.y - vp.y) / viewHeight(vp)) * 100 : 0;
  const tipVisible = tip !== null && tipLeft > -4 && tipLeft < 104 && tipTop > -4 && tipTop < 104;

  return (
    <section aria-labelledby="map-title" className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="map-title" className="text-base font-semibold text-zinc-900">
          {city.name} schematic map
        </h2>
        <p className="text-xs text-zinc-500">Not to scale. Lines are comparison links, not routes.</p>
      </div>

      <div role="group" aria-label="Map layers" className="mt-3 flex flex-wrap gap-2">
        <Toggle pressed={showNames} onClick={() => setShowNames((v) => !v)} icon={<Tag className="size-3.5" aria-hidden />}>
          Names
        </Toggle>
        <Toggle pressed={showValues} onClick={() => setShowValues((v) => !v)} icon={<Hash className="size-3.5" aria-hidden />}>
          Link values
        </Toggle>
        <Toggle pressed={topOnly} onClick={() => setTopOnly((v) => !v)} icon={<ListFilter className="size-3.5" aria-hidden />}>
          Top {TOP_LINKS} links only
        </Toggle>
      </div>

      <div
        className="relative mt-3"
        onKeyDown={(e) => {
          if (e.key === '+' || e.key === '=') map.zoomBy(1.5);
          else if (e.key === '-' || e.key === '_') map.zoomBy(1 / 1.5);
          else if (e.key === '0') map.reset();
        }}
      >
        <svg
          ref={map.svgRef}
          viewBox={viewBoxOf(vp)}
          role="group"
          aria-label="Schematic map of 10 hotels and 15 wishlist places"
          data-zoom={vp.zoom.toFixed(2)}
          {...map.pointerHandlers}
          className={`block w-full touch-pan-y select-none rounded-lg ring-1 ring-zinc-500/20 ${vp.zoom > 1 ? (map.dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        >
          <MapBackdrop spec={city.backdrop} />

          {/* comparison links: only for the inspected hotel */}
          {inspected && from && (
            <g role="group" aria-label={`Comparison links from ${inspected.name}`}>
              {scenario.places.map((p) => {
                const to = markers[p.id];
                const c = contribs.get(p.id);
                if (!to || !c || !linkShown(p.id)) return null;
                const active = hoverPlaceId === p.id;
                const dim = hoverPlaceId !== null && !active;
                return (
                  <line
                    key={`${inspected.hotelId}:${p.id}`}
                    data-testid={`link-${p.id}`}
                    className="map-link"
                    pathLength={1}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={active ? '#4338ca' : '#6366f1'}
                    strokeOpacity={active ? 1 : dim ? 0.18 : 0.55}
                    strokeWidth={1.2 + (c.value / maxValue) * 4.5 + (active ? 1.5 : 0)}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          )}

          {/* places */}
          {scenario.places.map((p) => {
            const pt = markers[p.id]!;
            const c = contribs.get(p.id);
            const active = hoverPlaceId === p.id;
            const faded = topOnly && c && !topIds.has(p.id);
            const label = `${p.name}, ${p.type}, importance ${Number.isFinite(p.importance) ? p.importance : 'invalid'}${c ? `, round trip ${c.roundTripMinutes} minutes, contribution ${c.value}` : ''}`;
            return (
              <g
                key={p.id}
                data-testid={`place-${p.id}`}
                role="img"
                aria-label={label}
                onMouseEnter={() => onHoverPlace(p.id)}
                onMouseLeave={() => onHoverPlace(null)}
                opacity={faded ? 0.45 : 1}
                className="cursor-default"
              >
                {active && <circle cx={pt.x} cy={pt.y} r="19" fill={placeColor(p)} opacity="0.18" />}
                {p.type === 'attraction' ? (
                  <circle cx={pt.x} cy={pt.y} r={active ? 12 : 9} fill={placeColor(p)} style={{ stroke: 'var(--surface)' }} strokeWidth="2" />
                ) : (
                  <rect x={pt.x - 8} y={pt.y - 8} width="16" height="16" rx="3" transform={`rotate(45 ${pt.x} ${pt.y})`} fill={placeColor(p)} style={{ stroke: 'var(--surface)' }} strokeWidth="2" />
                )}
                {showNames && (
                  <text x={pt.x} y={pt.y + fs(26)} textAnchor="middle" fontSize={fs(13.5)} fontWeight={active ? 700 : 500} style={{ ...halo, fill: 'var(--map-ink)' }}>
                    {p.name}
                  </text>
                )}
                {showValues && c && linkShown(p.id) && (
                  <text x={pt.x} y={pt.y + fs(showNames ? 41 : 26)} textAnchor="middle" fontSize={fs(12.5)} fontWeight="600" style={{ ...halo, fill: 'var(--map-link-label)' }}>
                    {c.roundTripMinutes} min · ×{c.importance} = {c.value}
                  </text>
                )}
              </g>
            );
          })}

          {/* hotels */}
          {scenario.hotels.map((h: Hotel) => {
            const pt = markers[h.id]!;
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
                onClick={() => inspect(h.id)}
                onMouseEnter={() => setHoverHotelId(h.id)}
                onMouseLeave={() => setHoverHotelId(null)}
                onFocus={() => {
                  setHoverHotelId(h.id);
                  map.reveal(pt.x, pt.y);
                }}
                onBlur={() => setHoverHotelId(null)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    inspect(h.id);
                  }
                }}
                className="cursor-pointer outline-none focus-visible:[&>rect:nth-of-type(2)]:stroke-indigo-600"
              >
                {e?.status === 'RECOMMENDED' && <rect className="pulse-ring" x={pt.x - 18} y={pt.y - 14} width="36" height="28" rx="7" fill="none" stroke="#10b981" strokeWidth="2" aria-hidden />}
                <rect x={pt.x - 18} y={pt.y - 14} width="36" height="28" rx="7" fill="none" stroke={selected ? '#4f46e5' : 'transparent'} strokeWidth="3" />
                <rect x={pt.x - 15} y={pt.y - 11} width="30" height="22" rx="5" fill={st.fill} stroke={st.stroke} strokeWidth="2" strokeDasharray={e?.status === 'OVER_BUDGET' ? '4 3' : undefined} />
                <text x={pt.x} y={pt.y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={st.text}>
                  {st.glyph}
                </text>
                {showNames && (
                  <text x={pt.x} y={pt.y - fs(21)} textAnchor="middle" fontSize={fs(14.5)} fontWeight="700" style={{ ...halo, fill: 'var(--map-ink-strong)' }}>
                    {h.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {tip && tipVisible && <MapTooltip target={tip.target} money={money} leftPct={tipLeft} topPct={tipTop} />}

        <div role="group" aria-label="Map zoom" className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-lg border border-zinc-300 bg-surface/90 shadow-sm backdrop-blur">
          <button type="button" aria-label="Zoom in" onClick={() => map.zoomBy(1.5)} disabled={!map.canZoomIn} className={zoomBtn}>
            <Plus className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => map.zoomBy(1 / 1.5)} disabled={!map.canZoomOut} className={`${zoomBtn} border-t border-zinc-200`}>
            <Minus className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Reset map view" onClick={map.reset} disabled={!map.canZoomOut} className={`${zoomBtn} border-t border-zinc-200`}>
            <Locate className="size-4" aria-hidden />
          </button>
        </div>
        <p className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-surface/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600 backdrop-blur" aria-live="polite">
          {Math.round(vp.zoom * 100)}%
        </p>
      </div>

      <ul aria-label="Map legend" className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-600">
        <li className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="6" fill="#7c3aed" /></svg> Attraction</li>
        <li className="flex items-center gap-1.5"><svg width="14" height="14" aria-hidden><rect x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" fill="#ea580c" /></svg> Food stop</li>
        <li className="flex items-center gap-1.5"><span className="inline-flex h-4 w-6 items-center justify-center rounded text-[10px] font-bold" style={{ background: '#047857', color: '#fff' }}>★</span> Recommended</li>
        <li className="flex items-center gap-1.5"><span className="inline-flex h-4 w-6 items-center justify-center rounded text-[10px] font-bold" style={{ background: '#fbbf24', color: '#451a03' }}>2</span> Ranked (affordable)</li>
        <li className="flex items-center gap-1.5"><span className="inline-flex h-4 w-6 items-center justify-center rounded border border-dashed text-[10px] font-bold" style={{ background: '#f1f5f9', color: '#be123c', borderColor: '#e11d48' }}>✕</span> Over budget</li>
        <li className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-6 bg-indigo-500" /> Link of inspected hotel (thicker = larger contribution)</li>
      </ul>
      <p className="mt-2 text-xs text-zinc-500">Zoom with the buttons, + / − keys, or Ctrl/⌘ + scroll; drag to pan when zoomed. Hover or focus a marker for details.</p>
      {!inspected && <p className="mt-2 text-sm text-zinc-600">No links shown: there is no valid comparison to inspect.</p>}
    </section>
  );
}
