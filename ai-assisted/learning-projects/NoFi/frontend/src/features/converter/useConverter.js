import { useEffect, useState } from "react";
import { getAllTracksMetadata, saveTrackMetadata, updateTrackMetadata } from "../../db.js";
import { AUDIO_CACHE_NAME, audioCacheRequest } from "../../shared/constants/storage.js";
import { convertVideoToAudio, fetchVideoInfo } from "../../shared/services/videoApi.js";
import { cleanTrackTitle, createTrackId } from "../../shared/utils/trackFormatting.js";

export function useConverter({
  isOnline,
  setTracks,
  refreshLibrary,
  selectTrack,
  completedPlaysRef,
  onSavedSuccess,
  setError,
  setNotice,
}) {
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let interval = null;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/health`);
        if (response.ok) {
          if (!cancelled) setBackendReady(true);
          return true;
        }
      } catch {
        // Backend waking up.
      }
      if (!cancelled) setBackendReady(false);
      return false;
    };

    void checkHealth().then((ready) => {
      if (ready || cancelled) return;
      interval = window.setInterval(async () => {
        const nextReady = await checkHealth();
        if (nextReady && interval !== null) {
          window.clearInterval(interval);
          interval = null;
        }
      }, 3000);
    });

    return () => {
      cancelled = true;
      if (interval !== null) window.clearInterval(interval);
    };
  }, []);

  const isBackendUnavailable = (error) => {
    if (error?.status === 502 || error?.status === 503) {
      return true;
    }
    const message = String(error?.message || "");
    return (
      error instanceof TypeError ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("Failed to fetch") ||
      message.includes("network")
    );
  };

  const waitForBackendReady = async (maxMs = 30000) => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (backendReady) return true;
      if (await checkHealth()) return true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return backendReady;
  };

  const checkBackendReady = async () => {
    await checkHealth();
  };

  const loadVideoInfo = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!navigator.onLine || !isOnline) {
      setNotice("You're offline. Reconnect to preview and download tracks.");
      return;
    }
    if (!backendReady) {
      const ready = await waitForBackendReady();
      if (!ready) {
        setError("The converter is not responding. Please try again later.");
        return;
      }
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

  const convertAndSave = async (attempt = 1) => {
    if (isConverting) return;
    if (!navigator.onLine || !isOnline) {
      setError("");
      setNotice("You're offline. Reconnect to download this track.");
      return;
    }
    if (!video) {
      setError("Load video details before converting.");
      return;
    }

    if (!backendReady) {
      const ready = await waitForBackendReady();
      if (!ready) {
        setError("The converter is not responding. Please try again later.");
        return;
      }
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
        setNotice("You already have this track.");
        return;
      }

      const audioBlob = await convertVideoToAudio(url);
      if (!audioBlob.size) throw new Error("The converted audio file was empty.");
      if (!("caches" in window)) throw new Error("This browser does not support offline audio storage.");

      const cache = await caches.open(AUDIO_CACHE_NAME);
      const audioRequest = audioCacheRequest(id);
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

      onSavedSuccess();
      setTracks((existing) => [savedTrack, ...existing]);
      selectTrack(savedTrack, false);
      completedPlaysRef.current = { trackId: savedTrack.id, count: 0 };
      setNotice("Saved to your offline library. Ready to play anywhere.");
      setUrl("");
      setVideo(null);
    } catch (convertError) {
      // Retry once on transient backend unavailability (cold start / network blip).
      if (attempt === 1 && navigator.onLine && isBackendUnavailable(convertError)) {
        await waitForBackendReady();
        return convertAndSave(2);
      }
      if (!navigator.onLine) {
        setNotice("You're offline. Reconnect to download this track.");
      } else {
        setError(convertError.message || "Conversion failed. Please try again.");
      }
    } finally {
      setIsConverting(false);
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
      if (!backendReady) {
        const ready = await waitForBackendReady();
        if (!ready) {
          setError("The converter is not responding. Please try again later.");
          return;
        }
      }
      const audioBlob = await convertVideoToAudio(`https://www.youtube.com/watch?v=${track.videoId}`);
      if (!audioBlob.size) throw new Error("The converted audio file was empty.");
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const audioRequest = audioCacheRequest(track.id);
      await cache.put(
        audioRequest,
        new Response(audioBlob, {
          headers: {
            "Content-Type": audioBlob.type || "audio/mpeg",
            "Content-Length": String(audioBlob.size),
          },
        })
      );
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

  const resetForm = () => {
    setUrl("");
    setVideo(null);
  };

  return {
    url,
    setUrl,
    video,
    setVideo,
    isLoadingInfo,
    isConverting,
    backendReady,
    loadVideoInfo,
    convertAndSave,
    reDownloadTrack,
    resetForm,
    checkBackendReady,
  };
}


