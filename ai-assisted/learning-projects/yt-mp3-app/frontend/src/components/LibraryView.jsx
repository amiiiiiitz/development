import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine, Check, ChevronDown, Disc3, Download, FolderPlus, Grid2X2, Heart,
  ImagePlus, List, ListMusic, ListPlus, MoreHorizontal, Pause, Pencil, RefreshCw, Search,
  Shield, SlidersHorizontal, Trash2, Upload, WifiOff, X,
} from "lucide-react";
import MusicPlayIcon from "./MusicPlayIcon.jsx";
import TrackArtwork from "./TrackArtwork.jsx";
import { CassetteTape, EqBars, MiniCassette } from "./RemixAssets.jsx";
import { cleanTrackTitle, formatDuration } from "../utils/trackFormatting.js";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const STRIPES = ["#6B4EFF", "#F28C38", "#FFD93D", "#3EE0A0", "#2EC4B6", "#F28C38"];

export default function LibraryView({ library, filters, forms, playback, queue = {}, actions }) {
  const {
    tracks, visibleTracks, folders, activeFolderId, setActiveFolderId, activeFolder, unfiledCount,
    storageInfo, sortBy, setSortBy, queueIds = [],
  } = library;
  const { searchQuery, setSearchQuery, favoritesOnly, setFavoritesOnly } = filters;
  const { isCreatingFolder, newFolderName, setNewFolderName, renameTrackId, renameDraft, setRenameDraft, pendingImport } = forms;
  const { currentTrack, isPlaying, isPreparingAudio, currentTime, duration, inlineProgressRef, inlineCurrentTimeRef, inlineDurationRef, onPlayTrack, onAddToQueue, onSeekTrack } = playback;
  const { showQueue = false, queueIndex = -1, onPlayQueueTrack, onRemoveFromQueue, onClearQueue } = queue;
  const {
    onCreateFolder, onToggleCreateFolder, onOpenPersonalization, onRenameTrack, onBeginRenameTrack, onCancelRenameTrack,
    onUpdatePlayCountLimit, onToggleFavorite, onMoveTrackToFolder, onRemoveTrack, onRemoveFolder, onGoToConverter,
    onExportLibrary, onImportLibrary, onDownloadTrack, onReDownloadTrack, onApplyImport, onCancelImport, onFetchMissingCovers,
    onToggleQueue, onShowAllCollection,
  } = actions;

  const [showTools, setShowTools] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [trackMenuId, setTrackMenuId] = useState(null);
  const toolsRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showTools && trackMenuId === null) return undefined;
    const close = (event) => {
      if (showTools && toolsRef.current && !toolsRef.current.contains(event.target)) setShowTools(false);
      if (trackMenuId !== null && menuRef.current && !menuRef.current.contains(event.target)) setTrackMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showTools, trackMenuId]);

  const queueTracks = useMemo(() => (
    (queueIds || []).map((id, index) => ({ track: tracks.find((item) => item.id === id), index })).filter(({ track }) => track)
  ), [queueIds, tracks]);

  const storageUsage = storageInfo?.usage || 0;
  const storageQuota = storageInfo?.quota || 0;
  const storagePercent = storageQuota ? Math.min(100, (storageUsage / storageQuota) * 100) : 0;

  const renderRow = (track, index) => {
    const isCurrent = currentTrack?.id === track.id;
    const title = cleanTrackTitle(track.title);
    const artist = track.uploader || track.artist || "Offline track";
    const queued = (queueIds || []).includes(track.id);
    const menuOpen = trackMenuId === track.id;
    return (
      <article key={track.id} className={`bd rx-lib-row ${isCurrent ? "is-current" : ""}`} style={isCurrent ? { background: "#6B4EFF", color: "#fff" } : { background: "#fff" }}>
        <button className="rx-lib-art-btn" onClick={() => onPlayTrack(track)} disabled={isPreparingAudio && isCurrent} aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${title}`}>
          <MiniCassette stripe={STRIPES[index % STRIPES.length]} />
        </button>
        <div className="rx-lib-meta">
          {renameTrackId === track.id ? (
            <form className="rx-rename" onSubmit={(e) => onRenameTrack(e, track)}>
              <label className="sr-only" htmlFor={`rename-${track.id}`}>Song name</label>
              <input id={`rename-${track.id}`} autoFocus value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} maxLength={160} />
              <button type="submit" className="ib" style={{ width: 36, height: 36 }} aria-label="Save"><Check size={14} /></button>
              <button type="button" className="ib" style={{ width: 36, height: 36 }} onClick={onCancelRenameTrack} aria-label="Cancel"><X size={14} /></button>
            </form>
          ) : (
            <>
              <button className="rx-lib-title" onClick={() => onPlayTrack(track)} disabled={isPreparingAudio && isCurrent} title={title}>{title}</button>
              <p className="rx-lib-sub">{artist} · {formatDuration(track.duration)} {track.favorite ? "· ♥" : ""}</p>
            </>
          )}
          {isCurrent && (
            <div className="rx-inline-seek">
              <span ref={inlineCurrentTimeRef}>{formatDuration(currentTime)}</span>
              <input ref={inlineProgressRef} type="range" min="0" max={duration || currentTrack?.duration || 0} step="0.01" defaultValue={Math.min(currentTime, duration || currentTrack?.duration || 0)} onChange={(e) => onSeekTrack(e, track)} disabled={!(duration || currentTrack?.duration > 0)} aria-label={`Seek ${title}`} style={{ "--progress": `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              <span ref={inlineDurationRef}>{formatDuration(duration || currentTrack?.duration || 0)}</span>
            </div>
          )}
        </div>
        {isCurrent && isPlaying ? <EqBars light /> : track.savedAt ? <span className="ch rx-saved-chip" style={{ minHeight: 26, padding: "0 8px", fontSize: 11, background: "#3EE0A0", boxShadow: "none", borderWidth: 2 }}>saved</span> : null}
        <button className="ib rx-icon-btn" onClick={() => onToggleFavorite(track)} aria-label={track.favorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`} aria-pressed={Boolean(track.favorite)} style={{ width: 40, height: 40, boxShadow: "none", borderWidth: 2, background: track.favorite ? "#FFD93D" : "transparent", borderColor: isCurrent ? "rgba(255,255,255,.35)" : "transparent", color: "inherit" }}>
          <Heart size={15} fill={track.favorite ? "currentColor" : "none"} />
        </button>
        <div className="rx-menu-wrap" ref={menuOpen ? menuRef : null}>
          <button className="ib rx-icon-btn" type="button" onClick={() => setTrackMenuId(menuOpen ? null : track.id)} aria-label={`More actions for ${title}`} aria-expanded={menuOpen} style={{ width: 40, height: 40, boxShadow: "none", borderWidth: 2, background: "transparent", borderColor: isCurrent ? "rgba(255,255,255,.35)" : "transparent", color: "inherit" }}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="rx-menu bd" role="menu">
              <button type="button" role="menuitem" onClick={() => { onAddToQueue?.(track); setTrackMenuId(null); }} disabled={queued}><ListPlus size={14} /> {queued ? "Already in queue" : "Add to queue"}</button>
              <button type="button" role="menuitem" onClick={() => { onBeginRenameTrack(track); setTrackMenuId(null); }}><Pencil size={14} /> Rename</button>
              <button type="button" role="menuitem" onClick={() => { onDownloadTrack(track); setTrackMenuId(null); }}><ArrowDownToLine size={14} /> Download file</button>
              {track.downloaded === false && <button type="button" role="menuitem" onClick={() => { onReDownloadTrack(track); setTrackMenuId(null); }}><RefreshCw size={14} /> Re-download audio</button>}
              {folders.length > 0 && (
                <label className="rx-menu-select"><Disc3 size={14} />
                  <select value={track.folderId || ""} onChange={(e) => { onMoveTrackToFolder(track, e.target.value); setTrackMenuId(null); }} aria-label={`Move ${title}`}>
                    <option value="">Move to Unfiled</option>
                    {folders.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}
                  </select>
                </label>
              )}
              <label className="rx-menu-select"><SlidersHorizontal size={14} />
                <select value={track.playCountLimit ?? 1} onChange={(e) => { onUpdatePlayCountLimit(track, e.target.value); setTrackMenuId(null); }} aria-label={`Play count for ${title}`}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option value={c} key={c}>Play {c}× then continue</option>)}
                  <option value="forever">Repeat until skipped</option>
                </select>
              </label>
              <button type="button" role="menuitem" className="is-danger" onClick={() => { onRemoveTrack(track); setTrackMenuId(null); }}><Trash2 size={14} /> Remove from library</button>
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="rx-page rx-enter rx-library">
      <header className="rx-lib-header">
        <h1 className="B rx-lib-title-main">ur library</h1>
        <p className="H rx-lib-submain">everything lives offline here</p>
      </header>

      <div className="bd rx-search-bar">
        <Search size={20} aria-hidden="true" />
        <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="search songs or channels" aria-label="Search your collection" />
        {searchQuery && <button type="button" className="rx-link" onClick={() => setSearchQuery("")} aria-label="Clear search"><X size={16} /></button>}
      </div>

      <div className="rx-filters">
        <button type="button" className="ch" style={!favoritesOnly && activeFolderId === "all" ? { background: "#FFD93D" } : undefined} onClick={onShowAllCollection}>all</button>
        <button type="button" className="ch" style={favoritesOnly ? { background: "#FFD93D" } : undefined} onClick={() => setFavoritesOnly((v) => !v)}>favorites</button>
        <button type="button" className="ch" style={showFolders ? { background: "#FFD93D" } : undefined} onClick={() => setShowFolders((v) => !v)} aria-expanded={showFolders}>playlists</button>
        <button type="button" className="ch" style={showQueue ? { background: "#FFD93D" } : undefined} onClick={onToggleQueue} aria-expanded={showQueue}>queue {queueIds.length ? `(${queueIds.length})` : ""}</button>
        <label className="ch rx-sort-chip"><SlidersHorizontal size={14} aria-hidden="true" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort songs">
            <option value="recent">recent</option><option value="mostPlayed">most played</option><option value="az">A–Z</option>
            <option value="durationAsc">shortest</option><option value="durationDesc">longest</option>
          </select>
        </label>
        <div className="rx-tools-wrap" ref={toolsRef}>
          <button type="button" className="ch" onClick={() => setShowTools((v) => !v)} aria-expanded={showTools}>tools <ChevronDown size={14} /></button>
          {showTools && (
            <div className="rx-menu bd" role="menu">
              <button type="button" role="menuitem" onClick={() => { onExportLibrary(); setShowTools(false); }}><Download size={14} /> Export collection</button>
              <button type="button" role="menuitem" onClick={() => { onImportLibrary(); setShowTools(false); }}><Upload size={14} /> Import collection</button>
              <button type="button" role="menuitem" onClick={() => { onFetchMissingCovers(); setShowTools(false); }}><ImagePlus size={14} /> Fetch missing covers</button>
              <button type="button" role="menuitem" onClick={() => { onOpenPersonalization(); setShowTools(false); }}><Pencil size={14} /> Personalize signature</button>
            </div>
          )}
        </div>
      </div>

      {pendingImport && (
        <div className="bd rx-panel" role="status">
          <p><strong>Import collection?</strong> {pendingImport.tracks.length} tracks, {pendingImport.folders.length} folders.</p>
          <div className="rx-panel-actions">
            <button type="button" className="library-action-primary" onClick={() => onApplyImport("merge")}>Merge</button>
            <button type="button" className="ch" onClick={() => onApplyImport("replace")}>Replace</button>
            <button type="button" className="rx-link" onClick={onCancelImport}>Cancel</button>
          </div>
        </div>
      )}

      {showQueue && (
        <section className="bd rx-panel" aria-label="Playback queue">
          <div className="rx-panel-head"><h2 className="B">queue</h2><div className="rx-panel-actions">{queueTracks.length > 0 && <button type="button" className="rx-link" onClick={onClearQueue}>Clear</button>}<button type="button" className="rx-link" onClick={onToggleQueue}>Close</button></div></div>
          {queueTracks.length === 0 ? <p className="rx-muted">The queue is empty.</p> : (
            <div className="rx-queue-expanded">{queueTracks.map(({ track, index }) => (
              <div key={`${track.id}-${index}`} className={`rx-queue-row ${index === queueIndex ? "is-current" : ""}`}>
                <button type="button" className="rx-queue-play" onClick={() => onPlayQueueTrack?.(track, index)}>
                  <MiniCassette stripe={STRIPES[index % STRIPES.length]} /><span><strong>{cleanTrackTitle(track.title)}</strong><small>{track.uploader || "Offline track"}</small></span>
                </button>
                <button type="button" className="ib rx-queue-x" onClick={() => onRemoveFromQueue?.(track.id)} aria-label={`Remove from queue`}><X size={14} /></button>
              </div>
            ))}</div>
          )}
        </section>
      )}

      {showFolders && (
        <section className="bd rx-panel" aria-label="Folders">
          <div className="rx-panel-head"><h2 className="B">folders &amp; favorites</h2><button type="button" className="ch" onClick={onToggleCreateFolder}><FolderPlus size={14} /> New folder</button></div>
          {isCreatingFolder && (
            <form className="rx-folder-form" onSubmit={onCreateFolder}>
              <label className="sr-only" htmlFor="new-folder-name">Folder name</label>
              <input id="new-folder-name" autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name your folder" maxLength={40} />
              <button type="submit" className="library-action-primary" disabled={!newFolderName.trim()}>Create</button>
            </form>
          )}
          <div className="rx-folder-pills">
            <button type="button" className="ch" style={activeFolderId === "all" && !favoritesOnly ? { background: "#FFD93D" } : undefined} onClick={onShowAllCollection}>All <small>{tracks.length}</small></button>
            <button type="button" className="ch" style={activeFolderId === "unfiled" && !favoritesOnly ? { background: "#FFD93D" } : undefined} onClick={() => { setActiveFolderId("unfiled"); setFavoritesOnly(false); }}>Unfiled <small>{unfiledCount}</small></button>
            {folders.map((folder) => (
              <span key={folder.id} className="rx-folder-pill-wrap">
                <button type="button" className="ch" style={activeFolderId === folder.id && !favoritesOnly ? { background: "#FFD93D" } : undefined} onClick={() => { setActiveFolderId(folder.id); setFavoritesOnly(false); }}>{folder.name} <small>{tracks.filter((t) => t.folderId === folder.id).length}</small></button>
                <button type="button" className="rx-link" onClick={() => onRemoveFolder(folder)} aria-label={`Delete ${folder.name}`}><X size={12} /></button>
              </span>
            ))}
          </div>
        </section>
      )}

      <p className="B rx-section-kicker">NEWEST FIRST</p>
      {tracks.length === 0 ? (
        <div className="bd rx-empty-state">
          <CassetteTape width={160} label="empty" />
          <h2 className="B">nothing here yet.</h2>
          <p>Your offline collection is ready when you are.</p>
          <button type="button" className="library-action-primary" onClick={onGoToConverter}>Bring something home</button>
        </div>
      ) : visibleTracks.length === 0 ? (
        <div className="bd rx-empty-state">
          <Search size={28} />
          <h2 className="B">no matching tracks</h2>
          <p>Try a different search, or clear your view.</p>
          <button type="button" className="ch" onClick={onShowAllCollection}>Show all tracks</button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="rx-lib-grid">
          {visibleTracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <article key={track.id} className={`bd rx-grid-card ${isCurrent ? "is-current" : ""}`}>
                <button type="button" className="rx-grid-art" onClick={() => onPlayTrack(track)} aria-label={`Play ${cleanTrackTitle(track.title)}`}>
                  <TrackArtwork track={track} size="recent" />
                  {isCurrent && isPlaying && <span className="rx-grid-eq"><EqBars /></span>}
                </button>
                <button type="button" className="rx-lib-title" onClick={() => onPlayTrack(track)}>{cleanTrackTitle(track.title)}</button>
                <p className="rx-lib-sub">{track.uploader || "Offline track"}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rx-lib-list">{visibleTracks.map((track, index) => renderRow(track, index))}</div>
      )}

      <section className="rx-storage" aria-label="Storage">
        <button type="button" className="rx-storage-toggle" onClick={() => setShowStorage((v) => !v)} aria-expanded={showStorage}>
          <span><Shield size={15} /> <strong>Storage</strong> {storageInfo?.supported ? `${formatBytes(storageUsage)} used` : "unavailable"}</span>
          <ChevronDown size={15} className={showStorage ? "is-open" : ""} />
        </button>
        {showStorage && storageInfo?.supported && (
          <div className="bd rx-panel" style={{ marginTop: 8 }}>
            <div className="rx-storage-bar"><span style={{ width: `${storagePercent}%` }} /></div>
            <p className="rx-muted">{formatBytes(storageUsage)}{storageQuota ? ` of ${formatBytes(storageQuota)}` : ""} · {storageInfo.persistent ? "persistent" : "not persistent"}</p>
          </div>
        )}
        <div className="rx-view-toggle" role="group" aria-label="Track display">
          <button type="button" className="ch" style={viewMode === "list" ? { background: "#FFD93D" } : undefined} onClick={() => setViewMode("list")}><List size={15} /> List</button>
          <button type="button" className="ch" style={viewMode === "grid" ? { background: "#FFD93D" } : undefined} onClick={() => setViewMode("grid")}><Grid2X2 size={15} /> Grid</button>
        </div>
      </section>
      <div className="rx-footnote"><WifiOff size={14} /> Stored on this device for offline playback.</div>
    </div>
  );
}
