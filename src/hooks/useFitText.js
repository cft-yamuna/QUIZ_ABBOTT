import { useLayoutEffect } from 'react';

/*
 * Steps the font size down until the element is no taller than maxHeight.
 * The design is set in Indeed Sans; with Inter standing in, longer talent
 * titles would otherwise spill out of the magenta band. Re-runs once web
 * fonts finish loading, since the fallback font measures differently.
 */
export function useFitText(ref, { max, min, maxHeight }, deps) {
  useLayoutEffect(() => {
    let cancelled = false;

    function fit() {
      const element = ref.current;
      if (!element || cancelled) return;

      let size = max;
      element.style.fontSize = `${size}px`;

      while (element.offsetHeight > maxHeight && size > min) {
        size -= 2;
        element.style.fontSize = `${size}px`;
      }
    }

    fit();
    document.fonts?.ready.then(fit);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
