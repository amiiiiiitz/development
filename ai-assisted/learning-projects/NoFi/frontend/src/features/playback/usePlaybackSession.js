import { useCallback, useEffect, useRef } from "react";
import { getResumePosition, incrementTrackStats, saveResumePosition } from "../../db.js";
import { formatDuration } from "../../shared/utils/trackFormatting.js";

function pickShuffleIndex(items, excludeIndex) {
  const candidates = items.map((_, idx) => idx).filter((idx) => idx !== excludeIndex);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : -1;
}

export function usePlaybackSession({
  tracks,
  setTracks,
  activeFolderId,
  favoritesOnly,
  queueIds,
  queueIndex,
  setQueueIndex,
  queueRemoveFromQueue,
  playback,
  audio,
  setError,
}) {
  const {
    currentTrack,
    isPlaying,
    duration,
    isShuffle,
    repeatMode,
    autoPlay,
    setCurrentTrack,
    setIsPlaying,
    setDuration,
    selectTrack,
    playRelativeTrack,
    registerTrackNavigator,
  } = playback;
  const { audioRef, audioSource, audioHandlersRef } = audio;

  const transitionGuardRef = useRef(false);
  const resumeRestoredRef = useRef(false);
  const pendingResumeRef = useRef(null);
  const interruptedQueueTrackRef = useRef(null);
  const resumeSnapshotRef = useRef(null);
  const resumeSavedAtRef = useRef(0);

  const playerBarProgressRef = useRef(null);
  const playerBarCurrentTimeRef = useRef(null);
  const playerBarDurationRef = useRef(null);
  const inlineProgressRef = useRef(null);
  const inlineCurrentTimeRef = useRef(null);
  const inlineDurationRef = useRef(null);

  const currentTimeRef = useRef(0);
  const completedPlaysRef = useRef({ trackId: null, count: 0 });
  const playSessionCountedRef = useRef(false);
  const activePlaybackTrackIdRef = useRef(null);
  const lastPlaybackPositionRef = useRef(0);
  const pendingStatsRef = useRef(new Map());
  const statsWritesInFlightRef = useRef(new Set());

  const updatePlaybackDisplay = useCallback(
    (playbackPosition, trackDuration = duration || currentTrack?.duration || 0) => {
      currentTimeRef.current = playbackPosition;
      const progress = trackDuration ? Math.min(100, (playbackPosition / trackDuration) * 100) : 0;

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
    },
    [duration, currentTrack?.duration]
  );

  const flushTrackStats = useCallback(
    async (trackId) => {
      const ids = trackId ? [trackId] : [...pendingStatsRef.current.keys()];
      await Promise.all(
        ids.map(async (id) => {
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
            setTracks((existing) => existing.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
            setCurrentTrack((track) => (track?.id === updatedTrack.id ? updatedTrack : track));
          } catch (statsError) {
            setError(statsError.message || "Could not save listening statistics.");
          } finally {
            statsWritesInFlightRef.current.delete(id);
          }
        })
      );
    },
    [setTracks, setCurrentTrack, setError]
  );

  const recordTrackPlay = (trackId) => {
    if (playSessionCountedRef.current) return;
    playSessionCountedRef.current = true;
    const pending = pendingStatsRef.current.get(trackId) || { playCount: 0, listenSeconds: 0 };
    pending.playCount += 1;
    pendingStatsRef.current.set(trackId, pending);
    void flushTrackStats(trackId);
  };

  const rememberResume = (trackId, position, { force = false } = {}) => {
    if (!trackId || !Number.isFinite(position)) return;
    resumeSnapshotRef.current = { trackId, position };
    const now = Date.now();
    if (force || now - resumeSavedAtRef.current >= 5000) {
      resumeSavedAtRef.current = now;
      saveResumePosition(trackId, position).catch(() => {});
    }
  };

  const recordPlaybackTime = (audioEl, trackId = activePlaybackTrackIdRef.current) => {
    const playbackPosition = audioEl.currentTime;
    const elapsed = playbackPosition - lastPlaybackPositionRef.current;
    lastPlaybackPositionRef.current = playbackPosition;

    if (currentTrack?.id === trackId) {
      updatePlaybackDisplay(playbackPosition);
      rememberResume(trackId, playbackPosition);
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

  const appSelectTrack = useCallback(
    (track, shouldPlay = true, fromQueue = false) => {
      if (currentTrack && currentTrack.id !== track.id) {
        void flushTrackStats(currentTrack.id);
      }
      playSessionCountedRef.current = false;
      lastPlaybackPositionRef.current = 0;
      completedPlaysRef.current = { trackId: track.id, count: 0 };
      if (!fromQueue) {
        const isInterruptingQueueTrack =
          queueIndex >= 0 && queueIds[queueIndex] === currentTrack?.id && !audioRef.current?.ended;
        if (isInterruptingQueueTrack) {
          interruptedQueueTrackRef.current = {
            trackId: currentTrack.id,
            index: queueIndex,
            time: audioRef.current?.currentTime || 0,
          };
        }
        setQueueIndex(-1);
      } else {
        interruptedQueueTrackRef.current = null;
      }
      selectTrack(track, shouldPlay);
      updatePlaybackDisplay(0, Number.isFinite(track.duration) ? track.duration : 0);
    },
    [
      audioRef,
      currentTrack,
      flushTrackStats,
      queueIds,
      queueIndex,
      selectTrack,
      setQueueIndex,
      updatePlaybackDisplay,
    ]
  );

  const appPlayRelativeTrack = useCallback(
    (direction, { wrap = false } = {}) => {
      // When a queue exists, prev/next navigate the queue; otherwise the library list.
      if (queueIds.length > 0) {
        let activeQueueIndex = queueIndex;
        if (!(activeQueueIndex >= 0 && queueIds[activeQueueIndex] === currentTrack?.id)) {
          const foundIndex = currentTrack ? queueIds.indexOf(currentTrack.id) : -1;
          activeQueueIndex = foundIndex >= 0 ? foundIndex : -1;
        }

        if (direction > 0) {
          let nextIndex = -1;
          if (isShuffle && queueIds.length > 1) {
            nextIndex = pickShuffleIndex(queueIds, activeQueueIndex >= 0 ? activeQueueIndex : -1);
          } else {
            nextIndex = activeQueueIndex + 1;
            if (nextIndex >= queueIds.length) {
              if (repeatMode === "all") nextIndex = 0;
              else {
                // Queue exhausted on the right: fall back to the library list.
                return navigateLibraryList(direction, wrap);
              }
            }
          }
          const nextTrack = tracks.find((track) => track.id === queueIds[nextIndex]);
          if (nextTrack) {
            setQueueIndex(nextIndex);
            appSelectTrack(nextTrack, true, true);
            return;
          }
          // Queue track missing: fall back to the library list.
          return navigateLibraryList(direction, wrap);
        }

        if (activeQueueIndex > 0) {
          const previousTrack = tracks.find((track) => track.id === queueIds[activeQueueIndex - 1]);
          if (previousTrack) {
            setQueueIndex(activeQueueIndex - 1);
            appSelectTrack(previousTrack, true, true);
            return;
          }
          // Queue track missing: fall back to the library list.
          return navigateLibraryList(direction, wrap);
        }

        if (currentTrack && audioRef.current) {
          audioRef.current.currentTime = 0;
        }
        // At the first queue track going back: fall back to the library list.
        return navigateLibraryList(direction, wrap);
      }

      return navigateLibraryList(direction, wrap);

      function navigateLibraryList(direction, wrap) {
        const playlist =
          activeFolderId === "all"
            ? tracks
            : tracks.filter((track) => (track.folderId || "unfiled") === activeFolderId);
        const filteredPlaylist = favoritesOnly ? playlist.filter((track) => track.favorite) : playlist;
        if (!filteredPlaylist.length) return;

        const currentIndex = filteredPlaylist.findIndex((track) => track.id === currentTrack?.id);
        let nextIndex;
        if (isShuffle && direction > 0 && filteredPlaylist.length > 1) {
          nextIndex = pickShuffleIndex(filteredPlaylist, currentIndex);
        } else if (currentIndex === -1) {
          nextIndex = direction > 0 ? 0 : filteredPlaylist.length - 1;
        } else {
          // Always wrap: last song -> first song, first song -> last song.
          nextIndex = (currentIndex + direction + filteredPlaylist.length) % filteredPlaylist.length;
        }
        appSelectTrack(filteredPlaylist[nextIndex]);
      }
    },
    [
      queueIds,
      queueIndex,
      setQueueIndex,
      isShuffle,
      repeatMode,
      tracks,
      currentTrack,
      audioRef,
      activeFolderId,
      favoritesOnly,
      appSelectTrack,
    ]
  );

  useEffect(
    () => registerTrackNavigator(appPlayRelativeTrack),
    [registerTrackNavigator, appPlayRelativeTrack]
  );

  // Restore last playing track & position on startup
  useEffect(() => {
    if (resumeRestoredRef.current || !tracks.length) return;
    resumeRestoredRef.current = true;
    if (currentTrack) return;

    getResumePosition()
      .then((saved) => {
        if (!saved?.trackId || (audioRef.current && !audioRef.current.paused)) return;
        const track = tracks.find((item) => item.id === saved.trackId);
        if (!track || track.downloaded === false) return;
        const length = Number.isFinite(track.duration) ? track.duration : 0;
        const nearEnd = length > 0 && saved.time >= length - 3;
        pendingResumeRef.current = { trackId: track.id, time: nearEnd ? 0 : Math.max(0, saved.time || 0) };
        appSelectTrack(track, false);
      })
      .catch(() => {});
  }, [tracks, currentTrack, audioRef, appSelectTrack]);

  // Flush stats & save resume position on page hide
  useEffect(() => {
    const saveStatsWhenLeaving = () => {
      if (document.visibilityState === "hidden") {
        void flushTrackStats();
        const heard = resumeSnapshotRef.current;
        if (heard) {
          saveResumePosition(heard.trackId, heard.position).catch(() => {});
        }
      }
    };
    window.addEventListener("pagehide", saveStatsWhenLeaving);
    document.addEventListener("visibilitychange", saveStatsWhenLeaving);
    return () => {
      window.removeEventListener("pagehide", saveStatsWhenLeaving);
      document.removeEventListener("visibilitychange", saveStatsWhenLeaving);
    };
  }, [flushTrackStats]);

  const handleTrackEnded = () => {
    if (transitionGuardRef.current) return;
    transitionGuardRef.current = true;
    window.setTimeout(() => {
      transitionGuardRef.current = false;
    }, 0);

    void flushTrackStats();
    playSessionCountedRef.current = false;

    const completedPlays =
      completedPlaysRef.current.trackId === currentTrack?.id ? completedPlaysRef.current.count + 1 : 1;
    completedPlaysRef.current = { trackId: currentTrack?.id || null, count: completedPlays };

    const playCountLimit = currentTrack?.playCountLimit ?? 1;
    if (repeatMode === "one" || playCountLimit === "forever" || completedPlays < playCountLimit) {
      const audioEl = audioRef.current;
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch((playError) => {
          setIsPlaying(false);
          setError(playError.message || "Could not replay this track.");
        });
      }
      return;
    }

    const isActiveQueueTrack =
      queueIds.length > 0 && queueIndex >= 0 && queueIds[queueIndex] === currentTrack?.id;
    if (isActiveQueueTrack) {
      let nextIndex = -1;
      if (isShuffle && queueIds.length > 1) {
        nextIndex = pickShuffleIndex(queueIds, queueIndex);
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queueIds.length && repeatMode === "all") nextIndex = 0;
        else if (nextIndex >= queueIds.length) nextIndex = -1;
      }
      if (nextIndex >= 0 && nextIndex < queueIds.length) {
        const nextTrack = tracks.find((track) => track.id === queueIds[nextIndex]);
        if (nextTrack) {
          setQueueIndex(nextIndex);
          appSelectTrack(nextTrack, true, true);
          return;
        }
      }
      // The queue is exhausted. Let Autoplay select the next library track
      // below instead of stopping before the Autoplay setting is considered.
      if (!autoPlay && repeatMode !== "all") {
        setIsPlaying(false);
        return;
      }
    } else if (queueIds.length > 0) {
      // Queue exists but current track isn't in it: advance through the queue from the start.
      const nextTrack = tracks.find((track) => track.id === queueIds[0]);
      if (nextTrack) {
        setQueueIndex(0);
        appSelectTrack(nextTrack, true, true);
        return;
      }
      if (!autoPlay && repeatMode !== "all") {
        setIsPlaying(false);
        return;
      }
    }

    if (autoPlay && interruptedQueueTrackRef.current) {
      const interrupted = interruptedQueueTrackRef.current;
      const interruptedTrack = tracks.find((track) => track.id === interrupted.trackId);
      interruptedQueueTrackRef.current = null;
      if (interruptedTrack) {
        pendingResumeRef.current = {
          trackId: interruptedTrack.id,
          time: interrupted.time,
        };
        setQueueIndex(interrupted.index);
        appSelectTrack(interruptedTrack, true, true);
        return;
      }
    }

    if (repeatMode === "all" || autoPlay) {
      const playlist =
        activeFolderId === "all"
          ? tracks
          : tracks.filter((track) => (track.folderId || "unfiled") === activeFolderId);
      const filteredPlaylist = favoritesOnly ? playlist.filter((track) => track.favorite) : playlist;
      if (!filteredPlaylist.length) {
        setIsPlaying(false);
        return;
      }
      const currentIndex = filteredPlaylist.findIndex((track) => track.id === currentTrack?.id);
      let nextIndex;
      if (isShuffle && filteredPlaylist.length > 1) {
        nextIndex = pickShuffleIndex(filteredPlaylist, currentIndex);
      } else {
        // Always wrap: last song -> first song, and continue looping.
        nextIndex = (currentIndex + 1 + filteredPlaylist.length) % filteredPlaylist.length;
      }
      appSelectTrack(filteredPlaylist[nextIndex]);
      return;
    }
    setIsPlaying(false);
  };

  const playTrack = (track) => {
    const audioEl = audioRef.current;
    if (currentTrack?.id === track.id) {
      if (audioEl && !audioEl.paused) {
        audioEl.pause();
        return;
      }
      if (audioEl && audioEl.ended) {
        audioEl.currentTime = 0;
        completedPlaysRef.current = { trackId: track.id, count: 0 };
      }
      if (!audioSource) {
        appSelectTrack(track, true);
        return;
      }
      audioEl?.play().catch((playError) => {
        setIsPlaying(false);
        setError(playError.message || "Could not play this track.");
      });
      return;
    }
    appSelectTrack(track);
  };

  const togglePlayback = () => {
    const audioEl = audioRef.current;
    if (!audioEl || !currentTrack) return;
    if (audioEl.paused) {
      if (audioEl.ended) {
        audioEl.currentTime = 0;
        completedPlaysRef.current = { trackId: currentTrack.id, count: 0 };
      }
      audioEl.play().catch((playError) => {
        setIsPlaying(false);
        setError(playError.message || "Could not play this track.");
      });
    } else {
      audioEl.pause();
    }
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
    const audioEl = audioRef.current;
    const nextTime = Number(event.target.value);
    if (!audioEl || currentTrack?.id !== track.id || !Number.isFinite(nextTime)) return;
    audioEl.currentTime = nextTime;
    lastPlaybackPositionRef.current = nextTime;
    updatePlaybackDisplay(nextTime);
  };

  const removeFromQueue = (songId) => {
    if (!songId) return;
    const index = queueIds.indexOf(songId);
    if (index === -1) return;
    const wasCurrent = index === queueIndex;
    const nextQueueIds = queueIds.filter((_, i) => i !== index);
    queueRemoveFromQueue(songId);

    if (wasCurrent && nextQueueIds.length && index < nextQueueIds.length) {
      const nextTrack = tracks.find((track) => track.id === nextQueueIds[index]);
      if (nextTrack) appSelectTrack(nextTrack, true, true);
    }
  };

  audioHandlersRef.current = {
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
        if (pausedTrackId === currentTrack?.id) {
          rememberResume(pausedTrackId, audioRef.current.currentTime, { force: true });
        }
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
      const pendingResume = pendingResumeRef.current;
      if (pendingResume && Number.isFinite(event.currentTarget.duration)) {
        pendingResumeRef.current = null;
        if (pendingResume.trackId === currentTrack?.id && pendingResume.time > 0) {
          event.currentTarget.currentTime = Math.min(
            pendingResume.time,
            Math.max(0, event.currentTarget.duration - 1)
          );
        }
      }
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

  return {
    playerBarProgressRef,
    playerBarCurrentTimeRef,
    playerBarDurationRef,
    inlineProgressRef,
    inlineCurrentTimeRef,
    inlineDurationRef,
    completedPlaysRef,
    pendingStatsRef,
    flushTrackStats,
    updatePlaybackDisplay,
    appPlayRelativeTrack,
    appSelectTrack,
    playTrack,
    togglePlayback,
    appSeekTo,
    seekTrack,
    removeFromQueue,
  };
}


