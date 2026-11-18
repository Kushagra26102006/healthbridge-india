import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { notificationStreamService } from './modules/notifications/services/notification-stream.service';
import { registerDefaultEventHandlers } from './modules/events/handlers/register-handlers';
import { defaultEventWorker } from './modules/events/event.processor';
import { logger } from './utils/logger';
import http from 'http';

const startServer = async (): Promise<void> => {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Database Connection
  await connectDatabase();

  // Register Cross-Module Domain Event Handlers & start durable Outbox Worker
  // When scaling horizontally, set ENABLE_BACKGROUND_WORKER=false on stateless API replicas
  // and run a single dedicated worker process to prevent unintended duplicate polling.
  registerDefaultEventHandlers();
  if (env.NODE_ENV !== 'test' && env.ENABLE_BACKGROUND_WORKER) {
    defaultEventWorker.start();
  } else if (env.NODE_ENV !== 'test') {
    logger.info('Background outbox worker disabled on this replica (ENABLE_BACKGROUND_WORKER=false)');
  }

  const serverInstance = server.listen(env.PORT, () => {
    logger.info(`HealthBridge India API server started successfully`, {
      environment: env.NODE_ENV,
      port: env.PORT,
      backgroundWorkerEnabled: env.NODE_ENV !== 'test' && env.ENABLE_BACKGROUND_WORKER,
      healthCheck: `/api/v1/health`,
      readinessCheck: `/api/v1/health/ready`,
    });
  });

  // Idempotent Graceful Shutdown Handler
  let isShuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    notificationStreamService.closeAll();
    await defaultEventWorker.stop(5000);

    serverInstance.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Graceful shutdown completed. Exiting process.');
      process.exit(0);
    });

    // Force shutdown after timeout (unref'd so clean closes exit promptly)
    const forceTimer = setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
    forceTimer.unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
};

void startServer();
