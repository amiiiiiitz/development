import {
  LoaderCircle,
  ListMusic,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import MicrophoneIcon from "./MicrophoneIcon.jsx";
import MusicPlayIcon from "./MusicPlayIcon.jsx";
import TrackArtwork from "./TrackArtwork.jsx";
import { cleanTrackTitle, formatDuration } from "../../shared/utils/trackFormatting.js";

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlayerDock({ player, actions }) {
  const {
    currentTrack, currentTime, duration, isPlaying, isPreparingAudio, isShuffle, repeatMode,
    tracksLength, volume, playbackRate, autoPlay, queueOpen, playerProgressRef,
    playerCurrentTimeRef, playerRemainingTimeRef,
  } = player;
  const {
    onToggleShuffle, onPreviousTrack, onNextTrack, onTogglePlayback, onCycleRepeatMode,
    onPlaybackRateChange, onToggleVolume, onVolumeChange, onToggleAutoPlay, onSeek, onToggleQueue,
  } = actions;
  const trackDuration = duration || currentTrack?.duration || 0;

  return (
    <div className={`player-dock ${player.currentPage === "playing" ? "is-now-playing" : ""}`}>
      <div className="player-inner">
        <div className="player-track">
          {currentTrack ? (
            <>
              <TrackArtwork track={currentTrack} size="small" />
              <div className="player-copy">
                <strong>{cleanTrackTitle(currentTrack.title)}</strong>
                <span>{currentTrack.uploader || currentTrack.artist || "Offline track"}</span>
              </div>
            </>
          ) : (
            <>
              <div className="player-placeholder"><MusicPlayIcon size={18} /></div>
              <div className="player-copy"><strong>nothing playing</strong><span>your next favorite is close.</span></div>
            </>
          )}
        </div>

        <div className="player-controls" aria-label="Playback controls">
          <button type="button" className={`player-mode-button ${isShuffle ? "is-active" : ""}`} onClick={onToggleShuffle} disabled={tracksLength < 2} aria-label={isShuffle ? "Turn shuffle off" : "Turn shuffle on"} aria-pressed={isShuffle} title="Shuffle"><Shuffle size={17} /></button>
          <button type="button" className="player-mode-button" onClick={onPreviousTrack} disabled={!tracksLength} aria-label="Previous track"><SkipBack size={18} fill="currentColor" /></button>
          <button type="button" className="main-play-button" onClick={onTogglePlayback} disabled={!currentTrack || isPreparingAudio} aria-label={isPreparingAudio ? "Loading track" : isPlaying ? "Pause" : "Play"}>
            {isPreparingAudio ? <LoaderCircle className="spin" size={18} /> : isPlaying ? <Pause size={18} fill="currentColor" /> : <MusicPlayIcon size={20} />}
          </button>
          <button type="button" className="player-mode-button" onClick={onNextTrack} disabled={!tracksLength} aria-label="Next track"><SkipForward size={18} fill="currentColor" /></button>
          <button type="button" className={`player-mode-button ${repeatMode !== "off" ? "is-active" : ""}`} onClick={onCycleRepeatMode} aria-label={`Repeat ${repeatMode}`} aria-pressed={repeatMode !== "off"} title={`Repeat ${repeatMode}`}>{repeatMode === "one" ? <Repeat1 size={17} /> : <Repeat size={17} />}</button>
        </div>

        <div className="player-options">
          <label className="playback-speed-control"><span>speed</span>
            <select value={playbackRate} onChange={(e) => onPlaybackRateChange(Number(e.target.value))} aria-label="Playback speed">
              {PLAYBACK_SPEEDS.map((speed) => <option value={speed} key={speed}>{speed}Ã—</option>)}
            </select>
          </label>
          <div className="volume-control">
            <button type="button" className="player-mode-button volume-button" onClick={onToggleVolume} aria-label={volume > 0 ? "Mute" : "Unmute"}><MicrophoneIcon muted={volume <= 0} /></button>
            <input className="volume-slider" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} aria-label="Volume" style={{ "--volume": `${volume * 100}%` }} />
          </div>
          <button type="button" className={`autoplay-toggle ${autoPlay ? "is-active" : ""}`} onClick={onToggleAutoPlay} aria-pressed={autoPlay}>AUTO <span>{autoPlay ? "ON" : "OFF"}</span></button>
          <button type="button" className={`player-mode-button ${queueOpen ? "is-active" : ""}`} onClick={onToggleQueue} aria-label="Toggle queue" aria-expanded={queueOpen} aria-controls="queue-drawer"><ListMusic size={17} /></button>
          {currentTrack && <span className="player-status"><span className={isPlaying ? "equalizer playing" : "equalizer"}><i /><i /><i /><i /></span>{isPlaying ? "PLAYING" : "READY"}</span>}
        </div>

        <div className="player-progress">
          <span ref={playerCurrentTimeRef} className="progress-time">{formatDuration(currentTime)}</span>
          <input ref={playerProgressRef} className="progress-slider" type="range" min="0" max={trackDuration} step="0.1" defaultValue={Math.min(currentTime, trackDuration)} onChange={onSeek} disabled={!currentTrack || !trackDuration} aria-label="Seek through track" style={{ "--progress": `${trackDuration ? (currentTime / trackDuration) * 100 : 0}%` }} />
          <span ref={playerRemainingTimeRef} className="progress-time remaining-time">{formatDuration(trackDuration)}</span>
        </div>
      </div>
    </div>
  );
}
