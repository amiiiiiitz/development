import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import TrackArtwork from "./TrackArtwork.jsx";
import { CassetteTape } from "./RemixAssets.jsx";
import { cleanTrackTitle, formatDuration } from "../utils/trackFormatting.js";

export default function QueueDrawer({ open, tracks, queueIds, queueIndex, onClose, onPlayQueueTrack, onRemoveFromQueue, onClearQueue }) {
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="queue-drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside id="queue-drawer" className="queue-drawer" role="dialog" aria-modal="true" aria-label="Playback queue" aria-labelledby="queue-drawer-title">
        <div className="queue-drawer-header">
          <div>
            <h2 id="queue-drawer-title">queue</h2>
            <span>{queueIds.length} tracks</span>
          </div>
          <button ref={closeButtonRef} type="button" className="ib" style={{ width: 42, height: 42 }} onClick={onClose} aria-label="Close queue"><X size={18} /></button>
        </div>
        <div className="queue-drawer-body">
          {queueIds.length === 0 && (
            <div className="queue-empty queue-drawer-empty">
              <CassetteTape width={140} label="empty" />
              <p>No tracks in queue.</p>
            </div>
          )}
          {queueIds.map((id, index) => {
            const track = tracks.find((item) => item.id === id);
            if (!track) return null;
            const isCurrent = index === queueIndex;
            return (
              <div key={`${id}-${index}`} className={`queue-row ${isCurrent ? "active" : ""}`}>
                <button type="button" className="queue-play" onClick={() => onPlayQueueTrack(track, index)}>
                  <TrackArtwork track={track} size="small" />
                  <div className="queue-copy">
                    <strong>{cleanTrackTitle(track.title)}</strong>
                    <span>{track.uploader || track.artist || "Offline track"}</span>
                  </div>
                  <span className="queue-duration">{formatDuration(track.duration)}</span>
                </button>
                <button type="button" className="queue-remove" onClick={() => onRemoveFromQueue(id)} aria-label="Remove from queue">Remove</button>
              </div>
            );
          })}
        </div>
        <div className="queue-drawer-footer">
          <button type="button" onClick={onClearQueue} disabled={!queueIds.length}>Clear queue</button>
        </div>
      </aside>
    </div>
  );
}
