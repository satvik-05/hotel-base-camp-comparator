import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { FULL_VIEW, MAX_ZOOM, MIN_ZOOM, centerOn, isNearEdge, panBy, viewHeight, viewWidth, zoomAt, zoomCentered, type Viewport } from './mapViewport';

const prefersReducedMotion = (): boolean => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Drag {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly origin: Viewport;
  moved: boolean;
}

/**
 * Pan/zoom state for the map: buttons, Ctrl/Cmd + wheel (and trackpad pinch), drag to pan, and
 * recentring when keyboard focus lands on an off-screen marker. Presentation only.
 */
export function useMapViewport() {
  const [vp, setVp] = useState<Viewport>(FULL_VIEW);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const vpRef = useRef(vp);
  const raf = useRef(0);
  const drag = useRef<Drag | null>(null);
  const justDragged = useRef(false);

  const set = useCallback((v: Viewport) => {
    cancelAnimationFrame(raf.current);
    vpRef.current = v;
    setVp(v);
  }, []);

  const animateTo = useCallback(
    (target: Viewport) => {
      if (prefersReducedMotion()) return set(target);
      cancelAnimationFrame(raf.current);
      const from = vpRef.current;
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 260);
        const e = 1 - Math.pow(1 - k, 3);
        const v = k === 1 ? target : { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, zoom: from.zoom + (target.zoom - from.zoom) * e };
        vpRef.current = v;
        setVp(v);
        if (k < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [set],
  );

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /** Client pixel -> map units, using the current window. */
  const toMap = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const v = vpRef.current;
    if (!rect || rect.width === 0) return { x: v.x + viewWidth(v) / 2, y: v.y + viewHeight(v) / 2 };
    return { x: v.x + ((clientX - rect.left) / rect.width) * viewWidth(v), y: v.y + ((clientY - rect.top) / rect.height) * viewHeight(v) };
  }, []);

  // Ctrl/Cmd + wheel (also what trackpad pinch sends) zooms at the cursor; plain scroll still scrolls the page.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const at = toMap(e.clientX, e.clientY);
      set(zoomAt(vpRef.current, Math.exp(-e.deltaY * 0.01), at.x, at.y));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [set, toMap]);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || vpRef.current.zoom <= MIN_ZOOM) return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origin: vpRef.current, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 5) return;
      d.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const unit = viewWidth(d.origin) / rect.width;
    set(panBy(d.origin, -dx * unit, -dy * unit));
  };
  const endDrag = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.moved) {
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false), 0);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
    setDragging(false);
  };

  return {
    vp,
    svgRef,
    dragging,
    canZoomIn: vp.zoom < MAX_ZOOM - 0.001,
    canZoomOut: vp.zoom > MIN_ZOOM + 0.001,
    zoomBy: (factor: number) => animateTo(zoomCentered(vpRef.current, factor)),
    reset: () => animateTo(FULL_VIEW),
    /** Recentres on a marker the user focused with the keyboard if it is at or past the window edge. */
    reveal: (x: number, y: number) => {
      if (isNearEdge(vpRef.current, x, y)) animateTo(centerOn(vpRef.current, x, y));
    },
    /** True right after a drag, so the click that ends it does not also inspect a hotel. */
    wasDragged: () => justDragged.current,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag },
  };
}
