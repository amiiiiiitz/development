import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getQueue, saveQueue } from "../../db.js";

const QueueContext = createContext(null);

/**
 * QueueProvider owns queue state: ordered track IDs, current queue index,
 * add/remove/clear operations, and IndexedDB persistence.
 *
 * QueueProvider is independent of AudioProvider and PlaybackProvider.
 * It does NOT control the audio element, own currentTrack, isPlaying,
 * repeat, shuffle, playback progression, or Media Session logic.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function QueueProvider({ children }) {
  const [queueIds, setQueueIds] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [queueLoaded, setQueueLoaded] = useState(false);

  // Load persisted queue from IndexedDB when tracks are available.
  useEffect(() => {
    let active = true;
    getQueue()
      .then((ids) => {
        if (active && Array.isArray(ids)) {
          setQueueIds(ids);
          setQueueLoaded(true);
        }
      })
      .catch((error) => {
        if (active) {
          console.error("Could not load the persisted playback queue:", error);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist queueIds to IndexedDB whenever they change.
  useEffect(() => {
    if (!queueLoaded) return;
    saveQueue(queueIds).catch((error) => {
      console.error("Could not save the playback queue:", error);
    });
  }, [queueIds, queueLoaded]);

  // Validate queueIndex against queueIds length whenever queueIds change.
  useEffect(() => {
    setQueueIndex((index) => {
      if (queueIds.length === 0) {
        return -1;
      }
      if (index < 0) {
        return -1;
      }
      if (index >= queueIds.length) {
        return queueIds.length - 1;
      }
      return index;
    });
  }, [queueIds]);

  /**
   * Adds a track to the queue. Duplicates are not allowed.
   * @param {Object} song - track object with an `id` property
   */
  const addToQueue = useCallback((song) => {
    if (!song?.id) {
      return;
    }
    setQueueIds((ids) => (ids.includes(song.id) ? ids : [...ids, song.id]));
  }, []);

  /**
   * Removes a track from the queue by ID.
   * Adjusts queueIndex appropriately:
   * - If removed track was at queueIndex: points to next track (or -1 if empty).
   * - If removed track was before queueIndex: decrements queueIndex.
   * Does NOT play the next track — that is the playback layer's responsibility.
   * @param {string} songId - track ID to remove
   */
  const removeFromQueue = useCallback((songId) => {
    if (!songId) {
      return;
    }
    setQueueIds((ids) => {
      const index = ids.indexOf(songId);
      if (index === -1) {
        return ids;
      }
      const next = ids.filter((_, itemIndex) => itemIndex !== index);
      if (index === queueIndex) {
        if (next.length) {
          setQueueIndex(Math.min(index, next.length - 1));
        } else {
          setQueueIndex(-1);
        }
      } else if (index < queueIndex) {
        setQueueIndex((value) => Math.max(0, value - 1));
      }
      return next;
    });
  }, [queueIndex]);

  /**
   * Clears the entire queue and resets queueIndex to -1.
   */
  const clearQueue = useCallback(() => {
    setQueueIds([]);
    setQueueIndex(-1);
  }, []);

  const value = useMemo(
    () => ({ queueIds, queueIndex, setQueueIndex, addToQueue, removeFromQueue, clearQueue }),
    [queueIds, queueIndex, setQueueIndex, addToQueue, removeFromQueue, clearQueue]
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

/**
 * Consume the queue context. Must be used within a QueueProvider.
 * Returns { queueIds, queueIndex, addToQueue, removeFromQueue, clearQueue }.
 */
export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}
