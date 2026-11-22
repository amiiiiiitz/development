import { useCallback, useEffect, useRef, useState } from "react";
import { importLibraryMetadata } from "../../db.js";
import { prepareImport, validateBackup } from "../../shared/utils/libraryBackup.js";
import { AUDIO_CACHE_NAME, COVER_CACHE_NAME, audioCacheRequest } from "../../shared/constants/storage.js";
import { cleanTrackTitle } from "../../shared/utils/trackFormatting.js";

export function useLibraryBackup({ tracks, folders, refreshLibrary, setError, setNotice }) {
  const [storageInfo, setStorageInfo] = useState({
    supported: false,
    persistent: null,
    usage: 0,
    quota: 0,
  });
  const [pendingImport, setPendingImport] = useState(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    const loadStorage = async () => {
      if (!navigator.storage) return;
      try {
        if (navigator.storage.persist) {
          const persisted = await navigator.storage.persist();
          setStorageInfo((info) => ({ ...info, supported: true, persistent: persisted }));
        }
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          setStorageInfo((info) => ({
            ...info,
            supported: true,
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            persistent: info.persistent ?? null,
          }));
        }
      } catch {
        setError("Could not read storage information.");
      }
    };
    void loadStorage();
  }, [setError]);

  const isAudioCached = async (trackId) => {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const response = await cache.match(audioCacheRequest(trackId));
      return Boolean(response && response.ok);
    } catch {
      return false;
    }
  };

  const exportLibrary = () => {
    const data = { version: 1, exportedAt: Date.now(), tracks, folders };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nofi-library-backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice("Library exported.");
  };

  const downloadTrackFile = async (track) => {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const response = await cache.match(audioCacheRequest(track.id));
      if (!response) {
        setError("This song is not saved offline.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cleanTrackTitle(track.title)}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || "Could not download this song.");
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) {
        throw new Error("This backup file is too large to import.");
      }
      const text = await file.text();
      const data = JSON.parse(text);
      const { tracks: validTracks, folders: validFolders } = validateBackup(data);
      setPendingImport({ ...data, tracks: validTracks, folders: validFolders });
    } catch (importError) {
      setError(importError.message || "Could not read this backup file.");
    } finally {
      event.target.value = "";
    }
  };

  const applyImport = async (mode) => {
    if (!pendingImport) return;
    if (mode === "replace") {
      const confirmed = window.confirm(
        `Replace the library on this device with this backup (${pendingImport.tracks.length} tracks, ${pendingImport.folders.length} folders)?\n\n` +
          `Your current ${tracks.length} tracks and ${folders.length} folders will be removed from the list. ` +
          "Downloaded audio stays on this device, but tracks that are not in the backup will no longer be listed.\n\n" +
          "Tip: press Cancel and use Export first if you want a copy of your current library."
      );
      if (!confirmed) return;
    }
    setError("");
    try {
      const prepared = await prepareImport(pendingImport, isAudioCached);
      await importLibraryMetadata({
        tracks: prepared.tracks,
        folders: prepared.folders,
        replace: mode === "replace",
      });
      await refreshLibrary();
      setPendingImport(null);
      setNotice(mode === "replace" ? "Library replaced from backup." : "Library merged from backup.");
    } catch (importError) {
      setError(importError.message || "Could not import this library. Your existing library was not changed.");
    }
  };

  const fetchMissingCovers = useCallback(async () => {
    if (!navigator.onLine) {
      setNotice("You're offline. Reconnect to fetch covers.");
      return;
    }
    setError("");
    setNotice("Fetching missing covers…");
    let updated = 0;
    for (const track of tracks) {
      if (!track.thumbnail) continue;
      try {
        const cache = await caches.open(COVER_CACHE_NAME);
        const request = new Request(new URL(`/cover/${encodeURIComponent(track.id)}`, window.location.origin));
        const existing = await cache.match(request);
        if (existing) continue;
        const response = await fetch(track.thumbnail);
        if (response.ok) {
          await cache.put(request, response.clone());
          updated += 1;
        }
      } catch {
        // Ignore individual cover failures.
      }
    }
    setNotice(updated ? `Fetched ${updated} cover${updated === 1 ? "" : "s"}.` : "No new covers to fetch.");
  }, [tracks, setError, setNotice]);

  return {
    storageInfo,
    pendingImport,
    setPendingImport,
    importInputRef,
    exportLibrary,
    downloadTrackFile,
    handleImportFile,
    applyImport,
    fetchMissingCovers,
  };
}


