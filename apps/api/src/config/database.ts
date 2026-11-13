import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export type DbStatus = 'connected' | 'disconnected' | 'connecting' | 'uninitialized';

export interface ConnectionHealth {
  status: DbStatus;
  latencyMs?: number;
  host?: string;
  name?: string;
}

let isConnecting = false;

// In production, disable automatic index builds to prevent performance degradation or index locks
if (env.NODE_ENV === 'production') {
  mongoose.set('autoIndex', false);
} else {
  mongoose.set('autoIndex', true);
}

// Setup event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established successfully', {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error encountered:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

/**
 * Initializes connection to MongoDB Atlas or local MongoDB instance
 */
export const connectDatabase = async (customUri?: string): Promise<typeof mongoose | null> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (isConnecting) {
    return null;
  }

  isConnecting = true;

  try {
    const mongoUri = customUri || env.MONGODB_URI;

    // Mask credentials for clean logging
    const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    logger.info(`Connecting to MongoDB at: ${maskedUri}`);

    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 5,
    });

    isConnecting = false;
    return connection;
  } catch (error) {
    isConnecting = false;
    logger.error('Failed to connect to MongoDB during initialization:', error);
    // Non-fatal during local bootstrap so health check can report status
    return null;
  }
};

/**
 * Explicitly synchronizes indexes in non-production environments or controlled migrations
 */
export const syncDatabaseIndexes = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Cannot sync indexes: Database not connected');
    return;
  }

  try {
    logger.info('Starting database index synchronization...');
    await mongoose.syncIndexes();
    logger.info('Database index synchronization completed successfully');
  } catch (error) {
    logger.error('Failed to sync database indexes:', error);
    throw error;
  }
};

/**
 * Gracefully disconnects from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('MongoDB connection closed successfully');
    }
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
  }
};

/**
 * Returns the current database connection health and latency
 */
export const getDatabaseStatus = async (): Promise<ConnectionHealth> => {
  const readyState = mongoose.connection.readyState;

  const statusMap: Record<number, DbStatus> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnected',
  };

  const status = statusMap[readyState] ?? 'uninitialized';

  if (status === 'connected' && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const latencyMs = Date.now() - start;

      return {
        status: 'connected',
        latencyMs,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      };
    } catch {
      return { status: 'disconnected' };
    }
  }

  return { status };
};
