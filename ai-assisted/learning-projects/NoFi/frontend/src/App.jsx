import { useEffect, useState, useMemo } from "react";
import { ListMusic, Music2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "./app/shell/AppShell.jsx";
import { PageShell, useAudioPlaying } from "./app/shell/ui.jsx";
import useOnlineStatus from "./shared/hooks/useOnlineStatus.js";
import { cleanTrackTitle } from "./shared/utils/trackFormatting.js";
import ConverterView from "./pages/add-song/ConverterView.jsx";
import HomeView from "./pages/home/HomeView.jsx";
import LibraryView from "./pages/library/LibraryView.jsx";
import NowPlayingView from "./pages/now-playing/NowPlayingView.jsx";
import PersonalizationModal from "./pages/settings/PersonalizationModal.jsx";
import SettingsView from "./pages/settings/SettingsView.jsx";
import { useAudio } from "./features/audio/index.jsx";
import { useQueue } from "./features/queue/useQueue.jsx";
import { useMediaSession, usePlayback } from "./features/playback";
import { usePersonalization } from "./features/personalization/usePersonalization.js";
import { useLibrary } from "./features/library/useLibrary.js";
import { useLibraryBackup } from "./features/library/useLibraryBackup.js";
import { useConverter } from "./features/converter/useConverter.js";
import { usePlaybackSession } from "./features/playback/usePlaybackSession.js";

export default function App() {
  const [showQueue, setShowQueue] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const goTo = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  const isOnline = useOnlineStatus();
  useMediaSession();

  const {
    queueIds,
    queueIndex,
    setQueueIndex,
    addToQueue,
    removeFromQueue: queueRemoveFromQueue,
    clearQueue,
  } = useQueue();
  const playback = usePlayback();
  const audio = useAudio();
  const playing = useAudioPlaying(audio.audioRef);

  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    isShuffle,
    repeatMode,
    autoPlay,
    playbackError,
    setCurrentTrack,
    setIsPlaying,
    setIsShuffle,
    setAutoPlay,
    selectTrack,
    cycleRepeatMode,
    seekTo,
  } = playback;
  const { audioError, isPreparingAudio, volume, playbackRate, setVolume, setPlaybackRate } = audio;

  useEffect(() => {
    if (audioError) setError(audioError.message || "Could not load this song from offline storage.");
  }, [audioError]);

  useEffect(() => {
    if (playbackError) setError(playbackError.message || "Could not play this track.");
  }, [playbackError]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const personalization = usePersonalization({ setError, setNotice });

  // Bridge refs shared between library and playback session
  const sessionBridgeRef = {
    flushTrackStats: null,
    pendingStatsRef: null,
    completedPlaysRef: null,
    updatePlaybackDisplay: null,
  };

  const library = useLibrary({
    currentTrack,
    setCurrentTrack,
    audioRef: audio.audioRef,
    selectTrack,
    setIsPlaying,
    queueRemoveFromQueue,
    flushTrackStats: (...args) => sessionBridgeRef.flushTrackStats?.(...args),
    get pendingStatsRef() {
      return sessionBridgeRef.pendingStatsRef;
    },
    get completedPlaysRef() {
      return sessionBridgeRef.completedPlaysRef;
    },
    updatePlaybackDisplay: (...args) => sessionBridgeRef.updatePlaybackDisplay?.(...args),
    setError,
    setNotice,
  });

  const session = usePlaybackSession({
    tracks: library.tracks,
    setTracks: library.setTracks,
    activeFolderId: library.activeFolderId,
    favoritesOnly: library.favoritesOnly,
    queueIds,
    queueIndex,
    setQueueIndex,
    queueRemoveFromQueue,
    playback,
    audio,
    setError,
  });

  sessionBridgeRef.flushTrackStats = session.flushTrackStats;
  sessionBridgeRef.pendingStatsRef = session.pendingStatsRef;
  sessionBridgeRef.completedPlaysRef = session.completedPlaysRef;
  sessionBridgeRef.updatePlaybackDisplay = session.updatePlaybackDisplay;

  const backup = useLibraryBackup({
    tracks: library.tracks,
    folders: library.folders,
    refreshLibrary: library.refreshLibrary,
    setError,
    setNotice,
  });

  const converter = useConverter({
    isOnline,
    setTracks: library.setTracks,
    refreshLibrary: library.refreshLibrary,
    selectTrack: session.appSelectTrack,
    completedPlaysRef: session.completedPlaysRef,
    onSavedSuccess: () => {
      library.setActiveFolderId("all");
      library.setFavoritesOnly(false);
      library.setSearchQuery("");
      goTo("/add");
    },
    setError,
    setNotice,
  });

  const homeQueue = queueIds
    .map((id, index) => ({ track: library.tracks.find((track) => track.id === id), index }))
    .filter(({ track }) => Boolean(track));

  const openHome = () => {
    setError("");
    setShowQueue(false);
    goTo("/");
  };

  const openLibrary = (showFavorites = false) => {
    goTo("/library");
    library.setFavoritesOnly(showFavorites);
    if (showFavorites) library.setActiveFolderId("all");
    library.setSearchQuery("");
    setShowQueue(false);
    setError("");
    setNotice("");
    void library.refreshLibrary();
  };

  const openConverter = () => {
    converter.resetForm();
    setError("");
    setNotice("");
    setShowQueue(false);
    goTo("/add");
  };

  const openSettings = () => {
    goTo("/settings");
    setError("");
    setShowQueue(false);
  };

  const navigateShell = (tab) => {
    setShowQueue(false);
    if (tab === "home") openHome();
    else if (tab === "library") openLibrary();
    else if (tab === "add") openConverter();
    else if (tab === "playing") goTo("/playing");
  };

  const activeTab = useMemo(() => {
    switch (location.pathname) {
      case "/library":
        return "library";
      case "/add":
        return "convert";
      case "/playing":
        return "playing";
      case "/settings":
        return "settings";
      default:
        return "home";
    }
  }, [location.pathname]);

  // Unknown routes redirect to the homepage without adding history entries.
  useEffect(() => {
    const valid = ["/", "/library", "/add", "/playing", "/settings"];
    if (!valid.includes(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  const shellActive = activeTab === "convert" ? "add" : activeTab;

  return (
    <AppShell
      active={shellActive}
      onNavigate={navigateShell}
      signature={personalization.signatureName}
      onEditSignature={personalization.openPersonalization}
      onSettings={openSettings}
      settingsActive={activeTab === "settings"}
player={{
        song: currentTrack
          ? {
              title: cleanTrackTitle(currentTrack.title),
              channel: currentTrack.uploader || currentTrack.artist || "Offline track",
              playCount: currentTrack.playCount || 0,
            }
          : null,
        playing: isPlaying,
        percent: duration ? Math.min(100, (currentTime / duration) * 100) : 0,
        current: currentTime,
        duration,
        onToggle: session.togglePlayback,
        onPrev: () => session.appPlayRelativeTrack(-1, { wrap: repeatMode === "all" }),
        onNext: () => session.appPlayRelativeTrack(1, { wrap: repeatMode === "all" }),
        onSeek: (percent) => {
          const trackDuration = duration || currentTrack?.duration || 0;
          session.appSeekTo({ target: { value: String((trackDuration * percent) / 100) } });
        },
        progressRef: session.playerBarProgressRef,
        currentTimeRef: session.playerBarCurrentTimeRef,
        durationRef: session.playerBarDurationRef,
      }}
    >
      {notice && (
        <div className="duplicate-toast" role="status">
          <span className="duplicate-toast-icon"><Music2 size={17} /></span>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      <PageShell page={shellActive} playing={playing}>
        {error && <div className="page-status error-message" role="alert">{error}</div>}
        {!converter.backendReady && activeTab === "convert" && (
          <div className="page-status" role="status">Waking up the server, please wait…</div>
        )}

        {activeTab === "home" && (
          <HomeView
            home={{
              tracks: library.tracks,
              currentTrack,
              currentTime,
              duration,
              isPlaying,
              isPreparingAudio,
              isShuffle,
              repeatMode,
              queue: homeQueue,
              queueIndex,
              signatureName: personalization.signatureName,
              showQueue,
            }}
            actions={{
              onEditSignature: personalization.openPersonalization,
              onNavigate: (tab) => {
                if (tab === "convert") openConverter();
                else if (tab === "settings") openSettings();
                else openLibrary();
              },
              onPlayTrack: session.playTrack,
              onPlayQueueTrack: (track, index) => {
                setQueueIndex(index);
                session.appSelectTrack(track, true, true);
              },
              onTogglePlayback: session.togglePlayback,
              onPreviousTrack: () => session.appPlayRelativeTrack(-1, { wrap: repeatMode === "all" }),
              onNextTrack: () => session.appPlayRelativeTrack(1, { wrap: repeatMode === "all" }),
              onToggleShuffle: () => setIsShuffle((s) => !s),
              onCycleRepeatMode: cycleRepeatMode,
              onSeek: seekTo,
              onToggleFavorite: library.toggleFavorite,
              onAddToQueue: addToQueue,
              onToggleQueue: () => setShowQueue((open) => !open),
              onRemoveFromQueue: session.removeFromQueue,
              onClearQueue: clearQueue,
            }}
          />
        )}

        {activeTab === "playing" && (
          <NowPlayingView
            player={{
              currentTrack,
              currentTime,
              duration,
              isPlaying,
              isPreparingAudio,
              isShuffle,
              repeatMode,
              queueIndex,
              volume,
              playbackRate,
              autoPlay,
            }}
            queue={homeQueue}
            actions={{
              onTogglePlayback: session.togglePlayback,
              onPreviousTrack: () => session.appPlayRelativeTrack(-1, { wrap: repeatMode === "all" }),
              onNextTrack: () => session.appPlayRelativeTrack(1, { wrap: repeatMode === "all" }),
              onToggleShuffle: () => setIsShuffle((s) => !s),
              onCycleRepeatMode: cycleRepeatMode,
              onSeek: session.appSeekTo,
              onToggleFavorite: library.toggleFavorite,
              onPlayQueueTrack: (track, index) => {
                setQueueIndex(index);
                session.appSelectTrack(track, true, true);
              },
              onDownloadTrack: backup.downloadTrackFile,
              onOpenPlaylists: () => openLibrary(),
              onToggleVolume: () => setVolume(volume > 0 ? 0 : 0.8),
              onVolumeChange: setVolume,
              onPlaybackRateChange: setPlaybackRate,
              onToggleAutoPlay: () => setAutoPlay((enabled) => !enabled),
            }}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            settings={{
              storageInfo: backup.storageInfo,
              tracksLength: library.tracks.length,
              signatureName: personalization.signatureName,
              pendingImport: backup.pendingImport,
            }}
            actions={{
              onExportLibrary: backup.exportLibrary,
              onImportLibrary: () => backup.importInputRef.current?.click(),
              onFetchMissingCovers: backup.fetchMissingCovers,
              onOpenPersonalization: personalization.openPersonalization,
              onApplyImport: backup.applyImport,
              onCancelImport: () => backup.setPendingImport(null),
            }}
          />
        )}

        {(activeTab === "convert" || activeTab === "library") && (
          <section className={`workspace-card non-home-workspace${activeTab === "library" ? " non-home-library" : ""}`}>
            {activeTab === "convert" && (
              <>
                <div className="rx-convert-toolbar">
                  <button
                    type="button"
                    className="ch"
                    onClick={() => setShowQueue((open) => !open)}
                    aria-expanded={showQueue}
                    style={showQueue ? { background: "var(--peach)" } : undefined}
                  >
                    <ListMusic size={16} /> Queue <small>{queueIds.length}</small>
                  </button>
                </div>

                {showQueue && (
                  <div className="bd rx-panel rx-inline-queue">
                    <div className="rx-panel-head">
                      <h2 className="B">queue ({queueIds.length})</h2>
                      <button type="button" className="rx-link" onClick={clearQueue}>Clear</button>
                    </div>
                    {queueIds.length === 0 && <p className="rx-muted">No songs in queue.</p>}
                    <div className="rx-queue-expanded">
{queueIds.map((id, index) => {
                        const track = library.tracks.find((item) => item.id === id);
                        if (!track) return null;
                        const playCount = track.playCount || 0;
                        return (
                          <div key={`${id}-${index}`} className={`rx-queue-row ${index === queueIndex ? "is-current" : ""}`}>
                            <button
                              type="button"
                              className="rx-queue-play"
                              onClick={() => {
                                setQueueIndex(index);
                                session.appSelectTrack(track, true, true);
                              }}
                            >
                              <span>
                                <strong>{cleanTrackTitle(track.title)}</strong>
                                <small>{track.uploader || "Offline track"} {playCount > 0 && `· ▷ ${playCount}`}</small>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="ib rx-queue-x"
                              onClick={() => session.removeFromQueue(id)}
                              aria-label="Remove"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {currentTrack && (
                      <button type="button" className="ch" style={{ marginTop: 10 }} onClick={() => addToQueue(currentTrack)}>
                        Add current song
                      </button>
                    )}
                  </div>
                )}

                <ConverterView
                  url={converter.url}
                  onUrlChange={(event) => {
                    converter.setUrl(event.target.value);
                    converter.setVideo(null);
                    setError("");
                    setNotice("");
                  }}
                  onPreview={converter.loadVideoInfo}
                  onSaveOffline={converter.convertAndSave}
                  video={converter.video}
                  isOnline={isOnline}
                  isLoadingInfo={converter.isLoadingInfo}
                  isConverting={converter.isConverting}
                />
              </>
            )}

            {activeTab === "library" && (
              <LibraryView
                library={{
                  tracks: library.tracks,
                  visibleTracks: library.sortedVisibleTracks,
                  folders: library.folders,
                  activeFolderId: library.activeFolderId,
                  setActiveFolderId: library.setActiveFolderId,
                  unfiledCount: library.unfiledCount,
                  sortBy: library.sortBy,
                  setSortBy: library.setSortBy,
                  queueIds,
                }}
                filters={{
                  searchQuery: library.searchQuery,
                  setSearchQuery: library.setSearchQuery,
                  favoritesOnly: library.favoritesOnly,
                  setFavoritesOnly: library.setFavoritesOnly,
                }}
                forms={{
                  isCreatingFolder: library.isCreatingFolder,
                  setIsCreatingFolder: library.setIsCreatingFolder,
                  newFolderName: library.newFolderName,
                  setNewFolderName: library.setNewFolderName,
                  renameTrackId: library.renameTrackId,
                  renameDraft: library.renameDraft,
                  setRenameDraft: library.setRenameDraft,
                }}
                playback={{
                  currentTrack,
                  isPlaying,
                  isPreparingAudio,
                  currentTime,
                  duration,
                  pendingStatsRef: session.pendingStatsRef,
                  inlineProgressRef: session.inlineProgressRef,
                  inlineCurrentTimeRef: session.inlineCurrentTimeRef,
                  inlineDurationRef: session.inlineDurationRef,
                  onPlayTrack: session.playTrack,
                  onAddToQueue: addToQueue,
                  onSeekTrack: session.seekTrack,
                }}
                queue={{
                  queueIndex,
                  onPlayQueueTrack: (track, index) => {
                    setQueueIndex(index);
                    session.appSelectTrack(track, true, true);
                  },
                  onRemoveFromQueue: session.removeFromQueue,
                  onClearQueue: clearQueue,
                }}
                actions={{
                  onCreateFolder: library.createFolder,
                  onToggleCreateFolder: () => {
                    library.setIsCreatingFolder((open) => !open);
                    library.setNewFolderName("");
                    setError("");
                  },
                  onRenameTrack: library.renameTrack,
                  onBeginRenameTrack: library.beginRenameTrack,
                  onCancelRenameTrack: library.cancelRenameTrack,
                  onUpdatePlayCountLimit: library.updatePlayCountLimit,
                  onToggleFavorite: library.toggleFavorite,
                  onMoveTrackToFolder: library.moveTrackToFolder,
                  onRemoveTrack: library.removeTrack,
                  onRemoveFolder: library.removeFolder,
                  onAddSong: openConverter,
                  onDownloadTrack: backup.downloadTrackFile,
                  onReDownloadTrack: converter.reDownloadTrack,
                  onShowAllCollection: () => {
                    library.setActiveFolderId("all");
                    library.setFavoritesOnly(false);
                    library.setSearchQuery("");
                  },
                }}
              />
            )}
          </section>
        )}

        <footer className="page-footer">
          <span>nofi <span className="footer-dot">✦</span> no skips · no ads · no wifi needed</span>
          <span>Audio you’re authorized to use.</span>
        </footer>
      </PageShell>

      {personalization.isPersonalizationReady && personalization.showPersonalization && (
        <PersonalizationModal
          initialName={personalization.signatureName}
          isFirstVisit={!personalization.hasCompletedPersonalization}
          error={error}
          onSave={personalization.savePersonalization}
          onClear={personalization.clearPersonalization}
          onDismiss={personalization.closePersonalization}
          onSkip={personalization.skipPersonalization}
        />
      )}

      <input
        ref={backup.importInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={backup.handleImportFile}
      />
    </AppShell>
  );
}

