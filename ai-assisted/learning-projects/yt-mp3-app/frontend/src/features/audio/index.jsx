import { createContext, useContext, useMemo, useRef } from "react";
import { useAudioPlayer } from "./useAudioPlayer.js";

const AudioContext = createContext(null);

/**
 * AudioProvider owns the single audio element and all low-level audio-engine
 * responsibilities: Blob URL lifecycle, Cache API retrieval, play/pause/seek/
 * volume/playbackRate, and audio preparation state.
 *
 * It renders the <audio> element and exposes event callbacks through the
 * context. Playback state and progression are owned by PlaybackProvider.
 *
 * The provider owns the shared audio element. Consumers may update its event
 * handlers without remounting it through the returned audioHandlersRef.
 */
export function AudioProvider({ children }) {
  const {
    audioRef,
    audioTrackId,
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
  } = useAudioPlayer();
  const audioHandlersRef = useRef({});

  const value = useMemo(
    () => ({
      audioRef,
      audioTrackId,
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
      audioHandlersRef,
    }),
    [
      audioRef,
      audioTrackId,
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
      audioHandlersRef,
    ]
  );

  return (
    <AudioContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={audioSource || undefined}
        onPlay={(event) => audioHandlersRef.current.onPlay?.(event)}
        onPause={(event) => audioHandlersRef.current.onPause?.(event)}
        onTimeUpdate={(event) => audioHandlersRef.current.onTimeUpdate?.(event)}
        onSeeking={(event) => audioHandlersRef.current.onSeeking?.(event)}
        onLoadedMetadata={(event) => audioHandlersRef.current.onLoadedMetadata?.(event)}
        onDurationChange={(event) => audioHandlersRef.current.onDurationChange?.(event)}
        onEnded={(event) => audioHandlersRef.current.onEnded?.(event)}
        onError={(event) => audioHandlersRef.current.onError?.(event)}
        preload="metadata"
      />
      {children}
    </AudioContext.Provider>
  );
}

/**
 * Consume the audio engine context. Must be used within an AudioProvider.
 * Returns the shared audio element, source/loading/error state, operations,
 * settings, and audio event-handler ref.
 */
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}