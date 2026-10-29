const AUDIO_CACHE_NAME = "mp3-offline-cache-v1";
const APP_CACHE_NAME = "nofi-app-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE_NAME);
    const appUrl = new URL("/", self.location.origin);
    const appResponse = await fetch(appUrl, { cache: "reload" });
    if (!appResponse.ok) {
      throw new Error(`Could not cache the app shell (${appResponse.status}).`);
    }

    const appHtml = await appResponse.text();
    await cache.put(appUrl, new Response(appHtml, {
      status: appResponse.status,
      statusText: appResponse.statusText,
      headers: appResponse.headers,
    }));

    const assetPattern = /(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g;
    for (const [, assetPath] of appHtml.matchAll(assetPattern)) {
      const assetUrl = new URL(assetPath, appUrl);
      if (assetUrl.origin !== self.location.origin) {
        continue;
      }

      const assetResponse = await fetch(assetUrl, { cache: "reload" });
      if (assetResponse.ok) {
        await cache.put(assetUrl, assetResponse);
      }
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((cacheName) => cacheName.startsWith("nofi-app-shell-") && cacheName !== APP_CACHE_NAME)
      .map((cacheName) => caches.delete(cacheName)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || event.request.method !== "GET") {
    return;
  }

  if (requestUrl.pathname.startsWith("/offline-audio/")) {
    event.respondWith((async () => {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const cachedResponse = await cache.match(new Request(requestUrl.href));
      if (!cachedResponse) {
        return new Response("This track is not available in the offline library.", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const rangeHeader = event.request.headers.get("range");
      if (!rangeHeader) {
        return cachedResponse;
      }

      const range = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!range) {
        return new Response(null, { status: 416, headers: { "Content-Range": "bytes */0" } });
      }

      const audioBlob = await cachedResponse.blob();
      const size = audioBlob.size;
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[2] && range[1] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }

      return new Response(audioBlob.slice(start, end + 1), {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Type": cachedResponse.headers.get("Content-Type") || "audio/mpeg",
        },
      });
    })());
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(APP_CACHE_NAME);
          await cache.put(new URL("/", self.location.origin), response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(APP_CACHE_NAME);
        const cachedApp = await cache.match(new URL("/", self.location.origin));
        return cachedApp || new Response("Open NoFi while online once to make it available offline.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  if (["script", "style", "image", "font", "worker"].includes(event.request.destination)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(APP_CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(APP_CACHE_NAME);
        const cachedAsset = await cache.match(event.request);
        if (cachedAsset) {
          return cachedAsset;
        }
        throw new Error(`This app resource is not available offline: ${requestUrl.pathname}`);
      }
    })());
  }
});
