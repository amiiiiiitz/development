import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteFolder as deleteFolderFromDB,
  deleteTrackMetadata,
  getAllFolders,
  getAllTracksMetadata,
  saveFolder,
  updateTrackMetadata,
} from "../../db.js";
import { AUDIO_CACHE_NAME, audioCacheRequest } from "../../shared/constants/storage.js";
import {
  cleanTrackTitle,
  createTrackId,
  normalizeSearchText,
} from "../../shared/utils/trackFormatting.js";

export function useLibrary({
  currentTrack,
  setCurrentTrack,
  audioRef,
  selectTrack,
  setIsPlaying,
  queueRemoveFromQueue,
  flushTrackStats,
  pendingStatsRef,
  completedPlaysRef,
  updatePlaybackDisplay,
  setError,
  setNotice,
}) {
  const [tracks, setTracks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTrackId, setRenameTrackId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [sortBy, setSortBy] = useState(() => {
    const saved = window.localStorage.getItem("nofi-sort");
    return saved === "recent" || !saved ? "newest" : saved;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("nofi-sort", sortBy);
    } catch {
      // Ignore storage errors.
    }
  }, [sortBy]);

  const refreshLibrary = useCallback(async () => {
    try {
      const [savedTracks, savedFolders] = await Promise.all([
        getAllTracksMetadata(),
        getAllFolders(),
      ]);
      setTracks(savedTracks);
      setFolders(savedFolders);
    } catch (loadError) {
      setError(loadError.message || "Could not load the offline library.");
    }
  }, [setError]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const toggleFavorite = async (track) => {
    setError("");
    try {
      const updatedTrack = await updateTrackMetadata(track.id, { favorite: !track.favorite });
      setTracks((existing) => existing.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      setNotice(
        updatedTrack.favorite
          ? `Added "${cleanTrackTitle(updatedTrack.title)}" to favorites.`
          : `Removed "${cleanTrackTitle(updatedTrack.title)}" from favorites.`
      );
    } catch (err) {
      setError(err.message || "Could not update this favorite.");
    }
  };

  const beginRenameTrack = (track) => {
    setRenameTrackId(track.id);
    setRenameDraft(cleanTrackTitle(track.title));
    setError("");
  };

  const renameTrack = async (event, track) => {
    event.preventDefault();
    const title = cleanTrackTitle(renameDraft);
    if (!title) {
      setError("Enter a name for this song.");
      return;
    }
    setError("");
    try {
      const updatedTrack = await updateTrackMetadata(track.id, { title });
      setTracks((existing) => existing.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      setRenameTrackId(null);
      setRenameDraft("");
      setNotice(`Renamed to "${title}".`);
    } catch (err) {
      setError(err.message || "Could not rename this song.");
    }
  };

  const updatePlayCountLimit = async (track, value) => {
    setError("");
    const playCountLimit = value === "forever" ? "forever" : Number(value);
    try {
      const updatedTrack = await updateTrackMetadata(track.id, { playCountLimit });
      setTracks((existing) => existing.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      if (currentTrack?.id === updatedTrack.id) {
        completedPlaysRef.current = { trackId: updatedTrack.id, count: 0 };
      }
      setNotice(`Play limit updated for "${cleanTrackTitle(updatedTrack.title)}".`);
    } catch (err) {
      setError(err.message || "Could not update this song's play count.");
    }
  };

  const createFolder = async (event) => {
    event.preventDefault();
    const name = newFolderName.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (folders.some((f) => normalizeSearchText(f.name) === normalizeSearchText(name))) {
      setError("A folder with that name already exists.");
      return;
    }
    setError("");
    const folder = { id: createTrackId(), name, createdAt: Date.now() };
    try {
      await saveFolder(folder);
      setFolders((existing) =>
        [...existing, folder].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
        )
      );
      setActiveFolderId("all");
      setNewFolderName("");
      setIsCreatingFolder(false);
      setFavoritesOnly(false);
      setNotice(`Created "${name}". Assign songs with the folder menu in each track.`);
    } catch (err) {
      setError(err.message || "Could not create this folder.");
    }
  };

  const removeFolder = async (folder) => {
    setError("");
    try {
      await deleteFolderFromDB(folder.id);
      setFolders((existing) => existing.filter((f) => f.id !== folder.id));
      setTracks((existing) =>
        existing.map((t) => (t.folderId === folder.id ? { ...t, folderId: null } : t))
      );
      setActiveFolderId((id) => (id === folder.id ? "all" : id));
      setNotice(`Deleted "${folder.name}". Its songs are now unfiled.`);
    } catch (err) {
      setError(err.message || "Could not delete this folder.");
    }
  };

  const moveTrackToFolder = async (track, folderId) => {
    setError("");
    try {
      const updatedTrack = await updateTrackMetadata(track.id, { folderId: folderId || null });
      setTracks((existing) => existing.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      const destination = folders.find((f) => f.id === updatedTrack.folderId)?.name || "Unfiled";
      setNotice(`Moved "${cleanTrackTitle(updatedTrack.title)}" to ${destination}.`);
    } catch (err) {
      setError(err.message || "Could not move this song.");
    }
  };

  const removeTrack = async (track) => {
    setError("");
    try {
      if (currentTrack?.id === track.id) {
        audioRef.current?.pause();
      }
      await flushTrackStats(track.id);
      const cache = await caches.open(AUDIO_CACHE_NAME);
      await cache.delete(audioCacheRequest(track.id));
      await deleteTrackMetadata(track.id);
      setTracks((existing) => existing.filter((t) => t.id !== track.id));
      queueRemoveFromQueue(track.id);
      if (currentTrack?.id === track.id) {
        audioRef.current?.pause();
        selectTrack(null, false);
        setIsPlaying(false);
        updatePlaybackDisplay(0, 0);
      }
      setNotice("Track removed from your offline library.");
    } catch (err) {
      setError(err.message || "Could not remove this track.");
    }
  };

  const sortedVisibleTracks = useMemo(() => {
    const searchTerms = normalizeSearchText(searchQuery).split(" ").filter(Boolean);
    const visible = tracks.filter((track) => {
      if (activeFolderId !== "all" && (track.folderId || "unfiled") !== activeFolderId) {
        return false;
      }
      if (favoritesOnly && !track.favorite) {
        return false;
      }
      const searchableText = normalizeSearchText(
        `${track.title || ""} ${track.uploader || ""} ${track.videoId || ""}`
      );
      return searchTerms.every((term) => searchableText.includes(term));
    });

    return [...visible].sort((a, b) => {
      if (sortBy === "newest" || sortBy === "recent") return (b.savedAt || 0) - (a.savedAt || 0);
      if (sortBy === "mostPlayed") return (b.playCount || 0) - (a.playCount || 0);
      if (sortBy === "az") return cleanTrackTitle(a.title || "").localeCompare(cleanTrackTitle(b.title || ""));
      if (sortBy === "durationAsc") return (a.duration || 0) - (b.duration || 0);
      if (sortBy === "durationDesc") return (b.duration || 0) - (a.duration || 0);
      return 0;
    });
  }, [tracks, activeFolderId, favoritesOnly, searchQuery, sortBy]);

  const unfiledCount = useMemo(
    () => tracks.filter((track) => !track.folderId).length,
    [tracks]
  );

  return {
    tracks,
    setTracks,
    folders,
    activeFolderId,
    setActiveFolderId,
    favoritesOnly,
    setFavoritesOnly,
    searchQuery,
    setSearchQuery,
    isCreatingFolder,
    setIsCreatingFolder,
    newFolderName,
    setNewFolderName,
    renameTrackId,
    renameDraft,
    setRenameDraft,
    sortBy,
    setSortBy,
    sortedVisibleTracks,
    unfiledCount,
    refreshLibrary,
    toggleFavorite,
    beginRenameTrack,
    renameTrack,
    cancelRenameTrack: () => {
      setRenameTrackId(null);
      setRenameDraft("");
    },
    updatePlayCountLimit,
    createFolder,
    removeFolder,
    moveTrackToFolder,
    removeTrack,
  };
}


