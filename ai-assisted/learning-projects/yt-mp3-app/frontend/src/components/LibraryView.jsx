import {
  Check,
  Disc3,
  Heart,
  ListMusic,
  Music2,
  Pause,
  Pencil,
  Search,
  Star,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import MusicPlayIcon from "./MusicPlayIcon.jsx";
import TrackArtwork from "./TrackArtwork.jsx";
import {
  cleanTrackTitle,
  formatDuration,
  formatListeningTime,
} from "../utils/trackFormatting.js";

export default function LibraryView({ library, filters, forms, playback, actions }) {
  const {
    tracks,
    visibleTracks,
    folders,
    activeFolderId,
    setActiveFolderId,
    activeFolder,
    unfiledCount,
    searchTerms,
  } = library;
  const { searchQuery, setSearchQuery, favoritesOnly, setFavoritesOnly } = filters;
  const {
    isCreatingFolder,
    setIsCreatingFolder,
    newFolderName,
    setNewFolderName,
    signatureName,
    isEditingSignature,
    signatureDraft,
    setSignatureDraft,
    renameTrackId,
    renameDraft,
    setRenameDraft,
  } = forms;
  const {
    currentTrack,
    isPlaying,
    isPreparingAudio,
    currentTime,
    duration,
    pendingStatsRef,
    inlineProgressRef,
    inlineCurrentTimeRef,
    inlineDurationRef,
    onPlayTrack,
    onSeekTrack,
  } = playback;
  const {
    onCreateFolder,
    onToggleCreateFolder,
    onToggleSignature,
    onSaveSignature,
    onDeleteSignature,
    onCancelSignature,
    onRenameTrack,
    onBeginRenameTrack,
    onCancelRenameTrack,
    onUpdatePlayCountLimit,
    onToggleFavorite,
    onMoveTrackToFolder,
    onRemoveTrack,
    onRemoveFolder,
    onGoToConverter,
  } = actions;

  return (
    <div className="library-view">
      <div className="section-heading library-heading">
        <div>
          <span className="eyebrow">YOUR PERSONAL COLLECTION</span>
          <h2>Offline library<span className="heading-period">.</span></h2>
        </div>
        <span className="library-total">{tracks.length} {tracks.length === 1 ? "TRACK" : "TRACKS"}</span>
      </div>

      <div className="library-search-tools">
        {tracks.length > 0 && (
          <>
            <div className="library-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search your library"
                aria-label="Search your offline library"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">×</button>
              )}
            </div>
            <button
              className={`favorites-filter ${favoritesOnly ? "is-active" : ""}`}
              type="button"
              onClick={() => setFavoritesOnly((enabled) => !enabled)}
              aria-pressed={favoritesOnly}
            >
              <Heart size={15} fill={favoritesOnly ? "currentColor" : "none"} />
              Favorites
            </button>
          </>
        )}
        <div className="library-signature-actions">
          <button
            className={`new-folder-toggle ${isCreatingFolder ? "is-open" : ""}`}
            type="button"
            onClick={onToggleCreateFolder}
            aria-expanded={isCreatingFolder}
          >
            <ListMusic size={15} /> New crate
          </button>
          <button
            className={`signature-toggle ${isEditingSignature ? "is-open" : ""}`}
            type="button"
            onClick={onToggleSignature}
            aria-expanded={isEditingSignature}
          >
            <Pencil size={14} /> Make it uniquely yours
          </button>
        </div>
      </div>

      {isCreatingFolder && (
        <form className="folder-create" onSubmit={onCreateFolder}>
          <label className="sr-only" htmlFor="new-folder-name">Crate name</label>
          <input
            id="new-folder-name"
            autoFocus
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="Name your crate"
            maxLength={40}
          />
          <button className="folder-submit" type="submit" disabled={!newFolderName.trim()}>Create crate</button>
          <button
            className="folder-cancel"
            type="button"
            onClick={() => { setIsCreatingFolder(false); setNewFolderName(""); }}
          >
            Cancel
          </button>
        </form>
      )}

      <nav className="folder-list" aria-label="Music folders">
        <button
          type="button"
          className={`folder-card folder-card-library ${activeFolderId === "all" ? "is-active" : ""}`}
          data-tone="0"
          onClick={() => setActiveFolderId("all")}
          aria-pressed={activeFolderId === "all"}
        >
          <span className="folder-card-icon"><ListMusic size={17} /></span>
          <span className="folder-card-copy"><strong>All songs</strong><small>Your full library</small></span>
          <span className="folder-card-count">{tracks.length}</span>
        </button>
        <button
          type="button"
          className={`folder-card folder-card-unfiled ${activeFolderId === "unfiled" ? "is-active" : ""}`}
          data-tone="1"
          onClick={() => setActiveFolderId("unfiled")}
          aria-pressed={activeFolderId === "unfiled"}
        >
          <span className="folder-card-icon"><ListMusic size={17} /></span>
          <span className="folder-card-copy"><strong>Unfiled</strong><small>Sort these later</small></span>
          <span className="folder-card-count">{unfiledCount}</span>
        </button>
        {folders.map((folder, index) => (
          <div
            className={`folder-card folder-card-mood ${activeFolderId === folder.id ? "is-active" : ""}`}
            data-tone={(index + 2) % 5}
            key={folder.id}
          >
            <button
              type="button"
              className="folder-card-select"
              onClick={() => setActiveFolderId(folder.id)}
              aria-pressed={activeFolderId === folder.id}
            >
              <span className="folder-card-icon"><ListMusic size={17} /></span>
              <span className="folder-card-copy"><strong>{folder.name}</strong></span>
              <span className="folder-card-count">{tracks.filter((track) => track.folderId === folder.id).length}</span>
            </button>
            <button
              type="button"
              className="folder-delete"
              onClick={() => onRemoveFolder(folder)}
              aria-label={`Delete ${folder.name} folder`}
              title={`Delete ${folder.name} folder`}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </nav>

      {isEditingSignature && (
        <form className="signature-form" onSubmit={onSaveSignature}>
          <label className="sr-only" htmlFor="library-signature">Nickname for your song-list sign</label>
          <input
            id="library-signature"
            autoFocus
            value={signatureDraft}
            onChange={(event) => setSignatureDraft(event.target.value)}
            placeholder="Choose a nickname"
            maxLength={32}
          />
          <button className="signature-save" type="submit">Save tag</button>
          {signatureName && (
            <button className="signature-delete" type="button" onClick={onDeleteSignature}>Delete sign</button>
          )}
          <button className="signature-cancel" type="button" onClick={onCancelSignature}>Cancel</button>
        </form>
      )}

      {tracks.length === 0 ? (
        <div className="empty-library">
          <div className="empty-icon"><Music2 size={26} /></div>
          <h3>Your library is waiting.</h3>
          <p>Converted tracks will appear here and work without an internet connection.</p>
          <button className="text-button" onClick={onGoToConverter}>Convert a video</button>
        </div>
      ) : visibleTracks.length === 0 ? (
        <div className="empty-library search-empty">
          <div className="empty-icon">{activeFolder ? <Disc3 size={22} /> : <Search size={22} />}</div>
          <h3>
            {activeFolder && !searchTerms.length && !favoritesOnly
              ? `No songs in ${activeFolder.name} yet.`
              : activeFolderId === "unfiled" && !searchTerms.length && !favoritesOnly
                ? "No unfiled songs."
                : favoritesOnly && !searchTerms.length
                  ? "No favorites yet."
                  : "No matching tracks."}
          </h3>
          <p>
            {activeFolder && !searchTerms.length && !favoritesOnly
              ? "Move songs here from the folder menu on any track."
              : favoritesOnly && !searchTerms.length
                ? "Tap the star on a song to save it here."
                : "Try fewer words, another title or creator name, or clear your filters."}
          </p>
          {(searchQuery || favoritesOnly) && (
            <button className="text-button" onClick={() => { setSearchQuery(""); setFavoritesOnly(false); }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="track-list">
          {signatureName && (
            <div className="track-list-signature" aria-hidden="true">
              <svg className="signature-flourish" viewBox="0 0 760 180" preserveAspectRatio="none">
                <path d="M104 94C78 119 39 143 36 119 33 97 68 74 91 76 117 78 106 111 81 126" />
                <path d="M182 132C278 150 444 145 548 117 604 102 644 83 667 59 690 35 719 48 696 69 681 83 668 65 687 52" />
                <path d="M584 130C624 137 682 132 728 113" />
              </svg>
              <span className="signature-name">
                <span className="signature-initial">{Array.from(signatureName)[0]}</span>
                <span className="signature-rest">{Array.from(signatureName).slice(1).join("")}</span>
              </span>
            </div>
          )}
          {visibleTracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            const title = cleanTrackTitle(track.title);
            return (
              <article className={`track-row ${isCurrent ? "is-current" : ""}`} key={track.id}>
                <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
                <button
                  className="track-art-trigger"
                  onClick={() => onPlayTrack(track)}
                  disabled={isPreparingAudio && isCurrent}
                  aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${title}`}
                >
                  <TrackArtwork track={track} size="small" />
                  <span className="track-art-drop" aria-hidden="true">
                    {isCurrent && isPlaying ? <Pause size={11} /> : <MusicPlayIcon size={12} />}
                  </span>
                </button>
                <div className="track-details">
                  {renameTrackId === track.id ? (
                    <form className="track-rename-form" onSubmit={(event) => onRenameTrack(event, track)}>
                      <label className="sr-only" htmlFor={`rename-${track.id}`}>Song name</label>
                      <input
                        id={`rename-${track.id}`}
                        autoFocus
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        maxLength={160}
                      />
                      <button type="submit" aria-label="Save song name"><Check size={14} /></button>
                      <button type="button" aria-label="Cancel song rename" onClick={onCancelRenameTrack}><X size={14} /></button>
                    </form>
                  ) : (
                    <h3>
                      <button
                        className="track-title-play"
                        onClick={() => onPlayTrack(track)}
                        disabled={isPreparingAudio && isCurrent}
                        aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${title}`}
                      >
                        {title}
                      </button>
                    </h3>
                  )}
                  <div className="track-subline">
                    <span className="track-listening-stats">
                      {track.playCount || 0} {(track.playCount || 0) === 1 ? "play" : "plays"}
                      <span aria-hidden="true"> · </span>
                      {formatListeningTime(
                        (track.listenSeconds || 0) +
                          (pendingStatsRef.current.get(track.id)?.listenSeconds || 0)
                      )}
                    </span>
                    <div className="track-quick-controls">
                      <select
                        className="track-play-count"
                        value={track.playCountLimit ?? 1}
                        onChange={(event) => onUpdatePlayCountLimit(track, event.target.value)}
                        aria-label={`Play count for ${title}`}
                        title="How many times to play this song before continuing"
                      >
                        {Array.from({ length: 10 }, (_, countIndex) => countIndex + 1).map((count) => (
                          <option value={count} key={count}>{count}×</option>
                        ))}
                        <option value="forever">∞</option>
                      </select>
                      <button
                        className={`track-quick-favorite ${track.favorite ? "is-favorite" : ""}`}
                        onClick={() => onToggleFavorite(track)}
                        aria-label={track.favorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
                        aria-pressed={Boolean(track.favorite)}
                        title={track.favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star size={14} fill={track.favorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="track-inline-progress">
                      <span ref={inlineCurrentTimeRef}>{formatDuration(currentTime)}</span>
                      <input
                        ref={inlineProgressRef}
                        type="range"
                        min="0"
                        max={duration || currentTrack.duration || 0}
                        step="0.01"
                        defaultValue={Math.min(currentTime, duration || currentTrack.duration || 0)}
                        onChange={(event) => onSeekTrack(event, track)}
                        disabled={!(duration || currentTrack.duration > 0)}
                        aria-label={`Seek ${title}`}
                        style={{ "--progress": `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                      <span ref={inlineDurationRef}>{formatDuration(duration || currentTrack.duration || 0)}</span>
                    </div>
                  )}
                </div>
                {folders.length > 0 && (
                  <select
                    className="track-folder-select"
                    value={track.folderId || ""}
                    onChange={(event) => onMoveTrackToFolder(track, event.target.value)}
                    aria-label={`Move ${title} to folder`}
                  >
                    <option value="">Unfiled</option>
                    {folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}
                  </select>
                )}
                <span className="track-duration">{formatDuration(track.duration)}</span>
                <button
                  className="icon-button rename-button"
                  onClick={() => onBeginRenameTrack(track)}
                  aria-label={`Rename ${title}`}
                  title="Rename song"
                >
                  <Pencil size={15} />
                </button>
                <button className="icon-button remove-button" onClick={() => onRemoveTrack(track)} aria-label={`Remove ${title}`}>
                  <Trash2 size={17} />
                </button>
              </article>
            );
          })}
        </div>
      )}
      <div className="library-footnote"><WifiOff size={15} /> Everything here is stored on this device and available offline.</div>
    </div>
  );
}
