import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AudioProvider } from "./features/audio/index.jsx";
import { QueueProvider } from "./features/queue/useQueue.jsx";
import { PlaybackProvider } from "./features/playback/index.jsx";
import "./index.css";
import "./shared/styles/tokens.css";
import "./shared/styles/base.css";
import "./shared/styles/pages.css";
import "./shared/styles/motion.css";
import "./shared/styles/responsive.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AudioProvider>
      <QueueProvider>
        <PlaybackProvider>
          <App />
        </PlaybackProvider>
      </QueueProvider>
    </AudioProvider>
  </React.StrictMode>
);
