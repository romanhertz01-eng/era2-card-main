FROM node:20-alpine AS base

# ── deps: только production-зависимости ──────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --frozen-lockfile 2>/dev/null || npm install

# ── builder: компиляция ──────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_VK_CLIENT_ID
ENV NEXT_PUBLIC_VK_CLIENT_ID=$NEXT_PUBLIC_VK_CLIENT_ID
RUN --mount=type=cache,target=/app/.next/cache npm run build

# ── runner: минимальный production-образ ─────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
