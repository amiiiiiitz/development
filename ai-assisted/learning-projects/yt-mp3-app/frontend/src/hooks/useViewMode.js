import { useCallback, useEffect, useState } from "react";

const VIEW_MODE_STORAGE_KEY = "nofi-view";
const VIEW_MODE_MANUAL_KEY = "nofi-view-manual";
const MOBILE_QUERY = "(max-width: 767px)";

function getResponsiveViewMode() {
  if (typeof window === "undefined") return "grid";
  try {
    return window.matchMedia(MOBILE_QUERY).matches ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function getInitialViewMode() {
  try {
    const isManual = window.localStorage.getItem(VIEW_MODE_MANUAL_KEY) === "1";
    if (isManual) {
      const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === "list" || saved === "grid") return saved;
    }
  } catch {
    // fall back to responsive default
  }
  return getResponsiveViewMode();
}

/**
 * Responsive view-mode hook.
 * Defaults to "list" on mobile (<768px) and "grid" on tablet/desktop,
 * unless the user has manually selected and saved a mode.
 */
export function useViewMode() {
  const [viewMode, setViewMode] = useState(getInitialViewMode);
  const [isManual, setIsManual] = useState(() => {
    try {
      return window.localStorage.getItem(VIEW_MODE_MANUAL_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia(MOBILE_QUERY);
    const applyResponsive = () => {
      if (isManual) return;
      setViewMode(media.matches ? "list" : "grid");
    };
    applyResponsive();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", applyResponsive);
    } else {
      media.addListener(applyResponsive);
    }
    window.addEventListener("resize", applyResponsive);
    return () => {
      window.removeEventListener("resize", applyResponsive);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", applyResponsive);
      } else {
        media.removeListener(applyResponsive);
      }
    };
  }, [isManual]);

  const selectViewMode = useCallback((mode) => {
    setViewMode(mode);
    setIsManual(true);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      window.localStorage.setItem(VIEW_MODE_MANUAL_KEY, "1");
    } catch {
      // ignore storage errors
    }
  }, []);

  return [viewMode, selectViewMode];
}
