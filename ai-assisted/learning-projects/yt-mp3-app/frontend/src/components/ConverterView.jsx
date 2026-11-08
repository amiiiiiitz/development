import { ArrowDownToLine, ChevronRight, LoaderCircle, Link2, WifiOff, Youtube } from "lucide-react";
import { formatDuration } from "../utils/trackFormatting.js";
import { CassetteTape, MiniCassette } from "./RemixAssets.jsx";

export default function ConverterView({
  url, onUrlChange, onPreview, onSaveOffline, video, isOnline, isLoadingInfo, isConverting,
}) {
  return (
    <div className="rx-page rx-enter rx-convert">
      <header className="rx-convert-header">
        <h1 className="B rx-lib-title-main" style={{ backgroundImage: "linear-gradient(transparent 62%, #FFD93D 62%)" }}>add a song</h1>
        <p className="H rx-lib-submain">paste a youtube link, we do the rest</p>
      </header>

      <form className="bd rx-convert-card" onSubmit={onPreview}>
        <p className="B rx-card-kicker">YOUTUBE LINK</p>
        <label className="sr-only" htmlFor="youtube-url">YouTube video URL</label>
        <div className="rx-url-row">
          <div className="rx-url-field">
            <Link2 size={18} aria-hidden="true" />
            <input id="youtube-url" type="url" value={url} onChange={onUrlChange} placeholder="paste link here" required disabled={isLoadingInfo || isConverting} />
          </div>
          <button type="submit" className="ch rx-paste-btn" disabled={isLoadingInfo || !url.trim()}>
            {isLoadingInfo ? <LoaderCircle className="spin" size={16} /> : "preview"}
          </button>
        </div>
        <p className="rx-muted" style={{ marginTop: 10 }}>Only convert content you own or are authorized to download.</p>

        {video && (
          <section aria-label="Preview" style={{ marginTop: 14 }}>
            <p className="B rx-section-kicker">READY TO SAVE</p>
            <article className="bd rx-preview-card">
              <div className="rx-preview-art">
                {video.thumbnail ? <img src={video.thumbnail} alt="" /> : <CassetteTape width={120} label="track" />}
                <span className="ch rx-duration-tag" style={{ minHeight: 28, padding: "0 10px", fontSize: 12 }}>{formatDuration(video.duration)}</span>
              </div>
              <div className="rx-preview-copy">
                <span className="rx-card-kicker B" style={{ color: "var(--rx-violet)" }}>VIDEO FOUND</span>
                <h2 className="B" style={{ margin: "4px 0", fontSize: 20, lineHeight: 1.1 }}>{video.title}</h2>
                <p style={{ margin: 0, opacity: .75 }}>{video.uploader}</p>
              </div>
              <button type="button" className="library-action-primary" onClick={onSaveOffline} disabled={isConverting} style={{ width: "100%", marginTop: 12 }}>
                {isConverting ? <><LoaderCircle className="spin" size={17} /> Saving…</> : <><ArrowDownToLine size={17} /> Save offline <ChevronRight size={16} /></>}
              </button>
            </article>
          </section>
        )}
      </form>

      <div className="rx-steps" aria-label="How it works">
        {[{ n: 1, c: "#FFD93D", t: "paste" }, { n: 2, c: "#F28C38", t: "preview" }, { n: 3, c: "#3EE0A0", t: "save offline" }].map((s) => (
          <div key={s.n} className="rx-step"><div className="bd rx-step-num" style={{ background: s.c }}>{s.n}</div><p>{s.t}</p></div>
        ))}
      </div>

      {!isOnline && (
        <div className="bd rx-panel" style={{ background: "#fff" }}><p style={{ display: "flex", gap: 8, alignItems: "center", margin: 0 }}><WifiOff size={17} /> You’re offline. Your saved tracks are ready; reconnect to preview or download.</p></div>
      )}

      {isConverting && (
        <section aria-label="In progress">
          <p className="B rx-section-kicker">IN PROGRESS</p>
          <div className="bd rx-progress-card">
            <MiniCassette stripe="#F28C38" />
            <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 700 }}>{video?.title || "Saving track"}</p><p style={{ margin: 0, fontSize: 12 }}>converting…</p>
              <div className="rx-progress-bar"><div className="rx-st" style={{ width: "62%", height: "100%" }} /></div>
            </div>
          </div>
        </section>
      )}

      <div className="bd rx-panel rx-privacy">
        <WifiOff size={18} />
        <p style={{ margin: 0 }}><strong>Made for offline listening.</strong><br />Your downloaded audio stays on this device, in your browser storage.</p>
      </div>
    </div>
  );
}
