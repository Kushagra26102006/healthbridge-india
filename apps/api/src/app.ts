import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { requestLogger } from './middleware/request-logger';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './modules/health/health.routes';
import { APP_CONFIG } from '@healthbridge/config';

export const createApp = (): Application => {
  const app: Application = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-ABDM-Auth'],
    })
  );

  // Request body and cookie parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request logger
  app.use(requestLogger);

  // Root welcome / discovery endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: APP_CONFIG.name,
      description: APP_CONFIG.description,
      version: APP_CONFIG.version,
      healthEndpoint: `${APP_CONFIG.apiPrefix}/health`,
      documentation: '/docs',
    });
  });

  // API Routes
  app.use(`${APP_CONFIG.apiPrefix}/health`, healthRoutes);

  // 404 Route Not Found Catch-All
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

