// Browser storage names used by the app.
// DO NOT CHANGE these values: they identify data already saved on users' devices, so changing one
// makes existing offline music (or covers) disappear. public/sw.js keeps its own copy of
// AUDIO_CACHE_NAME because a service worker cannot import app modules.
export const AUDIO_CACHE_NAME = "mp3-offline-cache-v1";
export const COVER_CACHE_NAME = "nofi-cover-cache-v1";

/** The Cache API key under which a track's audio is stored (a fake same-origin URL, never fetched). */
export function audioCacheRequest(trackId) {
  return new Request(new URL(`/offline-audio/${encodeURIComponent(trackId)}`, window.location.origin));
}

