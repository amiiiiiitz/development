// Validation for library backup files (the JSON made by "Export library").
// Everything here runs BEFORE the offline library is touched, so a damaged or hand-edited
// file is rejected up front instead of failing halfway through an import.

const MAX_ITEMS = 50000;

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasText = (value) => typeof value === "string" && value.trim() !== "";

function uniqueById(items) {
  // If a file lists the same id twice, the last entry wins (same result as saving them in order).
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

/** Returns { tracks, folders } with duplicates removed, or throws an Error with a friendly message. */
export function validateBackup(data) {
  if (!isPlainObject(data) || data.version !== 1) {
    throw new Error("This backup file is not supported.");
  }
  if (!Array.isArray(data.tracks) || !Array.isArray(data.folders)) {
    throw new Error("This backup file is missing library data.");
  }
  if (data.tracks.length > MAX_ITEMS || data.folders.length > MAX_ITEMS) {
    throw new Error("This backup file is too large to import.");
  }

  data.folders.forEach((folder, index) => {
    if (!isPlainObject(folder) || !hasText(folder.id) || !hasText(folder.name)) {
      throw new Error(`Folder ${index + 1} in this backup is damaged. Nothing was imported.`);
    }
  });
  data.tracks.forEach((track, index) => {
    if (!isPlainObject(track) || !hasText(track.id)) {
      throw new Error(`Track ${index + 1} in this backup is damaged. Nothing was imported.`);
    }
  });

  return { tracks: uniqueById(data.tracks), folders: uniqueById(data.folders) };
}

/**
 * Validates a backup and works out which tracks still have their audio on this device.
 * Audio files are not part of a backup, so `downloaded` always reflects what is in the cache right now.
 * Does all the slow/async work first so the actual write can be one quick all-or-nothing transaction.
 */
export async function prepareImport(backup, isAudioCached) {
  const { tracks, folders } = validateBackup(backup);
  const tracksWithStatus = await Promise.all(
    tracks.map(async (track) => ({ ...track, downloaded: Boolean(await isAudioCached(track.id)) }))
  );
  return { tracks: tracksWithStatus, folders };
}

