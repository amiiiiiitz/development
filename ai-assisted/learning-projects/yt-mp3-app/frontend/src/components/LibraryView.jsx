import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownToLine, Check, Disc3, FolderPlus, Grid2X2, Heart, List, ListPlus,
  MoreHorizontal, Pencil, RefreshCw, Search, SlidersHorizontal, Trash2, WifiOff, X,
} from "lucide-react";
import TrackArtwork from "./TrackArtwork.jsx";
import { CassetteTape, EqBars, MiniCassette } from "./RemixAssets.jsx";
import { cleanTrackTitle, formatDuration } from "../utils/trackFormatting.js";
import { useViewMode } from "../hooks/useViewMode.js";
import { usePortal } from "../hooks/usePortal.js";

const STRIPES = ["#6B4EFF", "#F28C38", "#FFD93D", "#3EE0A0", "#2EC4B6", "#F28C38"];

export default function LibraryView({ library, filters, forms, playback, queue = {}, actions }) {
  const {
    tracks, visibleTracks, folders, activeFolderId, setActiveFolderId, unfiledCount,
    sortBy, setSortBy, queueIds = [],
  } = library;
  const { searchQuery, setSearchQuery, favoritesOnly, setFavoritesOnly } = filters;
  const { isCreatingFolder, newFolderName, setNewFolderName, renameTrackId, renameDraft, setRenameDraft } = forms;
  const { currentTrack, isPlaying, isPreparingAudio, currentTime, duration, inlineProgressRef, inlineCurrentTimeRef, inlineDurationRef, onPlayTrack, onAddToQueue, onSeekTrack } = playback;
  const { queueIndex = -1, onPlayQueueTrack, onRemoveFromQueue, onClearQueue } = queue;
  const {
    onCreateFolder, onToggleCreateFolder, onRenameTrack, onBeginRenameTrack, onCancelRenameTrack,
    onUpdatePlayCountLimit, onToggleFavorite, onMoveTrackToFolder, onRemoveTrack, onRemoveFolder, onAddSong,
    onDownloadTrack, onReDownloadTrack, onShowAllCollection,
  } = actions;

  const [activePanel, setActivePanel] = useState(() => favoritesOnly ? "favorites" : "all");
  const [viewMode, setViewMode] = useViewMode();
  const [trackMenuId, setTrackMenuId] = useState(null);
  const [trackMenuPosition, setTrackMenuPosition] = useState(null);
  const menuRef = useRef(null);
  const portalRoot = usePortal();

  useEffect(() => {
    if (trackMenuId === null) return undefined;
    const closeOnOutsideClick = (event) => {
      if (event.target.closest?.("[data-track-menu-trigger]")) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) setTrackMenuId(null);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setTrackMenuId(null);
    };
    const closeOnViewportChange = () => setTrackMenuId(null);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnViewportChange, true);
    window.addEventListener("resize", closeOnViewportChange);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnViewportChange, true);
      window.removeEventListener("resize", closeOnViewportChange);
    };
  }, [trackMenuId]);

  const queueTracks = useMemo(() => (
    (queueIds || []).map((id, index) => ({ track: tracks.find((item) => item.id === id), index })).filter(({ track }) => track)
  ), [queueIds, tracks]);

  const openTrackMenu = (event, trackId) => {
    if (trackMenuId === trackId) {
      setTrackMenuId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = Math.min(360, window.innerHeight - 16);
    const belowSpace = window.innerHeight - rect.bottom - 8;
    const opensAbove = belowSpace < menuHeight && rect.top > belowSpace;
    const maxHeight = Math.max(120, Math.min(menuHeight, opensAbove ? rect.top - 16 : belowSpace));
    const top = opensAbove
      ? Math.max(8, rect.top - maxHeight - 8)
      : Math.min(rect.bottom + 8, window.innerHeight - maxHeight);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setTrackMenuPosition({ left, top, maxHeight });
    setTrackMenuId(trackId);
  };

  const renderTrackMenuTrigger = (track) => {
    const isCurrent = currentTrack?.id === track.id;
    const menuOpen = trackMenuId === track.id;
    return (
      <button
        className="ib rx-icon-btn"
        type="button"
        data-track-menu-trigger
        onClick={(event) => { event.stopPropagation(); openTrackMenu(event, track.id); }}
        aria-label={`More actions for ${cleanTrackTitle(track.title)}`}
        aria-expanded={menuOpen}
        style={{ width: 40, height: 40, boxShadow: "none", borderWidth: 2, background: "transparent", borderColor: isCurrent ? "rgba(255,255,255,.35)" : "transparent", color: "inherit" }}
      >
        <MoreHorizontal size={16} />
      </button>
    );
  };

  const renderTrackMenu = (track) => {
    const queued = (queueIds || []).includes(track.id);
    return (
      <div className="rx-menu bd rx-track-menu" role="menu" ref={menuRef} style={trackMenuPosition}>
        <button type="button" role="menuitem" onClick={() => { onAddToQueue?.(track); setTrackMenuId(null); }} disabled={queued}><ListPlus size={14} /> {queued ? "Already in queue" : "Add to queue"}</button>
        <button type="button" role="menuitem" onClick={() => { onBeginRenameTrack(track); setTrackMenuId(null); }}><Pencil size={14} /> Rename</button>
        <button type="button" role="menuitem" onClick={() => { onDownloadTrack(track); setTrackMenuId(null); }}><ArrowDownToLine size={14} /> Download file</button>
        {track.downloaded === false && <button type="button" role="menuitem" onClick={() => { onReDownloadTrack(track); setTrackMenuId(null); }}><RefreshCw size={14} /> Re-download audio</button>}
        {folders.length > 0 && (
          <label className="rx-menu-select"><Disc3 size={14} />
            <select value={track.folderId || ""} onChange={(e) => { onMoveTrackToFolder(track, e.target.value); setTrackMenuId(null); }} aria-label={`Move ${cleanTrackTitle(track.title)}`}>
              <option value="">Move to Unfiled</option>
              {folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}
            </select>
          </label>
        )}
        <label className="rx-menu-select"><SlidersHorizontal size={14} />
          <select value={track.playCountLimit ?? 1} onChange={(e) => { onUpdatePlayCountLimit(track, e.target.value); setTrackMenuId(null); }} aria-label={`Play count for ${cleanTrackTitle(track.title)}`}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((count) => <option value={count} key={count}>Play {count}× then continue</option>)}
            <option value="forever">Repeat until skipped</option>
          </select>
        </label>
        <button type="button" role="menuitem" className="is-danger" onClick={() => { onRemoveTrack(track); setTrackMenuId(null); }}><Trash2 size={14} /> Remove from library</button>
      </div>
    );
  };

  const activatePanel = (panel) => {
    if (panel === "all") {
      setActivePanel("all");
      onShowAllCollection();
      return;
    }
    if (panel === "favorites") {
      const activateFavorites = activePanel !== "favorites";
      if (activateFavorites) {
        setActivePanel("favorites");
        setActiveFolderId("all");
        setFavoritesOnly(true);
      } else {
        setActivePanel("all");
        onShowAllCollection();
      }
      return;
    }
    if (panel === "folders") {
      const activateFolders = activePanel !== "folders";
      if (activateFolders) {
        setActivePanel("folders");
        setFavoritesOnly(false);
      } else {
        setActivePanel("all");
        onShowAllCollection();
      }
      return;
    }
    const activateQueue = activePanel !== "queue";
    if (activateQueue) {
      setActivePanel("queue");
      setFavoritesOnly(false);
    } else {
      setActivePanel("all");
      onShowAllCollection();
    }
  };

  const renderRow = (track, index) => {
    const isCurrent = currentTrack?.id === track.id;
    const title = cleanTrackTitle(track.title);
    const artist = track.uploader || track.artist || "Offline track";
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
        {renderTrackMenuTrigger(track)}
      </article>
    );
  };

  return (
    <div className="rx-page rx-enter rx-library">
      <header className="rx-lib-header">
        <h1 className="B rx-lib-title-main">ur library</h1>
        <p className="H rx-lib-submain">everything lives offline here</p>
      </header>

<div className="rx-search-bar">
        <Search size={20} aria-hidden="true" />
        <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="search songs or channels" aria-label="Search your collection" />
        {searchQuery && <button type="button" className="rx-link" onClick={() => setSearchQuery("")} aria-label="Clear search"><X size={16} /></button>}
      </div>

      <div className="rx-filters" role="group" aria-label="Library controls">
        <div className="rx-panel-controls" role="group" aria-label="Library panels">
          <button type="button" className="ch" aria-pressed={activePanel === "all"} style={activePanel === "all" ? { background: "#FFD93D" } : undefined} onClick={() => activatePanel("all")}>All</button>
          <button type="button" className="ch" aria-pressed={activePanel === "favorites"} style={activePanel === "favorites" ? { background: "#FFD93D" } : undefined} onClick={() => activatePanel("favorites")}>Favorites</button>
          <button type="button" className="ch" aria-pressed={activePanel === "folders"} style={activePanel === "folders" ? { background: "#FFD93D" } : undefined} onClick={() => activatePanel("folders")} aria-expanded={activePanel === "folders"}>Folders</button>
          <button type="button" className="ch" aria-pressed={activePanel === "queue"} style={activePanel === "queue" ? { background: "#FFD93D" } : undefined} onClick={() => activatePanel("queue")} aria-expanded={activePanel === "queue"}>Queue {queueIds.length ? `(${queueIds.length})` : ""}</button>
        </div>
        <label className="ch rx-sort-chip"><SlidersHorizontal size={14} aria-hidden="true" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort songs">
            <option value="newest">Newest First</option><option value="mostPlayed">Most Played</option><option value="az">A–Z</option>
            <option value="durationAsc">Shortest</option><option value="durationDesc">Longest</option>
          </select>
        </label>
        <div className="rx-view-toggle" role="group" aria-label="Track display">
          <button type="button" className="ch" aria-pressed={viewMode === "list"} style={viewMode === "list" ? { background: "#FFD93D" } : undefined} onClick={() => setViewMode("list")}><List size={15} /> List</button>
          <button type="button" className="ch" aria-pressed={viewMode === "grid"} style={viewMode === "grid" ? { background: "#FFD93D" } : undefined} onClick={() => setViewMode("grid")}><Grid2X2 size={15} /> Grid</button>
        </div>
      </div>

      {activePanel === "queue" && (
        <section className="bd rx-panel" aria-label="Playback queue">
          <div className="rx-panel-head"><h2 className="B">queue</h2><div className="rx-panel-actions">{queueTracks.length > 0 && <button type="button" className="rx-link" onClick={onClearQueue}>Clear</button>}<button type="button" className="rx-link" onClick={() => activatePanel("all")}>Close</button></div></div>
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

      {activePanel === "folders" && (
        <section className="rx-folder-bar" aria-label="Folders">
          <div className="rx-folder-row">
            <div className="rx-folder-pills">
              <button type="button" className="ch rx-folder-pill" aria-pressed={activeFolderId === "all" && !favoritesOnly} style={activeFolderId === "all" && !favoritesOnly ? { background: "#FFD93D" } : undefined} onClick={onShowAllCollection}>All <small>{tracks.length}</small></button>
              <button type="button" className="ch rx-folder-pill" aria-pressed={activeFolderId === "unfiled" && !favoritesOnly} style={activeFolderId === "unfiled" && !favoritesOnly ? { background: "#FFD93D" } : undefined} onClick={() => { setActiveFolderId("unfiled"); setFavoritesOnly(false); }}>Unfiled <small>{unfiledCount}</small></button>
              {folders.map((folder) => (
                <span key={folder.id} className={`rx-folder-pill-wrap ${activeFolderId === folder.id && !favoritesOnly ? "is-active" : ""}`}>
                  <button type="button" className="ch rx-folder-pill" aria-pressed={activeFolderId === folder.id && !favoritesOnly} style={activeFolderId === folder.id && !favoritesOnly ? { background: "#FFD93D" } : undefined} onClick={() => { setActiveFolderId(folder.id); setFavoritesOnly(false); }}><span className="rx-folder-name">{folder.name}</span> <small>{tracks.filter((t) => t.folderId === folder.id).length}</small></button>
                  <button type="button" className="rx-link rx-folder-delete" onClick={() => onRemoveFolder(folder)} aria-label={`Delete ${folder.name}`}><X size={12} /></button>
                </span>
              ))}
            </div>
            <button type="button" className="ch rx-folder-new" onClick={onToggleCreateFolder} aria-expanded={isCreatingFolder}><FolderPlus size={14} /> New folder</button>
          </div>
          {isCreatingFolder && (
            <form className="rx-folder-form" onSubmit={onCreateFolder}>
              <label className="sr-only" htmlFor="new-folder-name">Folder name</label>
              <input id="new-folder-name" autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Name your folder" maxLength={40} />
              <button type="submit" className="library-action-primary" disabled={!newFolderName.trim()}>Create</button>
            </form>
          )}
        </section>
      )}

      <p className="B rx-section-kicker">{sortBy === "mostPlayed" ? "MOST PLAYED" : sortBy === "az" ? "A–Z" : sortBy === "durationAsc" ? "SHORTEST FIRST" : sortBy === "durationDesc" ? "LONGEST FIRST" : "NEWEST FIRST"}</p>
      {tracks.length === 0 ? (
        <div className="bd rx-empty-state">
          <CassetteTape width={160} label="empty" />
          <h2 className="B">nothing here yet.</h2>
          <p>Your offline collection is ready when you are.</p>
          <button type="button" className="library-action-primary" onClick={onAddSong}>Bring something home</button>
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
          {visibleTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <article key={track.id} className={`bd rx-grid-card ${isCurrent ? "is-current" : ""}`}>
                <button type="button" className="rx-grid-art" onClick={() => onPlayTrack(track)} aria-label={`Play ${cleanTrackTitle(track.title)}`}>
                  <TrackArtwork track={track} size="recent" />
                  {isCurrent && isPlaying && <span className="rx-grid-eq"><EqBars /></span>}
                </button>
                {renameTrackId === track.id ? (
                  <form className="rx-rename" onSubmit={(event) => onRenameTrack(event, track)}>
                    <label className="sr-only" htmlFor={`rename-${track.id}`}>Song name</label>
                    <input id={`rename-${track.id}`} autoFocus value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} maxLength={160} />
                    <button type="submit" className="ib" style={{ width: 36, height: 36 }} aria-label="Save"><Check size={14} /></button>
                    <button type="button" className="ib" style={{ width: 36, height: 36 }} onClick={onCancelRenameTrack} aria-label="Cancel"><X size={14} /></button>
                  </form>
                ) : (
                  <>
                    <button type="button" className="rx-lib-title" onClick={() => onPlayTrack(track)}>{cleanTrackTitle(track.title)}</button>
                    <p className="rx-lib-sub">{track.uploader || "Offline track"} · {formatDuration(track.duration)}</p>
                  </>
                )}
                {isCurrent && isPlaying && <EqBars light />}
                <div className="rx-grid-actions">
                  <button className="ib rx-icon-btn" type="button" onClick={() => onToggleFavorite(track)} aria-label={track.favorite ? `Remove ${cleanTrackTitle(track.title)} from favorites` : `Add ${cleanTrackTitle(track.title)} to favorites`} aria-pressed={Boolean(track.favorite)} style={{ width: 40, height: 40, boxShadow: "none", borderWidth: 2, background: track.favorite ? "#FFD93D" : "transparent", borderColor: isCurrent ? "rgba(255,255,255,.35)" : "transparent", color: "inherit" }}>
                    <Heart size={15} fill={track.favorite ? "currentColor" : "none"} />
                  </button>
                  {track.savedAt && <span className="ch rx-saved-chip">saved</span>}
                  {renderTrackMenuTrigger(track)}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rx-lib-list">{visibleTracks.map((track, index) => renderRow(track, index))}</div>
      )}

      {trackMenuId && tracks.some((track) => track.id === trackMenuId) && createPortal(
        <div onClick={(event) => event.stopPropagation()}>
          {renderTrackMenu(tracks.find((track) => track.id === trackMenuId))}
        </div>,
        portalRoot,
      )}
    </div>
  );
}
	