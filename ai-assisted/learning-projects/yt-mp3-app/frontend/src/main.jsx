if ("serviceWorker" in navigator) {
  if (!import.meta.env.DEV) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  } else {
    // Development mode: unregister any existing service worker whose scope
    // matches the application's production SW scope, to prevent development
    // interference from an old SW caching Vite HMR resources and dependency
    // bundles. This is development-only and will not affect production users.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        // The SW is registered as navigator.serviceWorker.register("/sw.js"),
        // which scopes to the origin root. Only unregister SWs with that exact
        // scope; leave unrelated SWs alone.
        if (registration.scope === window.location.origin + "/") {
          registration.unregister();
        }
      }
    });
    // Do not claim clients or import React here — this is development-only
    // SW management and does not affect the production service worker.
  }
} else {
  // Service worker registration disabled in development mode to prevent
  // Vite development resources from being cached in the app-shell cache.
  // In development, the SW would intercept HMR requests and development
  // dependency bundles, causing the app-shell cache to grow indefinitely.
  // Offline functionality in development can be tested by manually
  // registering the service worker: navigator.serviceWorker.register('/sw.js')
}
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
