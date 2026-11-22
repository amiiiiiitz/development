const { execFile } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const cors = require("cors");
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const execFileAsync = promisify(execFile);
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.API_HOST || "127.0.0.1";
const readInteger = (name, fallback, minimum = 1) => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    console.warn(`Invalid ${name}=${value}; using fallback ${fallback}.`);
    return fallback;
  }
  return parsed;
};
const TRUST_PROXY_HOPS = readInteger(
  "TRUST_PROXY_HOPS",
  process.env.NODE_ENV === "production" ? 1 : 0,
  0
);
const INFO_RATE_LIMIT_WINDOW_MS = readInteger("INFO_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000);
const INFO_RATE_LIMIT_MAX = readInteger("INFO_RATE_LIMIT_MAX", 30);
const CONVERT_RATE_LIMIT_WINDOW_MS = readInteger("CONVERT_RATE_LIMIT_WINDOW_MS", 60 * 60 * 1000);
const CONVERT_RATE_LIMIT_MAX = readInteger("CONVERT_RATE_LIMIT_MAX", 5);
const MAX_CONCURRENT_CONVERSIONS = readInteger("MAX_CONCURRENT_CONVERSIONS", 2);
const MAX_CONCURRENT_LOOKUPS = readInteger("MAX_CONCURRENT_LOOKUPS", 4);
const DOWNLOADS_DIR = path.join(__dirname, "downloads");
const STALE_FILE_MAX_AGE_MS = 60 * 60 * 1000; // conversions time out after 10 minutes, so 1 hour is safely stale
const TEMP_FILE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./i;
let activeConversions = 0;
let activeLookups = 0;
const ALLOWED_ORIGINS = new Set(
  (process.env.FRONTEND_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const YOUTUBE_URL_REGEX =
  /^https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|(?:shorts|embed|live)\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#/].*)?$/i;

app.disable("x-powered-by");
// Behind a reverse proxy (e.g. Render) this makes rate limits use the real client IP instead of the proxy's.
app.set("trust proxy", TRUST_PROXY_HOPS);
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || ALLOWED_ORIGINS.has(origin));
  },
}));
app.use(express.json({ limit: "16kb" }));

const infoRateLimit = rateLimit({
  windowMs: INFO_RATE_LIMIT_WINDOW_MS,
  limit: INFO_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many preview requests. Please wait before trying again." },
});

const convertRateLimit = rateLimit({
  windowMs: CONVERT_RATE_LIMIT_WINDOW_MS,
  limit: CONVERT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Conversion limit reached. Please try again later." },
});

function limitConcurrentConversions(req, res, next) {
  if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
    res.setHeader("Retry-After", "30");
    return res.status(503).json({ error: "The converter is busy. Please try again shortly." });
  }

  activeConversions += 1;
  let released = false;
  const abortController = new AbortController();
  req.conversionSignal = abortController.signal;
  const release = () => {
    if (!released) {
      released = true;
      activeConversions -= 1;
    }
  };

  res.once("finish", release);
  res.once("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
    release();
  });
  next();
}

function limitConcurrentLookups(req, res, next) {
  if (activeLookups >= MAX_CONCURRENT_LOOKUPS) {
    res.setHeader("Retry-After", "10");
    return res.status(503).json({ error: "The server is busy. Please try again shortly." });
  }

  activeLookups += 1;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      activeLookups -= 1;
    }
  };
  res.once("finish", release);
  res.once("close", release);
  next();
}

function getVideoId(value) {
  if (typeof value !== "string") {
    return null;
  }

  return YOUTUBE_URL_REGEX.exec(value.trim())?.[1] ?? null;
}

// yt-dlp only ever receives a URL we build from the validated 11-character video ID,
// never the raw text the user sent.
const toWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function requireMediaToolsReady(req, res, next) {
  if (ytDlpReady && ffmpegReady) {
    return next();
  }
  res.setHeader("Retry-After", "30");
  return res.status(503).json({ error: "The converter is starting up. Please try again shortly." });
}

