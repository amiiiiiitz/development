import { useRef, useState, useCallback, useEffect } from "react";

const AUDIO_CACHE_NAME = "mp3-offline-cache-v1";

/**
 * Low-level audio engine hook.
 * Owns the single audio element ref, Blob URL lifecycle, Cache API retrieval,
 * and play/pause/seek/volume/playbackRate operations.
 *
 * Does NOT own: current track, play state, duration, queue, repeat, shuffle,
 * Media Session, or playback statistics. Those belong to the playback layer.
 */
export function useAudioPlayer() {
  const audioRef = useRef(null);
  const audioSourceRef = useRef(null);
  const [trackId, setTrackId] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [playbackRate, setPlaybackRateState] = useState(1);

  const loadTrack = useCallback((nextTrackId) => {
    const normalizedTrackId = nextTrackId || null;
    audioRef.current?.pause();
    setTrackId(normalizedTrackId);
    setAudioSource(null);
    setAudioError(null);
    setIsPreparingAudio(Boolean(normalizedTrackId));
  }, []);

  // Load audio from Cache API when trackId changes.
  // Creates a Blob URL from the cached audio and cleans it up on unload/track change.
  useEffect(() => {
    let isCurrent = true;
    let objectUrl;

    if (!trackId) {
      audioRef.current?.pause();
      setIsPreparingAudio(false);
      setAudioSource(null);
      return undefined;
    }

    audioRef.current?.pause();
    setIsPreparingAudio(true);
    setAudioSource(null);

    const loadSavedAudio = async () => {
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const audioRequest = new Request(
          new URL(`/offline-audio/${encodeURIComponent(trackId)}`, window.location.origin)
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
        if (!isCurrent) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        audioSourceRef.current = objectUrl;
        setAudioSource(objectUrl);
        setIsPreparingAudio(false);
      } catch (audioError) {
        if (isCurrent) {
          setIsPreparingAudio(false);
          setAudioError(audioError);
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
  }, [trackId]);

  // Apply volume to the audio element.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Apply playback rate to the audio element.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, audioSource]);

  const play = useCallback(() => {
    return audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && Number.isFinite(time)) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((nextVolume) => {
    setVolumeState(nextVolume);
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    setPlaybackRateState(rate);
  }, []);

  return {
    audioRef,
    audioTrackId: trackId,
    audioSource,
    audioError,
    isPreparingAudio,
    volume,
    playbackRate,
    loadTrack,
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    setIsPreparingAudio,
  };
}