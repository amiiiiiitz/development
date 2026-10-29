FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    API_HOST=0.0.0.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 python3-venv \
    && python3 -m venv /opt/yt-dlp \
    && /opt/yt-dlp/bin/pip install --no-cache-dir yt-dlp \
    && ln -s /opt/yt-dlp/bin/yt-dlp /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node server.js ./
RUN mkdir -p /app/downloads && chown node:node /app/downloads
USER node

EXPOSE 3001

CMD ["npm", "start"]
