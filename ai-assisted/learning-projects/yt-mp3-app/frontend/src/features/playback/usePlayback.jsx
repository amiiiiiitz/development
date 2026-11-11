import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAudio } from "../audio/index.jsx";
import { useQueue } from "../queue/useQueue.jsx";

const PlaybackContext = createContext(null);

function pickShuffleIndex(items, excludeIndex) {
  const candidates = items.map((_, index) => index).filter((index) => index !== excludeIndex);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : -1;
}

/**
 * PlaybackProvider owns playback state and exposes queue navigation to App's
 * playlist-aware controller when one is registered.
 */
export function PlaybackProvider({ children }) {
  const { audioRef, audioTrackId, audioSource, loadTrack, play, pause, seek } = useAudio();
  const { queueIds, queueIndex, setQueueIndex } = useQueue();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off");
  const [autoPlay, setAutoPlay] = useState(true);
  const [playbackError, setPlaybackError] = useState(null);
  const trackNavigatorRef = useRef(null);
  const pendingPlayRef = useRef(null);

  useEffect(() => {
    if (pendingPlayRef.current && pendingPlayRef.current !== currentTrack?.id) {
      pendingPlayRef.current = null;
    }
    loadTrack(currentTrack?.id);
    setCurrentTime(0);
    setDuration(Number.isFinite(currentTrack?.duration) ? currentTrack.duration : 0);
  }, [currentTrack?.id, loadTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const updateCurrentTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const updatePlaying = () => setIsPlaying(true);
    const updatePaused = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateCurrentTime);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", updatePlaying);
    audio.addEventListener("pause", updatePaused);
    return () => {
      audio.removeEventListener("timeupdate", updateCurrentTime);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", updatePlaying);
      audio.removeEventListener("pause", updatePaused);
    };
  }, [audioRef]);

  useEffect(() => {
    if (
      !audioSource ||
      !currentTrack ||
      audioTrackId !== currentTrack.id ||
      pendingPlayRef.current !== currentTrack.id
    ) return;
    pendingPlayRef.current = null;
    const result = play();
    result?.catch((error) => {
      setIsPlaying(false);
      setPlaybackError(error);
    });
  }, [audioSource, audioTrackId, currentTrack, play]);

  const selectTrack = useCallback((track, shouldPlay = true) => {
    if (!track) {
      pendingPlayRef.current = null;
      setCurrentTrack(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    pendingPlayRef.current = shouldPlay ? track.id : null;
    setPlaybackError(null);
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(Number.isFinite(track.duration) ? track.duration : 0);
  }, []);

  const registerTrackNavigator = useCallback((navigator) => {
    trackNavigatorRef.current = navigator;
    return () => {
      if (trackNavigatorRef.current === navigator) {
        trackNavigatorRef.current = null;
      }
    };
  }, []);

  const playRelativeTrack = useCallback((direction, options) => {
    if (trackNavigatorRef.current) {
      trackNavigatorRef.current(direction, options);
      return;
    }
    if (!queueIds.length) return;

    let nextIndex = queueIndex + direction;
    if (nextIndex < 0 || nextIndex >= queueIds.length) {
      if (repeatMode !== "all") {
        setIsPlaying(false);
        return;
      }
      nextIndex = (nextIndex + queueIds.length) % queueIds.length;
    }
    if (isShuffle && queueIds.length > 1) {
      nextIndex = pickShuffleIndex(queueIds, queueIndex);
    }
    setQueueIndex(nextIndex);
  }, [isShuffle, queueIds, queueIndex, repeatMode, setQueueIndex]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off"));
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((value) => !value);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((value) => !value);
  }, []);

  const seekTo = useCallback((time) => {
    if (Number.isFinite(time)) {
      seek(time);
      setCurrentTime(time);
    }
  }, [seek]);

  const value = useMemo(() => ({
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
    toggleShuffle,
    toggleAutoPlay,
    seekTo,
    play,
    pause,
  }), [
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    isShuffle,
    repeatMode,
    autoPlay,
    playbackError,
    selectTrack,
    playRelativeTrack,
    registerTrackNavigator,
    cycleRepeatMode,
    toggleShuffle,
    toggleAutoPlay,
    seekTo,
    play,
    pause,
  ]);

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

/**
 * Consume the playback context. Must be used within a PlaybackProvider.
 */
export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
}
