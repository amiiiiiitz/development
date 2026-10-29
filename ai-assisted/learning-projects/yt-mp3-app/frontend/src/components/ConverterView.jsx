import { ArrowDownToLine, ChevronRight, LoaderCircle, Music2, WifiOff, Youtube } from "lucide-react";
import { formatDuration } from "../utils/trackFormatting.js";

export default function ConverterView({
  url,
  onUrlChange,
  onPreview,
  onSaveOffline,
  video,
  isOnline,
  isLoadingInfo,
  isConverting,
}) {
  return (
    <div className="convert-view">
      <div className="section-heading">
        <div>
          <span className="eyebrow">START WITH A LINK</span>
          <h2>Bring the audio with you.</h2>
        </div>
        <div className="heading-note"><span className="pulse-dot" /> MP3 · 192 KBPS</div>
      </div>
      <form onSubmit={onPreview}>
        <label className="input-label" htmlFor="youtube-url">YouTube video URL</label>
        <div className="url-entry">
          <Youtube className="url-icon" size={19} />
          <input
            id="youtube-url"
            type="url"
            value={url}
            onChange={onUrlChange}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            disabled={isLoadingInfo || isConverting}
          />
          <button className="inspect-button" type="submit" disabled={isLoadingInfo || !url.trim()}>
            {isLoadingInfo ? <LoaderCircle className="spin" size={17} /> : <>Preview <ChevronRight size={16} /></>}
          </button>
        </div>
        <p className="input-hint">Only convert content you own or are authorized to download.</p>
      </form>

      {!isOnline && (
        <div className="offline-callout">
          <WifiOff size={17} />
          <span>You’re offline. Your saved tracks are ready to play; reconnect to preview or download new tracks.</span>
        </div>
      )}

      {video && (
        <div className="video-preview">
          <div className="preview-image">
            {video.thumbnail ? <img src={video.thumbnail} alt="" /> : <Music2 size={28} />}
            <span className="duration-tag">{formatDuration(video.duration)}</span>
          </div>
          <div className="preview-copy">
            <span className="eyebrow">VIDEO FOUND</span>
            <h3>{video.title}</h3>
            <p>{video.uploader}</p>
          </div>
          <button className="download-button" onClick={onSaveOffline} disabled={isConverting}>
            {isConverting
              ? <><LoaderCircle className="spin" size={17} /> Saving…</>
              : <><ArrowDownToLine size={17} /> Save offline</>}
          </button>
        </div>
      )}

      <div className="privacy-note">
        <div className="privacy-icon"><WifiOff size={17} /></div>
        <p><strong>Made for offline listening.</strong><br />Your downloaded audio stays on this device, in your browser storage.</p>
      </div>
    </div>
  );
}
