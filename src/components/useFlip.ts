import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Presentation-only FLIP animation: when children of `ref` (marked `data-flip-id`) change position,
 * slide them from their old spot to the new one. Never touches data; a no-op without layout
 * (jsdom), without the Web Animations API, or with reduced motion.
 */
export function useFlip(ref: RefObject<HTMLElement | null>, orderKey: string): void {
  const previous = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-flip-id]'));
    const next = new Map<string, number>();
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const el of items) {
      const id = el.dataset.flipId!;
      const top = el.getBoundingClientRect().top;
      next.set(id, top);
      const before = previous.current.get(id);
      if (!reduced && before !== undefined && typeof el.animate === 'function') {
        const dy = before - top;
        if (Math.abs(dy) > 1) {
          el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
            duration: 380,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          });
        }
      }
    }
    previous.current = next;
  }, [ref, orderKey]);
}
