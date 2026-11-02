import {
  FULL_VIEW, MAP_H, MAP_W, MAX_ZOOM, MIN_ZOOM, centerOn, isNearEdge, normalize, panBy, viewBoxOf, viewHeight, viewWidth, zoomAt, zoomCentered,
} from './mapViewport';

describe('map viewport maths', () => {
  it('starts on the whole map', () => {
    expect(viewBoxOf(FULL_VIEW)).toBe(`0 0 ${MAP_W} ${MAP_H}`);
  });

  it('zooming in halves the window and keeps the anchor point fixed on screen', () => {
    const v = zoomAt(FULL_VIEW, 2, 800, 300);
    expect(viewWidth(v)).toBe(500);
    expect(viewHeight(v)).toBe(320);
    // The anchor stays at the same fraction of the window as before (0.8, 300/640).
    expect((800 - v.x) / viewWidth(v)).toBeCloseTo(0.8);
    expect((300 - v.y) / viewHeight(v)).toBeCloseTo(300 / 640);
  });

  it('clamps zoom to its limits and the window to the map', () => {
    expect(zoomAt(FULL_VIEW, 0.1, 500, 320).zoom).toBe(MIN_ZOOM);
    let v = FULL_VIEW;
    for (let i = 0; i < 20; i++) v = zoomAt(v, 2, 999, 639);
    expect(v.zoom).toBe(MAX_ZOOM);
    expect(v.x + viewWidth(v)).toBeLessThanOrEqual(MAP_W);
    expect(v.y + viewHeight(v)).toBeLessThanOrEqual(MAP_H);
  });

  it('cannot pan the whole map (nothing to pan at zoom 1)', () => {
    expect(panBy(FULL_VIEW, 300, -200)).toEqual(FULL_VIEW);
  });

  it('pans a zoomed window but never off the map', () => {
    const z = zoomCentered(FULL_VIEW, 2);
    expect(panBy(z, 10_000, 10_000)).toMatchObject({ x: MAP_W - 500, y: MAP_H - 320 });
    expect(panBy(z, -10_000, -10_000)).toMatchObject({ x: 0, y: 0 });
  });

  it('zooming back out returns to the whole map from anywhere', () => {
    let v = zoomAt(FULL_VIEW, 4, 900, 540);
    v = zoomCentered(v, 0.01);
    expect(v).toEqual(FULL_VIEW);
  });

  it('normalize repairs out-of-range input', () => {
    expect(normalize({ x: -50, y: 900, zoom: 99 })).toEqual({ zoom: MAX_ZOOM, x: 0, y: MAP_H - MAP_H / MAX_ZOOM });
  });

  it('detects markers near or beyond the window edge, and recentres on them', () => {
    const z = zoomCentered(FULL_VIEW, 2); // window x 250..750, y 160..480
    expect(isNearEdge(z, 500, 320)).toBe(false);
    expect(isNearEdge(z, 260, 320)).toBe(true);
    expect(isNearEdge(z, 900, 320)).toBe(true);
    const c = centerOn(z, 900, 540);
    expect(isNearEdge(c, 900, 540)).toBe(false);
  });
});
