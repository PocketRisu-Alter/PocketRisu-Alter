# syntax=docker/dockerfile:1.7

# ------------------------------------------------------------------------------------------
# Shared Node + pnpm base. Keep package files out of this stage so the runtime and
# cloudflared layers remain cached when dependencies change.
FROM node:24-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Copy dependency-related file
COPY package.json .
COPY pnpm-lock.yaml .

RUN corepack enable
RUN corepack install --global pnpm@10.34.1

# ------------------------------------------------------------------------------------------
# Install all dependencies once. Source changes no longer invalidate this layer.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# better-sqlite3 may require native compilation on Node 24.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Produce the production-only node_modules tree without downloading dependencies again.
FROM deps AS prod-deps
RUN pnpm prune --prod

# ------------------------------------------------------------------------------------------
FROM deps AS builder
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
# The normal package script creates source maps. They are not shipped or needed in
# the production container, so use the Vite production build directly here.
RUN pnpm exec vite build

# ------------------------------------------------------------------------------------------
# Download cloudflared in an independent stage so package/source changes do not
# invalidate this network layer.
FROM base AS cloudflared
ARG TARGETARCH
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${TARGETARCH}" \
       -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------------------
FROM base AS runtime
WORKDIR /app

COPY package.json ./
COPY --from=cloudflared /usr/local/bin/cloudflared /usr/local/bin/cloudflared
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 6001

CMD ["pnpm", "runserver"]
