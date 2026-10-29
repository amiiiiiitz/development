import {
  LoaderCircle,
  Music2,
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
import { cleanTrackTitle, formatDuration } from "../utils/trackFormatting.js";

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlayerDock({ player, actions }) {
  const {
    audioRef,
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    isPreparingAudio,
    isShuffle,
    repeatMode,
    tracksLength,
    volume,
    playbackRate,
    autoPlay,
    audioSource,
    playerProgressRef,
    playerCurrentTimeRef,
    playerRemainingTimeRef,
  } = player;
  const {
    onToggleShuffle,
    onPreviousTrack,
    onNextTrack,
    onTogglePlayback,
    onCycleRepeatMode,
    onPlaybackRateChange,
    onToggleVolume,
    onVolumeChange,
    onToggleAutoPlay,
    onSeek,
    audioHandlers,
  } = actions;
  const trackDuration = duration || currentTrack?.duration || 0;
  const remainingTime = Math.max(0, trackDuration - currentTime);

  return (
    <div className="player-dock">
      <div className="player-inner">
        <div className="player-track">
          {currentTrack ? (
            <>
              <TrackArtwork track={currentTrack} size="small" />
              <div className="player-copy"><strong>{cleanTrackTitle(currentTrack.title)}</strong></div>
            </>
          ) : (
            <>
              <div className="player-placeholder"><Music2 size={18} /></div>
              <div className="player-copy"><strong>Nothing playing</strong><span>Your next favorite is close.</span></div>
            </>
          )}
        </div>

        <div className="player-controls">
          <button
            className={`player-mode-button mode-toggle ${isShuffle ? "is-active" : ""}`}
            onClick={onToggleShuffle}
            disabled={tracksLength < 2}
            aria-label={isShuffle ? "Turn shuffle off" : "Turn shuffle on"}
            aria-pressed={isShuffle}
            title={isShuffle ? "Shuffle on" : "Shuffle off"}
          >
            <Shuffle size={17} />
            {isShuffle && <span className="mode-active-dot" aria-hidden="true" />}
          </button>
          <button
            className="player-mode-button"
            onClick={onPreviousTrack}
            disabled={!tracksLength}
            aria-label="Play previous track"
            title="Previous track"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button
            className="main-play-button"
            onClick={onTogglePlayback}
            disabled={!currentTrack || isPreparingAudio}
            aria-label={isPreparingAudio ? "Loading track" : isPlaying ? "Pause" : "Play"}
          >
            {isPreparingAudio
              ? <LoaderCircle className="spin" size={18} />
              : isPlaying
                ? <Pause size={18} fill="currentColor" />
                : <MusicPlayIcon size={20} />}
          </button>
          <button
            className="player-mode-button"
            onClick={onNextTrack}
            disabled={!tracksLength}
            aria-label="Play next track"
            title="Next track"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button
            className={`player-mode-button mode-toggle ${repeatMode !== "off" ? "is-active" : ""}`}
            onClick={onCycleRepeatMode}
            aria-label={`Repeat ${repeatMode}`}
            aria-pressed={repeatMode !== "off"}
            title={`Repeat ${repeatMode === "all" ? "all tracks" : repeatMode === "one" ? "current track" : "off"}`}
          >
            {repeatMode === "one" ? <Repeat1 size={17} /> : <Repeat size={17} />}
            {repeatMode !== "off" && (
              <span className="mode-active-dot" aria-hidden="true">{repeatMode === "one" ? "1" : ""}</span>
            )}
          </button>
          <audio ref={audioRef} src={audioSource || undefined} {...audioHandlers} preload="metadata" />
        </div>

        <div className="player-options">
          <label className="playback-speed-control">
            <span>Speed</span>
            <select
              value={playbackRate}
              onChange={(event) => onPlaybackRateChange(Number(event.target.value))}
              aria-label="Playback speed"
              title="Playback speed"
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <option value={speed} key={speed}>{speed.toFixed(2)}×</option>
              ))}
            </select>
          </label>
          <div className="volume-control">
            <button
              className="player-mode-button volume-button"
              onClick={onToggleVolume}
              aria-label={volume > 0 ? "Mute audio" : "Unmute audio"}
              title={volume > 0 ? "Mute" : "Unmute"}
            >
              <MicrophoneIcon muted={volume <= 0} />
            </button>
            <input
              className="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              aria-label="Volume"
              style={{ "--volume": `${volume * 100}%` }}
            />
          </div>
          <button
            className={`autoplay-toggle ${autoPlay ? "is-active" : ""}`}
            onClick={onToggleAutoPlay}
            aria-pressed={autoPlay}
            title="Automatically play the next track when this one ends"
          >
            AUTO <span>{autoPlay ? "ON" : "OFF"}</span>
          </button>
          {currentTrack && (
            <span className="player-status">
              <span className={isPlaying ? "equalizer playing" : "equalizer"}><i /><i /><i /><i /></span>
              {isPlaying ? "PLAYING" : "OFFLINE READY"}
            </span>
          )}
        </div>

        <div className="player-progress">
          <span ref={playerCurrentTimeRef} className="progress-time">{formatDuration(currentTime)}</span>
          <input
            ref={playerProgressRef}
            className="progress-slider"
            type="range"
            min="0"
            max={trackDuration}
            step="0.1"
            defaultValue={Math.min(currentTime, trackDuration)}
            onChange={onSeek}
            disabled={!currentTrack || !trackDuration}
            aria-label="Seek through track"
            style={{ "--progress": `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          <span ref={playerRemainingTimeRef} className="progress-time remaining-time">−{formatDuration(remainingTime)}</span>
        </div>
      </div>
    </div>
  );
}
