# NoFi: changes made in the cleanup (version 2026-11-15)

1. Player bar removed. Volume, speed and Autoplay moved to Now Playing. PlayerDock/QueueDrawer archived.
2. Seek slider on Now Playing fixed; "+ playlist" no longer opens favorites-only.
3. Garbled text (mojibake) and BOMs fixed. `--rx-red` defined.
4. Stray files moved to `_archive/`. Added README.md, frontend/.env.example, backend/.env.example.
5. Library: list by default on phones (<768px), grid on larger screens; manual choice remembered per device class;
   max 4 columns; larger visible gaps (src/shared/hooks/useViewMode.js, src/shared/styles/remix-views.css).
6. 174 dead CSS selectors and 5 unused keyframes removed.
7. Bug fixes: empty-library button, health-check timer leak, deleted tracks removed from queue,
   queue hook double-update, URL-field focus ring, aria label, unused imports, stray JSX text.


8. Backend hardening (backend/server.js, Dockerfile, .env.example, DEPLOYMENT.md):
   - Removed the unused, unvalidated /api/playlist route.
   - yt-dlp now only receives a URL built from the validated 11-character video ID, after `--`.
   - TRUST_PROXY_HOPS is now actually applied (it was read but never used).
   - All temp files of a conversion are removed (not just the .mp3); stale job files are swept at startup and hourly.
   - /api/info has its own concurrency limit (MAX_CONCURRENT_LOOKUPS, default 4).
   - SIGTERM/SIGINT now shut the server down (before, Ctrl+C and docker stop were ignored).
   - Dockerfile: optional YTDLP_VERSION build argument to pin yt-dlp.

9. Data safety (step 3):
   - Import can no longer destroy the library: backups are validated record by record BEFORE anything is written
     (src/shared/utils/libraryBackup.js), and the write is one all-or-nothing IndexedDB transaction
     (new additive function importLibraryMetadata in src/db.js; schema, name and version are unchanged).
   - "Replace" now asks for confirmation and states how many tracks/folders will be removed from the list.
   - Resume position works again: the app remembers the track and position (saved about every 5 s, on pause and when
     the page is hidden) and reopens it paused at that spot. A position within 3 s of the end restarts from 0.
   - Cache names and the audio cache key now live in one file (src/shared/constants/storage.js). Values are unchanged.
     (public/sw.js keeps its own copy because a service worker cannot import app modules.)

9. Data safety (step 3):
   - Import can no longer destroy the library: backups are validated record by record BEFORE anything is written
     (src/shared/utils/libraryBackup.js), and the write is one all-or-nothing IndexedDB transaction
     (new additive function importLibraryMetadata in src/db.js; schema, name and version are unchanged).
   - "Replace" now asks for confirmation and states how many tracks/folders will be removed from the list.
   - Resume position works again: the app remembers the track and position (saved about every 5 s, on pause and when
     the page is hidden) and reopens it paused at that spot. A position within 3 s of the end restarts from 0.
   - Cache names and the audio cache key now live in one file (src/shared/constants/storage.js). Values are unchanged.
     (public/sw.js keeps its own copy because a service worker cannot import app modules.)

Not changed on purpose: sw.js, manifest, audio/playback/queue hooks (see audit findings F-19 offline covers/fonts, F-15, F-16).
Existing audio left behind after "Replace" is kept on the device (never deleted automatically).
