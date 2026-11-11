import { useCallback, useEffect, useRef, useState } from "react";
import {
  ListMusic,
  Music2,
  X,
} from "lucide-react";
import { AppShell } from "./app/shell/AppShell.jsx";
import { PageShell, useAudioPlaying } from "./app/shell/ui.jsx";
import {
  deleteTrackMetadata,
  deleteFolder as deleteFolderFromDB,
  getAllFolders,
  getAllTracksMetadata,
  getResumePosition,
  incrementTrackStats,
  saveFolder,
  saveResumePosition,
  saveTrackMetadata,
  updateTrackMetadata,
} from "./db.js";
import useOnlineStatus from "./shared/hooks/useOnlineStatus.js";
import { convertVideoToAudio, fetchVideoInfo } from "./shared/services/videoApi.js";
import {
  cleanTrackTitle,
  createTrackId,
  formatDuration,
  normalizeSearchText,
} from "./shared/utils/trackFormatting.js";
import ConverterView from "./pages/add-song/ConverterView.jsx";
import HomeView from "./pages/home/HomeView.jsx";
import LibraryView from "./pages/library/LibraryView.jsx";
import NowPlayingView from "./pages/now-playing/NowPlayingView.jsx";
import PersonalizationModal from "./pages/settings/PersonalizationModal.jsx";
import PlayerDock from "./shared/components/PlayerDock.jsx";
import QueueDrawer from "./shared/components/QueueDrawer.jsx";
import SettingsView from "./pages/settings/SettingsView.jsx";
import { useAudio } from "./features/audio/index.jsx";
import { useQueue } from "./features/queue/useQueue.jsx";
import { usePlayback, useMediaSession } from "./features/playback";

const PERSONALIZATION_NAME_KEY = "nofi-personalization-name";
const PERSONALIZATION_STATUS_KEY = "nofi-personalization-status";
const LEGACY_SIGNATURE_KEY = "nofi-library-signature";
const MAX_PERSONALIZATION_NAME_LENGTH = 32;

function normalizePersonalizationName(value) {
  if (typeof value !== "string") {
    return "";
  }
  return Array.from(value.trim().replace(/\s+/gu, " "))
    .slice(0, MAX_PERSONALIZATION_NAME_LENGTH)
    .join("");
}

/**
 * Picks a random index from `items`, excluding `excludeIndex`.
 * Returns -1 when there is no valid candidate (e.g. a single-item list).
 */
function pickShuffleIndex(items, excludeIndex) {
  const candidates = items.map((_, index) => index).filter((index) => index !== excludeIndex);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : -1;
}

