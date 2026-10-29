const DATABASE_NAME = "sonora-offline-library";
const DATABASE_VERSION = 2;
const TRACKS_STORE = "tracks";
const FOLDERS_STORE = "folders";

let databasePromise;

function compareFolderNames(firstFolder, secondFolder) {
  return firstFolder.name.localeCompare(secondFolder.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function initDB() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("This browser does not support IndexedDB."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(TRACKS_STORE)) {
          database.createObjectStore(TRACKS_STORE, { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains(FOLDERS_STORE)) {
          database.createObjectStore(FOLDERS_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          databasePromise = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error || new Error("Could not open the offline library."));
      };
      request.onblocked = () => {
        databasePromise = undefined;
        reject(new Error("The offline library is blocked by another browser tab."));
      };
    });
  }

  return databasePromise;
}

export async function saveTrackMetadata(track) {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TRACKS_STORE, "readwrite");
    transaction.objectStore(TRACKS_STORE).put(track);
    transaction.oncomplete = () => resolve(track);
    transaction.onerror = () => reject(transaction.error || new Error("Could not save track details."));
    transaction.onabort = () => reject(transaction.error || new Error("Saving track details was cancelled."));
  });
}

export async function updateTrackMetadata(id, updates) {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TRACKS_STORE, "readwrite");
    const store = transaction.objectStore(TRACKS_STORE);
    const request = store.get(id);
    let updatedTrack;

    request.onsuccess = () => {
      if (!request.result) {
        transaction.abort();
        return;
      }

      updatedTrack = { ...request.result, ...updates };
      store.put(updatedTrack);
    };
    request.onerror = () => reject(request.error || new Error("Could not read track details."));
    transaction.oncomplete = () => resolve(updatedTrack);
    transaction.onerror = () => reject(transaction.error || new Error("Could not update track details."));
    transaction.onabort = () => reject(transaction.error || new Error("Updating track details was cancelled."));
  });
}

export async function incrementTrackStats(id, playCount, listenSeconds) {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TRACKS_STORE, "readwrite");
    const store = transaction.objectStore(TRACKS_STORE);
    const request = store.get(id);
    let updatedTrack;

    request.onsuccess = () => {
      if (!request.result) {
        transaction.abort();
        return;
      }

      updatedTrack = {
        ...request.result,
        playCount: (request.result.playCount || 0) + playCount,
        listenSeconds: (request.result.listenSeconds || 0) + listenSeconds,
      };
      store.put(updatedTrack);
    };
    request.onerror = () => reject(request.error || new Error("Could not read track statistics."));
    transaction.oncomplete = () => resolve(updatedTrack);
    transaction.onerror = () => reject(transaction.error || new Error("Could not update track statistics."));
    transaction.onabort = () => reject(transaction.error || new Error("Updating track statistics was cancelled."));
  });
}

export async function getAllTracksMetadata() {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const request = database.transaction(TRACKS_STORE, "readonly").objectStore(TRACKS_STORE).getAll();
    request.onsuccess = () => {
      const tracks = request.result || [];
      tracks.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      resolve(tracks);
    };
    request.onerror = () => reject(request.error || new Error("Could not load the offline library."));
  });
}

export async function deleteTrackMetadata(id) {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TRACKS_STORE, "readwrite");
    transaction.objectStore(TRACKS_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Could not remove track details."));
    transaction.onabort = () => reject(transaction.error || new Error("Removing track details was cancelled."));
  });
}

export async function getAllFolders() {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const request = database.transaction(FOLDERS_STORE, "readonly").objectStore(FOLDERS_STORE).getAll();
    request.onsuccess = () => {
      const folders = request.result || [];
      folders.sort(compareFolderNames);
      resolve(folders);
    };
    request.onerror = () => reject(request.error || new Error("Could not load music folders."));
  });
}

export async function saveFolder(folder) {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDERS_STORE, "readwrite");
    transaction.objectStore(FOLDERS_STORE).put(folder);
    transaction.oncomplete = () => resolve(folder);
    transaction.onerror = () => reject(transaction.error || new Error("Could not save this folder."));
    transaction.onabort = () => reject(transaction.error || new Error("Saving this folder was cancelled."));
  });
}

export async function deleteFolder(folderId) {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FOLDERS_STORE, TRACKS_STORE], "readwrite");
    const folders = transaction.objectStore(FOLDERS_STORE);
    const tracks = transaction.objectStore(TRACKS_STORE);
    const request = tracks.getAll();

    request.onsuccess = () => {
      request.result.forEach((track) => {
        if (track.folderId === folderId) {
          tracks.put({ ...track, folderId: null });
        }
      });
      folders.delete(folderId);
    };
    request.onerror = () => {
      transaction.abort();
      reject(request.error || new Error("Could not update tracks in this folder."));
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Could not delete this folder."));
    transaction.onabort = () => reject(transaction.error || new Error("Deleting this folder was cancelled."));
  });
}
