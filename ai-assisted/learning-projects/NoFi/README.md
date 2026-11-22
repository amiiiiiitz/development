# NoFi

A personal, offline-first YouTube-to-MP3 music player. Convert a YouTube video to MP3,
organise tracks into folders and favorites, and play them offline as an installable PWA.

## Structure

```
frontend/   React 18 + Vite PWA (IndexedDB for metadata, Cache API for audio, service worker)
backend/    Express API that runs yt-dlp (and FFmpeg through it) to produce MP3 files
_archive/   Files moved out of the project during cleanup (safe to delete once reviewed)
```

## Run locally

Requirements: Node.js, plus `yt-dlp` and `ffmpeg` available on the backend machine's PATH.

```bash
# backend (http://localhost:3001)
cd backend && npm install && node server.js

# frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Environment variables are documented in `frontend/.env.example` and `backend/.env.example`.
Deployment notes are in `DEPLOYMENT.md`.

## Offline data (do not rename casually)

| What | Name |
|---|---|
| IndexedDB database | `sonora-offline-library` (legacy name, kept so existing libraries keep working) |
| Audio cache | `mp3-offline-cache-v1` |
| Cover cache | `nofi-cover-cache-v1` |
| App-shell cache prefix | `nofi-app-shell-` |

Changing any of these without a migration makes existing offline music disappear.
