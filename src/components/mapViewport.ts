/**
 * Pure pan/zoom maths for the schematic map. Presentation only: nothing here reads or affects
 * travel times, importance, budget or ranking. The map is a fixed 1000 x 640 coordinate space.
 */
export const MAP_W = 1000;
export const MAP_H = 640;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export interface Viewport {
  /** Top-left of the visible window, in map units. */
  readonly x: number;
  readonly y: number;
  /** Zoom factor: 1 shows the whole map. */
  readonly zoom: number;
}

export const FULL_VIEW: Viewport = Object.freeze({ x: 0, y: 0, zoom: 1 });

export const viewWidth = (v: Viewport): number => MAP_W / v.zoom;
export const viewHeight = (v: Viewport): number => MAP_H / v.zoom;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Keeps the window inside the map and the zoom inside its limits. */
export function normalize(v: Viewport): Viewport {
  const zoom = clamp(v.zoom, MIN_ZOOM, MAX_ZOOM);
  return {
    zoom,
    x: clamp(v.x, 0, MAP_W - MAP_W / zoom),
    y: clamp(v.y, 0, MAP_H - MAP_H / zoom),
  };
}

/** Zooms by `factor`, keeping the map point (cx, cy) fixed on screen. */
export function zoomAt(v: Viewport, factor: number, cx: number, cy: number): Viewport {
  const zoom = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const fx = (cx - v.x) / viewWidth(v);
  const fy = (cy - v.y) / viewHeight(v);
  return normalize({ zoom, x: cx - fx * (MAP_W / zoom), y: cy - fy * (MAP_H / zoom) });
}

/** Zooms about the centre of the current window. */
export function zoomCentered(v: Viewport, factor: number): Viewport {
  return zoomAt(v, factor, v.x + viewWidth(v) / 2, v.y + viewHeight(v) / 2);
}

/** Pans by map units. */
export function panBy(v: Viewport, dx: number, dy: number): Viewport {
  return normalize({ ...v, x: v.x + dx, y: v.y + dy });
}

/** True when the point sits within `margin` map units of the window edge or outside it. */
export function isNearEdge(v: Viewport, px: number, py: number, margin = 40): boolean {
  return (
    px < v.x + margin ||
    px > v.x + viewWidth(v) - margin ||
    py < v.y + margin ||
    py > v.y + viewHeight(v) - margin
  );
}

/** Recentres the window on a point (used when keyboard focus lands on an off-screen marker). */
export function centerOn(v: Viewport, px: number, py: number): Viewport {
  return normalize({ ...v, x: px - viewWidth(v) / 2, y: py - viewHeight(v) / 2 });
}

/** The SVG viewBox string for a viewport. */
export const viewBoxOf = (v: Viewport): string => `${v.x} ${v.y} ${viewWidth(v)} ${viewHeight(v)}`;
