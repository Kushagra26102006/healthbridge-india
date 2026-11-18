# Multi-stage Production Dockerfile for @healthbridge/api
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @healthbridge/api...
COPY apps/api/ ./apps/api/
RUN pnpm --filter @healthbridge/api... build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate \
  && addgroup -g 1001 -S nodejs \
  && adduser -S healthbridge -u 1001
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

COPY --from=builder --chown=healthbridge:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=healthbridge:nodejs /app/packages ./packages
COPY --from=builder --chown=healthbridge:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=healthbridge:nodejs /app/apps/api/dist ./apps/api/dist
RUN pnpm install --prod --frozen-lockfile --filter @healthbridge/api...

USER healthbridge
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5001/api/v1/health/live || exit 1

CMD ["node", "apps/api/dist/server.js"]
