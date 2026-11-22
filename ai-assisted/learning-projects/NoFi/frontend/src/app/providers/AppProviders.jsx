import { AudioProvider } from "../../features/audio/index.jsx";
import { QueueProvider } from "../../features/queue/useQueue.jsx";
import { PlaybackProvider } from "../../features/playback/index.jsx";

export function AppProviders({ children }) {
  return (
    <AudioProvider>
      <QueueProvider>
        <PlaybackProvider>{children}</PlaybackProvider>
      </QueueProvider>
    </AudioProvider>
  );
}

