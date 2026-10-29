import { useCallback, useEffect, useRef, useState } from "react";
import {
  Disc3,
  Headphones,
  Music2,
  Radio,
  X,
  Youtube,
} from "lucide-react";
import {
  deleteTrackMetadata,
  deleteFolder as deleteFolderFromDB,
  getAllFolders,
  getAllTracksMetadata,
  incrementTrackStats,
  saveFolder,
  saveTrackMetadata,
  updateTrackMetadata,
} from "./db.js";
import useOnlineStatus from "./hooks/useOnlineStatus.js";
import { convertVideoToAudio, fetchVideoInfo } from "./services/videoApi.js";
import {
  cleanTrackTitle,
  createTrackId,
  formatDuration,
  normalizeSearchText,
} from "./utils/trackFormatting.js";
import ConverterView from "./components/ConverterView.jsx";
import LibraryView from "./components/LibraryView.jsx";
import PlayerDock from "./components/PlayerDock.jsx";

const AUDIO_CACHE_NAME = "mp3-offline-cache-v1";

export default function App() {
  const [activeTab, setActiveTab] = useState("convert");
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [renameTrackId, setRenameTrackId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [signatureDraft, setSignatureDraft] = useState("");
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState("off");
  const [isShuffle, setIsShuffle] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const isOnline = useOnlineStatus();
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [audioSource, setAudioSource] = useState(null);
  const audioRef = useRef(null);
  const currentTimeRef = useRef(0);
  const playerProgressRef = useRef(null);
  const playerCurrentTimeRef = useRef(null);
  const playerRemainingTimeRef = useRef(null);
  const inlineProgressRef = useRef(null);
  const inlineCurrentTimeRef = useRef(null);
  const inlineDurationRef = useRef(null);
  const audioSourceRef = useRef(null);
  const pendingPlaybackRef = useRef(false);
  const completedPlaysRef = useRef({ trackId: null, count: 0 });
  const playSessionCountedRef = useRef(false);
  const activePlaybackTrackIdRef = useRef(null);
  const lastPlaybackPositionRef = useRef(0);
  const pendingStatsRef = useRef(new Map());
  const statsWritesInFlightRef = useRef(new Set());
  const currentTime = currentTimeRef.current;

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

  const saveSignature = (event) => {
    event.preventDefault();
    const name = signatureDraft.trim().replace(/\s+/g, " ").slice(0, 32);
    try {
      if (name) {
        window.localStorage.setItem("nofi-library-signature", name);
      } else {
        window.localStorage.removeItem("nofi-library-signature");
      }
      setSignatureName(name);
      setIsEditingSignature(false);
      setError("");
      setNotice(name ? "Your sign has been updated." : "Your sign has been removed.");
    } catch (storageError) {
      setError("Could not save your signature in this browser.");
    }
  };

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const deleteSignature = () => {
    try {
      window.localStorage.removeItem("nofi-library-signature");
      setSignatureName("");
      setSignatureDraft("");
      setIsEditingSignature(false);
      setError("");
      setNotice("Your sign has been deleted.");
    } catch (storageError) {
      setError("Could not delete your signature from this browser.");
    }
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

  const selectTrack = (track, shouldPlay = true) => {
    if (currentTrack && currentTrack.id !== track.id) {
      void flushTrackStats(currentTrack.id);
    }
    playSessionCountedRef.current = false;
    lastPlaybackPositionRef.current = 0;
    completedPlaysRef.current = { trackId: track.id, count: 0 };
    pendingPlaybackRef.current = shouldPlay;
    setCurrentTrack(track);
    updatePlaybackDisplay(0, Number.isFinite(track.duration) ? track.duration : 0);
    setDuration(Number.isFinite(track.duration) ? track.duration : 0);
  };

  const playRelativeTrack = (direction, { wrap = false } = {}) => {
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
      const candidates = filteredPlaylist.map((_, index) => index).filter((index) => index !== currentIndex);
      nextIndex = candidates[Math.floor(Math.random() * candidates.length)];
    } else if (currentIndex === -1) {
      nextIndex = direction > 0 ? 0 : filteredPlaylist.length - 1;
    } else if (!wrap && (currentIndex + direction < 0 || currentIndex + direction >= filteredPlaylist.length)) {
      return;
    } else {
      nextIndex = (currentIndex + direction + filteredPlaylist.length) % filteredPlaylist.length;
    }
    selectTrack(filteredPlaylist[nextIndex]);
  };

  const handleTrackEnded = () => {
    void flushTrackStats();
    playSessionCountedRef.current = false;
    setIsPlaying(false);
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
          setError(playError.message || "Could not replay this track.");
        });
      }
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
      } else if (repeatMode === "all" && filteredPlaylist.length) {
        selectTrack(filteredPlaylist[0]);
      }
    }
  };

  const seekTo = (event) => {
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

  const cycleRepeatMode = () => {
    setRepeatMode((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off"));
  };

  const updateVolume = (nextVolume) => {
    setVolume(nextVolume);
  };

  const resetConverter = () => {
    setUrl("");
    setVideo(null);
    setError("");
    setNotice("");
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
      setSignatureName(window.localStorage.getItem("nofi-library-signature") || "");
    } catch (storageError) {
      setError("Could not read your saved library signature from this browser.");
    }
  }, [refreshLibrary]);

  useEffect(() => {
    if (!currentTrack) {
      setIsPreparingAudio(false);
      setAudioSource(null);
      return undefined;
    }

    let isCurrent = true;
    let objectUrl;
    audioRef.current?.pause();
    setIsPreparingAudio(true);
    setAudioSource(null);

    const loadSavedAudio = async () => {
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const audioRequest = new Request(
          new URL(`/offline-audio/${encodeURIComponent(currentTrack.id)}`, window.location.origin)
        );
        const response = await cache.match(audioRequest);
        if (!response) {
          throw new Error("This song is missing from offline storage. Save it again while online.");
        }

        const audioBlob = await response.blob();
        if (!audioBlob.size) {
          throw new Error("The saved audio file is empty. Save this song again.");
        }

        objectUrl = URL.createObjectURL(audioBlob);
        if (isCurrent) {
          audioSourceRef.current = objectUrl;
          setAudioSource(objectUrl);
          setIsPreparingAudio(false);
        }
      } catch (audioError) {
        if (isCurrent) {
          setIsPreparingAudio(false);
          setError(audioError.message || "Could not load this song from offline storage.");
        }
      }
    };

    void loadSavedAudio();
    return () => {
      isCurrent = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (audioSourceRef.current === objectUrl) {
        audioSourceRef.current = null;
      }
    };
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audioSource || !pendingPlaybackRef.current) {
      return;
    }

    pendingPlaybackRef.current = false;
    audioRef.current?.play().catch((playError) => {
      setIsPlaying(false);
      setError(playError.message || "Could not play this track.");
    });
  }, [audioSource]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, audioSource]);

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
      pendingPlaybackRef.current = false;
      setCurrentTrack(savedTrack);
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
        pendingPlaybackRef.current = true;
        setIsPreparingAudio(true);
        return;
      }
      audio?.play().catch((playError) => {
        setIsPlaying(false);
        setError(playError.message || "Could not play this track.");
      });
      return;
    }

    selectTrack(track);
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

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return undefined;
    }

    const session = navigator.mediaSession;
    if (currentTrack && "MediaMetadata" in window) {
      session.metadata = new window.MediaMetadata({
        title: cleanTrackTitle(currentTrack.title),
        artist: currentTrack.uploader || "Offline track",
        album: "NoFi Offline Library",
        ...(currentTrack.thumbnail
          ? { artwork: [{ src: currentTrack.thumbnail, sizes: "512x512" }] }
          : {}),
      });
    } else {
      session.metadata = null;
    }

    const actions = {
      play: () => audioRef.current?.play().catch((playError) => {
        setError(playError.message || "Could not play this track.");
      }),
      pause: () => audioRef.current?.pause(),
      previoustrack: () => playRelativeTrack(-1, { wrap: repeatMode === "all" }),
      nexttrack: () => playRelativeTrack(1, { wrap: repeatMode === "all" }),
    };
    Object.entries(actions).forEach(([action, handler]) => {
      session.setActionHandler(action, currentTrack ? handler : null);
    });

    return () => {
      Object.keys(actions).forEach((action) => session.setActionHandler(action, null));
    };
  }, [currentTrack, tracks, isShuffle, repeatMode, activeFolderId, favoritesOnly]);

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
        setCurrentTrack(null);
        setIsPlaying(false);
        updatePlaybackDisplay(0, 0);
        setDuration(0);
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
      `${track.title} ${track.uploader || ""} ${track.videoId || ""}`
    );
    return searchTerms.every((term) => searchableText.includes(term));
  });
  const activeFolder = folders.find((folder) => folder.id === activeFolderId);
  const unfiledCount = tracks.filter((track) => !track.folderId).length;

  return (
    <div className="app-shell min-h-screen bg-ink text-white">
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
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <a className="brand-mark" href="#" aria-label="NoFi home">
          <span className="brand-icon"><Radio size={20} strokeWidth={2.3} /></span>
          <span>NoFi<span className="brand-dot">.</span></span>
        </a>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-40 sm:px-8">
        <section className="hero-section">
          <div className="hero-kicker"><span className="kicker-line" /> YOUR JAM, ANYWHERE</div>
          <h1>Good sound.<br /><span>Wherever you go.</span></h1>
          <p>Save audio you have permission to use, then take your listening offline.</p>
          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />
          <div className="hero-disc"><Disc3 size={172} strokeWidth={0.65} /></div>
        </section>

        <section className="workspace-card">
          <div className="tabs" role="tablist" aria-label="Music tools">
            <button
              className={`tab-button ${activeTab === "convert" ? "active" : ""}`}
              onClick={resetConverter}
              role="tab"
              aria-selected={activeTab === "convert"}
            >
              <Youtube size={17} /> Convert
            </button>
            <button
              className={`tab-button ${activeTab === "library" ? "active" : ""}`}
              onClick={() => { setActiveTab("library"); setError(""); setNotice(""); refreshLibrary(); }}
              role="tab"
              aria-selected={activeTab === "library"}
            >
              <Headphones size={17} /> Offline Library
              <span className="tab-count">{tracks.length}</span>
            </button>
          </div>

          {error && <div className="status-message error-message" role="alert">{error}</div>}

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
              library={{ tracks, visibleTracks, folders, activeFolderId, setActiveFolderId, activeFolder, unfiledCount, searchTerms }}
              filters={{ searchQuery, setSearchQuery, favoritesOnly, setFavoritesOnly }}
              forms={{ isCreatingFolder, setIsCreatingFolder, newFolderName, setNewFolderName, signatureName, isEditingSignature, signatureDraft, setSignatureDraft, renameTrackId, renameDraft, setRenameDraft }}
              playback={{ currentTrack, isPlaying, isPreparingAudio, currentTime, duration, pendingStatsRef, inlineProgressRef, inlineCurrentTimeRef, inlineDurationRef, onPlayTrack: playTrack, onSeekTrack: seekTrack }}
              actions={{
                onCreateFolder: createFolder,
                onToggleCreateFolder: () => { setIsCreatingFolder((open) => !open); setNewFolderName(""); setError(""); },
                onToggleSignature: () => { setSignatureDraft(signatureName); setIsEditingSignature((editing) => !editing); setError(""); },
                onSaveSignature: saveSignature,
                onDeleteSignature: deleteSignature,
                onCancelSignature: () => setIsEditingSignature(false),
                onRenameTrack: renameTrack,
                onBeginRenameTrack: beginRenameTrack,
                onCancelRenameTrack: () => { setRenameTrackId(null); setRenameDraft(""); },
                onUpdatePlayCountLimit: updatePlayCountLimit,
                onToggleFavorite: toggleFavorite,
                onMoveTrackToFolder: moveTrackToFolder,
                onRemoveTrack: removeTrack,
                onRemoveFolder: removeFolder,
                onGoToConverter: resetConverter,
              }}
            />
          )}
        </section>

        <footer className="page-footer">
          <span>NOFI <span className="footer-dot">·</span> LISTEN ON YOUR TERMS</span>
          <span>Audio you’re authorized to use.</span>
        </footer>
      </main>

      <PlayerDock
        player={{
          audioRef,
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
          audioSource,
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
          audioHandlers: {
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
          },
        }}
      />
    </div>
  );
}
