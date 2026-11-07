import {
  ArrowUpRight,
  Disc3,
  Heart,
  LoaderCircle,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { CassetteTape, EqBars, MiniCassette, SignatureScribble } from "./RemixAssets.jsx";
import { cleanTrackTitle, formatDuration } from "../utils/trackFormatting.js";

const MOODS = [
  { label: "main character", bg: "#FFD93D", fg: "#14110F", rot: -2 },
  { label: "rainy bus ride", bg: "#F28C38", fg: "#14110F", rot: 2 },
  { label: "3am thoughts", bg: "#6B4EFF", fg: "#fff", rot: -1 },
  { label: "gym delulu", bg: "#3EE0A0", fg: "#14110F", rot: 3 },
];

export default function HomeView({ home, actions }) {
  const {
    tracks, currentTrack, currentTime, duration, isPlaying, isPreparingAudio,
    queue, queueIndex, signatureName, showQueue,
  } = home;
  const {
    onNavigate, onEditSignature, onPlayTrack, onPlayQueueTrack, onTogglePlayback, onPreviousTrack,
    onNextTrack, onAddToQueue, onToggleQueue, onRemoveFromQueue, onClearQueue,
  } = actions;

  const recentlyAdded = [...tracks].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).slice(0, 5);
  const upcoming = queue.filter(({ index, track }) => (queueIndex >= 0 ? index > queueIndex : track.id !== currentTrack?.id));
  const visibleUpcoming = upcoming.slice(0, showQueue ? upcoming.length : 4);
  const stripes = ["#6B4EFF", "#F28C38", "#FFD93D", "#3EE0A0", "#F28C38"];

  return (
    <div className="rx-page rx-enter rx-home">
      <header className="rx-home-header">
        <h1 className="B rx-wordmark">nofi</h1>
        <button type="button" className="rx-sig-card rx-wg" onClick={onEditSignature} aria-label="Edit your signature">
          <SignatureScribble name={signatureName} />
        </button>
        <p className="H rx-greeting">hey you, what&apos;s the mood? <span aria-hidden="true">↷</span></p>
        <div className="rx-moods" aria-label="Moods">
          {MOODS.map((m) => (
            <button key={m.label} type="button" className="ch rx-mood" style={{ background: m.bg, color: m.fg, transform: `rotate(${m.rot}deg)` }} onClick={() => onNavigate("library")}>{m.label}</button>
          ))}
        </div>
      </header>

      <section className="rx-home-stage" aria-labelledby="now-playing-title">
        <div className="rx-polaroid-wrap">
          <div className="rx-tape-strip" aria-hidden="true" />
          <article className="bd rx-polaroid">
            <div className="rx-polaroid-art">
              <div className="rx-polaroid-feature">
                <CassetteTape
                  className="rx-polaroid-cassette"
                  width={250}
                  spinning={isPlaying}
                  label={currentTrack ? cleanTrackTitle(currentTrack.title || "mixtape") : "pick a track"}
                  artwork={currentTrack?.thumbnail}
                />
              </div>
            </div>
            <p className="H rx-polaroid-title">{currentTrack ? cleanTrackTitle(currentTrack.title) : "nothing queued"}</p>
            <p className="rx-polaroid-sub">{currentTrack ? (currentTrack.uploader || "Offline track") : "your saved tapes live here"}</p>
          </article>
        </div>

        <div className="rx-stage-controls">
          <div className="rx-now-row">
            <p className="B rx-now-label">now<br />playing</p>
            {isPlaying && <EqBars />}
          </div>
          {currentTrack ? (
            <>
              <div className="rx-home-controls">
                <button type="button" className="ib rx-mini-btn" onClick={onPreviousTrack} aria-label="Previous track"><SkipBack size={18} /></button>
                <button type="button" className={`ib rx-main-play rx-pl ${isPlaying ? "is-playing" : ""}`} onClick={onTogglePlayback} disabled={isPreparingAudio} aria-label={isPreparingAudio ? "Loading track" : isPlaying ? "Pause" : "Play"}>
                  {isPreparingAudio ? <LoaderCircle className="spin" size={28} /> : isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                </button>
                <button type="button" className="ib rx-mini-btn" onClick={onNextTrack} aria-label="Next track"><SkipForward size={18} /></button>
              </div>
              <p className="H rx-time-readout">{formatDuration(currentTime)} / {formatDuration(trackDuration)}</p>
            </>
          ) : (
            <button type="button" className="ch" style={{ background: "#FFD93D" }} onClick={() => onNavigate("library")}>open library <ArrowUpRight size={15} /></button>
          )}
        </div>
      </section>

      <div className="rx-marquee" aria-hidden="true">
        <span className="rx-mq-track">NO SKIPS ✦ NO ADS ✦ NO WIFI NEEDED ✦ NO SKIPS ✦ NO ADS ✦ NO WIFI NEEDED ✦ NO SKIPS ✦ NO ADS ✦ NO WIFI NEEDED ✦ NO SKIPS ✦ NO ADS ✦ NO WIFI NEEDED ✦ </span>
      </div>

      <section className="rx-home-tiles" aria-label="Quick actions">
        <button type="button" className="bd rx-tile rx-tile-big" style={{ background: "#F28C38" }} onClick={() => onNavigate("library")}>
          <p className="B">ur saved tapes</p><p>songs kept offline, always</p>
        </button>
        <div className="rx-tile-stack">
          <button type="button" className="bd rx-tile" style={{ background: "#3EE0A0" }} onClick={() => onNavigate("convert")}>
            <p className="B">+ add a link</p><p>paste. convert. done.</p>
          </button>
          <button type="button" className="bd rx-tile" style={{ background: "#FFD93D" }} onClick={() => onNavigate("library")}>
            <p className="B">playlists</p><p>folders & favorites</p>
          </button>
        </div>
      </section>

      <section className="rx-up-next bd" aria-labelledby="up-next-title">
        <div className="rx-up-next-head">
          <h2 id="up-next-title" className="B">up next</h2>
          <button type="button" className="rx-link" onClick={onToggleQueue}>{showQueue ? "close" : "see all"}</button>
        </div>
        {showQueue ? (
          <div className="rx-queue-expanded">
            {queue.length === 0 ? <p className="rx-muted">your queue is clear. add tracks as you listen.</p> : queue.map(({ track, index }) => (
              <div key={`${track.id}-${index}`} className={`rx-queue-row ${index === queueIndex ? "is-current" : ""}`}>
                <button type="button" className="rx-queue-play" onClick={() => onPlayQueueTrack(track, index)}>
                  <MiniCassette stripe={stripes[index % stripes.length]} />
                  <span><strong>{cleanTrackTitle(track.title)}</strong><small>{track.uploader || "Offline track"}</small></span>
                </button>
                <button type="button" className="ib rx-queue-x" onClick={() => onRemoveFromQueue(track.id)} aria-label={`Remove ${cleanTrackTitle(track.title)} from queue`}><X size={14} /></button>
              </div>
            ))}
            {queue.length > 0 && <button type="button" className="rx-link" onClick={onClearQueue}>clear queue</button>}
          </div>
        ) : upcoming.length ? (
          <div className="rx-up-next-list">
            {visibleUpcoming.map(({ track, index }) => (
              <button type="button" key={`${track.id}-${index}`} className="rx-up-next-item" onClick={() => onPlayQueueTrack(track, index)}>
                <MiniCassette stripe={stripes[index % stripes.length]} />
                <span className="rx-up-next-copy"><strong>{cleanTrackTitle(track.title)}</strong><small>{track.uploader || "Offline track"}</small></span>
                {index === queueIndex && isPlaying ? <EqBars /> : <span className="rx-num">{String(index + 1).padStart(2, "0")}</span>}
              </button>
            ))}
          </div>
        ) : (
          <p className="rx-muted">nothing waiting in the queue. <button type="button" className="rx-link" onClick={() => onNavigate("library")}>add from your library</button></p>
        )}
      </section>

      <section className="rx-recent" aria-labelledby="recently-added-title">
        <div className="rx-recent-head">
          <h2 id="recently-added-title" className="B">Fresh Tapes</h2>
          {tracks.length > 0 && <button type="button" className="rx-link" onClick={() => onNavigate("library")}>full library <ArrowUpRight size={14} /></button>}
        </div>
        {recentlyAdded.length ? (
          <div className="rx-recent-grid">
            {recentlyAdded.map((track, index) => (
              <article className="rx-recent-card" key={track.id}>
                <button type="button" className="rx-recent-art" onClick={() => onPlayTrack(track)} aria-label={`Play ${cleanTrackTitle(track.title)}`}>
                  <CassetteTape
                    className="rx-recent-cassette"
                    width={170}
                    label={cleanTrackTitle(track.title)}
                    stripe={stripes[index % stripes.length]}
                    spinning={isPlaying && currentTrack?.id === track.id}
                    artwork={track.thumbnail}
                  />
                </button>
                <button type="button" className="rx-recent-title" onClick={() => onPlayTrack(track)}>{cleanTrackTitle(track.title)}</button>
                <span className="rx-recent-artist">{track.uploader || "Offline track"}</span>
                <button type="button" className="rx-link rx-recent-q" onClick={() => onAddToQueue(track)} disabled={queue.some(({ track: q }) => q.id === track.id)}><Disc3 size={13} /> {queue.some(({ track: q }) => q.id === track.id) ? "queued" : "queue"}</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="bd rx-empty-inline"><CassetteTape width={120} label="empty" /><p>Your library is waiting for its first track. <button type="button" className="rx-link" onClick={() => onNavigate("convert")}>convert audio you can use</button></p></div>
        )}
      </section>
    </div>
  );
}
