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
    throw new Error(`${name} must be an integer greater than or equal to ${minimum}.`);
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
const DOWNLOADS_DIR = path.join(__dirname, "downloads");
let activeConversions = 0;
const ALLOWED_ORIGINS = new Set(
  (process.env.FRONTEND_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const YOUTUBE_URL_REGEX =
  /^https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|(?:shorts|embed|live)\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#/].*)?$/i;

app.disable("x-powered-by");
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

function getVideoId(value) {
  if (typeof value !== "string") {
    return null;
  }

  return YOUTUBE_URL_REGEX.exec(value.trim())?.[1] ?? null;
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

app.post("/api/info", infoRateLimit, async (req, res) => {
  const videoId = getVideoId(req.body?.url);
  if (!videoId) {
    return sendError(res, 400, "Enter a valid YouTube video URL.");
  }

  const url = req.body.url.trim();

  try {
    const { stdout } = await execFileAsync(
      "yt-dlp",
      ["--dump-json", "--no-warnings", "--no-playlist", url],
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

app.post("/api/convert", convertRateLimit, limitConcurrentConversions, async (req, res) => {
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
    fs.unlink(filePath, (error) => {
      if (error && error.code !== "ENOENT") {
        console.error("Unable to remove temporary audio file:", error.message);
      }
    });
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
        "-o",
        outputTemplate,
        req.body.url.trim(),
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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
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

app.listen(PORT, HOST, () => {
  console.log(`YouTube MP3 API listening on http://${HOST}:${PORT}`);
});
