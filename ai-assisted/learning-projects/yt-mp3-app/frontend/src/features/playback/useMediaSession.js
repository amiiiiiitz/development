import { useEffect } from "react";
import { useAudio } from "../audio/index.jsx";
import { usePlayback } from "./usePlayback.jsx";

const MEDIA_ACTIONS = [
  "play",
  "pause",
  "previoustrack",
  "nexttrack",
  "seekto",
  "seekbackward",
  "seekforward",
];

export function useMediaSession() {
  const { play, pause, playbackRate } = useAudio();
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    setIsPlaying,
    seekTo,
    playRelativeTrack,
  } = usePlayback();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    if (!currentTrack) {
      session.metadata = null;
      return;
    }

    if (typeof window.MediaMetadata === "function") {
      session.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.uploader || "Offline track",
        album: "NoFi Offline Library",
        ...(currentTrack.thumbnail
          ? { artwork: [{ src: currentTrack.thumbnail, sizes: "512x512", type: "image/jpeg" }] }
          : {}),
      });
    }
  }, [currentTrack]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return undefined;
    const session = navigator.mediaSession;
    if (!currentTrack) {
      MEDIA_ACTIONS.forEach((action) => {
        try {
          session.setActionHandler(action, null);
        } catch {
          // Ignore actions unsupported by this browser.
        }
      });
      return undefined;
    }

    const setHandler = (action, handler) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Ignore actions unsupported by this browser.
      }
    };

    setHandler("play", () => {
      if (!isPlaying) {
        const result = play();
        result?.catch(() => setIsPlaying(false));
      }
    });
    setHandler("pause", pause);
    setHandler("previoustrack", () => playRelativeTrack(-1));
    setHandler("nexttrack", () => playRelativeTrack(1));
    setHandler("seekto", ({ seekTime }) => {
      if (Number.isFinite(seekTime)) seekTo(seekTime);
    });
    setHandler("seekbackward", ({ seekOffset = 10 } = {}) => {
      seekTo(Math.max(0, currentTime - seekOffset));
    });
    setHandler("seekforward", ({ seekOffset = 10 } = {}) => {
      const trackDuration = duration || currentTrack.duration || 0;
      seekTo(Math.min(trackDuration, currentTime + seekOffset));
    });

    return () => {
      MEDIA_ACTIONS.forEach((action) => {
        try {
          session.setActionHandler(action, null);
        } catch {
          // Ignore actions unsupported by this browser.
        }
      });
    };
  }, [
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    play,
    pause,
    setIsPlaying,
    seekTo,
    playRelativeTrack,
  ]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !currentTrack) return;
    const trackDuration = duration || currentTrack.duration || 0;
    if (!trackDuration) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: trackDuration,
        playbackRate,
        position: Math.min(currentTime, trackDuration),
      });
    } catch {
      // Ignore position-state errors in browsers without support.
    }
  }, [currentTrack, currentTime, duration, playbackRate]);
}