const COVER_CACHE_NAME = "nofi-cover-cache-v1";
const AUDIO_CACHE_NAME = "mp3-offline-cache-v1";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [renameTrackId, setRenameTrackId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [isPersonalizationReady, setIsPersonalizationReady] = useState(false);
  const [hasCompletedPersonalization, setHasCompletedPersonalization] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const isOnline = useOnlineStatus()

// Media Session API integration - extracted to useMediaSession hook
// Call once inside App which is a descendant of PlaybackProvider
useMediaSession();
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sortBy, setSortBy] = useState(() => {
    const saved = window.localStorage.getItem("nofi-sort");
    // "recent" is the legacy label for the newest-first sort.
    return saved === "recent" || !saved ? "newest" : saved;
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("nofi-sort", sortBy);
    } catch {
      // Ignore storage errors.
    }
  }, [sortBy]);
  const [backendReady, setBackendReady] = useState(true);
  const transitionGuardRef = useRef(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const resumeRestoredRef = useRef(false);

  const { queueIds, queueIndex, setQueueIndex, addToQueue, removeFromQueue: queueRemoveFromQueue, clearQueue } = useQueue();
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    isShuffle,
    repeatMode,
    autoPlay,
    playbackError,
    setCurrentTrack,
    setIsPlaying,
    setDuration,
    setIsShuffle,
    setAutoPlay,
    selectTrack,
    playRelativeTrack,
    registerTrackNavigator,
    cycleRepeatMode,
    seekTo,
  } = usePlayback();
  const {
    audioRef,
    audioSource,
    audioError,
    isPreparingAudio,
    volume,
    playbackRate,
    setVolume,
    setPlaybackRate,
    audioHandlersRef,
  } = useAudio();
  useEffect(() => {
    if (audioError) {
      setError(audioError.message || "Could not load this song from offline storage.");
    }
  }, [audioError]);
  useEffect(() => {
    if (playbackError) {
      setError(playbackError.message || "Could not play this track.");
    }
  }, [playbackError]);
  const [storageInfo, setStorageInfo] = useState({ supported: false, persistent: null, usage: 0, quota: 0 });
  const [pendingImport, setPendingImport] = useState(null);
  const importInputRef = useRef(null);
  const playerBarProgressRef = useRef(null);
  const playerBarCurrentTimeRef = useRef(null);
  const playerBarDurationRef = useRef(null);
  const playing = useAudioPlaying(audioRef);
  const currentTimeRef = useRef(0);
  const playerProgressRef = useRef(null);
  const playerCurrentTimeRef = useRef(null);
  const playerRemainingTimeRef = useRef(null);
  const inlineProgressRef = useRef(null);
  const inlineCurrentTimeRef = useRef(null);
  const inlineDurationRef = useRef(null);
  const completedPlaysRef = useRef({ trackId: null, count: 0 });
  const playSessionCountedRef = useRef(false);
  const activePlaybackTrackIdRef = useRef(null);
  const lastPlaybackPositionRef = useRef(0);
  const pendingStatsRef = useRef(new Map());
  const statsWritesInFlightRef = useRef(new Set());
  const appCurrentTime = currentTimeRef.current;

  const updatePlaybackDisplay = (playbackPosition, trackDuration = duration || currentTrack?.duration || 0) => {
    currentTimeRef.current = playbackPosition;
    const progress = trackDuration ? Math.min(100, (playbackPosition / trackDuration) * 100) : 0;
    const remainingTime = Math.max(0, trackDuration - playbackPosition);
    if (playerProgressRef.current) {
      playerProgressRef.current.value = String(Math.min(playbackPosition, trackDuration));
      playerProgressRef.current.style.setProperty("--progress", `${progress}%`);
    }
    if (playerCurrentTimeRef.current) {
      playerCurrentTimeRef.current.textContent = formatDuration(playbackPosition);
    }
    if (playerRemainingTimeRef.current) {
      playerRemainingTimeRef.current.textContent = `−${formatDuration(remainingTime)}`;
    }
    if (playerBarProgressRef.current) {
      playerBarProgressRef.current.value = String(progress);
      playerBarProgressRef.current.style.setProperty("--p", `${progress}%`);
    }
    if (playerBarCurrentTimeRef.current) {
      playerBarCurrentTimeRef.current.textContent = formatDuration(playbackPosition);
    }
    if (playerBarDurationRef.current) {
      playerBarDurationRef.current.textContent = formatDuration(trackDuration);
    }
    if (inlineProgressRef.current) {
      inlineProgressRef.current.value = String(Math.min(playbackPosition, trackDuration));
      inlineProgressRef.current.style.setProperty("--progress", `${progress}%`);
    }
    if (inlineCurrentTimeRef.current) {
      inlineCurrentTimeRef.current.textContent = formatDuration(playbackPosition);
    }
    if (inlineDurationRef.current) {
      inlineDurationRef.current.textContent = formatDuration(trackDuration);
    }
  };

  const flushTrackStats = async (trackId) => {
    const ids = trackId ? [trackId] : [...pendingStatsRef.current.keys()];
    await Promise.all(ids.map(async (id) => {
      const pending = pendingStatsRef.current.get(id);
      if (!pending || statsWritesInFlightRef.current.has(id) || (!pending.playCount && !pending.listenSeconds)) {
        return;
      }

      const snapshot = { ...pending };
      statsWritesInFlightRef.current.add(id);
      try {
        const updatedTrack = await incrementTrackStats(id, snapshot.playCount, snapshot.listenSeconds);
        const remaining = pendingStatsRef.current.get(id);
        if (remaining) {
          remaining.playCount = Math.max(0, remaining.playCount - snapshot.playCount);
          remaining.listenSeconds = Math.max(0, remaining.listenSeconds - snapshot.listenSeconds);
          if (!remaining.playCount && remaining.listenSeconds < 0.001) {
            pendingStatsRef.current.delete(id);
          }
        }
        setTracks((existingTracks) =>
          existingTracks.map((track) => (track.id === updatedTrack.id ? updatedTrack : track))
        );
        setCurrentTrack((track) => (track?.id === updatedTrack.id ? updatedTrack : track));
      } catch (statsError) {
        setError(statsError.message || "Could not save listening statistics.");
      } finally {
        statsWritesInFlightRef.current.delete(id);
      }
    }));
  };

  const updatePlayCountLimit = async (track, value) => {
    setError("");
    const playCountLimit = value === "forever" ? "forever" : Number(value);
    try {
      const updatedTrack = await updateTrackMetadata(track.id, { playCountLimit });
      setTracks((existingTracks) =>
        existingTracks.map((item) => (item.id === updatedTrack.id ? updatedTrack : item))
      );
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      if (currentTrack?.id === updatedTrack.id) {
        completedPlaysRef.current = { trackId: updatedTrack.id, count: 0 };
      }
      setNotice(`Play limit updated for "${cleanTrackTitle(updatedTrack.title)}".`);
    } catch (playCountError) {
      setError(playCountError.message || "Could not update this song's play count.");
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
      setTracks((existingTracks) =>
        existingTracks.map((item) => (item.id === updatedTrack.id ? updatedTrack : item))
      );
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      setRenameTrackId(null);
      setRenameDraft("");
      setNotice(`Renamed to "${title}".`);
    } catch (renameError) {
      setError(renameError.message || "Could not rename this song.");
    }
  };

  const savePersonalization = (value) => {
    const name = normalizePersonalizationName(value);
    if (!name) {
      setError("Enter a name for your signature.");
      return false;
    }
    try {
      window.localStorage.setItem(PERSONALIZATION_NAME_KEY, name);
      window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "personalized");
      setSignatureName(name);
      setHasCompletedPersonalization(true);
      setError("");
      setNotice("Your signature has been saved.");
      return true;
    } catch (storageError) {
      setError(storageError.message || "Could not save your signature in this browser.");
      return false;
    }
  };

  const clearPersonalization = () => {
    try {
      window.localStorage.removeItem(PERSONALIZATION_NAME_KEY);
      window.localStorage.removeItem(LEGACY_SIGNATURE_KEY);
      window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "skipped");
      setSignatureName("");
      setHasCompletedPersonalization(true);
      setError("");
      setNotice("Your default signature has been restored.");
      return true;
    } catch (storageError) {
      setError(storageError.message || "Could not clear your saved signature.");
      return false;
    }
  };

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const skipPersonalization = () => {
    try {
      window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "skipped");
      window.localStorage.removeItem(PERSONALIZATION_NAME_KEY);
      window.localStorage.removeItem(LEGACY_SIGNATURE_KEY);
      setSignatureName("");
      setHasCompletedPersonalization(true);
      setError("");
      setShowPersonalization(false);
    } catch (storageError) {
      setError(storageError.message || "Could not save your personalization preference.");
    }
  };

  const closePersonalization = () => {
    setShowPersonalization(false);
  };

  const openPersonalization = () => {
    setError("");
    setShowPersonalization(true);
  };

  const recordTrackPlay = (trackId) => {
    if (playSessionCountedRef.current) {
      return;
    }

    playSessionCountedRef.current = true;
    const pending = pendingStatsRef.current.get(trackId) || { playCount: 0, listenSeconds: 0 };
    pending.playCount += 1;
    pendingStatsRef.current.set(trackId, pending);
    void flushTrackStats(trackId);
  };

  const recordPlaybackTime = (audio, trackId = activePlaybackTrackIdRef.current) => {
    const playbackPosition = audio.currentTime;
    const elapsed = playbackPosition - lastPlaybackPositionRef.current;
    lastPlaybackPositionRef.current = playbackPosition;
    if (currentTrack?.id === trackId) {
      updatePlaybackDisplay(playbackPosition);
    }


    if (isPlaying && elapsed > 0 && trackId) {
      const pending = pendingStatsRef.current.get(trackId) || { playCount: 0, listenSeconds: 0 };
      pending.listenSeconds += elapsed;
      pendingStatsRef.current.set(trackId, pending);
      if (pending.listenSeconds >= 15) {
        void flushTrackStats(trackId);
      }
    }
  };

  const appSelectTrack = (track, shouldPlay = true) => {
    if (currentTrack && currentTrack.id !== track.id) {
      void flushTrackStats(currentTrack.id);
    }
    playSessionCountedRef.current = false;
    lastPlaybackPositionRef.current = 0;
    completedPlaysRef.current = { trackId: track.id, count: 0 };
    selectTrack(track, shouldPlay);
    updatePlaybackDisplay(0, Number.isFinite(track.duration) ? track.duration : 0);
  };

  const appPlayRelativeTrack = (direction, { wrap = false } = {}) => {
    if (queueIds.length) {
      if (direction > 0) {
        let nextIndex = -1;
        if (isShuffle && queueIds.length > 1) {
          nextIndex = pickShuffleIndex(queueIds, queueIndex);
        } else {
          nextIndex = queueIndex + 1;
          if (nextIndex >= queueIds.length) {
            if (repeatMode === "all") {
              nextIndex = 0;
            } else {
              return;
            }
          }
        }
        const nextTrack = tracks.find((track) => track.id === queueIds[nextIndex]);
        if (nextTrack) {
          setQueueIndex(nextIndex);
          appSelectTrack(nextTrack);
        }
        return;
      }

      if (queueIndex > 0) {
        const previousTrack = tracks.find((track) => track.id === queueIds[queueIndex - 1]);
        if (previousTrack) {
          setQueueIndex(queueIndex - 1);
          appSelectTrack(previousTrack);
        }
        return;
      }

      if (currentTrack) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
        }
      }
      return;
    }

    const playlist = activeFolderId === "all"
      ? tracks
      : tracks.filter((track) => (track.folderId || "unfiled") === activeFolderId);
    const filteredPlaylist = favoritesOnly
      ? playlist.filter((track) => track.favorite)
      : playlist;
    if (!filteredPlaylist.length) {
      return;
    }

    const currentIndex = filteredPlaylist.findIndex((track) => track.id === currentTrack?.id);
    let nextIndex;
    if (isShuffle && direction > 0 && filteredPlaylist.length > 1) {
      nextIndex = pickShuffleIndex(filteredPlaylist, currentIndex);
    } else if (currentIndex === -1) {
      nextIndex = direction > 0 ? 0 : filteredPlaylist.length - 1;
    } else if (!wrap && (currentIndex + direction < 0 || currentIndex + direction >= filteredPlaylist.length)) {
      return;
    } else {
      nextIndex = (currentIndex + direction + filteredPlaylist.length) % filteredPlaylist.length;
    }
    appSelectTrack(filteredPlaylist[nextIndex]);
  };

  useEffect(
    () => registerTrackNavigator(appPlayRelativeTrack),
    [registerTrackNavigator, appPlayRelativeTrack]
  );

  const handleTrackEnded = () => {
    if (transitionGuardRef.current) {
      return;
    }
    transitionGuardRef.current = true;
    window.setTimeout(() => {
      transitionGuardRef.current = false;
    }, 0);
    void flushTrackStats();
    playSessionCountedRef.current = false;
    const completedPlays = completedPlaysRef.current.trackId === currentTrack?.id
      ? completedPlaysRef.current.count + 1
      : 1;
    completedPlaysRef.current = { trackId: currentTrack?.id || null, count: completedPlays };
    const playCountLimit = currentTrack?.playCountLimit ?? 1;
    if (repeatMode === "one" || playCountLimit === "forever" || completedPlays < playCountLimit) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((playError) => {
          setIsPlaying(false);
          setError(playError.message || "Could not replay this track.");
        });
      }
      return;
    }

    if (queueIds.length) {
      let nextIndex = -1;
      if (isShuffle && queueIds.length > 1) {
        nextIndex = pickShuffleIndex(queueIds, queueIndex);
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queueIds.length && repeatMode === "all") {
          nextIndex = 0;
        } else if (nextIndex >= queueIds.length) {
          nextIndex = -1;
        }
      }
      if (nextIndex >= 0 && nextIndex < queueIds.length) {
        const nextTrack = tracks.find((track) => track.id === queueIds[nextIndex]);
        if (nextTrack) {
          setQueueIndex(nextIndex);
          selectTrack(nextTrack, true);
          return;
        }
      }
      setIsPlaying(false);
      return;
    }

    if (repeatMode === "all" || autoPlay) {
      const playlist = activeFolderId === "all"
        ? tracks
        : tracks.filter((track) => (track.folderId || "unfiled") === activeFolderId);
      const filteredPlaylist = favoritesOnly
        ? playlist.filter((track) => track.favorite)
        : playlist;
      const currentIndex = filteredPlaylist.findIndex((track) => track.id === currentTrack?.id);
      const hasNextTrack = isShuffle
        ? filteredPlaylist.length > 1
        : currentIndex >= 0 && currentIndex < filteredPlaylist.length - 1;
      if (hasNextTrack) {
        playRelativeTrack(1, { wrap: repeatMode === "all" });
        return;
      } else if (repeatMode === "all" && filteredPlaylist.length) {
        selectTrack(filteredPlaylist[0]);
        return;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    setIsPlaying(false);
  };

  const appSeekTo = (event) => {
    const nextTime = Number(event.target.value);
    if (audioRef.current && Number.isFinite(nextTime)) {
      audioRef.current.currentTime = nextTime;
      lastPlaybackPositionRef.current = nextTime;
      updatePlaybackDisplay(nextTime);
    }
  };

  const seekTrack = (event, track) => {
    const audio = audioRef.current;
    const nextTime = Number(event.target.value);
    if (!audio || currentTrack?.id !== track.id || !Number.isFinite(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    lastPlaybackPositionRef.current = nextTime;
    updatePlaybackDisplay(nextTime);
  };


  const updateVolume = (nextVolume) => {
    setVolume(nextVolume);
  };

  const resetConverter = () => {
    setUrl("");
    setVideo(null);
    setError("");
    setNotice("");
    setShowQueue(false);
    setShowQueueDrawer(false);
    setActiveTab("convert");
  };

  const toggleFavorite = async (track) => {
    setError("");
    try {
      const updatedTrack = await updateTrackMetadata(track.id, { favorite: !track.favorite });
      setTracks((existingTracks) =>
        existingTracks.map((item) => (item.id === updatedTrack.id ? updatedTrack : item))
      );
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      setNotice(updatedTrack.favorite
        ? `Added "${cleanTrackTitle(updatedTrack.title)}" to favorites.`
        : `Removed "${cleanTrackTitle(updatedTrack.title)}" from favorites.`);
    } catch (favoriteError) {
      setError(favoriteError.message || "Could not update this favorite.");
    }
  };

  const createFolder = async (event) => {
    event.preventDefault();
    const name = newFolderName.trim().replace(/\s+/g, " ");
    if (!name) {
      return;
    }
    if (folders.some((folder) => normalizeSearchText(folder.name) === normalizeSearchText(name))) {
      setError("A folder with that name already exists.");
      return;
    }

    setError("");
    const folder = { id: createTrackId(), name, createdAt: Date.now() };
    try {
      await saveFolder(folder);
      setFolders((existingFolders) => [...existingFolders, folder].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      ));
      setActiveFolderId("all");
      setNewFolderName("");
      setIsCreatingFolder(false);
      setFavoritesOnly(false);
      setNotice(`Created "${name}". Assign songs with the folder menu in each track.`);
    } catch (folderError) {
      setError(folderError.message || "Could not create this folder.");
    }
  };

  const removeFolder = async (folder) => {
    setError("");
    try {
      await deleteFolderFromDB(folder.id);
      setFolders((existingFolders) => existingFolders.filter((item) => item.id !== folder.id));
      setTracks((existingTracks) =>
        existingTracks.map((track) => (track.folderId === folder.id ? { ...track, folderId: null } : track))
      );
      setActiveFolderId((activeId) => (activeId === folder.id ? "all" : activeId));
      setNotice(`Deleted "${folder.name}". Its songs are now unfiled.`);
    } catch (folderError) {
      setError(folderError.message || "Could not delete this folder.");
    }
  };

  const moveTrackToFolder = async (track, folderId) => {
    setError("");
    try {
      const updatedTrack = await updateTrackMetadata(track.id, { folderId: folderId || null });
      setTracks((existingTracks) =>
        existingTracks.map((item) => (item.id === updatedTrack.id ? updatedTrack : item))
      );
      setCurrentTrack((current) => (current?.id === updatedTrack.id ? updatedTrack : current));
      const destination = folders.find((folder) => folder.id === updatedTrack.folderId)?.name || "Unfiled";
      setNotice(`Moved "${cleanTrackTitle(updatedTrack.title)}" to ${destination}.`);
    } catch (folderError) {
      setError(folderError.message || "Could not move this song.");
    }
  };

  const removeFromQueue = (songId) => {
    if (!songId) {
      return;
    }
    const index = queueIds.indexOf(songId);
    if (index === -1) {
      return;
    }
    const wasCurrent = index === queueIndex;
    const nextQueueIds = queueIds.filter((_, i) => i !== index);
    let nextQueueIndex = queueIndex;
    if (wasCurrent) {
      if (nextQueueIds.length && index < nextQueueIds.length) {
        nextQueueIndex = index;
      } else if (nextQueueIds.length) {
        nextQueueIndex = Math.max(0, index - 1);
      } else {
        nextQueueIndex = -1;
      }
    } else if (index < queueIndex) {
      nextQueueIndex = Math.max(0, queueIndex - 1);
    }

    queueRemoveFromQueue(songId);

    // Temporary coordination: PlaybackProvider will own track progression in Step 4b.
    // When the current track is removed from the queue, select the next available track.
    if (wasCurrent && nextQueueIds.length && index < nextQueueIds.length) {
      const nextTrack = tracks.find((track) => track.id === nextQueueIds[index]);
      if (nextTrack) {
        selectTrack(nextTrack, true);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/health`);
        if (response.ok) {
          if (!cancelled) {
            setBackendReady(true);
          }
          return true;
        }
      } catch {
        // Backend may be waking up.
      }
      if (!cancelled) {
        setBackendReady(false);
      }
      return false;
    };

    void checkHealth().then((ready) => {
      if (ready || cancelled) {
        return;
      }
      const interval = window.setInterval(async () => {
        const nextReady = await checkHealth();
        if (nextReady) {
          window.clearInterval(interval);
        }
      }, 3000);
      return () => window.clearInterval(interval);
    });

    return () => {
      cancelled = true;
    };
  }, []);
  const refreshLibrary = useCallback(async () => {
    try {
      const [savedTracks, savedFolders] = await Promise.all([getAllTracksMetadata(), getAllFolders()]);
      setTracks(savedTracks);
      setFolders(savedFolders);
    } catch (loadError) {
      setError(loadError.message || "Could not load the offline library.");
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
    try {
      const status = window.localStorage.getItem(PERSONALIZATION_STATUS_KEY);
      const currentName = window.localStorage.getItem(PERSONALIZATION_NAME_KEY);
      const legacyName = currentName === null
        ? window.localStorage.getItem(LEGACY_SIGNATURE_KEY)
        : null;
      const savedName = normalizePersonalizationName(currentName ?? legacyName);
      const hasSavedChoice = status === "personalized" || status === "skipped";

      setSignatureName(status === "skipped" ? "" : savedName);
      if (hasSavedChoice) {
        if (status === "personalized" && currentName !== savedName) {
          window.localStorage.setItem(PERSONALIZATION_NAME_KEY, savedName);
        }
        setHasCompletedPersonalization(true);
      } else if (savedName) {
        window.localStorage.setItem(PERSONALIZATION_NAME_KEY, savedName);
        window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "personalized");
        setHasCompletedPersonalization(true);
      } else {
        setShowPersonalization(true);
      }
    } catch (storageError) {
      setError(storageError.message || "Could not read your saved personalization from this browser.");
      setShowPersonalization(true);
    } finally {
      setIsPersonalizationReady(true);
    }
  }, [refreshLibrary]);

  useEffect(() => {
    const loadStorage = async () => {
      if (!navigator.storage) {
        return;
      }
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
      } catch (storageError) {
        setError("Could not read storage information.");
      }
    };
    void loadStorage();
  }, []);

  useEffect(() => {
    const saveStatsWhenLeaving = () => {
      if (document.visibilityState === "hidden") {
        void flushTrackStats();
      }
    };
    window.addEventListener("pagehide", saveStatsWhenLeaving);
    document.addEventListener("visibilitychange", saveStatsWhenLeaving);
    return () => {
      window.removeEventListener("pagehide", saveStatsWhenLeaving);
      document.removeEventListener("visibilitychange", saveStatsWhenLeaving);
    };
  }, []);

  const loadVideoInfo = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!navigator.onLine || !isOnline) {
      setNotice("You're offline. Reconnect to preview and download tracks.");
      return;
    }
    setVideo(null);
    setIsLoadingInfo(true);

    try {
      setVideo(await fetchVideoInfo(url));
    } catch (fetchError) {
      if (!navigator.onLine) {
        setNotice("You're offline. Reconnect to preview and download tracks.");
      } else {
        setError(fetchError.message || "Could not retrieve video details.");
      }
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const convertAndSave = async () => {
    if (!backendReady) {
      setError("Waking up the server, please wait...");
      return;
    }
    if (isConverting) {
      return;
    }
    if (!navigator.onLine || !isOnline) {
      setError("");
      setNotice("You're offline. Reconnect to download this track.");
      return;
    }
    if (!video) {
      setError("Load video details before converting.");
      return;
    }

    setError("");
    setNotice("");
    setIsConverting(true);
    const id = createTrackId();

    try {
      const savedTracks = await getAllTracksMetadata();
      setTracks(savedTracks);
      if (savedTracks.some((track) => track.videoId === video.id)) {
        setUrl("");
        setVideo(null);
        setActiveTab("convert");
        setNotice("You already have this track.");
        return;
      }

      const audioBlob = await convertVideoToAudio(url);
      if (!audioBlob.size) {
        throw new Error("The converted audio file was empty.");
      }
      if (!("caches" in window)) {
        throw new Error("This browser does not support offline audio storage.");
      }

      const cache = await caches.open(AUDIO_CACHE_NAME);
      const audioRequest = new Request(
        new URL(`/offline-audio/${encodeURIComponent(id)}`, window.location.origin)
      );
      await cache.put(
        audioRequest,
        new Response(audioBlob, {
          headers: {
            "Content-Type": audioBlob.type || "audio/mpeg",
            "Content-Length": String(audioBlob.size),
          },
        })
      );
      const cachedAudio = await cache.match(audioRequest);
      if (!cachedAudio || Number(cachedAudio.headers.get("Content-Length")) !== audioBlob.size) {
        await cache.delete(audioRequest);
        throw new Error("Could not verify the saved audio in offline storage. Please try again.");
      }

      const savedTrack = {
        id,
        title: cleanTrackTitle(video.title),
        thumbnail: video.thumbnail,
        duration: video.duration,
        uploader: video.uploader,
        videoId: video.id,
        savedAt: Date.now(),
      };
      try {
        await saveTrackMetadata(savedTrack);
      } catch (metadataError) {
        await cache.delete(audioRequest);
        throw metadataError;
      }

      setActiveFolderId("all");
      setFavoritesOnly(false);
      setSearchQuery("");
      setTracks((existingTracks) => [savedTrack, ...existingTracks]);
      selectTrack(savedTrack, false);
      completedPlaysRef.current = { trackId: savedTrack.id, count: 0 };
      setNotice("Saved to your offline library. Ready to play anywhere.");
      setUrl("");
      setVideo(null);
      setActiveTab("convert");
    } catch (convertError) {
      if (!navigator.onLine) {
        setNotice("You're offline. Reconnect to download this track.");
      } else {
        setError(convertError.message || "Conversion failed. Please try again.");
      }
    } finally {
      setIsConverting(false);
    }
  };

  const playTrack = (track) => {
    const audio = audioRef.current;
    if (currentTrack?.id === track.id) {
      if (audio && !audio.paused) {
        audio.pause();
        return;
      }

      if (audio && audio.ended) {
        audio.currentTime = 0;
        completedPlaysRef.current = { trackId: track.id, count: 0 };
      }
      if (!audioSource) {
        selectTrack(track, true);
        return;
      }
      audio?.play().catch((playError) => {
        setIsPlaying(false);
        setError(playError.message || "Could not play this track.");
      });
      return;
    }

    appSelectTrack(track)
  };

  const togglePlayback = () => {
    if (!audioRef.current || !currentTrack) {
      return;
    }
    if (audioRef.current.paused) {
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
        completedPlaysRef.current = { trackId: currentTrack.id, count: 0 };
      }
      audioRef.current.play().catch((playError) => {
        setIsPlaying(false);
        setError(playError.message || "Could not play this track.");
      });
    } else {
      audioRef.current.pause();
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

  const isAudioCached = async (trackId) => {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const response = await cache.match(new Request(new URL(`/offline-audio/${encodeURIComponent(trackId)}`, window.location.origin)));
      return Boolean(response && response.ok);
    } catch {
      return false;
    }
  };

  const downloadTrackFile = async (track) => {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const response = await cache.match(new Request(new URL(`/offline-audio/${encodeURIComponent(track.id)}`, window.location.origin)));
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
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== "object" || data.version !== 1) {
        throw new Error("This backup file is not supported.");
      }
      if (!Array.isArray(data.tracks) || !Array.isArray(data.folders)) {
        throw new Error("This backup file is missing library data.");
      }
      setPendingImport(data);
    } catch (importError) {
      setError(importError.message || "Could not read this backup file.");
    } finally {
      event.target.value = "";
    }
  };

  const applyImport = async (mode) => {
    if (!pendingImport) {
      return;
    }
    setError("");
    try {
      const importedTracks = pendingImport.tracks;
      const importedFolders = pendingImport.folders;

      if (mode === "replace") {
        const existingTracks = await getAllTracksMetadata();
        await Promise.all(existingTracks.map((track) => deleteTrackMetadata(track.id)));
        const existingFolders = await getAllFolders();
        await Promise.all(existingFolders.map((folder) => deleteFolderFromDB(folder.id)));
      }

      await Promise.all(importedFolders.map((folder) => saveFolder(folder)));
      await Promise.all(importedTracks.map((track) => saveTrackMetadata({ ...track, downloaded: undefined })));

      // mark downloaded status
      const tracksWithStatus = await Promise.all(importedTracks.map(async (track) => {
        const cached = await isAudioCached(track.id);
        return { ...track, downloaded: cached };
      }));
      await Promise.all(tracksWithStatus.map((track) => saveTrackMetadata(track)));

      await refreshLibrary();
      setPendingImport(null);
      setNotice(mode === "replace" ? "Library replaced from backup." : "Library merged from backup.");
    } catch (importError) {
      setError(importError.message || "Could not import this library.");
    }
  };

  const reDownloadTrack = async (track) => {
    if (!track?.videoId) {
      setError("This track has no video ID to re-download.");
      return;
    }
    setError("");
    setIsConverting(true);
    try {
      const audioBlob = await convertVideoToAudio(`https://www.youtube.com/watch?v=${track.videoId}`);
      if (!audioBlob.size) {
        throw new Error("The converted audio file was empty.");
      }
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const audioRequest = new Request(new URL(`/offline-audio/${encodeURIComponent(track.id)}`, window.location.origin));
      await cache.put(audioRequest, new Response(audioBlob, { headers: { "Content-Type": audioBlob.type || "audio/mpeg", "Content-Length": String(audioBlob.size) } }));
      await updateTrackMetadata(track.id, { downloaded: true });
      await refreshLibrary();
      setNotice("Track re-downloaded.");
    } catch (reDownloadError) {
      if (!navigator.onLine) {
        setNotice("You're offline. Reconnect to download this track.");
      } else {
        setError(reDownloadError.message || "Re-download failed.");
      }
    } finally {
      setIsConverting(false);
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
      if (!track.thumbnail) {
        continue;
      }
      try {
        const cache = await caches.open(COVER_CACHE_NAME);
        const request = new Request(new URL(`/cover/${encodeURIComponent(track.id)}`, window.location.origin));
        const existing = await cache.match(request);
        if (existing) {
          continue;
        }
        const response = await fetch(track.thumbnail);
        if (response.ok) {
          await cache.put(request, response.clone());
          updated += 1;
        }
      } catch {
        // Ignore individual failures.
      }
    }
    setNotice(updated ? `Fetched ${updated} cover${updated === 1 ? "" : "s"}.` : "No new covers to fetch.");
  }, [tracks]);
  const removeTrack = async (track) => {
    setError("");
    try {
      if (currentTrack?.id === track.id) {
        audioRef.current?.pause();
      }
      if (pendingStatsRef.current.has(track.id)) {
        await flushTrackStats(track.id);
      }
      await caches.open(AUDIO_CACHE_NAME).then((cache) =>
        cache.delete(
          new Request(new URL(`/offline-audio/${encodeURIComponent(track.id)}`, window.location.origin))
        )
      );
      await deleteTrackMetadata(track.id);
      setTracks((existingTracks) => existingTracks.filter((item) => item.id !== track.id));
      if (currentTrack?.id === track.id) {
        audioRef.current?.pause();
        selectTrack(null, false);
        setIsPlaying(false);
        updatePlaybackDisplay(0, 0);
      }
      setNotice("Track removed from your offline library.");
    } catch (removeError) {
      setError(removeError.message || "Could not remove this track.");
    }
  };

  const searchTerms = normalizeSearchText(searchQuery).split(" ").filter(Boolean);
  const visibleTracks = tracks.filter((track) => {
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

  const sortedVisibleTracks = [...visibleTracks].sort((a, b) => {
    if (sortBy === "newest" || sortBy === "recent") {
      return (b.savedAt || 0) - (a.savedAt || 0);
    }
    if (sortBy === "mostPlayed") {
      return (b.playCount || 0) - (a.playCount || 0);
    }
    if (sortBy === "az") {
      return cleanTrackTitle(a.title || "").localeCompare(cleanTrackTitle(b.title || ""));
    }
    if (sortBy === "durationAsc") {
      return (a.duration || 0) - (b.duration || 0);
    }
    if (sortBy === "durationDesc") {
      return (b.duration || 0) - (a.duration || 0);
    }
    return 0;
  });
  const activeFolder = folders.find((folder) => folder.id === activeFolderId);
  const unfiledCount = tracks.filter((track) => !track.folderId).length;
  const homeQueue = queueIds
    .map((id, index) => ({ track: tracks.find((track) => track.id === id), index }))
    .filter(({ track }) => Boolean(track));
  const openLibrary = (showFavorites = false) => {
    setActiveTab("library");
    setFavoritesOnly(showFavorites);
    if (showFavorites) setActiveFolderId("all");
    setSearchQuery("");
    setShowQueue(false);
    setShowQueueDrawer(false);
    setError("");
    setNotice("");
    void refreshLibrary();
  };
  const openLibraryTools = () => {
    setActiveTab("settings");
    setError("");
    setShowQueue(false);
    setShowQueueDrawer(false);
  };
  const openHome = () => {
    setActiveTab("home");
    setError("");
    setShowQueue(false);
    setShowQueueDrawer(false);
  };

  const toggleInlineQueue = () => {
    setShowQueueDrawer(false);
    setShowQueue((isOpen) => !isOpen);
  };

  const toggleQueueDrawer = () => {
    setShowQueue(false);
    setShowQueueDrawer((isOpen) => !isOpen);
  };

  const navigateShell = (tab) => {
    if (tab === "home") {
      openHome();
    } else if (tab === "library") {
      openLibrary();
    } else if (tab === "add") {
      resetConverter();
    } else if (tab === "playing") {
      setActiveTab("playing");
      setShowQueue(false);
      setShowQueueDrawer(false);
    }
  };
  const shellActive = activeTab === "convert" ? "add" : activeTab;
  const shellPage = activeTab === "convert" ? "add" : activeTab;
  const audioHandlers = {
    onPlay: () => {
      setIsPlaying(true);
      if (currentTrack) {
        activePlaybackTrackIdRef.current = currentTrack.id;
        recordTrackPlay(currentTrack.id);
      }
      if (audioRef.current) {
        lastPlaybackPositionRef.current = audioRef.current.currentTime;
      }
    },
    onPause: () => {
      const pausedTrackId = activePlaybackTrackIdRef.current;
      if (audioRef.current && pausedTrackId) {
        recordPlaybackTime(audioRef.current, pausedTrackId);
        void flushTrackStats(pausedTrackId);
      }
      if (pausedTrackId === currentTrack?.id) {
        setIsPlaying(false);
      }
      activePlaybackTrackIdRef.current = null;
    },
    onTimeUpdate: (event) => recordPlaybackTime(event.currentTarget),
    onSeeking: (event) => {
      lastPlaybackPositionRef.current = event.currentTarget.currentTime;
    },
    onLoadedMetadata: (event) => {
      if (Number.isFinite(event.currentTarget.duration)) {
        setDuration(event.currentTarget.duration);
        updatePlaybackDisplay(event.currentTarget.currentTime, event.currentTarget.duration);
      }
    },
    onDurationChange: (event) => {
      if (Number.isFinite(event.currentTarget.duration)) {
        setDuration(event.currentTarget.duration);
        updatePlaybackDisplay(event.currentTarget.currentTime, event.currentTarget.duration);
      }
    },
    onEnded: handleTrackEnded,
    onError: () => {
      if (currentTrack) {
        setIsPlaying(false);
        setError("This track could not be loaded from offline storage.");
      }
    },
  };
  audioHandlersRef.current = audioHandlers;

  return (
    <AppShell
      active={shellActive}
      onNavigate={navigateShell}
      signature={signatureName}
      onEditSignature={openPersonalization}
      onSettings={openLibraryTools}
      settingsActive={activeTab === "settings"}
      player={{
        song: currentTrack
          ? {
              title: cleanTrackTitle(currentTrack.title),
              channel: currentTrack.uploader || currentTrack.artist || "Offline track",
            }
          : null,
        isPlaying,
        percent: duration ? Math.min(100, (currentTime / duration) * 100) : 0,
        current: currentTime,
        duration,
        onToggle: togglePlayback,
        onPrev: () => appPlayRelativeTrack(-1, { wrap: repeatMode === "all" }),
        onNext: () => appPlayRelativeTrack(1, { wrap: repeatMode === "all" }),
        onSeek: (percent) => {
          const trackDuration = duration || currentTrack?.duration || 0;
          appSeekTo({ target: { value: String((trackDuration * percent) / 100) } });
        },
        progressRef: playerBarProgressRef,
        currentTimeRef: playerBarCurrentTimeRef,
        durationRef: playerBarDurationRef,
      }}
    >
      {notice && (
        <div className="duplicate-toast" role="status">
          <span className="duplicate-toast-icon"><Music2 size={17} /></span>
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <PageShell page={shellPage} playing={playing}>
        {error && <div className="page-status error-message" role="alert">{error}</div>}
        {!backendReady && activeTab === "convert" && (
          <div className="page-status" role="status">Waking up the server, please wait…</div>
        )}
        {activeTab === "home" ? (
          <HomeView
            home={{
              tracks,
              currentTrack,
              currentTime,
              duration,
              isPlaying,
              isPreparingAudio,
              isShuffle,
              repeatMode,
              queue: homeQueue,
              queueIndex,
              signatureName,
              showQueue,
            }}
            actions={{
              onEditSignature: openPersonalization,
              onNavigate: (tab) => {
                if (tab === "convert") {
                  resetConverter();
                } else if (tab === "settings") {
                  openLibraryTools();
                } else {
                  openLibrary();
                }
              },
              onPlayTrack: playTrack,
              onPlayQueueTrack: (track, index) => { setQueueIndex(index); selectTrack(track, true); },
              onTogglePlayback: togglePlayback,
              onPreviousTrack: () => appPlayRelativeTrack(-1, { wrap: repeatMode === "all" }),
              onNextTrack: () => appPlayRelativeTrack(1, { wrap: repeatMode === "all" }),
              onToggleShuffle: () => setIsShuffle((shuffle) => !shuffle),
              onCycleRepeatMode: cycleRepeatMode,
              onSeek: seekTo,
              onToggleFavorite: toggleFavorite,
              onAddToQueue: addToQueue,
              onToggleQueue: toggleInlineQueue,
              onRemoveFromQueue: removeFromQueue,
              onClearQueue: clearQueue,
            }}
          />
        ) : activeTab === "playing" ? (
          <NowPlayingView
            player={{ currentTrack, currentTime, duration, isPlaying, isPreparingAudio, isShuffle, repeatMode, queueIndex }}
            queue={homeQueue}
            actions={{
              onBack: openHome,
              onTogglePlayback: togglePlayback,
              onPreviousTrack: () => appPlayRelativeTrack(-1, { wrap: repeatMode === "all" }),
              onNextTrack: () => appPlayRelativeTrack(1, { wrap: repeatMode === "all" }),
              onToggleShuffle: () => setIsShuffle((shuffle) => !shuffle),
              onCycleRepeatMode: cycleRepeatMode,
              onSeek: seekTo,
              onToggleFavorite: toggleFavorite,
              onPlayQueueTrack: (track, index) => { setQueueIndex(index); selectTrack(track, true); },
              onDownloadTrack: downloadTrackFile,
              onOpenPlaylists: openLibrary,
            }}
          />
        ) : activeTab === "settings" ? (
          <SettingsView
            settings={{ storageInfo, tracksLength: tracks.length, signatureName, pendingImport }}
            actions={{
              onExportLibrary: exportLibrary,
              onImportLibrary: () => importInputRef.current?.click(),
              onFetchMissingCovers: fetchMissingCovers,
              onOpenPersonalization: openPersonalization,
              onApplyImport: applyImport,
              onCancelImport: () => setPendingImport(null),
            }}
          />
        ) : (
          <section className={`workspace-card non-home-workspace${activeTab === "library" ? " non-home-library" : ""}`}>
            {activeTab === "convert" && (
              <div className="rx-convert-toolbar">
                <button type="button" className="ch" onClick={toggleInlineQueue} aria-expanded={showQueue} style={showQueue ? { background: "#FFD93D" } : undefined}>
                  <ListMusic size={16} /> Queue <small>{queueIds.length}</small>
                </button>
              </div>
            )}
            {activeTab === "convert" && showQueue && (
              <div className="bd rx-panel rx-inline-queue">
                <div className="rx-panel-head">
                  <h2 className="B">queue ({queueIds.length})</h2>
                  <button type="button" className="rx-link" onClick={clearQueue}>Clear</button>
                </div>
                {queueIds.length === 0 && <p className="rx-muted">No songs in queue.</p>}
                <div className="rx-queue-expanded">
                  {queueIds.map((id, index) => {
                    const track = tracks.find((item) => item.id === id);
                    if (!track) return null;
                    return (
                      <div key={`${id}-${index}`} className={`rx-queue-row ${index === queueIndex ? "is-current" : ""}`}>
                        <button type="button" className="rx-queue-play" onClick={() => { setQueueIndex(index); selectTrack(track, true); }}>
                          <span><strong>{cleanTrackTitle(track.title)}</strong><small>{track.uploader || "Offline track"}</small></span>
                        </button>
                        <button type="button" className="ib rx-queue-x" onClick={() => removeFromQueue(id)} aria-label="Remove"><X size={14} /></button>
                      </div>
                    );
                  })}
                </div>
                {currentTrack && <button type="button" className="ch" style={{ marginTop: 10 }} onClick={() => addToQueue(currentTrack)}>Add current song</button>}
              </div>
            )}
            {activeTab === "convert" ? (
              <ConverterView
                url={url}
                onUrlChange={(event) => {
                  setUrl(event.target.value);
                  setVideo(null);
                  setError("");
                  setNotice("");
                }}
                onPreview={loadVideoInfo}
                onSaveOffline={convertAndSave}
                video={video}
                isOnline={isOnline}
                isLoadingInfo={isLoadingInfo}
                isConverting={isConverting}
              />
            ) : (
              <LibraryView
                library={{ tracks, visibleTracks: sortedVisibleTracks, folders, activeFolderId, setActiveFolderId, unfiledCount, sortBy, setSortBy, queueIds }}
                filters={{ searchQuery, setSearchQuery, favoritesOnly, setFavoritesOnly }}
                forms={{ isCreatingFolder, setIsCreatingFolder, newFolderName, setNewFolderName, renameTrackId, renameDraft, setRenameDraft }}
                playback={{ currentTrack, isPlaying, isPreparingAudio, currentTime, duration, pendingStatsRef, inlineProgressRef, inlineCurrentTimeRef, inlineDurationRef, onPlayTrack: playTrack, onAddToQueue: addToQueue, onSeekTrack: seekTrack }}
                queue={{ queueIndex, onPlayQueueTrack: (track, index) => { setQueueIndex(index); selectTrack(track, true); }, onRemoveFromQueue: removeFromQueue, onClearQueue: clearQueue }}
                actions={{
                  onCreateFolder: createFolder,
                  onToggleCreateFolder: () => { setIsCreatingFolder((open) => !open); setNewFolderName(""); setError(""); },
                  onRenameTrack: renameTrack,
                  onBeginRenameTrack: beginRenameTrack,
                  onCancelRenameTrack: () => { setRenameTrackId(null); setRenameDraft(""); },
                  onUpdatePlayCountLimit: updatePlayCountLimit,
                  onToggleFavorite: toggleFavorite,
                  onMoveTrackToFolder: moveTrackToFolder,
                  onRemoveTrack: removeTrack,
                  onRemoveFolder: removeFolder,
                  onGoToConverter: resetConverter,
                  onDownloadTrack: downloadTrackFile,
                  onReDownloadTrack: reDownloadTrack,
                  onShowAllCollection: () => { setActiveFolderId("all"); setFavoritesOnly(false); setSearchQuery(""); },
                }}
              />
            )}
          </section>
        )}

        <footer className="page-footer">
          <span>nofi <span className="footer-dot">✦</span> no skips · no ads · no wifi needed</span>
          <span>Audio you’re authorized to use.</span>
        </footer>
      </PageShell>

      {isPersonalizationReady && showPersonalization && (
        <PersonalizationModal
          initialName={signatureName}
          isFirstVisit={!hasCompletedPersonalization}
          error={error}
          onSave={savePersonalization}
          onClear={clearPersonalization}
          onDismiss={closePersonalization}
          onSkip={skipPersonalization}
        />
      )}

      <input ref={importInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />

      <PlayerDock
        player={{
          currentPage: activeTab,
          currentTrack,
          currentTime,
          duration,
          isPlaying,
          isPreparingAudio,
          isShuffle,
          repeatMode,
          tracksLength: tracks.length,
          volume,
          playbackRate,
          autoPlay,
          queueOpen: showQueueDrawer,
          playerProgressRef,
          playerCurrentTimeRef,
          playerRemainingTimeRef,
        }}
        actions={{
          onToggleShuffle: () => setIsShuffle((shuffle) => !shuffle),
          onPreviousTrack: () => playRelativeTrack(-1, { wrap: repeatMode === "all" }),
          onNextTrack: () => playRelativeTrack(1, { wrap: repeatMode === "all" }),
          onTogglePlayback: togglePlayback,
          onCycleRepeatMode: cycleRepeatMode,
          onPlaybackRateChange: setPlaybackRate,
          onToggleVolume: () => updateVolume(volume > 0 ? 0 : 0.8),
          onVolumeChange: updateVolume,
          onToggleAutoPlay: () => setAutoPlay((enabled) => !enabled),
          onSeek: seekTo,
          onToggleQueue: toggleQueueDrawer,
        }}
      />
      <QueueDrawer
        open={showQueueDrawer}
        tracks={tracks}
        queueIds={queueIds}
        queueIndex={queueIndex}
        onClose={() => setShowQueueDrawer(false)}
        onPlayQueueTrack={(track, index) => { setQueueIndex(index); selectTrack(track, true); }}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
      />
    </AppShell>
  );
}
