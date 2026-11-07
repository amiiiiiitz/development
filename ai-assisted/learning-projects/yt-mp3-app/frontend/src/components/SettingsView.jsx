import { Download, HardDrive, ImagePlus, Import, Pencil } from "lucide-react";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SettingsView({ settings, actions }) {
  const { storageInfo, tracksLength, signatureName, pendingImport } = settings;
  const { onExportLibrary, onImportLibrary, onFetchMissingCovers, onOpenPersonalization, onApplyImport, onCancelImport } = actions;
  const usagePercent = storageInfo?.quota ? Math.min(100, (storageInfo.usage / storageInfo.quota) * 100) : 0;
  const persistenceLabel = storageInfo?.persistent === true ? "PERSISTENT" : storageInfo?.persistent === false ? "NOT PERSISTENT" : "STATUS UNKNOWN";

  return (
    <div className="rx-page rx-enter settings-view">
      <header className="page-header">
        <span className="eyebrow">YOUR LISTENING ROOM</span>
        <h1>settings</h1>
        <p>A few details about your offline collection.</p>
      </header>

      <section className="settings-section" aria-labelledby="settings-collection-heading">
        <div className="section-header"><h2 id="settings-collection-heading">library tools</h2></div>
        <div className="settings-rows">
          <div className="settings-row"><div><strong>Export collection</strong><p>Save a backup of your track details and folders.</p></div><button type="button" className="text-link" onClick={onExportLibrary}><Download size={15} /> Export</button></div>
          <div className="settings-row"><div><strong>Import collection</strong><p>Restore or merge a collection backup.</p></div><button type="button" className="text-link" onClick={onImportLibrary}><Import size={15} /> Import</button></div>
          <div className="settings-row"><div><strong>Find missing artwork</strong><p>Look up cover images for saved tracks.</p></div><button type="button" className="text-link" onClick={onFetchMissingCovers}><ImagePlus size={15} /> Find covers</button></div>
        </div>
      </section>

      {pendingImport && (
        <section className="settings-import" aria-label="Import confirmation">
          <p>Import {pendingImport.tracks.length} tracks and {pendingImport.folders.length} folders?</p>
          <div><button type="button" onClick={() => onApplyImport("merge")}>Merge</button><button type="button" onClick={() => onApplyImport("replace")}>Replace</button><button type="button" onClick={onCancelImport}>Cancel</button></div>
        </section>
      )}

      <section className="settings-section" aria-labelledby="settings-storage-heading">
        <div className="section-header"><h2 id="settings-storage-heading">offline storage</h2></div>
        <div className="settings-storage">
          <div className="settings-storage-heading"><HardDrive size={17} aria-hidden="true" /><strong>{storageInfo?.supported ? `${formatBytes(storageInfo.usage)} used` : "Storage unavailable"}</strong>{storageInfo?.quota > 0 && <span>of {formatBytes(storageInfo.quota)}</span>}</div>
          {storageInfo?.supported && <progress className="settings-storage-bar" value={usagePercent} max="100" aria-label={`Offline storage used: ${usagePercent.toFixed(1)}%`} />}
          <span className="settings-storage-status">{persistenceLabel}</span>
          <p>{tracksLength} {tracksLength === 1 ? "track is" : "tracks are"} saved for offline listening in this browser.</p>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="settings-personal-heading">
        <div className="section-header"><h2 id="settings-personal-heading">your signature</h2></div>
        <div className="settings-row"><div><strong>{signatureName || "Your soundtrack"}</strong><p>This name appears in your listening room.</p></div><button type="button" className="text-link" onClick={onOpenPersonalization}><Pencil size={15} /> Edit signature</button></div>
      </section>
    </div>
  );
}
