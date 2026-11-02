import { memo } from 'react';
import type { BackdropSpec } from '../data/cities';

/**
 * Decorative city backdrop for the schematic map, drawn from a city's `BackdropSpec`: block or grid
 * texture, parks, water, arterial roads, rivers with bridges, district names and a compass.
 * Purely presentational (aria-hidden): none of these shapes carries data, and distances on the map are
 * never used for travel times.
 */
function BackdropBase({ spec }: { spec: BackdropSpec }) {
  return (
    <g aria-hidden>
      <defs>
        <pattern id="map-blocks" width="56" height="56" patternUnits="userSpaceOnUse">
          <rect x="6" y="6" width="20" height="19" rx="4" style={{ fill: 'var(--map-block)' }} />
          <rect x="31" y="6" width="19" height="19" rx="4" style={{ fill: 'var(--map-block)' }} />
          <rect x="6" y="31" width="14" height="19" rx="4" style={{ fill: 'var(--map-block)' }} />
          <rect x="25" y="31" width="25" height="19" rx="4" style={{ fill: 'var(--map-block)' }} />
        </pattern>
        <pattern id="map-grid" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M 34 0 L 0 0 0 34" fill="none" strokeWidth="1.5" style={{ stroke: 'var(--map-block)' }} />
        </pattern>
      </defs>
      <rect width="1000" height="640" style={{ fill: 'var(--map-land)' }} />
      <rect width="1000" height="640" fill={spec.texture === 'grid' ? 'url(#map-grid)' : 'url(#map-blocks)'} />

      {spec.parks.map((d) => (
        <path key={d} d={d} style={{ fill: 'var(--map-park)', stroke: 'var(--map-park-edge)' }} strokeWidth="2" />
      ))}

      {/* lakes and sea: shore, then water */}
      {spec.water.map((d) => (
        <path key={d} d={d} strokeWidth="5" strokeLinejoin="round" style={{ fill: 'var(--map-river)', stroke: 'var(--map-shore)' }} />
      ))}

      {/* arterial roads: casing, then surface */}
      {spec.roads.map((d) => (
        <path key={`c${d}`} d={d} fill="none" strokeWidth="13" strokeLinecap="round" style={{ stroke: 'var(--map-road-edge)' }} />
      ))}
      {spec.roads.map((d) => (
        <path key={`r${d}`} d={d} fill="none" strokeWidth="9" strokeLinecap="round" style={{ stroke: 'var(--map-road)' }} />
      ))}

      {/* rivers: shore, water */}
      {spec.rivers.map((r) => (
        <g key={r.d} fill="none" strokeLinecap="round">
          <path d={r.d} strokeWidth={r.width + 8} style={{ stroke: 'var(--map-shore)' }} opacity="0.55" />
          <path d={r.d} strokeWidth={r.width} style={{ stroke: 'var(--map-river)' }} opacity="0.95" />
        </g>
      ))}

      {/* bridges over water */}
      {spec.bridges.map((d) => (
        <g key={d} fill="none">
          <path d={d} strokeWidth="13" style={{ stroke: 'var(--map-road-edge)' }} />
          <path d={d} strokeWidth="9" style={{ stroke: 'var(--map-road)' }} />
        </g>
      ))}

      {/* district and water names */}
      <g fontSize="11" fontWeight="700" letterSpacing="2.5" style={{ fill: 'var(--map-soft-label)' }}>
        {spec.labels.map((l) => (
          <text key={l.text} x={l.x} y={l.y} transform={l.rotate ? `rotate(${l.rotate} ${l.x} ${l.y})` : undefined}>
            {l.text}
          </text>
        ))}
      </g>

      {/* compass */}
      <g transform="translate(46 596)" style={{ stroke: 'var(--map-soft-label)', fill: 'none' }} strokeWidth="1.5">
        <circle r="20" />
        <path d="M 0 -15 L 5 4 L 0 0 L -5 4 Z" style={{ fill: 'var(--map-soft-label)' }} />
        <text y="-26" textAnchor="middle" fontSize="11" fontWeight="700" style={{ fill: 'var(--map-soft-label)', stroke: 'none' }}>N</text>
      </g>
    </g>
  );
}

export const MapBackdrop = memo(BackdropBase);
