import {
  ArrowDownToLine,
  Heart,
  LoaderCircle,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Gauge,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CassetteTape, EqBars, MiniCassette } from "../../shared/components/RemixAssets.jsx";
import { cleanTrackTitle, formatDuration } from "../../shared/utils/trackFormatting.js";
import { MusicFlow } from "../../app/shell/ui.jsx";

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function NowPlayingView({ player, queue, actions }) {
  const {
    currentTrack, currentTime, duration, isPlaying, isPreparingAudio,
    isShuffle, repeatMode, queueIndex, volume, playbackRate, autoPlay,
  } = player;
  const {
    onTogglePlayback, onPreviousTrack, onNextTrack, onToggleShuffle,
    onCycleRepeatMode, onSeek, onToggleFavorite, onPlayQueueTrack, onDownloadTrack,
    onOpenPlaylists, onToggleVolume, onVolumeChange, onPlaybackRateChange, onToggleAutoPlay,
  } = actions;
  const trackDuration = duration || currentTrack?.duration || 0;
  const title = currentTrack ? cleanTrackTitle(currentTrack.title) : "nothing playing";
  const channel = currentTrack?.uploader || currentTrack?.artist || "your next favorite is close";
  const playCount = currentTrack?.playCount || 0;
  const stripes = ["var(--peach)", "var(--pistachio)", "var(--peach)", "var(--lilac)", "var(--peach)"];

  return (
    <div className="rx-page rx-enter rx-playing-view">
      <header className="rx-playing-header">
        <h1 className="B">now playing</h1>
        <button
          type="button"
          className={`ib rx-playing-heart ${currentTrack?.favorite ? "is-on" : ""}`}
          onClick={() => currentTrack && onToggleFavorite(currentTrack)}
          disabled={!currentTrack}
          aria-label={currentTrack?.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={Boolean(currentTrack?.favorite)}
        >
          <Heart size={20} fill={currentTrack?.favorite ? "currentColor" : "none"} />
        </button>
      </header>

      <div className="rx-np-split">
        <section className="rx-np-main" aria-label="Current track">
          <div className="rx-np-art">
            <CassetteTape
              width={520}
              spinning={isPlaying}
              label={title.slice(0, 18)}
              artwork={currentTrack?.thumbnail}
            />
            <span className="ch rx-np-badge">no skips</span>
          </div>
          <div className="rx-np-title-row">
            <div className="rx-np-copy">
              <h2 className="B" title={title}>{title}</h2>
              <p>{channel} {playCount > 0 && <span style={{ opacity: 0.7, marginLeft: 8 }}><Repeat size={14} /> {playCount}</span>}</p>
            </div>
            {isPlaying && <EqBars />}
          </div>
          <input
            className="rx-np-seek"
            type="range"
            min="0"
            max={trackDuration}
            step="0.1"
            value={Math.min(currentTime, trackDuration)}
            onChange={onSeek}
            disabled={!currentTrack || !trackDuration}
            aria-label="Seek through track"
            style={{ "--progress": `${trackDuration ? (currentTime / trackDuration) * 100 : 0}%` }}
          />
          <div className="rx-np-times"><span>{formatDuration(currentTime)}</span><span>{formatDuration(trackDuration)}</span></div>
          <div className="rx-np-controls" aria-label="Playback controls">
            <button type="button" className={`ib ${isShuffle ? "is-active" : ""}`} onClick={onToggleShuffle} disabled={!currentTrack} aria-label={isShuffle ? "Turn shuffle off" : "Turn shuffle on"} aria-pressed={isShuffle}><Shuffle size={18} /></button>
            <button type="button" className="ib" onClick={onPreviousTrack} disabled={!currentTrack} aria-label="Previous track"><SkipBack size={20} /></button>
            <span className="play-wrap">
              <button type="button" className={`ib rx-np-play pl ${isPlaying ? "is-playing" : ""}`} onClick={onTogglePlayback} disabled={!currentTrack || isPreparingAudio} aria-label={isPreparingAudio ? "Loading track" : isPlaying ? "Pause" : "Play"}>
                {isPreparingAudio ? <LoaderCircle className="spin" size={24} /> : isPlaying ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" />}
              </button>
              <MusicFlow playing={isPlaying} />
            </span>
            <button type="button" className="ib" onClick={onNextTrack} disabled={!currentTrack} aria-label="Next track"><SkipForward size={20} /></button>
            <button type="button" className={`ib ${repeatMode !== "off" ? "is-active" : ""}`} onClick={onCycleRepeatMode} disabled={!currentTrack} aria-label={`Repeat ${repeatMode}`} aria-pressed={repeatMode !== "off"}>{repeatMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}</button>
          </div>
          <div className="rx-np-actions">
            <button type="button" className="ch btn-save rx-np-save" onClick={() => currentTrack && onDownloadTrack(currentTrack)} disabled={!currentTrack}><ArrowDownToLine size={17} /> save mp3</button>
            <button type="button" className="ch btn-secondary" onClick={onOpenPlaylists}>+ playlist</button>
          </div>
          <div className="bd mt-[18px] flex flex-wrap items-center justify-center gap-3 p-3" role="group" aria-label="Listening settings">
            <div className="flex w-44 min-w-0 items-center gap-2">
              <button type="button" className="ib" onClick={onToggleVolume} aria-label={volume > 0 ? "Mute" : "Unmute"}>
                {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <input
                type="range"
                className="min-w-0 flex-1"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
                aria-label="Volume"
                style={{ "--progress": `${volume * 100}%` }}
              />
            </div>
            <label className="ch rx-sort-chip"><Gauge size={14} aria-hidden="true" />
              <select value={playbackRate} onChange={(event) => onPlaybackRateChange(Number(event.target.value))} aria-label="Playback speed">
                {PLAYBACK_SPEEDS.map((speed) => <option value={speed} key={speed}>{speed}×</option>)}
              </select>
            </label>
            <button type="button" className="ch" aria-pressed={autoPlay} onClick={onToggleAutoPlay} style={autoPlay ? { background: "var(--rx-yellow)" } : undefined}>
              Autoplay: {autoPlay ? "on" : "off"}
            </button>
          </div>
        </section>

        <aside className="bd rx-np-queue" aria-label="Up next">
          <h2 className="B">Up Next</h2>
          {queue.length ? (
            <div className="rx-np-queue-list">
              {queue.map(({ track, index }) => {
                const playCount = track.playCount || 0;
                return (
                  <button
                    type="button"
                    key={`${track.id}-${index}`}
                    className={`rx-np-queue-row ${index === queueIndex ? "is-current" : ""}`}
                    onClick={() => onPlayQueueTrack(track, index)}
                  >
                    <MiniCassette stripe={stripes[index % stripes.length]} />
                    <span><strong>{cleanTrackTitle(track.title)}</strong><small>{track.uploader || "Offline track"} {playCount > 0 && `· ▷ ${playCount}`}</small></span>
                    {index === queueIndex && isPlaying ? <EqBars /> : <small>{formatDuration(track.duration)}</small>}
                  </button>
                );
              })}
            </div>
          ) : <p className="rx-muted">Your queue is empty.</p>}
          <button type="button" className="rx-link rx-np-queue-link" onClick={onOpenPlaylists}>add songs from your library</button>
        </aside>
      </div>
    </div>
  );
}


