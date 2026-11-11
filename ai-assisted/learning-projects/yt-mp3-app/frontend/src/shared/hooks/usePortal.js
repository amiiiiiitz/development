import { useCallback, useEffect, useRef } from "react";

/**
 * Attaches children to a React portal attached to document.body.
 * Used so elements escape any overflow-clipped/stacking-context ancestor
 * (e.g. the page shell's overflow clip) on desktop.
 */
export function usePortal() {
  const elRef = useRef(null);

  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  const attach = useCallback(() => {
    const el = elRef.current;
    document.body.appendChild(el);
    return () => document.body.removeChild(el);
  }, []);

  useEffect(() => {
    return attach();
  }, [attach]);

  return elRef.current;
}
