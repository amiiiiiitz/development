# Deploying NoFi

NoFi uses two services: a static Vite frontend on Vercel and an API on Render.
The API needs Node.js, `yt-dlp`, and FFmpeg, so it must run in the included
Docker image rather than as a static site or serverless function.

## 1. Push the project to GitHub

Create a GitHub repository and push the project, including `render.yaml`,
`backend/Dockerfile`, and `frontend/vercel.json`. Do not commit `.env` files,
credentials, or local `node_modules` folders.

## 2. Deploy the API on Render

In Render, create a Blueprint deployment from the GitHub repository and select
the root `render.yaml`. When prompted for `FRONTEND_ORIGINS`, enter the exact
Vercel origin, such as `https://nofi-example.vercel.app` (no path or trailing
slash). If you do not know it yet, enter a temporary value and update the
environment variable after deploying the frontend.

After deployment, verify that `https://<render-service>.onrender.com/api/health`
returns `{"status":"ok"}`.

## 3. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel and set the project root
directory to `frontend`. The checked-in `frontend/vercel.json` configures the
Vite build, static output, SPA fallback, and service-worker update behavior.

Add this environment variable before the first production build:

```text
VITE_API_URL=https://<render-service>.onrender.com
```

Use the Render service origin only: do not add `/api` or a trailing slash.
Deploy the frontend and copy its production origin (for example,
`https://nofi-example.vercel.app`) into Render's `FRONTEND_ORIGINS` environment
variable. If you change that variable after the frontend is live, redeploy or
restart the Render service so the API loads the updated CORS configuration.

If you attach a custom frontend domain, include that exact HTTPS origin in
`FRONTEND_ORIGINS`. Keep the Vercel origin too if you still use the Vercel
domain.

## API limits and public access

The API applies per-IP request limits by default:

- Video previews: 30 requests per 15 minutes.
- Conversions: 5 requests per hour.
- Simultaneous conversions: 2 per service instance.

Render's Blueprint sets these defaults explicitly. To change them, update
`INFO_RATE_LIMIT_WINDOW_MS`, `INFO_RATE_LIMIT_MAX`,
`CONVERT_RATE_LIMIT_WINDOW_MS`, `CONVERT_RATE_LIMIT_MAX`, or
`MAX_CONCURRENT_CONVERSIONS` in the Render service environment. Windows are in
milliseconds. `TRUST_PROXY_HOPS=1` is configured for Render so limits use the
client IP forwarded by its proxy; keep this aligned with your platform if you
move hosts.

Limits are stored in memory and are enforced separately by each running
instance. They reset when an instance restarts and do not provide shared
quotas if you scale to multiple instances. Use a shared rate-limit store and
stronger abuse controls before scaling or widely advertising the public API.
CORS is not authentication and does not stop direct API clients. Follow
applicable platform acceptable-use policies and only download content you are
authorized to use.

Render's free service may sleep when idle, making the first API request slow.
The offline library remains stored in each browser on that device; browser data
does not migrate from localhost to the deployed domain.
