import { connectDatabase, disconnectDatabase, syncDatabaseIndexes } from '../config/database';
import { logger } from '../utils/logger';
import './models';

/**
 * Controlled non-destructive production index synchronization CLI.
 * Required because mongoose autoIndex is disabled in NODE_ENV=production.
 */
async function main(): Promise<void> {
  logger.info('Starting controlled database index synchronization...');
  const conn = await connectDatabase();
  if (!conn) {
    logger.error('Unable to connect to MongoDB; aborting index synchronization.');
    process.exit(1);
  }

  try {
    await syncDatabaseIndexes();
    logger.info('Database index synchronization finished cleanly.');
  } finally {
    await disconnectDatabase();
  }
}

void main().catch((err) => {
  logger.error('Database index synchronization failed:', err);
  process.exit(1);
});