async function removeFiles(shouldRemove) {
  let names;
  try {
    names = await fs.promises.readdir(DOWNLOADS_DIR);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Unable to read downloads folder:", error.message);
    }
    return;
  }

  await Promise.all(names.filter((name) => TEMP_FILE_PATTERN.test(name) && shouldRemove(name)).map(async (name) => {
    try {
      await fs.promises.unlink(path.join(DOWNLOADS_DIR, name));
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Unable to remove temporary file:", error.message);
      }
    }
  }));
}

// Removes leftovers from crashed or interrupted conversions. Only job files (UUID names) older than
// STALE_FILE_MAX_AGE_MS are touched, so a conversion that is still running is never affected.
async function sweepStaleFiles() {
  let names;
  try {
    names = await fs.promises.readdir(DOWNLOADS_DIR);
  } catch {
    return;
  }
  const stale = new Set();
  await Promise.all(names.filter((name) => TEMP_FILE_PATTERN.test(name)).map(async (name) => {
    try {
      const stats = await fs.promises.stat(path.join(DOWNLOADS_DIR, name));
      if (Date.now() - stats.mtimeMs > STALE_FILE_MAX_AGE_MS) {
        stale.add(name);
      }
    } catch {
      // file vanished between readdir and stat: nothing to do
    }
  }));
  await removeFiles((name) => stale.has(name));
}

app.post("/api/info", requireMediaToolsReady, infoRateLimit, limitConcurrentLookups, async (req, res) => {
  const videoId = getVideoId(req.body?.url);
  if (!videoId) {
    return sendError(res, 400, "Enter a valid YouTube video URL.");
  }

  const url = toWatchUrl(videoId);

  try {
    const { stdout } = await execFileAsync(
      "yt-dlp",
      ["--dump-json", "--no-warnings", "--no-playlist", "--", url],
      { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 }
    );
    const details = JSON.parse(stdout);

    return res.json({
      id: videoId,
      title: details.title || "Untitled video",
      thumbnail: details.thumbnail || "",
      duration: Number.isFinite(details.duration) ? details.duration : null,
      uploader: details.uploader || details.channel || "Unknown creator",
    });
  } catch (error) {
    console.error("Unable to retrieve video information:", error.message);
    return sendError(res, 502, "Could not retrieve video information. Check the URL and try again.");
  }
});

app.post("/api/convert", requireMediaToolsReady, convertRateLimit, limitConcurrentConversions, async (req, res) => {
  const videoId = getVideoId(req.body?.url);
  if (!videoId) {
    return sendError(res, 400, "Enter a valid YouTube video URL.");
  }

  const outputBase = randomUUID();
  const filePath = path.join(DOWNLOADS_DIR, `${outputBase}.mp3`);
  const outputTemplate = path.join(DOWNLOADS_DIR, `${outputBase}.%(ext)s`);
  let cleanupStarted = false;

  const cleanup = () => {
    if (cleanupStarted) {
      return;
    }
    cleanupStarted = true;
    // yt-dlp can leave intermediate files next to the .mp3 (source audio, thumbnail, .part): remove all of them.
    void removeFiles((name) => name.startsWith(`${outputBase}.`));
  };

  try {
    await fs.promises.mkdir(DOWNLOADS_DIR, { recursive: true });
    await execFileAsync(
       "yt-dlp",
       [
         "--no-warnings",
         "--no-playlist",
         "-x",
         "--audio-format",
         "mp3",
         "--audio-quality",
         "192K",
         "--add-metadata",
         "--embed-thumbnail",
         "-o",
         outputTemplate,
         "--",
         toWatchUrl(videoId),
       ],
      {
        timeout: 10 * 60_000,
        maxBuffer: 10 * 1024 * 1024,
        signal: req.conversionSignal,
      }
    );

    await fs.promises.access(filePath, fs.constants.R_OK);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${videoId}.mp3"`);
    res.on("finish", cleanup);
    res.on("close", cleanup);

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (error) => {
      console.error("Unable to stream converted audio:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Could not stream the converted audio file." });
      } else {
        res.destroy(error);
      }
    });
    res.once("close", () => fileStream.destroy());
    fileStream.pipe(res);
  } catch (error) {
    cleanup();
    if (req.conversionSignal.aborted) {
      return;
    }
    console.error("Unable to convert video to MP3:", error.message);
    return sendError(res, 502, "Could not convert this video. Please try again.");
  }
});

