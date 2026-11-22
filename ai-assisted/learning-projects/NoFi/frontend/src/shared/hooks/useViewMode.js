import { useCallback, useEffect, useState } from "react";

// Phones get a list by default, tablets/desktops get a grid.
// A manual choice is remembered separately for each, so choosing "list" on a
// desktop never changes what a phone shows (and the other way around).
const MOBILE_QUERY = "(max-width: 767px)";
const STORAGE_KEYS = { mobile: "nofi-view-mobile", desktop: "nofi-view-desktop" };
const DEFAULT_MODE = { mobile: "list", desktop: "grid" };

function getDevice() {
  try {
    return window.matchMedia(MOBILE_QUERY).matches ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}

function readSaved(device) {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS[device]);
    return saved === "list" || saved === "grid" ? saved : null;
  } catch {
    return null;
  }
}

export function useViewMode() {
  const [device, setDevice] = useState(getDevice);
  const [saved, setSaved] = useState(() => ({
    mobile: readSaved("mobile"),
    desktop: readSaved("desktop"),
  }));

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setDevice(media.matches ? "mobile" : "desktop");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const viewMode = saved[device] ?? DEFAULT_MODE[device];

  const selectViewMode = useCallback((mode) => {
    setSaved((current) => ({ ...current, [device]: mode }));
    try {
      window.localStorage.setItem(STORAGE_KEYS[device], mode);
    } catch {
      // storage unavailable: the choice still applies for this session
    }
  }, [device]);

  return [viewMode, selectViewMode];
}

