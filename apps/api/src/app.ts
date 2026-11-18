import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/request-id';
import { requestLogger } from './middleware/request-logger';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import { v1Router } from './routes/v1.routes';
import { APP_CONFIG } from '@healthbridge/config';
import {
  nosqlSanitizerMiddleware,
  hppGuardMiddleware,
  csrfProtectionMiddleware,
} from './security';

export const parseCorsOrigins = (rawOrigin: string): string[] =>
  rawOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== '*');

export const createApp = (): Application => {
  const app: Application = express();

  // Behind cloud reverse proxies / load balancers (Render, Railway, AWS ALB, Nginx),
  // trust proxy hops so rate limiters, audit logs, and Secure cookies evaluate real client IPs/TLS.
  const trustProxyHops =
    env.TRUST_PROXY_HOPS !== undefined
      ? env.TRUST_PROXY_HOPS
      : env.NODE_ENV === 'production'
        ? 1
        : 0;
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  // Request correlation & cryptographic tracing ID
  app.use(requestIdMiddleware);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible API documentation rendering
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts:
        env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
    })
  );

  // CORS Configuration (supports comma-separated explicit allowlist; never allows '*' with credentials)
  const allowedOrigins = parseCorsOrigins(env.CORS_ORIGIN);
  app.use(
    cors({
      origin: allowedOrigins.length <= 1 ? allowedOrigins[0] || false : allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-Id',
        'X-ABDM-Auth',
        'Last-Event-ID',
        'X-Video-Room-Token',
      ],
      exposedHeaders: [
        'X-Request-Id',
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset',
        'Retry-After',
      ],
    })
  );

  // Request body and cookie parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Global Input, NoSQL Operator Injection, HPP & Cookie CSRF Defense
  app.use(hppGuardMiddleware);
  app.use(nosqlSanitizerMiddleware);
  app.use(csrfProtectionMiddleware);

  // Structured HTTP Request Logger (Pino-backed)
  app.use(requestLogger);

  // Root welcome / discovery endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: APP_CONFIG.name,
      description: APP_CONFIG.description,
      version: APP_CONFIG.version,
      apiPrefix: APP_CONFIG.apiPrefix,
      healthEndpoint: `${APP_CONFIG.apiPrefix}/health`,
      documentation: `${APP_CONFIG.apiPrefix}/docs`,
      openApiSpecification: `${APP_CONFIG.apiPrefix}/docs/openapi.json`,
    });
  });

  // Direct /docs redirect to /api/v1/docs
  app.get('/docs', (_req: Request, res: Response) => {
    res.redirect(`${APP_CONFIG.apiPrefix}/docs`);
  });

  // Mount Unified API v1 Router
  app.use(APP_CONFIG.apiPrefix, v1Router);

  // 404 Route Not Found Catch-All
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
