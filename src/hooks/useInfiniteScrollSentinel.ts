import { useEffect, useRef } from 'react';

interface Options {
  /** Called when the sentinel scrolls into view and more pages are available. */
  onIntersect: () => void;
  enabled: boolean;
  rootMargin?: string;
}

/**
 * Attaches an IntersectionObserver to the returned ref. When the sentinel enters
 * the viewport and `enabled` is true, `onIntersect` fires to load the next page.
 */
export function useInfiniteScrollSentinel<T extends Element>({
  onIntersect,
  enabled,
  rootMargin = '320px',
}: Options) {
  const ref = useRef<T | null>(null);
  // Keep the latest callback without re-creating the observer each render.
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callbackRef.current();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return ref;
}
