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

export const createApp = (): Application => {
  const app: Application = express();

  // Request correlation & cryptographic tracing ID
  app.use(requestIdMiddleware);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible API documentation rendering
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-Id',
        'X-ABDM-Auth',
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
