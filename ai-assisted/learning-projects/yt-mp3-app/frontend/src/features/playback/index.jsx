/**
 * Playback feature entry point.
 *
 * Exports PlaybackProvider and usePlayback() cleanly from the playback feature.
 * Follows the existing feature conventions rather than creating unnecessary abstractions.
 *
 * Provider dependency order: AudioProvider ⊃ QueueProvider ⊃ PlaybackProvider
 */
export { PlaybackProvider, usePlayback } from "./usePlayback.jsx";
export { useMediaSession } from "./useMediaSession.js";

// pickShuffleIndex is available from usePlayback.js for internal use