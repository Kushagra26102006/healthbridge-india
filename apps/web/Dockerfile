# Multi-stage Production Dockerfile for @healthbridge/web (Next.js 14)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

FROM base AS builder
ARG NEXT_PUBLIC_APP_NAME="HealthBridge India"
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @healthbridge/web...
COPY apps/web/ ./apps/web/
RUN pnpm --filter @healthbridge/web build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate \
  && addgroup -g 1001 -S nodejs \
  && adduser -S healthbridge -u 1001
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder --chown=healthbridge:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=healthbridge:nodejs /app/packages ./packages
COPY --from=builder --chown=healthbridge:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=healthbridge:nodejs /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder --chown=healthbridge:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=healthbridge:nodejs /app/apps/web/public ./apps/web/public
RUN pnpm install --prod --frozen-lockfile --filter @healthbridge/web...

USER healthbridge
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

WORKDIR /app/apps/web
CMD ["pnpm", "start"]
