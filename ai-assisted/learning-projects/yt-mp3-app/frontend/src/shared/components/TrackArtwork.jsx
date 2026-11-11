import { Music2 } from "lucide-react";

export default function TrackArtwork({ track, size = "normal" }) {
  return (
    <div className={`track-art track-art-${size}`}>
      {track.thumbnail ? (
        <img src={track.thumbnail} alt="" loading="lazy" />
      ) : (
        <Music2 size={size === "small" ? 18 : 24} />
      )}
    </div>
  );
}