let ytDlpReady = false;
let ytDlpVersion = null;
let ffmpegReady = false;
let ffmpegVersion = null;
let mediaToolsCheckPromise = null;
let mediaToolsRetryTimer = null;

const checkMediaTools = async () => {
  if (mediaToolsCheckPromise) {
    return mediaToolsCheckPromise;
  }
  mediaToolsCheckPromise = (async () => {
    let ytDlpOk = false;
    let ffmpegOk = false;

    try {
      const { stdout } = await execFileAsync("yt-dlp", ["--version"], { timeout: 10_000 });
      ytDlpVersion = stdout.trim();
      ytDlpOk = true;
    } catch (error) {
      ytDlpVersion = null;
      ytDlpReady = false;
      console.error("yt-dlp is unavailable:", error.message);
    }

    try {
      const { stdout } = await execFileAsync("ffmpeg", ["-version"], { timeout: 10_000 });
      ffmpegVersion = stdout.split("\n", 1)[0];
      ffmpegOk = true;
    } catch (error) {
      ffmpegVersion = null;
      ffmpegReady = false;
      console.error("ffmpeg is unavailable:", error.message);
    }

    ytDlpReady = ytDlpOk;
    ffmpegReady = ffmpegOk;
    const mediaToolsReady = ytDlpReady && ffmpegReady;

    if (mediaToolsReady) {
      if (mediaToolsRetryTimer) {
        clearTimeout(mediaToolsRetryTimer);
        mediaToolsRetryTimer = null;
      }
    } else if (!mediaToolsRetryTimer) {
      mediaToolsRetryTimer = setTimeout(() => {
        mediaToolsRetryTimer = null;
        mediaToolsCheckPromise = null;
        void checkMediaTools();
      }, 30_000);
    }
    return mediaToolsReady;
  })();
  return mediaToolsCheckPromise;
};

// Stop accepting new requests, let running ones finish, then exit. Without process.exit() a signal
// handler replaces Node's default behaviour and the process would ignore Ctrl+C / docker stop.
function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  if (mediaToolsRetryTimer) {
    clearTimeout(mediaToolsRetryTimer);
  }
  server.close(() => process.exit(0));
  server.closeIdleConnections?.();
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

app.get("/api/health", async (_req, res) => {
  if (!ytDlpReady || !ffmpegReady) {
    await checkMediaTools();
  }
  if (ytDlpReady && ffmpegReady) {
    res.json({ status: "ok", ytDlpVersion, ffmpegVersion });
  } else {
    res.status(503).json({ status: "not_ready", error: "yt-dlp or FFmpeg is unavailable." });
  }
});

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  if (error.type === "entity.parse.failed") {
    return sendError(res, 400, "Request body must be valid JSON.");
  }
  if (error.type === "entity.too.large") {
    return sendError(res, 413, "Request body exceeds the 16 KB limit.");
  }

  console.error("Unhandled API request error:", error);
  return sendError(res, 500, "An unexpected server error occurred.");
});

const server = app.listen(PORT, HOST, () => {
  console.log(`YouTube MP3 API listening on http://${HOST}:${PORT}`);
  void checkMediaTools();
  void sweepStaleFiles();
  setInterval(() => void sweepStaleFiles(), 60 * 60 * 1000).unref();
});
